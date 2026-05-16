<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Event;
use App\Models\EventStaff;
use App\Models\Staff;
use App\Models\Group;
use Carbon\Carbon;

class PublicEventWithGroupsSeeder extends Seeder
{
    public function run(): void
    {
        $staff = Staff::inRandomOrder()->limit(5)->get();
        if ($staff->count() < 1) {
            $this->command->error('Non ci sono abbastanza staff. Esegui prima StaffSeeder!');
            return;
        }

        // Evento di 3 giorni che parte da oggi
        $start = Carbon::today();
        $end   = $start->copy()->addDays(2);
        $event = Event::create([
            'event_name'       => 'EC TEST',
            'description'      => 'Evento di test pubblico con gruppi',
            'event_start_date' => $start->toDateString(),
            'event_end_date'   => $end->toDateString(),
            'location'         => 'Test Arena',
        ]);
        $event->update(['event_name' => 'EC TEST ' . $event->id]);

        // ---------------------------------------------------------------
        // Associa ogni staff con periodi realistici in arena (added_at / removed_at)
        // così le statistiche BE hanno dati concreti da calcolare
        // ---------------------------------------------------------------
        $arenaStart = $start->copy()->setTime(9, 0);  // tutti entrano alle 9:00

        foreach ($staff as $index => $member) {
            // Periodo 1 (storico chiuso): dalle 9:00, uscito dopo 90-150 min
            $entrato1  = $arenaStart->copy()->addMinutes($index * 5);
            $uscito1   = $entrato1->copy()->addMinutes(90 + $index * 15);

            $periodo1 = EventStaff::create([
                'event_id'   => $event->id,
                'staff_id'   => $member->id,
                'added_at'   => $entrato1,
                'removed_at' => $uscito1,
                'status'     => 'active',
            ]);
            // Soft delete per marcare correttamente il periodo come chiuso
            // Uso DB::table perché EventStaff estende Pivot e non gestisce bene il save diretto
            DB::table('event_staff')->where('id', $periodo1->id)->update(['deleted_at' => $uscito1]);

            // Periodo 2 (corrente aperto): rientra dopo 30 min di pausa, ancora in arena
            $entrato2 = $uscito1->copy()->addMinutes(30);

            // Alterna: un membro su due è in pausa per mostrare entrambi gli stati
            $statusCorrente = ($index % 2 === 0) ? 'active' : 'break';

            EventStaff::create([
                'event_id'   => $event->id,
                'staff_id'   => $member->id,
                'added_at'   => $entrato2,
                'removed_at' => null,
                'status'     => $statusCorrente,
            ]);
        }

        // ---------------------------------------------------------------
        // Gruppi chiusi (attivati e conclusi) — generano dati per stats
        // ---------------------------------------------------------------
        $groupStart = $arenaStart->copy()->addMinutes(10);
        for ($i = 1; $i <= 8; $i++) {
            $duration = rand(10, 25);
            $activatedAt = $groupStart->copy()->addMinutes(($i - 1) * 30);
            Group::create([
                'group_name'          => 'Gruppo Chiuso ' . $i,
                'number_of_people'    => rand(2, 6),
                'is_waiting'          => false,
                'is_closed'           => true,
                'description'         => 'Gruppo chiuso di test n. ' . $i,
                'event_id'            => $event->id,
                'staff_id'            => $staff->get($i % $staff->count())->id,
                'date'                => $start->toDateString(),
                'activity_duration'   => $duration,
                'activity_started_at' => $activatedAt,
                'is_friend'           => false,
            ]);
        }

        // ---------------------------------------------------------------
        // Gruppi attivi (in corso) — is_waiting=false, non chiusi
        // ---------------------------------------------------------------
        for ($i = 1; $i <= 3; $i++) {
            $duration    = rand(10, 20);
            $activatedAt = Carbon::now()->subMinutes(rand(2, $duration - 1)); // timer non scaduto
            Group::create([
                'group_name'          => 'Gruppo Attivo ' . $i,
                'number_of_people'    => rand(2, 5),
                'is_waiting'          => false,
                'is_closed'           => false,
                'description'         => 'Gruppo attivo di test n. ' . $i,
                'event_id'            => $event->id,
                'staff_id'            => $staff->get($i % $staff->count())->id,
                'date'                => $start->toDateString(),
                'activity_duration'   => $duration,
                'activity_started_at' => $activatedAt,
                'is_friend'           => false,
            ]);
        }

        // ---------------------------------------------------------------
        // Gruppi in attesa — is_waiting=true
        // ---------------------------------------------------------------
        for ($i = 1; $i <= 5; $i++) {
            Group::create([
                'group_name'        => 'Gruppo Attesa ' . $i,
                'number_of_people'  => rand(2, 8),
                'is_waiting'        => true,
                'is_closed'         => false,
                'description'       => 'Gruppo in attesa di test n. ' . $i,
                'event_id'          => $event->id,
                'staff_id'          => $staff->random()->id,
                'date'              => $start->toDateString(),
                'activity_duration' => rand(10, 30),
                'is_friend'         => false,
            ]);
        }

        $this->command->info('PublicEventWithGroupsSeeder completato: evento "' . $event->event_name . '" con ' . $staff->count() . ' staff, 8 gruppi chiusi, 3 attivi, 5 in attesa.');
    }
}
