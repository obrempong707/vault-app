#!/bin/bash

# VaultLogix Automated Deployment Script
# This script handles complete deployment to Linode VPS

set -e

# Configuration
VPS_IP="69.164.195.230"
SSH_USER="root"
SSH_PASSWORD="Devbolt#23#"
GITHUB_REPO="https://github.com/obrempong707/vault-app.git"
DOMAIN="$VPS_IP"  # Use IP for now; update to your domain later
DB_USER="admin"
DB_PASSWORD="%007clT#"
APP_PATH="/var/www/vaultlogix"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VaultLogix Automated Deployment      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VPS IP: $VPS_IP"
echo "  SSH User: $SSH_USER"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Domain: $DOMAIN"
echo "  DB User: $DB_USER"
echo "  DB Password: $DB_PASSWORD"
echo ""

# Install sshpass if not available
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass...${NC}"
    brew install sshpass 2>/dev/null || apt-get install -y sshpass
fi

# Create comprehensive VPS setup script
cat > /tmp/complete_setup.sh <<'VPSSCRIPT'
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
# STEP 1: System Update & Dependencies
# ============================================
log_info "Step 1: Updating system and installing dependencies..."
apt update
apt upgrade -y
apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# ============================================
# STEP 2: Install PHP 8.1
# ============================================
log_info "Step 2: Installing PHP 8.1..."
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.1-fpm php8.1-cli php8.1-mysql php8.1-mbstring php8.1-xml php8.1-curl php8.1-zip php8.1-bcmath php8.1-tokenizer php8.1-opcache
systemctl start php8.1-fpm
systemctl enable php8.1-fpm

# ============================================
# STEP 3: Install MySQL
# ============================================
log_info "Step 3: Installing MySQL Server..."
apt install -y mysql-server

# Start MySQL
systemctl start mysql
systemctl enable mysql

# Create database and user
log_info "Creating database and user..."
sudo mysql <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS vaultlogix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON vaultlogix.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

log_info "Database created successfully"

# ============================================
# STEP 4: Install Composer
# ============================================
log_info "Step 4: Installing Composer..."
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# ============================================
# STEP 5: Install Nginx
# ============================================
log_info "Step 5: Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# ============================================
# STEP 6: Install Supervisor
# ============================================
log_info "Step 6: Installing Supervisor..."
apt install -y supervisor

# ============================================
# STEP 7: Clone Repository
# ============================================
log_info "Step 7: Cloning repository..."
mkdir -p $APP_PATH
cd $APP_PATH
git clone $GITHUB_REPO .

# ============================================
# STEP 8: Setup Backend
# ============================================
log_info "Step 8: Setting up backend..."
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
composer install --no-dev --optimize-autoloader

# Generate app key
php artisan key:generate

# Run migrations
log_info "Running database migrations..."
php artisan migrate --force

# Run production optimization
log_info "Running production optimization..."
composer run prod-optimize

# Set permissions
log_info "Setting file permissions..."
chown -R www-data:www-data $APP_PATH
chmod -R 755 $APP_PATH
chmod -R 775 $APP_PATH/storage
chmod -R 775 $APP_PATH/bootstrap/cache

# ============================================
# STEP 9: Setup Frontend
# ============================================
log_info "Step 9: Setting up frontend..."
cd $APP_PATH/frontend

# Install dependencies
npm ci

# Create .env for frontend
cat > .env <<FRONTEND_ENV
VITE_API_URL=http://$DOMAIN/api
FRONTEND_ENV

# Build frontend
npm run build

# Copy to web root
mkdir -p /var/www/vaultlogix-web
cp -r dist/* /var/www/vaultlogix-web/
chown -R www-data:www-data /var/www/vaultlogix-web

# ============================================
# STEP 10: Configure Nginx
# ============================================
log_info "Step 10: Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create API server block
cat > /etc/nginx/sites-available/vaultlogix-api <<NGINX_API
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

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
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
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
cat > /etc/nginx/sites-available/vaultlogix-web <<NGINX_WEB
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

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
ln -sf /etc/nginx/sites-available/vaultlogix-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/vaultlogix-web /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# ============================================
# STEP 11: Setup SSL Certificates
# ============================================
log_info "Step 11: Skipping SSL setup for IP-only deployment..."
log_info "SSL can be added later after you update the domain."

# ============================================
# STEP 12: Setup Supervisor
# ============================================
log_info "Step 12: Setting up Supervisor..."
cat > /etc/supervisor/conf.d/vaultlogix-worker.conf <<'SUPERVISOR_CONF'
[program:vaultlogix-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/vaultlogix/backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
numprocs=4
redirect_stderr=true
stdout_logfile=/var/log/vaultlogix-worker.log
user=www-data
SUPERVISOR_CONF

systemctl restart supervisor

# ============================================
# STEP 13: Setup Cron Jobs
# ============================================
log_info "Step 13: Setting up cron jobs..."
(crontab -u www-data -l 2>/dev/null; echo "* * * * * cd /var/www/vaultlogix/backend && php artisan schedule:run >> /dev/null 2>&1") | crontab -u www-data -

# ============================================
# STEP 14: Verify Deployment
# ============================================
log_info "Step 14: Verifying deployment..."

# Check PHP-FPM
if systemctl is-active --quiet php8.1-fpm; then
    log_info "✓ PHP-FPM is running"
else
    log_error "✗ PHP-FPM is not running"
fi

# Check MySQL
if systemctl is-active --quiet mysql; then
    log_info "✓ MySQL is running"
else
    log_error "✗ MySQL is not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    log_info "✓ Nginx is running"
else
    log_error "✗ Nginx is not running"
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
log_info "  Database User: $DB_USER"
log_info "  Database Password: $DB_PASSWORD"
log_info "  App Path: $APP_PATH"
log_info "  Domain: $DOMAIN"
log_info ""
log_info "Next Steps:"
log_info "  1. Test the application over HTTP at http://$VPS_IP"
log_info "  2. Update the Nginx configs with your actual domain later"
log_info "  3. Update APP_URL and frontend API URL when the domain is ready"
log_info "  4. Enable SSL only after the domain points to this VPS"
log_info ""
log_info "Useful Commands:"
log_info "  View logs: tail -f $APP_PATH/backend/storage/logs/laravel.log"
log_info "  Restart services: systemctl restart nginx php8.1-fpm mysql"
log_info "  Check status: systemctl status nginx php8.1-fpm mysql"
log_info ""

VPSSCRIPT

chmod +x /tmp/complete_setup.sh

# ============================================
# Execute deployment
# ============================================
echo -e "${YELLOW}Connecting to VPS and starting deployment...${NC}"
echo ""

sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $SSH_USER@$VPS_IP 'bash -s' < /tmp/complete_setup.sh $VPS_IP $SSH_USER "$GITHUB_REPO" "$DOMAIN" "$DB_PASSWORD" "$APP_PATH"

# ============================================
# Post-deployment instructions
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Script Complete!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Important - Manual Steps Required:${NC}"
echo ""
echo "1. ${BLUE}Update DNS Records${NC}"
echo "   Point your domain to VPS IP: $VPS_IP"
echo "   Use the IP now: http://$VPS_IP"
echo "   Add domain A records later when ready"
echo ""
echo "2. ${BLUE}Update Nginx Configuration${NC}"
echo "   SSH into VPS: ssh root@$VPS_IP"
echo "   Edit API config: nano /etc/nginx/sites-available/vaultlogix-api"
echo "   Replace the IP with your actual domain when ready"
echo "   Edit Web config: nano /etc/nginx/sites-available/vaultlogix-web"
echo "   Replace the IP with your actual domain when ready"
echo "   Restart: systemctl restart nginx"
echo ""
echo "3. ${BLUE}Setup SSL Certificates${NC}"
echo "   Skip SSL for now while using the IP"
echo "   Add certbot only after your domain is configured"
echo ""
echo "4. ${YELLOW}Database Credentials${NC}"
echo "   Username: vaultlogix"
echo "   Password: $DB_PASSWORD"
echo "   (Save this securely!)"
echo ""
echo "5. ${BLUE}Verify Deployment${NC}"
echo "   Check backend: curl http://$VPS_IP/api/login"
echo "   Check frontend: http://$VPS_IP"
echo "   View logs: ssh root@$VPS_IP tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log"
echo ""
echo -e "${GREEN}Deployment automation complete!${NC}"
