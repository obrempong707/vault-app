<?php

namespace App\Services;

use App\Models\VaultAsset;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class VaultAssetService
{
    public function getAssets(): Collection
    {
        $query = VaultAsset::query();

        if (!Auth::user()?->isAdmin()) {
            $query->where('user_id', Auth::id());
        }

        return $query->get();
    }

    public function getAssetById(int $id): ?VaultAsset
    {
        $asset = VaultAsset::find($id);

        if (!$asset) {
            return null;
        }

        if (!Auth::user()?->isAdmin() && $asset->user_id !== Auth::id()) {
            return null;
        }

        return $asset;
    }

    public function getAssetsByCustomer(int $customerId): Collection
    {
        return VaultAsset::where('customer_id', $customerId)->get();
    }

    public function searchAssets(array $filters): Collection
    {
        $query = VaultAsset::query();

        if (!Auth::user()?->isAdmin()) {
            $query->where('user_id', Auth::id());
        }

        if (isset($filters['asset_type'])) {
            $query->where('asset_type', $filters['asset_type']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['min_value'])) {
            $query->where('value', '>=', $filters['min_value']);
        }

        if (isset($filters['max_value'])) {
            $query->where('value', '<=', $filters['max_value']);
        }

        return $query->get();
    }

    public function createAsset(array $data): VaultAsset
    {
        return VaultAsset::create($data);
    }

    public function updateAsset(int $id, array $data): ?VaultAsset
    {
        $asset = VaultAsset::find($id);

        if (!$asset) {
            return null;
        }

        $asset->update($data);
        return $asset;
    }

    public function deleteAsset(int $id): bool
    {
        $asset = VaultAsset::find($id);
        return $asset ? $asset->delete() : false;
    }

    public function getAssetsSummary(): array
    {
        $assets = $this->getAssets();

        return [
            'total_value' => $assets->sum('value'),
            'total_assets' => $assets->count(),
            'by_type' => $assets->groupBy('asset_type')->map->count(),
        ];
    }
}
