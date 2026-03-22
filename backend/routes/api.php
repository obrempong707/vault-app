<?php

use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\VaultAssetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| RESTful API endpoints for VaultLogix platform.
| Base URL: /api
|
*/

// Shipment Tracking (public)
Route::get('/track/{trackingId}', [ShipmentController::class, 'track']);

// Shipments CRUD
Route::apiResource('shipments', ShipmentController::class);

// Vault Assets CRUD
Route::apiResource('vault-assets', VaultAssetController::class);

// Vault Assets by Customer
Route::get('/vault-assets/customer/{customerId}', [VaultAssetController::class, 'byCustomer']);
