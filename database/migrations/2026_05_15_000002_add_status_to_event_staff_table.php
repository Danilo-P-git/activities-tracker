<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_staff', function (Blueprint $table) {
            // 'active' = presente e assegnabile ai gruppi
            // 'break'  = fisicamente presente all'evento ma non assegnabile (pausa)
            // L'assenza è già gestita tramite removed_at + soft delete (nuovo record al rientro)
            $table->string('status', 10)->default('active')->after('removed_at');
        });
    }

    public function down(): void
    {
        Schema::table('event_staff', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
