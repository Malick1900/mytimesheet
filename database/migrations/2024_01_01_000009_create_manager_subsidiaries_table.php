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
        Schema::create('manager_subsidiaries', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->uuid('subsidiary_id');
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['user_id', 'subsidiary_id']);

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('subsidiary_id')
                ->references('id')
                ->on('subsidiaries')
                ->onDelete('restrict');

            $table->index('subsidiary_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manager_subsidiaries');
    }
};
