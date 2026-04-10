<?php

namespace App\Services;

use App\Models\Shipment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class ShipmentService
{
    public function getShipments(): Collection
    {
        $query = Shipment::with(['contents', 'trackingStops']);

        if (!Auth::user()?->isAdmin()) {
            $query->where('customer', Auth::user()->customer_id);
        }

        return $query->get();
    }

    public function getShipmentById(int $id): ?Shipment
    {
        $shipment = Shipment::with(['contents', 'trackingStops'])->find($id);

        if (!$shipment) {
            return null;
        }

        if (!Auth::user()?->isAdmin() && $shipment->customer !== Auth::user()->customer_id) {
            return null;
        }

        return $shipment;
    }

    public function trackShipment(string $trackingId): ?Shipment
    {
        return Shipment::with(['trackingStops'])
            ->where('tracking_id', $trackingId)
            ->first();
    }

    public function createShipment(array $data): Shipment
    {
        return Shipment::create($data);
    }

    public function updateShipment(int $id, array $data): ?Shipment
    {
        $shipment = Shipment::find($id);

        if (!$shipment) {
            return null;
        }

        $shipment->update($data);
        return $shipment;
    }

    public function deleteShipment(int $id): bool
    {
        $shipment = Shipment::find($id);
        return $shipment ? $shipment->delete() : false;
    }

    public function updateShipmentByTracking(string $trackingId, array $data): ?Shipment
    {
        $shipment = Shipment::where('tracking_id', $trackingId)->first();

        if (!$shipment) {
            return null;
        }

        $shipment->update($data);
        return $shipment;
    }
}
