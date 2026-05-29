<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventShift;
use App\Models\EventStaff;
use App\Models\Group;
use App\Support\StaffMetricsTime;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class MetricsController extends Controller
{
    /**
     * GET /api/events/{event}/metrics/staff
     *
     * Calcola le metriche per ogni membro dello staff intersecando i periodi di
     * presenza con le finestre dei turni (EventShift). Se l'evento non ha turni
     * definiti, si usa event_start_date / event_end_date come finestra unica.
     *
     * Returned fields per staff:
     *   id, full_name, is_master, activity_count, days_present,
     *   time_in_arena_seconds, time_breaks_seconds,
     *   time_activities_seconds, time_idle_seconds
     */
    public function staffMetrics($eventId)
    {
        try {
            $now        = Carbon::now('UTC');
            $dateFilter = request()->query('date');
            $scheduleTz = 'Europe/Rome';

            $event = Event::find($eventId);
            $eventStartAt = $event?->event_start_date
                ? StaffMetricsTime::asUtcCarbon($event->event_start_date)
                : null;
            $eventEndAt = $event?->event_end_date
                ? StaffMetricsTime::asUtcCarbon($event->event_end_date)
                : null;

            $shiftRecords = EventShift::where('event_id', $eventId)
                ->orderBy('starts_at')
                ->get();
            $allShiftWindows = StaffMetricsTime::resolveShiftWindows($eventStartAt, $eventEndAt, $shiftRecords, $now);
            $availableDates = StaffMetricsTime::availableDates($eventStartAt, $eventEndAt, $scheduleTz);
            $shiftWindows = StaffMetricsTime::filterShiftWindowsByDate($allShiftWindows, $dateFilter, $scheduleTz);
            $totalShiftSeconds = StaffMetricsTime::totalShiftSeconds($shiftWindows);
            $elapsedShiftSeconds = StaffMetricsTime::elapsedShiftSeconds($shiftWindows, $now);

            // ── Periodi di presenza staff (per breaks e days_present) ──────────
            $allPeriods = EventStaff::withTrashed()
                ->where('event_id', $eventId)
                ->with([
                    'staff'  => fn($q) => $q->withTrashed(),
                    'breaks',
                ])
                ->orderBy('added_at')
                ->get()
                ->groupBy('staff_id');

            // ── Gruppi completati ──────────────────────────────────────────────
            // "In arena" = somma delle attività svolte → solo gruppi chiusi (is_closed=true).
            // I gruppi in attesa (is_waiting=true) non vengono mai conteggiati.
            $groupsByStaff = Group::where('event_id', $eventId)
                ->whereNotNull('staff_id')
                ->where('is_closed', true)
                ->where('is_waiting', false)
                ->when($dateFilter, fn($q) => $q->where('date', $dateFilter))
                ->get()
                ->groupBy('staff_id');

            $metrics = [];
            $allEventDays = [];

            foreach ($allPeriods as $staffId => $periods) {
                $staffModel = $periods->first()->staff;
                if (!$staffModel) {
                    continue;
                }
                $staffGroups = $groupsByStaff->get($staffId, collect());
                $activityCount = $staffGroups->count();
                $timeInArenaSeconds = StaffMetricsTime::timeInArenaSeconds($staffGroups);
                $timeBreaksSeconds = StaffMetricsTime::timeBreaksSeconds($periods, $shiftWindows, $now);
                $timeIdleSeconds = StaffMetricsTime::timeIdleSeconds(
                    $elapsedShiftSeconds,
                    $timeInArenaSeconds,
                    $timeBreaksSeconds
                );
                [$staffDays, $presenceDays] = StaffMetricsTime::collectPresenceDays($periods, $shiftWindows, $now);
                $allEventDays = array_values(array_unique([...$allEventDays, ...$presenceDays]));

                $metrics[] = [
                    'id'                      => $staffModel->id,
                    'full_name'               => $staffModel->full_name,
                    'is_master'               => (bool) $staffModel->is_master,
                    'activity_count'          => $activityCount,
                    'days_present'            => count($staffDays),
                    'time_in_arena_seconds'   => $timeInArenaSeconds,
                    'time_breaks_seconds'     => $timeBreaksSeconds,
                    'time_activities_seconds' => $timeInArenaSeconds,
                    'time_idle_seconds'       => $timeIdleSeconds,
                ];
            }

            usort($metrics, fn($a, $b) => $b['activity_count'] - $a['activity_count']);

            return response()->json([
                'event_total_days'    => count($allEventDays),
                'total_shift_seconds' => $totalShiftSeconds,
                'dates'               => $availableDates,
                'metrics'             => $metrics,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Errore interno',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
