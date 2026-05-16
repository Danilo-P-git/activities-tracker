<?php

namespace App\Http\Controllers;

use App\Models\EventStaff;
use App\Models\Group;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MetricsController extends Controller
{
    /**
     * GET /api/events/{event}/metrics/staff
     *
     * Restituisce le metriche per ogni membro dello staff in un evento:
     * - activity_count          Numero di gruppi gestiti (attivati o chiusi)
     * - time_activities_seconds Durata totale delle attività (solo gruppi non-friend chiusi)
     * - time_in_arena_seconds   Tempo totale trascorso nell'evento
     * - time_breaks_seconds     Tempo totale in pausa (da staff_breaks)
     * - time_idle_seconds       Tempo in arena senza attività né pausa
     *
     * Ordinato per activity_count decrescente.
     */
    public function staffMetrics($eventId)
    {
        try {
            $now = Carbon::now();

            // Tutti i periodi di presenza per l'evento, con staff e relative pause
            $allPeriods = EventStaff::withTrashed()
                ->where('event_id', $eventId)
                ->with([
                    'staff'  => fn($q) => $q->withTrashed(),
                    'breaks',
                ])
                ->orderBy('added_at')
                ->get()
                ->groupBy('staff_id');

            // Gruppi attivati (is_waiting = false) per questo evento
            $groupsByStaff = Group::withTrashed()
                ->where('event_id', $eventId)
                ->whereNotNull('staff_id')
                ->where('is_waiting', false)
                ->get()
                ->groupBy('staff_id');

            $metrics       = [];
            $allEventDays  = [];  // tutti i giorni distinti dell'evento

            foreach ($allPeriods as $staffId => $periods) {
                $staffModel = $periods->first()->staff;
                if (!$staffModel) {
                    continue;
                }

                // ── Tempo in arena ────────────────────────────────────────────
                $timeInArenaSeconds = 0;
                foreach ($periods as $period) {
                    $addedAt = Carbon::parse($period->added_at);
                    $end = !is_null($period->removed_at)
                        ? Carbon::parse($period->removed_at)
                        : (!is_null($period->deleted_at) ? Carbon::parse($period->deleted_at) : $now);

                    $timeInArenaSeconds += max(0, $end->diffInSeconds($addedAt));
                }

                // ── Tempo in pausa ────────────────────────────────────────────
                $timeBreaksSeconds = 0;
                foreach ($periods as $period) {
                    foreach ($period->breaks as $break) {
                        $breakStart = Carbon::parse($break->started_at);
                        $breakEnd   = $break->ended_at ? Carbon::parse($break->ended_at) : $now;
                        $timeBreaksSeconds += max(0, $breakEnd->diffInSeconds($breakStart));
                    }
                }

                // ── Attività ──────────────────────────────────────────────────
                $staffGroups       = $groupsByStaff->get($staffId, collect());
                $activityCount     = $staffGroups->count();
                $timeActivitiesSeconds = (int) $staffGroups->sum(function ($group) {
                    if ($group->is_friend || is_null($group->activity_duration)) {
                        return 0;
                    }
                    return $group->activity_duration * 60;
                });

                // ── Idle: in arena senza attività né pausa ────────────────────
                $timeIdleSeconds = max(0, $timeInArenaSeconds - $timeActivitiesSeconds - $timeBreaksSeconds);

                // ── Giorni di presenza ────────────────────────────────────────
                // Conta i giorni calendario distinti coperti dai periodi di presenza
                $staffDays = [];
                foreach ($periods as $period) {
                    if (is_null($period->added_at)) {
                        continue;
                    }
                    $dayStart = Carbon::parse($period->added_at)->startOfDay();
                    $end = !is_null($period->removed_at)
                        ? Carbon::parse($period->removed_at)
                        : (!is_null($period->deleted_at) ? Carbon::parse($period->deleted_at) : $now);
                    $dayEnd = $end->copy()->startOfDay();

                    $cur = $dayStart->copy();
                    while ($cur->lte($dayEnd)) {
                        $dateStr = $cur->toDateString();
                        $staffDays[$dateStr]   = true;
                        $allEventDays[$dateStr] = true;
                        $cur->addDay();
                    }
                }
                $daysPresent = count($staffDays);

                $metrics[] = [
                    'id'                       => $staffModel->id,
                    'full_name'                => $staffModel->full_name,
                    'is_master'                => (bool) $staffModel->is_master,
                    'activity_count'           => $activityCount,
                    'days_present'             => $daysPresent,
                    'time_in_arena_seconds'    => $timeInArenaSeconds,
                    'time_breaks_seconds'      => $timeBreaksSeconds,
                    'time_activities_seconds'  => $timeActivitiesSeconds,
                    'time_idle_seconds'        => $timeIdleSeconds,
                ];
            }

            usort($metrics, fn($a, $b) => $b['activity_count'] - $a['activity_count']);

            return response()->json([
                'event_total_days' => count($allEventDays),
                'metrics'          => $metrics,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Errore interno',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
