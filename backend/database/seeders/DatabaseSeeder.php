<?php

namespace Database\Seeders;

use App\Models\Shipment;
use App\Models\VaultAsset;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed Shipments
        $shipment1 = Shipment::create([
            'tracking_id' => 'VLT-2024-001',
            'status' => 'in_transit',
            'origin' => 'Zurich, Switzerland',
            'destination' => 'Singapore',
            'current_location' => 'Dubai, UAE',
            'estimated_delivery' => '2024-03-25',
            'customer' => 'Goldstein Holdings Ltd',
            'total_value' => 1225000,
        ]);
        $shipment1->contents()->createMany([
            ['type' => 'Gold Bars', 'weight' => 5.2, 'unit' => 'kg', 'value' => 350000],
            ['type' => 'Diamonds', 'weight' => 125, 'unit' => 'carats', 'value' => 875000],
        ]);

        $shipment2 = Shipment::create([
            'tracking_id' => 'VLT-2024-002',
            'status' => 'delivered',
            'origin' => 'London, UK',
            'destination' => 'Hong Kong',
            'current_location' => 'Hong Kong',
            'estimated_delivery' => '2024-03-18',
            'delivered_at' => '2024-03-17',
            'customer' => 'Crown Jewelers International',
            'total_value' => 1335000,
        ]);
        $shipment2->contents()->createMany([
            ['type' => 'Gemstones', 'weight' => 450, 'unit' => 'carats', 'value' => 1250000],
            ['type' => 'Platinum', 'weight' => 2.1, 'unit' => 'kg', 'value' => 85000],
        ]);

        $shipment3 = Shipment::create([
            'tracking_id' => 'VLT-2024-003',
            'status' => 'processing',
            'origin' => 'New York, USA',
            'destination' => 'Geneva, Switzerland',
            'current_location' => 'New York, USA',
            'estimated_delivery' => '2024-03-28',
            'customer' => 'Manhattan Precious Metals',
            'total_value' => 580000,
        ]);
        $shipment3->contents()->create([
            'type' => 'Gold Coins', 'weight' => 8.5, 'unit' => 'kg', 'value' => 580000,
        ]);

        $shipment4 = Shipment::create([
            'tracking_id' => 'VLT-2024-004',
            'status' => 'in_transit',
            'origin' => 'Tokyo, Japan',
            'destination' => 'Sydney, Australia',
            'current_location' => 'Manila, Philippines',
            'estimated_delivery' => '2024-03-24',
            'customer' => 'Pacific Gem Traders',
            'total_value' => 1095000,
        ]);
        $shipment4->contents()->createMany([
            ['type' => 'Sapphires', 'weight' => 280, 'unit' => 'carats', 'value' => 420000],
            ['type' => 'Rubies', 'weight' => 150, 'unit' => 'carats', 'value' => 675000],
        ]);

        $shipment5 = Shipment::create([
            'tracking_id' => 'VLT-2024-005',
            'status' => 'pending',
            'origin' => 'Dubai, UAE',
            'destination' => 'Mumbai, India',
            'current_location' => 'Dubai, UAE',
            'estimated_delivery' => '2024-03-30',
            'customer' => 'Royal Indian Jewels',
            'total_value' => 1770000,
        ]);
        $shipment5->contents()->createMany([
            ['type' => 'Gold Bars', 'weight' => 12.0, 'unit' => 'kg', 'value' => 810000],
            ['type' => 'Emeralds', 'weight' => 320, 'unit' => 'carats', 'value' => 960000],
        ]);

        // Seed Vault Assets
        VaultAsset::create([
            'customer_id' => 'CUST-001',
            'customer_name' => 'Goldstein Holdings Ltd',
            'asset_type' => 'Gold Bars',
            'weight' => 15.5,
            'unit' => 'kg',
            'purity' => '99.99%',
            'value' => 1050000,
            'deposit_date' => '2024-01-15',
            'vault_location' => 'Zurich Vault A-12',
        ]);

        VaultAsset::create([
            'customer_id' => 'CUST-002',
            'customer_name' => 'Crown Jewelers International',
            'asset_type' => 'Diamonds',
            'weight' => 850,
            'unit' => 'carats',
            'purity' => 'VVS1-VVS2',
            'value' => 5950000,
            'deposit_date' => '2024-02-01',
            'vault_location' => 'London Vault B-05',
        ]);

        VaultAsset::create([
            'customer_id' => 'CUST-003',
            'customer_name' => 'Pacific Gem Traders',
            'asset_type' => 'Sapphires',
            'weight' => 420,
            'unit' => 'carats',
            'purity' => 'AAA Grade',
            'value' => 630000,
            'deposit_date' => '2024-02-20',
            'vault_location' => 'Singapore Vault C-08',
        ]);

        VaultAsset::create([
            'customer_id' => 'CUST-001',
            'customer_name' => 'Goldstein Holdings Ltd',
            'asset_type' => 'Platinum',
            'weight' => 8.2,
            'unit' => 'kg',
            'purity' => '99.95%',
            'value' => 328000,
            'deposit_date' => '2024-03-01',
            'vault_location' => 'Zurich Vault A-12',
        ]);

        VaultAsset::create([
            'customer_id' => 'CUST-004',
            'customer_name' => 'Royal Indian Jewels',
            'asset_type' => 'Emeralds',
            'weight' => 580,
            'unit' => 'carats',
            'purity' => 'AAA Grade',
            'value' => 1740000,
            'deposit_date' => '2024-03-10',
            'vault_location' => 'Dubai Vault D-03',
            'status' => 'pending_shipment',
        ]);

        VaultAsset::create([
            'customer_id' => 'CUST-005',
            'customer_name' => 'Manhattan Precious Metals',
            'asset_type' => 'Gold Coins',
            'weight' => 22.5,
            'unit' => 'kg',
            'purity' => '99.99%',
            'value' => 1530000,
            'deposit_date' => '2023-12-05',
            'vault_location' => 'New York Vault E-01',
        ]);
    }
}
