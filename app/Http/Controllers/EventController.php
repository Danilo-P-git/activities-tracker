<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;

use App\Models\Event;
use App\Models\EventStaff;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Events",
 *     description="API per la gestione degli eventi"
 * )
 */
class EventController extends Controller{
    /**
     * @OA\Get(
     *     path="/api/events",
     *     tags={"Events"},
     *     summary="Lista di tutti gli eventi",
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function index()
    {
        try {
            $query = Event::with('staff');

            // Filtro
            $filter = request('filter');
            if ($filter) {
                $query->where(function($q) use ($filter) {
                    $q->where('event_name', 'like', "%$filter%")
                      ->orWhere('location', 'like', "%$filter%") ;
                });
            }

            // Sorting
            $sortBy = request('sortBy', 'date');
            if ($sortBy === 'name') {
                $query->orderBy('event_name');
            } elseif ($sortBy === 'location') {
                $query->orderBy('location');
            } else { // default: date
                $query->orderBy('event_start_date');
            }

            $events = $query->get();
            // Per ogni evento, includi solo lo staff assegnato (staff relation)
            $result = $events;
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * @OA\Get(
     *     path="/api/events/featured",
     *     tags={"Events"},
     *     summary="Evento in corso oggi o il prossimo futuro",
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function featured()
    {
        try {
            $now = now();
            $weekBefore = $now->copy()->subWeek();
            $weekAfter = $now->copy()->addWeek();
            // Prendi tutti gli eventi in corso o entro una settimana prima/dopo oggi
            $events = Event::where(function($q) use ($weekBefore, $weekAfter) {
                $q->whereBetween('event_start_date', [$weekBefore, $weekAfter])
                  ->orWhereBetween('event_end_date', [$weekBefore, $weekAfter])
                  ->orWhere(function($q2) use ($weekBefore, $weekAfter) {
                      $q2->where('event_start_date', '<', $weekBefore)
                         ->where('event_end_date', '>', $weekAfter);
                  });
            })
            ->orderBy('event_start_date')
            ->get();
            return response()->json($events);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * @OA\Post(
     *     path="/api/events",
     *     tags={"Events"},
     *     summary="Crea un nuovo evento",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Event")
     *     ),
     *     @OA\Response(response=201, description="Creato")
     * )
     */
    public function store(StoreEventRequest $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->validated();
            $staffIds = $data['staff_ids'] ?? [];
            unset($data['staff_ids']);

            $event = Event::create($data);
            // Inserisci manualmente staff con added_at
            foreach ($staffIds as $staffId) {
                EventStaff::create([
                    'event_id' => $event->id,
                    'staff_id' => $staffId,
                    'added_at' => now(),
                ]);
            }
            // Raggruppa staff per periodi
            $staffRecords = EventStaff::withTrashed()
                ->where('event_id', $event->id)
                ->with('staff')
                ->orderBy('added_at')
                ->get();
            $staffGrouped = [];
            foreach ($staffRecords as $es) {
                $id = $es->staff_id;
                if (!isset($staffGrouped[$id])) {
                    $staffGrouped[$id] = [
                        'id' => $id,
                        'full_name' => $es->staff ? $es->staff->full_name : null,
                        'periods' => [],
                    ];
                }
                $staffGrouped[$id]['periods'][] = [
                    'added_at' => $es->added_at,
                    'removed_at' => $es->removed_at,
                    'deleted_at' => $es->deleted_at,
                ];
            }
            $eventData = $event->toArray();
            $eventData['staff'] = array_values($staffGrouped);
            DB::commit();
            return response()->json($eventData, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * @OA\Put(
     *     path="/api/events/{id}",
     *     tags={"Events"},
     *     summary="Aggiorna un evento",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Event")
     *     ),
     *     @OA\Response(response=200, description="Aggiornato")
     * )
     */
    public function update(UpdateEventRequest $request, Event $event)
    {
        try {
            DB::beginTransaction();
            $data = $request->validated();
            $staffIds = $data['staff_ids'] ?? null;
            unset($data['staff_ids']);
            $event->update($data);
            if ($staffIds !== null) {
                // Prendi tutti i record attivi (non soft deleted)
                $currentStaff = EventStaff::where('event_id', $event->id)->whereNull('deleted_at')->get();
                $currentStaffIds = $currentStaff->pluck('staff_id')->all();
                // Staff da aggiungere (nuova presenza)
                $toAdd = array_diff($staffIds, $currentStaffIds);
                // Staff da rimuovere (soft delete e set removed_at su tutti i record attivi)
                $toRemove = array_diff($currentStaffIds, $staffIds);
                // Aggiungi nuovi staff (nuovo record per ogni aggiunta)
                foreach ($toAdd as $staffId) {
                    EventStaff::create([
                        'event_id' => $event->id,
                        'staff_id' => $staffId,
                        'added_at' => now(),
                    ]);
                }
                // Rimuovi staff (soft delete e set removed_at su tutti i record attivi per quello staff)
                foreach ($toRemove as $staffId) {
                    $records = EventStaff::where('event_id', $event->id)
                        ->where('staff_id', $staffId)
                        ->whereNull('deleted_at')
                        ->get();
                    foreach ($records as $es) {
                        $es->removed_at = now();
                        $es->delete();
                        $es->save();
                    }
                }
            }
            // Raggruppa staff per periodi
            $staffRecords = EventStaff::withTrashed()
                ->where('event_id', $event->id)
                ->with('staff')
                ->orderBy('added_at')
                ->get();
            $staffGrouped = [];
            foreach ($staffRecords as $es) {
                $id = $es->staff_id;
                if (!isset($staffGrouped[$id])) {
                    $staffGrouped[$id] = [
                        'id' => $id,
                        'full_name' => $es->staff ? $es->staff->full_name : null,
                        'periods' => [],
                    ];
                }
                $staffGrouped[$id]['periods'][] = [
                    'added_at' => $es->added_at,
                    'removed_at' => $es->removed_at,
                    'deleted_at' => $es->deleted_at,
                ];
            }
            $eventData = $event->toArray();
            $eventData['staff'] = array_values($staffGrouped);
            DB::commit();
            return response()->json($eventData);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * @OA\Get(
     *     path="/api/events/{id}",
     *     tags={"Events"},
     *     summary="Mostra un evento",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function show(Event $event)
    {
        try {
            // Raggruppa staff per periodi
            $staffRecords = EventStaff::withTrashed()
                ->where('event_id', $event->id)
                ->with('staff')
                ->orderBy('added_at')
                ->get();
            $staffGrouped = [];
            foreach ($staffRecords as $es) {
                $id = $es->staff_id;
                if (!isset($staffGrouped[$id])) {
                    $staffGrouped[$id] = [
                        'id' => $id,
                        'full_name' => $es->staff ? $es->staff->full_name : null,
                        'periods' => [],
                    ];
                }
                $staffGrouped[$id]['periods'][] = [
                    'added_at' => $es->added_at,
                    'removed_at' => $es->removed_at,
                    'deleted_at' => $es->deleted_at,
                ];
            }
            $eventData = $event->toArray();
            $eventData['staff'] = array_values($staffGrouped);
            return response()->json($eventData);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/events/{id}",
     *     tags={"Events"},
     *     summary="Elimina un evento",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Eliminato")
     * )
     */
    public function destroy(Event $event)
    {
        try {
            $event->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
