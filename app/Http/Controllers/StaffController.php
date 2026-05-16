<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;

use App\Models\Event;
use Illuminate\Http\Request;
use App\Models\EventStaff;
use App\Models\Group;
use App\Models\Staff;
use App\Models\StaffBreak;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Staff",
 *     description="API per la gestione dello staff"
 * )
 */
class StaffController extends Controller{
    /**
     * @OA\Get(
     *     path="/api/staff",
     *     tags={"Staff"},
     *     summary="Lista di tutto lo staff",
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function index()
    {
        try {
            return response()->json(Staff::all());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
        /**
         * @OA\Get(
         *     path="/api/events/{event}/staff",
         *     tags={"Staff"},
         *     summary="Lista staff di un evento (attivi e non)",
         *     @OA\Parameter(name="event", in="path", required=true, @OA\Schema(type="integer")),
         *     @OA\Response(response=200, description="Successo")
         * )
         */
        public function staffByEvent($eventId)
        {
            try {
                $staffRecords = EventStaff::withTrashed()
                    ->where('event_id', $eventId)
                    ->with(['staff' => function ($query) {
                        $query->withTrashed();
                    }])
                    ->orderBy('added_at')
                    ->get();

                $staffGrouped = [];

                foreach ($staffRecords as $record) {
                    if (!$record->staff) {
                        continue;
                    }

                    $staffId = $record->staff_id;

                    if (!isset($staffGrouped[$staffId])) {
                        $staffGrouped[$staffId] = [
                            'id' => $record->staff->id,
                            'full_name' => $record->staff->full_name,
                            'is_available' => $record->staff->is_available,
                            'created_at' => $record->staff->created_at,
                            'updated_at' => $record->staff->updated_at,
                            'deleted_at' => $record->staff->deleted_at,
                            'is_currently_present' => false,
                            'is_on_break' => false,
                            'periods' => [],
                        ];
                    }

                    $period = [
                        'added_at' => $record->added_at,
                        'removed_at' => $record->removed_at,
                        'deleted_at' => $record->deleted_at,
                        'status' => $record->status,
                    ];

                    $staffGrouped[$staffId]['periods'][] = $period;

                    $isActivePeriod = is_null($record->removed_at) && is_null($record->deleted_at);
                    if ($isActivePeriod) {
                        $staffGrouped[$staffId]['is_currently_present'] = true;
                        $staffGrouped[$staffId]['is_on_break'] = $record->status === 'break';
                    }
                }

                return response()->json(array_values($staffGrouped));
            } catch (\Exception $e) {
                return response()->json([
                    'error' => 'Errore interno',
                    'message' => $e->getMessage()
                ], 500);
            }
        }

    /**
     * @OA\Get(
     *     path="/api/events/{event}/staff/stats",
     *     tags={"Staff"},
     *     summary="Statistiche attività per ogni membro dello staff in un evento",
     *     @OA\Parameter(name="event", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function staffStats($eventId)
    {
        try {
            $now = Carbon::now();

            // Tutti i periodi in/out arena per evento, raggruppati per staff
            $allPeriods = EventStaff::withTrashed()
                ->where('event_id', $eventId)
                ->with(['staff' => fn($q) => $q->withTrashed()])
                ->orderBy('added_at')
                ->get()
                ->groupBy('staff_id');

            // Tutti i gruppi attivati (is_waiting = false) per questo evento, per staff
            $groupsByStaff = Group::withTrashed()
                ->where('event_id', $eventId)
                ->whereNotNull('staff_id')
                ->where('is_waiting', false)
                ->get()
                ->groupBy('staff_id');

            $stats = [];

            foreach ($allPeriods as $staffId => $periods) {
                $staffModel = $periods->first()->staff;
                if (!$staffModel) {
                    continue;
                }

                $timeInArenaSeconds = 0;
                $firstAddedAt = null;
                $lastPeriodEnd = null;

                foreach ($periods as $period) {
                    $addedAt = Carbon::parse($period->added_at);

                    // Fine del periodo: removed_at, oppure deleted_at, oppure adesso (se ancora dentro)
                    $end = !is_null($period->removed_at)
                        ? Carbon::parse($period->removed_at)
                        : (!is_null($period->deleted_at) ? Carbon::parse($period->deleted_at) : $now);

                    if (is_null($firstAddedAt) || $addedAt->lt($firstAddedAt)) {
                        $firstAddedAt = clone $addedAt;
                    }
                    if (is_null($lastPeriodEnd) || $end->gt($lastPeriodEnd)) {
                        $lastPeriodEnd = clone $end;
                    }

                    $timeInArenaSeconds += max(0, $end->diffInSeconds($addedAt));
                }

                // Tempo fuori dall'arena: finestra totale (primo ingresso → ultima uscita) - tempo dentro
                $totalSpanSeconds = ($firstAddedAt && $lastPeriodEnd)
                    ? max(0, $lastPeriodEnd->diffInSeconds($firstAddedAt))
                    : 0;
                $timeOutsideArenaSeconds = max(0, $totalSpanSeconds - $timeInArenaSeconds);

                // Attività fatte e tempo stimato in attività
                $staffGroups = $groupsByStaff->get($staffId, collect());
                $activityCount = $staffGroups->count();
                $timeActivitiesSeconds = (int) $staffGroups->sum(function ($group) {
                    // Gli amici non hanno durata definita, non contano nel tempo occupato
                    if ($group->is_friend || is_null($group->activity_duration)) {
                        return 0;
                    }
                    return $group->activity_duration * 60;
                });

                // Tempo idle: in arena ma senza attività in corso
                $timeIdleSeconds = max(0, $timeInArenaSeconds - $timeActivitiesSeconds);

                $stats[] = [
                    'id'                        => $staffModel->id,
                    'full_name'                 => $staffModel->full_name,
                    'activity_count'            => $activityCount,
                    'time_in_arena_seconds'     => $timeInArenaSeconds,
                    'time_outside_arena_seconds' => $timeOutsideArenaSeconds,
                    'time_activities_seconds'   => $timeActivitiesSeconds,
                    'time_idle_seconds'         => $timeIdleSeconds,
                ];
            }

            // Ordina per numero attività decrescente
            usort($stats, fn($a, $b) => $b['activity_count'] - $a['activity_count']);

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Imposta lo status (active/break) del periodo aperto di uno staff in un evento.
     * PUT /api/events/{event}/staff/{staff}/status
     */
    public function updateEventStatus(Request $request, $eventId, $staffId)
    {
        $status = $request->input('status');
        if (!in_array($status, ['active', 'break'])) {
            return response()->json(['error' => 'Status non valido. Valori accettati: active, break'], 422);
        }

        // Trova il periodo aperto corrente (non rimosso, non soft-deleted)
        $record = EventStaff::where('event_id', $eventId)
            ->where('staff_id', $staffId)
            ->whereNull('removed_at')
            ->whereNull('deleted_at')
            ->first();

        if (!$record) {
            return response()->json(['error' => "Staff non attualmente presente nell'evento"], 404);
        }

        $previousStatus = $record->status;

        // Registra inizio/fine pausa nella tabella staff_breaks
        if ($previousStatus !== 'break' && $status === 'break') {
            // Sta iniziando una pausa
            StaffBreak::create([
                'event_staff_id' => $record->id,
                'started_at'     => Carbon::now(),
                'ended_at'       => null,
            ]);
        } elseif ($previousStatus === 'break' && $status === 'active') {
            // Sta terminando la pausa: chiude l'eventuale record aperto
            StaffBreak::where('event_staff_id', $record->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => Carbon::now()]);
        }

        $record->status = $status;
        $record->save();

        return response()->json([
            'id'          => (int) $staffId,
            'event_id'    => (int) $eventId,
            'status'      => $record->status,
            'is_on_break' => $record->status === 'break',
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/staff",
     *     tags={"Staff"},
     *     summary="Crea un nuovo membro dello staff",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Staff")
     *     ),
     *     @OA\Response(response=201, description="Creato")
     * )
     */
    public function store(StoreStaffRequest $request)
    {
        try {
            $staff = Staff::create($request->validated());
            return response()->json($staff, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/staff/{id}",
     *     tags={"Staff"},
     *     summary="Mostra un membro dello staff",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function show(Staff $staff)
    {
        try {
            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/staff/{id}",
     *     tags={"Staff"},
     *     summary="Aggiorna un membro dello staff",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Staff")
     *     ),
     *     @OA\Response(response=200, description="Aggiornato")
     * )
     */
    public function update(UpdateStaffRequest $request, Staff $staff)
    {
        try {
            $staff->update($request->validated());
            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/staff/{id}",
     *     tags={"Staff"},
     *     summary="Elimina un membro dello staff",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Eliminato")
     * )
     */
    public function destroy(Staff $staff)
    {
        try {
            $staff->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
