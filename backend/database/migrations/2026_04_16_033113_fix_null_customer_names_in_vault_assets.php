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
        // Update vault assets with null customer_name to have a default value
        \DB::statement("UPDATE vault_assets SET customer_name = CONCAT('Customer ', customer_id) WHERE customer_name IS NULL OR customer_name = ''");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data fix
    }
};
