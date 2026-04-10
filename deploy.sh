#!/bin/bash

# VaultLogix Deployment Script for Linode VPS
# Usage: ./deploy.sh <VPS_IP> <SSH_USER> <DOMAIN> [DB_USERNAME] [DB_PASSWORD]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 3 ]; then
    echo -e "${RED}Usage: ./deploy.sh <VPS_IP> <SSH_USER> <DOMAIN> [DB_USERNAME] [DB_PASSWORD]${NC}"
    echo "Example: ./deploy.sh 192.0.2.1 root 192.0.2.1 admin %007clT#"
    exit 1
fi

VPS_IP=$1
SSH_USER=$2
DOMAIN=$3
DB_USERNAME=${4:-"admin"}
DB_PASSWORD=${5:-"%007clT#"}

echo -e "${YELLOW}=== VaultLogix Deployment Script ===${NC}"
echo "VPS IP: $VPS_IP"
echo "SSH User: $SSH_USER"
echo "Domain: $DOMAIN"
echo "Database User: $DB_USERNAME"
echo "Database Password: $DB_PASSWORD"
echo ""

# Create deployment script to run on VPS
cat > /tmp/vps_setup.sh <<'VPSSCRIPT'
#!/bin/bash
set -e

VPS_IP=$1
SSH_USER=$2
DOMAIN=$3
DB_USERNAME=$4
DB_PASSWORD=$5

echo "Starting VPS setup..."

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install PHP
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.1-fpm php8.1-cli php8.1-mysql php8.1-mbstring php8.1-xml php8.1-curl php8.1-zip php8.1-bcmath php8.1-tokenizer php8.1-opcache

# Install MySQL
apt install -y mysql-server

# Install Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot
# Install Supervisor
apt install -y supervisor

# Create application directory
mkdir -p /var/www/vaultlogix
cd /var/www/vaultlogix

echo "Setup complete! Next steps:"
echo "1. Clone your repository: git clone <repo_url> ."
echo "2. Configure .env files"
echo "3. Run: composer install --no-dev --optimize-autoloader"
echo "4. Run: php artisan migrate --force"
VPSSCRIPT

chmod +x /tmp/vps_setup.sh

# Copy script to VPS and execute
echo -e "${YELLOW}Connecting to VPS and running setup...${NC}"
scp /tmp/vps_setup.sh $SSH_USER@$VPS_IP:/tmp/vps_setup.sh
ssh $SSH_USER@$VPS_IP "bash /tmp/vps_setup.sh $VPS_IP $SSH_USER $DOMAIN $DB_PASSWORD"

echo -e "${GREEN}VPS setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. SSH into your VPS: ssh $SSH_USER@$VPS_IP"
echo "2. Clone repository: cd /var/www/vaultlogix && git clone <your_repo> ."
echo "3. Setup backend:"
echo "   cd backend"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your values"
echo "   composer install --no-dev --optimize-autoloader"
echo "   php artisan key:generate"
echo "   php artisan migrate --force"
echo "   composer run prod-optimize"
echo "4. Setup Nginx configuration"
echo "5. Setup frontend and deploy"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
