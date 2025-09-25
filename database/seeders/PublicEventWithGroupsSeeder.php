<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\Staff;
use App\Models\Group;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PublicEventWithGroupsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Prendi 5 staff random (assicurati che esistano già)
        $staff = Staff::inRandomOrder()->limit(5)->get();
        if ($staff->count() < 1) {
            $this->command->error('Non ci sono abbastanza staff. Esegui prima il seeder Staff!');
            return;
        }

        // Crea evento di 3 giorni
        $start = Carbon::today();
        $end = $start->copy()->addDays(2); // 3 giorni inclusi
        $event = Event::create([
            'event_name' => 'EC TEST',
            'description' => 'Evento di test pubblico con gruppi',
            'event_start_date' => $start->toDateString(),
            'event_end_date' => $end->toDateString(),
            'location' => 'Test Arena',
        ]);
        // Aggiorna nome con id
        $event->event_name = 'EC TEST ' . $event->id;
        $event->save();

        // Associa staff all'evento
        $event->staff()->sync($staff->pluck('id')->toArray());

        // Crea 10 gruppi in attesa
        for ($i = 1; $i <= 10; $i++) {
            Group::create([
                'group_name' => 'Gruppo ' . $i,
                'number_of_people' => rand(2, 8),
                'is_waiting' => true,
                'is_closed' => false,
                'description' => 'Gruppo di test n. ' . $i,
                'event_id' => $event->id,
                'staff_id' => $staff->random()->id,
                'date' => $start->toDateString(),
                'activity_duration' => rand(10, 30),
                'is_friend' => false,
            ]);
        }
    }
}
