<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventShift;
use App\Models\EventStaff;
use App\Models\Group;
use Carbon\Carbon;

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
            $now        = Carbon::now();
            $dateFilter = request()->query('date'); // "YYYY-MM-DD" oppure null

            // ── Evento (sempre necessario per availableDates) ─────────────────
            $event = Event::find($eventId);

            // ── Finestre dei turni (tutte) ────────────────────────────────────
            $shiftRecords = EventShift::where('event_id', $eventId)
                ->orderBy('starts_at')
                ->get();

            if ($shiftRecords->isEmpty()) {
                if ($event && $event->event_start_date) {
                    $allShiftWindows = collect([[
                        'start' => Carbon::parse($event->event_start_date),
                        'end'   => $event->event_end_date
                            ? Carbon::parse($event->event_end_date)
                            : $now,
                    ]]);
                } else {
                    $allShiftWindows = null;
                }
            } else {
                $allShiftWindows = $shiftRecords->map(fn($s) => [
                    'start' => Carbon::parse($s->starts_at),
                    'end'   => Carbon::parse($s->ends_at),
                ]);
            }

            // ── Giorni disponibili per le tab (sempre dal range evento) ──────
            $availableDates = [];
            if ($event && $event->event_start_date) {
                $cur    = Carbon::parse($event->event_start_date)->startOfDay();
                $dayEnd = $event->event_end_date
                    ? Carbon::parse($event->event_end_date)->startOfDay()
                    : $cur->copy();
                while ($cur->lte($dayEnd)) {
                    $availableDates[] = $cur->toDateString();
                    $cur->addDay();
                }
            }

            // ── Filtra le finestre al singolo giorno richiesto ────────────────
            // I boundary del giorno usano il timezone locale (Europe/Rome) perché
            // il dateFilter è una data locale del client. L'app gira in UTC, ma
            // la mezzanotte locale è 22:00 UTC del giorno precedente.
            if ($dateFilter !== null) {
                $localTz  = 'Europe/Rome';
                $dayStart = Carbon::parse($dateFilter, $localTz)->startOfDay();
                $dayEnd   = Carbon::parse($dateFilter, $localTz)->endOfDay();
                if ($allShiftWindows !== null) {
                    $dayWindows = [];
                    foreach ($allShiftWindows as $w) {
                        $oStart = max($w['start']->timestamp, $dayStart->timestamp);
                        $oEnd   = min($w['end']->timestamp, $dayEnd->timestamp);
                        if ($oEnd > $oStart) {
                            $dayWindows[] = [
                                'start' => Carbon::createFromTimestamp($oStart),
                                'end'   => Carbon::createFromTimestamp($oEnd),
                            ];
                        }
                    }
                    $shiftWindows = !empty($dayWindows)
                        ? collect($dayWindows)
                        : collect([['start' => $dayStart, 'end' => $dayEnd]]);
                } else {
                    $shiftWindows = collect([['start' => $dayStart, 'end' => $dayEnd]]);
                }
            } else {
                $shiftWindows = $allShiftWindows;
            }

            // ── Helper: secondi di overlap tra [s1,e1] e [s2,e2] ─────────────
            $overlapSec = function (Carbon $s1, Carbon $e1, Carbon $s2, Carbon $e2): int {
                $oStart = max($s1->timestamp, $s2->timestamp);
                $oEnd   = min($e1->timestamp, $e2->timestamp);
                return max(0, $oEnd - $oStart);
            };

            // ── Helper: secondi di un periodo [start,end] dentro i turni ──────
            $periodInWindows = function (Carbon $start, Carbon $end) use ($shiftWindows, $overlapSec): int {
                if ($shiftWindows === null) {
                    return max(0, $end->timestamp - $start->timestamp);
                }
                $total = 0;
                foreach ($shiftWindows as $w) {
                    $total += $overlapSec($start, $end, $w['start'], $w['end']);
                }
                return $total;
            };

            // ── Totale secondi turni per il giorno selezionato ────────────────
            $totalShiftSeconds = 0;
            if ($shiftWindows !== null) {
                foreach ($shiftWindows as $w) {
                    $totalShiftSeconds += max(0, $w['end']->timestamp - $w['start']->timestamp);
                }
            }

            // ── Secondi di turno già trascorsi (fino ad ora) ─────────────────
            // Usato per idle: non si può essere "idle" nel futuro del turno.
            $elapsedShiftSeconds = 0;
            if ($shiftWindows !== null) {
                foreach ($shiftWindows as $w) {
                    $elapsed = max(0, min($w['end']->timestamp, $now->timestamp) - $w['start']->timestamp);
                    $elapsedShiftSeconds += $elapsed;
                }
            }

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

            $metrics      = [];
            $allEventDays = [];

            foreach ($allPeriods as $staffId => $periods) {
                $staffModel = $periods->first()->staff;
                if (!$staffModel) {
                    continue;
                }

                // ── "In arena" = attività completate ──────────────────────────
                // Durata reale: closed_at − activity_started_at (in secondi).
                // Fallback su activity_duration × 60 se closed_at non disponibile.
                // Gruppi friend (durata indefinita) e gruppi in attesa esclusi.
                $staffGroups        = $groupsByStaff->get($staffId, collect());
                $activityCount      = $staffGroups->count();
                $timeInArenaSeconds = (int) $staffGroups->sum(function ($group) {
                    if ($group->is_friend) {
                        return 0;
                    }
                    if ($group->closed_at && $group->activity_started_at) {
                        // Durata reale misurata
                        return max(0, $group->closed_at->timestamp - $group->activity_started_at->timestamp);
                    }
                    if (!is_null($group->activity_duration)) {
                        // Stima indicativa come fallback
                        return $group->activity_duration * 60;
                    }
                    return 0;
                });

                // ── Tempo in pausa (intersezione con turni) ───────────────────
                $timeBreaksSeconds = 0;
                foreach ($periods as $period) {
                    foreach ($period->breaks as $break) {
                        $bStart = Carbon::parse($break->started_at);
                        $bEnd   = $break->ended_at ? Carbon::parse($break->ended_at) : $now;
                        // Safeguard: se started_at > ended_at (bug timezone: ora locale salvata come UTC),
                        // scambia i due estremi per ottenere la durata corretta.
                        if ($bEnd->timestamp < $bStart->timestamp) {
                            [$bStart, $bEnd] = [$bEnd, $bStart];
                        }
                        $timeBreaksSeconds += $periodInWindows($bStart, $bEnd);
                    }
                }

                // ── Idle = turni trascorsi − arena − pause ────────────────────
                $timeIdleSeconds = max(0, $elapsedShiftSeconds - $timeInArenaSeconds - $timeBreaksSeconds);

                // ── Giorni di presenza (intersezione con turni) ───────────────
                $staffDays = [];
                foreach ($periods as $period) {
                    if (is_null($period->added_at)) {
                        continue;
                    }
                    $presStart = Carbon::parse($period->added_at);
                    $presEnd   = !is_null($period->removed_at)
                        ? Carbon::parse($period->removed_at)
                        : (!is_null($period->deleted_at) ? Carbon::parse($period->deleted_at) : $now);

                    $windows = $shiftWindows ?? collect([[
                        'start' => $presStart,
                        'end'   => $presEnd,
                    ]]);

                    foreach ($windows as $w) {
                        $oStart = max($presStart->timestamp, $w['start']->timestamp);
                        $oEnd   = min($presEnd->timestamp, $w['end']->timestamp);
                        if ($oEnd <= $oStart) {
                            continue;
                        }
                        $cur    = Carbon::createFromTimestamp($oStart)->startOfDay();
                        $dayEnd = Carbon::createFromTimestamp($oEnd)->startOfDay();
                        while ($cur->lte($dayEnd)) {
                            $dateStr               = $cur->toDateString();
                            $staffDays[$dateStr]   = true;
                            $allEventDays[$dateStr] = true;
                            $cur->addDay();
                        }
                    }
                }

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
