<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->integer('number_of_people');
            $table->string('group_name');
            $table->string('description')->nullable(true);
            $table->date('date');
            $table->integer('activity_duration')->nullable(); // durata in minuti, null se indefinita
            $table->boolean('is_friend')->default(false); // true se "amico", quindi durata indefinita
            $table->foreignId('staff_id')->nullable()->constrained('staff');
            $table->foreignId('event_id')->constrained('events');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
