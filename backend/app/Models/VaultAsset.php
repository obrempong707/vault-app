<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VaultAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'customer_id',
        'customer_name',
        'asset_type',
        'weight',
        'unit',
        'purity',
        'value',
        'deposit_date',
        'vault_location',
        'insurance_status',
        'status',
        'vault_asset_id',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'value' => 'decimal:2',
        'deposit_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shipment()
    {
        return $this->hasOne(Shipment::class);
    }

    public function hasTracking(): bool
    {
        return $this->shipment()->exists();
    }
}
