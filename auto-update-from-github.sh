#!/bin/bash

# Auto-update website when GitHub changes are pushed
# Run this on the VPS after a webhook trigger or from a scheduled job.

set -euo pipefail

APP_PATH="${APP_PATH:-/var/www/vaultlogix}"
BRANCH="${BRANCH:-master}"
BACKEND_PATH="$APP_PATH/backend"
FRONTEND_PATH="$APP_PATH/frontend"
LOCK_FILE="${LOCK_FILE:-/tmp/vaultlogix-update.lock}"
LOG_FILE="${LOG_FILE:-/var/log/vaultlogix-update.log}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

if [ -f "$LOCK_FILE" ]; then
  error "Update already running. Remove $LOCK_FILE if this is stale."
  exit 1
fi

touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

if [ ! -d "$APP_PATH/.git" ]; then
  error "Git repository not found at $APP_PATH"
  exit 1
fi

ensure_nodejs() {
  if command -v node >/dev/null 2>&1; then
    major="$(node -p "process.versions.node.split('.')[0]")"
    minor="$(node -p "process.versions.node.split('.')[1]")"
    if [ "$major" -gt 20 ] || { [ "$major" -eq 20 ] && [ "$minor" -ge 19 ]; } || [ "$major" -ge 22 ]; then
      log "Node.js $(node -v) is compatible with Vite"
      return 0
    fi
    warn "Node.js $(node -v) is too old. Installing Node 22..."
  else
    warn "Node.js is not installed. Installing Node 22..."
  fi

  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  else
    error "No supported package manager found to install Node.js automatically."
    exit 1
  fi
}

ensure_nodejs

log "Starting website update from GitHub on branch '$BRANCH'"
cd "$APP_PATH"

log "Fetching latest changes"
git fetch origin "$BRANCH"
CURRENT_HASH="$(git rev-parse HEAD)"
TARGET_HASH="$(git rev-parse origin/$BRANCH)"

if [ "$CURRENT_HASH" = "$TARGET_HASH" ]; then
  log "No changes detected. Website is already up to date."
  exit 0
fi

log "Updating code from $CURRENT_HASH to $TARGET_HASH"
git reset --hard "origin/$BRANCH"

action_failed=0

if [ -d "$BACKEND_PATH" ]; then
  log "Updating backend dependencies"
  cd "$BACKEND_PATH"
  if [ -f composer.json ]; then
    composer install --no-dev --optimize-autoloader || action_failed=1
    php artisan migrate --force || warn "Migrations failed; continuing"
    php artisan db:seed --force || warn "Seeding failed; continuing"
    php artisan config:clear || true
    php artisan cache:clear || true
    php artisan route:clear || true
    php artisan view:clear || true
    php artisan config:cache || warn "Config cache failed"
    php artisan route:cache || warn "Route cache failed"
    php artisan view:cache || warn "View cache failed"
  fi
fi

if [ -d "$FRONTEND_PATH" ]; then
  log "Updating frontend build"
  cd "$FRONTEND_PATH"
  if [ -f package-lock.json ]; then
    npm ci || action_failed=1
  else
    npm install || action_failed=1
  fi
  npm run build || action_failed=1
  if [ -d "$APP_PATH/frontend/dist" ] && [ -d "/var/www/vaultlogix/frontend-dist" ]; then
    log "Syncing built frontend to web root"
    rsync -a --delete "$APP_PATH/frontend/dist/" "/var/www/vaultlogix/frontend-dist/" || warn "Frontend sync failed"
  fi
fi

log "Restarting services"
systemctl restart nginx || warn "Failed to restart nginx"
systemctl restart php8.1-fpm 2>/dev/null || systemctl restart php8.3-fpm 2>/dev/null || warn "Failed to restart PHP-FPM"
systemctl restart mysql 2>/dev/null || true

if [ "$action_failed" -ne 0 ]; then
  warn "Update completed with one or more dependency/build warnings"
else
  log "Update completed successfully"
fi

exit 0
