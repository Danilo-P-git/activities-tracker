<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            StaffSeeder::class,
            ConfigurazioneSeeder::class,
            // ...altri seeder se presenti
        ]);

        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Chiedi conferma prima di eseguire PublicEventWithGroupsSeeder
        if ($this->command && $this->command->confirm('Vuoi eseguire anche il seeder PublicEventWithGroupsSeeder (evento pubblico di test con gruppi)?')) {
            $this->call(PublicEventWithGroupsSeeder::class);
        } else {
            $this->command && $this->command->info('Seeder PublicEventWithGroupsSeeder SKIPPATO.');
        }
    }
}
