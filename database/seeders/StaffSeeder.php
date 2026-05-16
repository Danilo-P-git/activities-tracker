<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        $members = [
            'Danilo', 'Daniele', 'Timothy', 'Giulia', 'Luca',
            'Martina', 'Alessio', 'Francesca', 'Simone', 'Chiara',
            'Matteo', 'Elena', 'Fabio',
        ];

        foreach ($members as $name) {
            \App\Models\Staff::firstOrCreate(
                ['full_name' => $name],
                ['is_available' => '1']
            );
        }
    }
}
