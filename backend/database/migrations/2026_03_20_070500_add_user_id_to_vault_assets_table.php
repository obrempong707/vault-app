<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vault_assets', function (Blueprint $table) {
            if (!Schema::hasColumn('vault_assets', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
                $table->index('user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vault_assets', function (Blueprint $table) {
            if (Schema::hasColumn('vault_assets', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
