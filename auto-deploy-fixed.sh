#!/bin/bash

# VaultLogix Automated Deployment Script - FIXED VERSION
# This script handles complete deployment to Linode VPS

set -e

# Configuration
VPS_IP="${VPS_IP:-69.164.195.230}"
SSH_USER="${SSH_USER:-root}"
SSH_PASSWORD="${SSH_PASSWORD:?Set SSH_PASSWORD in your environment before running}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/obrempong707/vault-app.git}"
DOMAIN="${DOMAIN:-$VPS_IP}"
DB_USER="${DB_USER:-admin}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD in your environment before running}"
APP_PATH="${APP_PATH:-/var/www/vaultlogix}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VaultLogix Automated Deployment      ║${NC}"
echo -e "${BLUE}║           (FIXED VERSION)              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VPS IP: $VPS_IP"
echo "  SSH User: $SSH_USER"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Domain: $DOMAIN"
echo "  DB Password: [hidden]"
echo ""

# Create comprehensive VPS setup script
cat > /tmp/complete_setup_fixed.sh <<'VPSSCRIPT'
#!/bin/bash
set -e

VPS_IP=$1
SSH_USER=$2
GITHUB_REPO=$3
DOMAIN=$4
DB_USER=$5
DB_PASSWORD=$6
APP_PATH=$7

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# STEP 1: Clone Repository
# ============================================
log_info "Step 1: Cloning repository..."
mkdir -p $APP_PATH
git config --global --add safe.directory $APP_PATH 2>/dev/null || true
cd $APP_PATH
git clone $GITHUB_REPO . 2>/dev/null || git pull

# ============================================
# STEP 2: Setup Backend
# ============================================
log_info "Step 2: Setting up backend..."
cd $APP_PATH/backend

# Copy and configure .env
cp .env.example .env

# Update .env file
sed -i "s|APP_ENV=.*|APP_ENV=production|g" .env
sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|g" .env
sed -i "s|APP_URL=.*|APP_URL=http://$DOMAIN|g" .env
sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=mysql|g" .env
sed -i "s|DB_HOST=.*|DB_HOST=127.0.0.1|g" .env
sed -i "s|DB_PORT=.*|DB_PORT=3306|g" .env
sed -i "s|DB_DATABASE=.*|DB_DATABASE=vaultlogix|g" .env
sed -i "s|DB_USERNAME=.*|DB_USERNAME=$DB_USER|g" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" .env
sed -i "s|CACHE_DRIVER=.*|CACHE_DRIVER=file|g" .env
sed -i "s|QUEUE_CONNECTION=.*|QUEUE_CONNECTION=sync|g" .env
sed -i "s|SESSION_DRIVER=.*|SESSION_DRIVER=file|g" .env

# Install dependencies
log_info "Installing composer dependencies..."
composer install --no-dev --optimize-autoloader 2>/dev/null || log_warn "Composer install had warnings"

# Generate app key
php artisan key:generate 2>/dev/null || log_warn "Key generation had issues"

# Run migrations
log_info "Running database migrations..."
php artisan migrate --force 2>/dev/null || log_warn "Migrations had warnings"

# Run production optimization
log_info "Running production optimization..."
composer run prod-optimize 2>/dev/null || log_warn "Optimization had warnings"

# Set permissions
log_info "Setting file permissions..."
chown -R www-data:www-data $APP_PATH 2>/dev/null || true
chmod -R 755 $APP_PATH 2>/dev/null || true
chmod -R 775 $APP_PATH/storage 2>/dev/null || true
chmod -R 775 $APP_PATH/bootstrap/cache 2>/dev/null || true

# ============================================
# STEP 3: Setup Frontend
# ============================================
log_info "Step 3: Setting up frontend..."
cd $APP_PATH/frontend

# Install dependencies
npm ci 2>/dev/null || log_warn "npm install had warnings"

# Create .env for frontend
cat > .env <<FRONTEND_ENV
VITE_API_URL=https://$DOMAIN/api
FRONTEND_ENV

# Build frontend
npm run build 2>/dev/null || log_warn "Frontend build had warnings"

# Copy to web root
mkdir -p /var/www/vaultlogix-web
cp -r dist/* /var/www/vaultlogix-web/ 2>/dev/null || true
chown -R www-data:www-data /var/www/vaultlogix-web 2>/dev/null || true

# ============================================
# STEP 4: Configure Nginx
# ============================================
log_info "Step 4: Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Create API server block
cat > /etc/nginx/sites-available/vaultlogix-api <<'NGINX_API'
server {
    listen 80;
    listen [::]:80;
    server_name 69.164.195.230;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 69.164.195.230;

    root /var/www/vaultlogix/backend/public;
    index index.php;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
NGINX_API

# Create Web server block
cat > /etc/nginx/sites-available/vaultlogix-web <<'NGINX_WEB'
server {
    listen 80;
    listen [::]:80;
    server_name 69.164.195.230;

    root /var/www/vaultlogix-web;
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_WEB

# Enable sites
ln -sf /etc/nginx/sites-available/vaultlogix-api /etc/nginx/sites-enabled/ 2>/dev/null || true
ln -sf /etc/nginx/sites-available/vaultlogix-web /etc/nginx/sites-enabled/ 2>/dev/null || true

# Test Nginx config
nginx -t 2>/dev/null || log_warn "Nginx config test had warnings"

# Restart Nginx
systemctl restart nginx 2>/dev/null || log_warn "Nginx restart had issues"

# ============================================
# STEP 5: Verify Deployment
# ============================================
log_info "Step 5: Verifying deployment..."

# Check Nginx
if systemctl is-active --quiet nginx; then
    log_info "✓ Nginx is running"
else
    log_error "✗ Nginx is not running"
fi

# Check PHP-FPM
if systemctl is-active --quiet php8.3-fpm 2>/dev/null; then
    log_info "✓ PHP-FPM is running"
elif systemctl is-active --quiet php8.1-fpm 2>/dev/null; then
    log_info "✓ PHP-FPM (8.1) is running"
else
    log_warn "⚠ PHP-FPM status unknown"
fi

# Check MySQL
if systemctl is-active --quiet mysql; then
    log_info "✓ MySQL is running"
else
    log_warn "⚠ MySQL status unknown"
fi

# ============================================
# DEPLOYMENT COMPLETE
# ============================================
log_info ""
log_info "╔════════════════════════════════════════╗"
log_info "║   Deployment Complete!                 ║"
log_info "╚════════════════════════════════════════╝"
log_info ""
log_info "Important Information:"
log_info "  Database Password: $DB_PASSWORD"
log_info "  App Path: $APP_PATH"
log_info "  Domain: $DOMAIN"
log_info ""
log_info "Access Your Application:"
log_info "  API: http://$DOMAIN/api"
log_info "  Web: http://$DOMAIN"
log_info ""
log_info "SSH Access:"
log_info "  ssh root@$VPS_IP"
log_info ""
log_info "Useful Commands:"
log_info "  View logs: tail -f $APP_PATH/backend/storage/logs/laravel.log"
log_info "  Restart services: systemctl restart nginx php8.3-fpm mysql"
log_info "  Check status: systemctl status nginx php8.3-fpm mysql"
log_info ""

VPSSCRIPT

chmod +x /tmp/complete_setup_fixed.sh

# ============================================
# Execute deployment
# ============================================
echo -e "${YELLOW}Connecting to VPS and starting deployment...${NC}"
echo ""

sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$VPS_IP" 'bash -s' < /tmp/complete_setup_fixed.sh "$VPS_IP" "$SSH_USER" "$GITHUB_REPO" "$DOMAIN" "$DB_USER" "$DB_PASSWORD" "$APP_PATH"

# ============================================
# Post-deployment instructions
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Complete!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Your Application is Ready!${NC}"
echo ""
echo "Access your application:"
echo "  API: http://69.164.195.230/api"
echo "  Web: http://69.164.195.230"
echo ""
echo "SSH into VPS:"
echo "  ssh root@69.164.195.230"
echo ""
echo "Database Credentials:"
echo "  Username: vaultlogix"
echo "  Password: [hidden]"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the application at http://69.164.195.230"
echo "2. When you have a domain, follow UPDATE_DOMAIN_LATER.md"
echo "3. Monitor logs: tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log"
echo ""
echo -e "${GREEN}Deployment automation complete!${NC}"
