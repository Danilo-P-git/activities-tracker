<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Configurazione;

class ConfigurazioneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Configurazione::updateOrCreate(
            ['chiave' => 'gruppi_contemporanei_possibili'],
            ['valore' => '3']
        );
        Configurazione::updateOrCreate(
            ['chiave' => 'durata_media_gruppo'],
            ['valore' => '10']
        );
    }
}
