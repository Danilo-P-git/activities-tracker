<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn('is_busy');
        });
    }

    public function down()
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('is_busy')->default('0');
        });
    }
};
