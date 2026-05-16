<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $choice = $this->command->choice(
            'Cosa vuoi seminare?',
            [
                1 => 'Solo utenti',
                2 => 'Utenti + Staff',
                3 => 'Utenti + Staff + Gruppi (evento di test)',
            ],
            1
        );


        // ── Utenti ────────────────────────────────────────────────────────────
        $this->call(ConfigurazioneSeeder::class);

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name'               => 'Test User',
                'password'           => Hash::make('password'),
                'email_verified_at'  => now(),
            ]
        );
        $this->command->info('✓ Utenti');

        if ($choice === 'Solo utenti') {
            return;
        }

        // ── Staff ─────────────────────────────────────────────────────────────
        $this->call(StaffSeeder::class);
        $this->command->info('✓ Staff + Configurazione');

        if ($choice === 'Utenti + Staff') {
            return;
        }

        // ── Gruppi (evento di test) ───────────────────────────────────────────
        $this->call(PublicEventWithGroupsSeeder::class);
        $this->command->info('✓ Evento pubblico di test con gruppi');
    }
}
