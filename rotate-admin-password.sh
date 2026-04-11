#!/bin/bash
set -euo pipefail

APP_ROOT=${APP_ROOT:-/var/www/vaultlogix}
BACKEND_ENV="$APP_ROOT/backend/.env"
FRONTEND_ENV="$APP_ROOT/frontend/.env"
FRONTEND_ONLY=false

usage() {
  cat <<'EOF'
Usage: ./rotate-admin-password.sh <admin-email> <new-password> [--frontend-only]

Environment:
  APP_ROOT            Application root path (default: /var/www/vaultlogix)
  FRONTEND_ONLY       Set to true to update frontend env only

Examples:
  ./rotate-admin-password.sh admin@vault.com 'NewStrongPassword123!'
  APP_ROOT=/srv/vault ./rotate-admin-password.sh admin@vault.com 'NewStrongPassword123!'
EOF
}

if [ $# -lt 2 ]; then
  usage
  exit 1
fi

ADMIN_EMAIL=$1
NEW_PASSWORD=$2
shift 2

while [ $# -gt 0 ]; do
  case "$1" in
    --frontend-only)
      FRONTEND_ONLY=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

update_env_value() {
  local file_path=$1
  local key=$2
  local value=$3

  if [ ! -f "$file_path" ]; then
    return 0
  fi

  if grep -q "^${key}=" "$file_path"; then
    if [[ "$OSTYPE" == darwin* ]]; then
      sed -i "" "s|^${key}=.*|${key}=${value}|" "$file_path"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file_path"
    fi
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file_path"
  fi
}

if [ "$FRONTEND_ONLY" = false ]; then
  if [ ! -f "$BACKEND_ENV" ]; then
    echo "Backend .env not found at: $BACKEND_ENV"
    exit 1
  fi

  update_env_value "$BACKEND_ENV" "VAULTLOGIX_ADMIN_EMAIL" "$ADMIN_EMAIL"
  update_env_value "$BACKEND_ENV" "VAULTLOGIX_ADMIN_PASSWORD" "$NEW_PASSWORD"
fi

if [ -f "$FRONTEND_ENV" ] || [ "$FRONTEND_ONLY" = true ]; then
  update_env_value "$FRONTEND_ENV" "VITE_VAULTLOGIX_ADMIN_EMAIL" "$ADMIN_EMAIL"
  update_env_value "$FRONTEND_ENV" "VITE_VAULTLOGIX_ADMIN_PASSWORD" "$NEW_PASSWORD"
fi

echo "Admin credentials updated successfully."
echo "Next steps:"
echo "- Redeploy or restart the backend"
echo "- Re-run the database seeder or deployment script if needed"
echo "- Log in with the new admin password"
