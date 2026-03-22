# VaultLogix API (Laravel Backend)

## Prerequisites
- PHP >= 8.1
- Composer
- MySQL or SQLite

## Setup

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations and seed data
php artisan migrate --seed

# Start the API server
php artisan serve
```

The API will be available at `http://localhost:8000/api`

## API Endpoints

### Shipments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments` | List all shipments |
| GET | `/api/shipments/{id}` | Get shipment by ID |
| GET | `/api/track/{trackingId}` | Track by tracking ID |
| POST | `/api/shipments` | Create new shipment |
| PUT | `/api/shipments/{id}` | Update a shipment |
| DELETE | `/api/shipments/{id}` | Delete a shipment |

### Vault Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vault-assets` | List all vault assets |
| GET | `/api/vault-assets/{id}` | Get asset by ID |
| GET | `/api/vault-assets/customer/{customerId}` | Get assets by customer |
| POST | `/api/vault-assets` | Create new vault asset |
| PUT | `/api/vault-assets/{id}` | Update a vault asset |
| DELETE | `/api/vault-assets/{id}` | Delete a vault asset |
