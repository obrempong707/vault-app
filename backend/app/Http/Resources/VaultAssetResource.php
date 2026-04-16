<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VaultAssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $depositDate = $this->deposit_date;
        if ($depositDate && is_object($depositDate)) {
            $depositDate = $depositDate->format('Y-m-d');
        }

        $shipment = $this->shipment;
        $hasTracking = $shipment !== null;

        return [
            'id' => $this->id,
            'customerId' => $this->customer_id,
            'customerName' => $this->customer_name,
            'assetType' => $this->asset_type,
            'weight' => $this->weight,
            'unit' => $this->unit,
            'purity' => $this->purity,
            'value' => $this->value,
            'depositDate' => $depositDate,
            'vaultLocation' => $this->vault_location,
            'insuranceStatus' => $this->insurance_status,
            'status' => $this->status,
            'hasTracking' => $hasTracking,
            'trackingId' => $hasTracking ? $shipment->tracking_id : null,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
