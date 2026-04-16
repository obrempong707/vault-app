<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'vault_asset_id',
        'tracking_id',
        'status',
        'origin',
        'destination',
        'current_location',
        'estimated_delivery',
        'delivered_at',
        'customer',
        'total_value',
    ];

    protected $casts = [
        'estimated_delivery' => 'date',
        'delivered_at' => 'date',
        'total_value' => 'decimal:2',
    ];

    public function vaultAsset()
    {
        return $this->belongsTo(VaultAsset::class);
    }

    public function contents()
    {
        return $this->hasMany(ShipmentContent::class);
    }

    public function trackingStops()
    {
        return $this->hasMany(TrackingStop::class)->orderBy('sequence')->orderBy('recorded_at');
    }
}
