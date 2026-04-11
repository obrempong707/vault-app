# VaultLogix VPS Deployment Guide (Linode)

## Prerequisites

- Linode VPS with Ubuntu 22.04 LTS or Debian 12
- SSH access to your VPS
- Domain name (optional; you can deploy with the IP first)
- Git installed on VPS

## Step 1: Initial VPS Setup

### 1.1 Connect to your VPS
```bash
ssh root@YOUR_VPS_IP
# or if using a specific user:
ssh deploy@YOUR_VPS_IP
```

### 1.2 Update system packages
```bash
apt update && apt upgrade -y
```

### 1.3 Install required dependencies
```bash
apt install -y \
  curl \
  wget \
  git \
  build-essential \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release
```

## Step 2: Install PHP & MySQL

### 2.1 Add PHP repository
```bash
add-apt-repository ppa:ondrej/php
apt update
```

### 2.2 Install PHP 8.1 and extensions
```bash
apt install -y \
  php8.1-fpm \
  php8.1-cli \
  php8.1-mysql \
  php8.1-mbstring \
  php8.1-xml \
  php8.1-curl \
  php8.1-zip \
  php8.1-bcmath \
  php8.1-json \
  php8.1-tokenizer \
  php8.1-opcache
```

### 2.3 Install MySQL Server
```bash
apt install -y mysql-server

# Secure MySQL installation
mysql_secure_installation
```

### 2.4 Create database and user
```bash
mysql -u root -p
```

Then in MySQL shell:
```sql
CREATE DATABASE vaultlogix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vaultlogix'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON vaultlogix.* TO 'vaultlogix'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 3: Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer
```

## Step 4: Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

## Step 5: Clone and Setup Backend

### 5.1 Create application directory
```bash
mkdir -p /var/www/vaultlogix
cd /var/www/vaultlogix
```

### 5.2 Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/vault.git .
# or if using SSH:
git clone git@github.com:YOUR_USERNAME/vault.git .
```

### 5.3 Setup backend
```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with production values
nano .env
```

**Important .env values for production:**
```
APP_ENV=production
APP_DEBUG=false
APP_URL=http://YOUR_VPS_IP

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vaultlogix
DB_USERNAME=admin
DB_PASSWORD=%007clT#

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

### 5.3.1 Rotate the admin password

Use this procedure whenever you need to change the admin password in production:

1. Choose a new secure password.
2. Update the production secret or `.env` value:
   ```env
   VAULTLOGIX_ADMIN_EMAIL=admin@vault.com
   VAULTLOGIX_ADMIN_PASSWORD=your-new-strong-password
   ```
3. If you also use the frontend demo login shortcut, update the frontend env values too:
   ```env
   VITE_VAULTLOGIX_ADMIN_EMAIL=admin@vault.com
   VITE_VAULTLOGIX_ADMIN_PASSWORD=your-new-strong-password
   ```
4. Redeploy or restart the backend so the updated secret is available.
5. Re-run the database seeder or your deployment script if it is responsible for creating the admin user.
6. Log in with the new password and remove the old value from any notes, shell history, or secret stores.

If the old password was exposed publicly, rotate it immediately and invalidate any sessions or tokens that may still be active.

### 5.4 Install dependencies and setup
```bash
composer install --no-dev --optimize-autoloader

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Run production optimization
composer run prod-optimize

# Set permissions
chown -R www-data:www-data /var/www/vaultlogix
chmod -R 755 /var/www/vaultlogix
chmod -R 775 /var/www/vaultlogix/storage
chmod -R 775 /var/www/vaultlogix/bootstrap/cache
```

## Step 6: Configure Nginx

Create `/etc/nginx/sites-available/vaultlogix-api`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_VPS_IP;

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
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/vaultlogix-api /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

## Step 7: Setup Frontend (Static Hosting)

### Option A: Serve from same Nginx server
```bash
cd /var/www/vaultlogix/frontend

# Build frontend
npm ci
npm run build

# Copy dist to web root
cp -r dist /var/www/vaultlogix/frontend-dist
```

> The deployment scripts now check Node.js automatically and install Node 22 if the VPS version is too old for Vite.

Create `/etc/nginx/sites-available/vaultlogix-web`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_VPS_IP;

    root /var/www/vaultlogix/frontend-dist;
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
```

Enable it:
```bash
ln -s /etc/nginx/sites-available/vaultlogix-web /etc/nginx/sites-enabled/
systemctl restart nginx
```

### Option B: Use CDN (Netlify, Vercel, etc.)
1. Push frontend to GitHub
2. Connect to Netlify/Vercel
3. Set build command: `npm run build`
4. Set publish directory: `frontend-dist`
5. Set environment variable: `VITE_API_URL=http://YOUR_VPS_IP/api`

## Step 8: Setup Supervisor (for Laravel Queue)

```bash
apt install -y supervisor

# Create supervisor config
cat > /etc/supervisor/conf.d/vaultlogix-worker.conf <<'EOF'
[program:vaultlogix-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/vaultlogix/backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
numprocs=4
redirect_stderr=true
stdout_logfile=/var/log/vaultlogix-worker.log
user=www-data
EOF

# Start supervisor
systemctl restart supervisor
```

## Step 9: Setup Cron Jobs

```bash
# Edit crontab
crontab -e -u www-data
```

Add:
```
* * * * * cd /var/www/vaultlogix/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Step 10: Verify Deployment

### Check backend API
```bash
curl http://YOUR_VPS_IP/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Check frontend
Open `http://YOUR_VPS_IP` in browser

### Monitor logs
```bash
# Laravel logs
tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PHP-FPM logs
tail -f /var/log/php8.1-fpm.log
```

## Step 11: Setup Monitoring & Backups

### Install monitoring tools
```bash
apt install -y htop iotop nethogs
```

### Setup automated backups
```bash
# Create backup script
cat > /usr/local/bin/backup-vaultlogix.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backups/vaultlogix"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u vaultlogix -p'password' vaultlogix | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/vaultlogix

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-vaultlogix.sh

# Schedule daily backups
echo "0 2 * * * /usr/local/bin/backup-vaultlogix.sh" | crontab -
```

## Deployment Checklist

- [ ] VPS created and SSH access confirmed
- [ ] System packages updated
- [ ] PHP 8.1 and extensions installed
- [ ] MySQL installed and database created
- [ ] Composer installed
- [ ] Nginx installed and configured
- [ ] Backend cloned and setup
- [ ] Frontend built and deployed
- [ ] SSL certificates installed later after domain is added
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Production optimization commands executed
- [ ] Supervisor configured for queue workers
- [ ] Cron jobs setup
- [ ] Monitoring tools installed
- [ ] Backup scripts configured
- [ ] API endpoints tested
- [ ] Frontend loads successfully
- [ ] CORS configured correctly
- [ ] Rate limiting verified

## Troubleshooting

### 502 Bad Gateway
```bash
# Check PHP-FPM status
systemctl status php8.1-fpm
systemctl restart php8.1-fpm
```

### Database connection error
```bash
# Check MySQL
systemctl status mysql
mysql -u vaultlogix -p vaultlogix -e "SELECT 1;"
```

### Permission denied errors
```bash
# Fix permissions
chown -R www-data:www-data /var/www/vaultlogix
chmod -R 755 /var/www/vaultlogix
chmod -R 775 /var/www/vaultlogix/storage
chmod -R 775 /var/www/vaultlogix/bootstrap/cache
```

### Nginx not finding PHP
```bash
# Verify PHP-FPM socket
ls -la /run/php/php8.1-fpm.sock
```

## Post-Deployment

1. **Monitor logs** - Watch for errors in first 24 hours
2. **Test all endpoints** - Verify API functionality
3. **Load testing** - Use tools like Apache Bench or wrk
4. **Security scan** - Run SSL Labs test
5. **Backup verification** - Test restore process
6. **Documentation** - Update team with deployment details

## Support & Maintenance

- Check logs regularly: `tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log`
- Monitor disk space: `df -h`
- Monitor memory: `free -h`
- Update packages monthly: `apt update && apt upgrade`
- Renew SSL certificates: `certbot renew` (after domain is configured)

---

**Need help?** Contact your VPS provider or refer to Laravel documentation at https://laravel.com/docs
