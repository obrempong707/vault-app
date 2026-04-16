<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trackingId' => $this->tracking_id,
            'customer' => $this->customer,
            'origin' => $this->origin,
            'destination' => $this->destination,
            'currentLocation' => $this->current_location,
            'status' => $this->status,
            'totalValue' => $this->total_value,
            'estimatedDelivery' => $this->estimated_delivery,
            'deliveredAt' => $this->delivered_at,
            'contents' => ShipmentContentResource::collection($this->whenLoaded('contents')),
            'trackingStops' => TrackingStopResource::collection($this->whenLoaded('trackingStops')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
