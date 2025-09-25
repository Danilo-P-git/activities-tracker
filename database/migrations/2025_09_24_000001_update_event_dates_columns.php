<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('event_date');
            $table->dateTime('event_start_date')->nullable()->after('description');
            $table->dateTime('event_end_date')->nullable()->after('event_start_date');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['event_start_date', 'event_end_date']);
            $table->dateTime('event_date')->nullable();
        });
    }
};
