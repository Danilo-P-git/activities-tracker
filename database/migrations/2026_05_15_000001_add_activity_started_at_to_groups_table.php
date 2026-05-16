<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // Timestamp impostato una volta sola quando il gruppo viene attivato (is_waiting → false)
            $table->timestamp('activity_started_at')->nullable()->after('activity_duration');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('activity_started_at');
        });
    }
};
