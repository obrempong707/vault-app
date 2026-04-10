<?php

namespace App\Http\Controllers;

use App\Models\VaultAsset;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class VaultAssetController extends Controller
{
    /**
     * List all vault assets.
     */
    public function index(): JsonResponse
    {
        $query = VaultAsset::query();
        // Non-admins: restrict to their own assets
        if (Auth::user() && (Auth::user()->role ?? null) !== 'admin') {
            $query->where('user_id', Auth::id());
        }
        $assets = $query->get();

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
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($vaultAsset->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this vault asset.',
                ], 403);
            }
        }
        
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
        $query = VaultAsset::where('customer_id', $customerId);
        if (Auth::user() && (Auth::user()->role ?? null) !== 'admin') {
            $query->where('user_id', Auth::id());
        }
        $assets = $query->get();

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
     * Search vault assets by various criteria.
     */
    public function search(Request $request): JsonResponse
    {
        // Validate search inputs to prevent abuse
        $validated = $request->validate([
            'customer_name' => 'sometimes|string|max:100',
            'asset_type' => 'sometimes|string|max:50',
            'vault_location' => 'sometimes|string|max:100',
            'status' => 'sometimes|in:stored,pending_shipment',
            'insurance_status' => 'sometimes|string|max:50',
            'customer_id' => 'sometimes|string|max:20',
        ]);

        $query = VaultAsset::query();

        // Non-admins: restrict to their own assets
        if (Auth::user() && (Auth::user()->role ?? null) !== 'admin') {
            $query->where('user_id', Auth::id());
        }

        // Search by customer name
        if (isset($validated['customer_name'])) {
            $query->where('customer_name', 'like', '%' . $validated['customer_name'] . '%');
        }

        // Search by asset type
        if (isset($validated['asset_type'])) {
            $query->where('asset_type', 'like', '%' . $validated['asset_type'] . '%');
        }

        // Search by vault location
        if (isset($validated['vault_location'])) {
            $query->where('vault_location', 'like', '%' . $validated['vault_location'] . '%');
        }

        // Search by status
        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Search by insurance status
        if (isset($validated['insurance_status'])) {
            $query->where('insurance_status', $validated['insurance_status']);
        }

        // Filter by customer ID (for non-admin users)
        if (isset($validated['customer_id'])) {
            $query->where('customer_id', $validated['customer_id']);
        }

        // Order by most recent deposit date
        $query->orderBy('deposit_date', 'desc');

        $assets = $query->get();

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
            'user_id' => 'sometimes|integer|exists:users,id',
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

        // Determine owner user_id
        $ownerId = Auth::id();
        if (isset($validated['user_id']) && Auth::user() && (Auth::user()->role ?? null) === 'admin') {
            $ownerId = (int) $validated['user_id'];
        }

        // Generate unique customer ID
        $customerId = $this->generateUniqueCustomerId($validated['customer_name']);

        $asset = VaultAsset::create(array_merge(collect($validated)->except('user_id')->all(), [
            'user_id' => $ownerId,
            'customer_id' => $customerId,
            'insurance_status' => $validated['insurance_status'] ?? 'Fully Insured',
            'status' => $validated['status'] ?? 'stored',
        ]));

        return response()->json([
            'success' => true,
            'data' => $asset,
        ], 201);
    }

    /**
     * Generate a unique customer ID based on customer name
     */
    private function generateUniqueCustomerId(string $customerName): string
    {
        // Create base ID from customer name (first 3 letters, uppercase)
        $baseId = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $customerName), 0, 3));
        if (empty($baseId)) {
            $baseId = 'CUST';
        }

        // Find existing customer IDs with same base
        $existingIds = VaultAsset::where('customer_id', 'like', $baseId . '%')
            ->pluck('customer_id')
            ->toArray();

        // Generate unique suffix
        $suffix = 1;
        do {
            $customerId = $baseId . str_pad($suffix, 3, '0', STR_PAD_LEFT);
            $suffix++;
        } while (in_array($customerId, $existingIds));

        return $customerId;
    }

    /**
     * Update an existing vault asset.
     */
    public function update(Request $request, VaultAsset $vaultAsset): JsonResponse
    {
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($vaultAsset->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this vault asset.',
                ], 403);
            }
        }
        
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
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($vaultAsset->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this vault asset.',
                ], 403);
            }
        }
        
        $vaultAsset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vault asset deleted.',
        ]);
    }
}
