<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('configurazioni', function (Blueprint $table) {
            $table->id();
            $table->string('chiave')->unique();
            $table->string('valore');
            // key-value: aggiungi nuove configurazioni senza migrazioni
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('configurazioni');
    }
};
