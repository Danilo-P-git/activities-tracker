<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\Staff::create(['full_name' => 'Danilo', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Daniele', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Timothy', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Giulia', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Luca', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Martina', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Alessio', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Francesca', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Simone', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Chiara', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Matteo', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Elena', 'is_available' => '1', 'is_busy' => '0']);
        \App\Models\Staff::create(['full_name' => 'Fabio', 'is_available' => '1', 'is_busy' => '0']);
    }
}
