<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vault_assets', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id');
            $table->string('customer_name');
            $table->string('asset_type');
            $table->decimal('weight', 10, 2);
            $table->string('unit');
            $table->string('purity');
            $table->decimal('value', 15, 2);
            $table->date('deposit_date');
            $table->string('vault_location');
            $table->string('insurance_status')->default('Fully Insured');
            $table->enum('status', ['stored', 'pending_shipment'])->default('stored');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vault_assets');
    }
};
