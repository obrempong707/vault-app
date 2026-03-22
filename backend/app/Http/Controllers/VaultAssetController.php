<?php

namespace App\Http\Controllers;

use App\Models\VaultAsset;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class VaultAssetController extends Controller
{
    /**
     * List all vault assets.
     */
    public function index(): JsonResponse
    {
        $assets = VaultAsset::all();

        return response()->json([
            'success' => true,
            'data' => $assets,
            'summary' => [
                'total_value' => $assets->sum('value'),
                'total_assets' => $assets->count(),
            ],
        ]);
    }

    /**
     * Get a single vault asset.
     */
    public function show(VaultAsset $vaultAsset): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $vaultAsset,
        ]);
    }

    /**
     * Get vault assets for a specific customer.
     */
    public function byCustomer(string $customerId): JsonResponse
    {
        $assets = VaultAsset::where('customer_id', $customerId)->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
            'summary' => [
                'total_value' => $assets->sum('value'),
                'total_assets' => $assets->count(),
            ],
        ]);
    }

    /**
     * Store a new vault asset.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'asset_type' => 'required|string',
            'weight' => 'required|numeric|min:0',
            'unit' => 'required|string|in:kg,grams,ounces,carats',
            'purity' => 'required|string',
            'value' => 'required|numeric|min:0',
            'deposit_date' => 'required|date',
            'vault_location' => 'required|string',
            'insurance_status' => 'sometimes|string',
            'status' => 'sometimes|in:stored,pending_shipment',
        ]);

        $asset = VaultAsset::create(array_merge($validated, [
            'insurance_status' => $validated['insurance_status'] ?? 'Fully Insured',
            'status' => $validated['status'] ?? 'stored',
            'customer_id' => $this->generateCustomerId(),
        ]));

        return response()->json([
            'success' => true,
            'data' => $asset,
        ], 201);
    }

    /**
     * Update an existing vault asset.
     */
    public function update(Request $request, VaultAsset $vaultAsset): JsonResponse
    {
        $validated = $request->validate([
            'asset_type' => 'sometimes|string',
            'weight' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string|in:kg,grams,ounces,carats',
            'purity' => 'sometimes|string',
            'value' => 'sometimes|numeric|min:0',
            'deposit_date' => 'sometimes|date',
            'vault_location' => 'sometimes|string',
            'insurance_status' => 'sometimes|string',
            'status' => 'sometimes|in:stored,pending_shipment',
        ]);

        $vaultAsset->update($validated);

        return response()->json([
            'success' => true,
            'data' => $vaultAsset,
        ]);
    }

    /**
     * Delete a vault asset.
     */
    public function destroy(VaultAsset $vaultAsset): JsonResponse
    {
        $vaultAsset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vault asset deleted.',
        ]);
    }

    private function generateCustomerId(): string
    {
        do {
            $customerId = 'CUST-' . strtoupper(Str::padLeft((string) random_int(1, 999), 3, '0'));
        } while (VaultAsset::where('customer_id', $customerId)->exists());

        return $customerId;
    }
}
