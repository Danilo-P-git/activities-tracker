<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;

class StaffMetricsTime
{
    public static function asUtcCarbon($value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        return $value instanceof Carbon
            ? $value->copy()
            : Carbon::parse($value);
    }

    public static function parseRawUtc($model, string $field): ?Carbon
    {
        $rawValue = is_object($model) && method_exists($model, 'getRawOriginal')
            ? $model->getRawOriginal($field)
            : null;

        if ($rawValue) {
            return Carbon::parse($rawValue, 'UTC');
        }

        $value = is_object($model) ? ($model->{$field} ?? null) : null;

        if (!$value) {
            return null;
        }

        return self::asUtcCarbon($value);
    }

    public static function resolveShiftWindows(?Carbon $eventStartAt, ?Carbon $eventEndAt, Collection $shiftRecords, Carbon $now): ?Collection
    {
        if ($shiftRecords->isEmpty()) {
            if (!$eventStartAt) {
                return null;
            }

            return collect([[
                'start' => $eventStartAt->copy(),
                'end' => $eventEndAt ? $eventEndAt->copy() : $now->copy(),
            ]]);
        }

        return $shiftRecords->map(fn($shift) => [
            'start' => self::asUtcCarbon($shift->starts_at),
            'end' => self::asUtcCarbon($shift->ends_at),
        ]);
    }

    public static function availableDates(?Carbon $eventStartAt, ?Carbon $eventEndAt, string $scheduleTz): array
    {
        if (!$eventStartAt) {
            return [];
        }

        $dates = [];
        $cursor = $eventStartAt->copy()->setTimezone($scheduleTz)->startOfDay();
        $dayEnd = $eventEndAt
            ? $eventEndAt->copy()->setTimezone($scheduleTz)->startOfDay()
            : $cursor->copy();

        while ($cursor->lte($dayEnd)) {
            $dates[] = $cursor->toDateString();
            $cursor->addDay();
        }

        return $dates;
    }

    public static function filterShiftWindowsByDate(?Collection $allShiftWindows, ?string $dateFilter, string $scheduleTz): ?Collection
    {
        if ($dateFilter === null) {
            return $allShiftWindows;
        }

        $dayStart = Carbon::parse($dateFilter, $scheduleTz)->startOfDay();
        $dayEnd = Carbon::parse($dateFilter, $scheduleTz)->endOfDay();

        if ($allShiftWindows === null) {
            return collect([['start' => $dayStart, 'end' => $dayEnd]]);
        }

        $dayWindows = [];
        foreach ($allShiftWindows as $window) {
            $overlapStart = max($window['start']->timestamp, $dayStart->timestamp);
            $overlapEnd = min($window['end']->timestamp, $dayEnd->timestamp);

            if ($overlapEnd > $overlapStart) {
                $dayWindows[] = [
                    'start' => Carbon::createFromTimestamp($overlapStart),
                    'end' => Carbon::createFromTimestamp($overlapEnd),
                ];
            }
        }

        return !empty($dayWindows)
            ? collect($dayWindows)
            : collect([['start' => $dayStart, 'end' => $dayEnd]]);
    }

    public static function totalShiftSeconds(?Collection $shiftWindows): int
    {
        if ($shiftWindows === null) {
            return 0;
        }

        return (int) $shiftWindows->sum(fn($window) => max(0, $window['end']->timestamp - $window['start']->timestamp));
    }

    public static function elapsedShiftSeconds(?Collection $shiftWindows, Carbon $now): int
    {
        if ($shiftWindows === null) {
            return 0;
        }

        return (int) $shiftWindows->sum(
            fn($window) => max(0, min($window['end']->timestamp, $now->timestamp) - $window['start']->timestamp)
        );
    }

    public static function collectPresenceDays(iterable $periods, ?Collection $shiftWindows, Carbon $now): array
    {
        $staffDays = [];
        $allEventDays = [];

        foreach ($periods as $period) {
            $presenceStart = self::parseRawUtc($period, 'added_at');
            if ($presenceStart === null) {
                continue;
            }

            $presenceEnd = self::parseRawUtc($period, 'removed_at')
                ?? self::parseRawUtc($period, 'deleted_at')
                ?? $now->copy();

            $windows = $shiftWindows ?? collect([[
                'start' => $presenceStart,
                'end' => $presenceEnd,
            ]]);

            foreach ($windows as $window) {
                $overlapStart = max($presenceStart->timestamp, $window['start']->timestamp);
                $overlapEnd = min($presenceEnd->timestamp, $window['end']->timestamp);

                if ($overlapEnd <= $overlapStart) {
                    continue;
                }

                $cursor = Carbon::createFromTimestamp($overlapStart)->startOfDay();
                $dayEnd = Carbon::createFromTimestamp($overlapEnd)->startOfDay();

                while ($cursor->lte($dayEnd)) {
                    $date = $cursor->toDateString();
                    $staffDays[$date] = true;
                    $allEventDays[$date] = true;
                    $cursor->addDay();
                }
            }
        }

        return [array_keys($staffDays), array_keys($allEventDays)];
    }

    public static function timeInArenaSeconds(Collection $groups): int
    {
        return (int) $groups->sum(function ($group) {
            if ($group->is_friend) {
                return 0;
            }

            $activityStartedAt = self::parseRawUtc($group, 'activity_started_at');
            $closedAt = self::parseRawUtc($group, 'closed_at');

            if ($closedAt && $activityStartedAt) {
                return max(0, $closedAt->timestamp - $activityStartedAt->timestamp);
            }

            if (!is_null($group->activity_duration)) {
                return $group->activity_duration * 60;
            }

            return 0;
        });
    }

    public static function timeBreaksSeconds(iterable $periods, ?Collection $shiftWindows, Carbon $now): int
    {
        $total = 0;

        foreach ($periods as $period) {
            foreach ($period->breaks as $break) {
                $breakStart = self::parseRawUtc($break, 'started_at');
                $breakEnd = self::parseRawUtc($break, 'ended_at') ?? $now->copy();

                // if (!$breakStart || $breakEnd->timestamp < $breakStart->timestamp) {
                //     continue;
                // }
                $total += self::periodInWindows($breakStart, $breakEnd, $shiftWindows);
            }
        }

        return $total;
    }

    public static function timeIdleSeconds(int $elapsedShiftSeconds, int $timeInArenaSeconds, int $timeBreaksSeconds): int
    {
        return max(0, $elapsedShiftSeconds - $timeInArenaSeconds - $timeBreaksSeconds);
    }

    public static function periodInWindows(Carbon $start, Carbon $end, ?Collection $shiftWindows): int
    {
        if ($shiftWindows === null) {
            return max(0, $end->timestamp - $start->timestamp);
        }

        $total = 0;

        foreach ($shiftWindows as $window) {
            $total += self::overlapSeconds($start, $end, $window['start'], $window['end']);
        }

        return $total;
    }

    public static function overlapSeconds(Carbon $startA, Carbon $endA, Carbon $startB, Carbon $endB): int
    {
        $overlapStart = max($startA->timestamp, $startB->timestamp);
        $overlapEnd = min($endA->timestamp, $endB->timestamp);

        return max(0, $overlapEnd - $overlapStart);
    }
}
