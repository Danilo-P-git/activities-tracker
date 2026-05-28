<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // Timestamp impostato automaticamente alla chiusura del gruppo (is_closed → true).
            // Permette di calcolare la durata reale: closed_at − activity_started_at.
            $table->timestamp('closed_at')->nullable()->after('activity_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('closed_at');
        });
    }
};
