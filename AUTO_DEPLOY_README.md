# Automated VPS Deployment - Quick Start

## Overview

The `auto-deploy.sh` script automates the entire VaultLogix deployment to your Linode VPS with a single command.

## What Gets Automated

✅ System updates and dependency installation
✅ PHP 8.1 and all required extensions
✅ MySQL database and user creation
✅ Composer installation
✅ Nginx web server setup
✅ Repository cloning from GitHub
✅ Backend configuration and setup
✅ Frontend build and deployment
✅ Nginx configuration for both API and web
✅ SSL certificate setup (Let's Encrypt)
✅ Supervisor queue worker configuration
✅ Cron job setup
✅ Production optimization
✅ File permissions configuration

## Prerequisites

1. **Linode VPS** running Ubuntu 22.04 LTS or Debian 12
2. **SSH access** with username and password
3. **GitHub repository** with your code
4. **Domain name** (can use IP initially)
5. **sshpass** installed locally (script will install if missing)

## Current Configuration

```
VPS IP: 69.164.195.230
SSH User: root
SSH Password: Devbolt#23#
GitHub Repo: https://github.com/obrempong707/vault-app.git
Domain: yourdomain.com (CHANGE THIS!)
```

## How to Run

### Step 1: Review IP-Only Settings

Before running, confirm the script is using the VPS IP and skipping SSL for now:

```bash
nano /Users/devbolt/Desktop/vault/auto-deploy.sh
```

Make sure these settings are present:
```bash
DOMAIN="$VPS_IP"  # Use IP for now; update to your domain later
DB_USER="admin"
DB_PASSWORD="Devbolt#23#"
```

### Step 2: Run the Deployment

```bash
cd /Users/devbolt/Desktop/vault
./auto-deploy.sh
```

The script will:
1. Install sshpass if needed
2. Connect to your VPS
3. Run the complete setup (14 steps)
4. Display results and next steps

**Estimated time: 10-15 minutes**

## What Happens During Deployment

### Phase 1: System Setup (2-3 minutes)
- Update system packages
- Install PHP 8.1, MySQL, Nginx, Supervisor

### Phase 2: Database Setup (1 minute)
- Create MySQL database `vaultlogix`
- Create database user `admin`
- Set the database password to `%007clT#`
- Grant privileges

### Phase 3: Application Setup (3-5 minutes)
- Clone GitHub repository
- Install Composer dependencies
- Configure environment variables
- Run database migrations
- Run production optimization

### Phase 4: Frontend Setup (2-3 minutes)
- Install npm dependencies
- Build React application
- Deploy to web root

### Phase 5: Web Server Setup (2 minutes)
- Configure Nginx for API and web over HTTP
- Enable security headers

### Phase 6: Services (2-3 minutes)
- Configure Supervisor for queue workers
- Setup cron jobs

### Phase 7: Verification (1 minute)
- Verify all services are running
- Display deployment summary

## After Deployment

### 1. Update DNS Records

Use the VPS IP now: `http://69.164.195.230`

Point your future domain to the VPS IP later when ready.

```
A Record: yourdomain.com → 69.164.195.230
A Record: api.yourdomain.com → 69.164.195.230
A Record: www.yourdomain.com → 69.164.195.230
```

Wait 5-10 minutes for DNS propagation.

### 2. Update Nginx Configuration

SSH into your VPS:
```bash
ssh root@69.164.195.230
```

Edit API configuration:
```bash
nano /etc/nginx/sites-available/vaultlogix-api
```

Replace all instances of `yourdomain.com` with your actual domain.

Edit web configuration:
```bash
nano /etc/nginx/sites-available/vaultlogix-web
```

Replace all instances of `yourdomain.com` with your actual domain.

Restart Nginx:
```bash
systemctl restart nginx
```

### 3. Setup SSL Certificates

SSH into your VPS and run:
```bash
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
certbot certonly --nginx -d api.yourdomain.com
```

Follow the prompts to complete SSL setup.

### 4. Verify Everything Works

Test the backend API:
```bash
curl https://api.yourdomain.com/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "success": false,
  "message": "Invalid credentials."
}
```

Open frontend in browser:
```
https://yourdomain.com
```

Should load your React application.

## Important Information

### Database Credentials

After deployment, you'll see:
```
Database Password: vaultlogix_XXXXXXXXXXXXXX
```

**Save this securely!** You'll need it for:
- Database backups
- Direct database access
- Troubleshooting

### File Locations on VPS

```
Application: /var/www/vaultlogix
Backend: /var/www/vaultlogix/backend
Frontend: /var/www/vaultlogix/frontend
Web Root: /var/www/vaultlogix-web
Logs: /var/www/vaultlogix/backend/storage/logs/laravel.log
```

### Service Management

```bash
# Check status
systemctl status nginx
systemctl status php8.1-fpm
systemctl status mysql
systemctl status supervisor

# Restart services
systemctl restart nginx
systemctl restart php8.1-fpm
systemctl restart mysql
systemctl restart supervisor

# View logs
tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log
tail -f /var/log/nginx/error.log
tail -f /var/log/supervisor/vaultlogix-worker.log
```

## Troubleshooting

### 502 Bad Gateway
```bash
ssh root@69.164.195.230
systemctl restart php8.1-fpm
systemctl restart nginx
```

### Database Connection Error
```bash
ssh root@69.164.195.230
mysql -u vaultlogix -p vaultlogix -e "SELECT 1;"
```

### SSL Certificate Issues
```bash
ssh root@69.164.195.230
certbot renew --force-renewal
systemctl restart nginx
```

### Permission Denied
```bash
ssh root@69.164.195.230
chown -R www-data:www-data /var/www/vaultlogix
chmod -R 755 /var/www/vaultlogix
chmod -R 775 /var/www/vaultlogix/storage
chmod -R 775 /var/www/vaultlogix/bootstrap/cache
```

## Monitoring

### Check Application Health

```bash
ssh root@69.164.195.230
curl http://localhost:8001/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Monitor Resources

```bash
ssh root@69.164.195.230
htop  # View CPU and memory usage
df -h  # View disk space
free -h  # View memory
```

### View Recent Logs

```bash
ssh root@69.164.195.230
tail -100 /var/www/vaultlogix/backend/storage/logs/laravel.log
```

## Backup & Recovery

### Backup Database

```bash
ssh root@69.164.195.230
mysqldump -u vaultlogix -p vaultlogix > backup.sql
```

### Restore Database

```bash
ssh root@69.164.195.230
mysql -u vaultlogix -p vaultlogix < backup.sql
```

### Backup Application

```bash
ssh root@69.164.195.230
tar -czf vaultlogix-backup.tar.gz /var/www/vaultlogix
```

## Security Checklist

- ✅ HTTPS/SSL enabled
- ✅ Security headers configured
- ✅ Rate limiting enabled
- ✅ Database user with limited privileges
- ✅ Environment variables protected
- ✅ File permissions configured
- ✅ Firewall rules (configure as needed)

## Next Steps

1. ✅ Run `./auto-deploy.sh`
2. ✅ Update DNS records
3. ✅ Update Nginx configuration
4. ✅ Setup SSL certificates
5. ✅ Verify application works
6. ✅ Monitor logs for 24 hours
7. ✅ Setup backups
8. ✅ Configure monitoring/alerts

## Support

For issues or questions:
1. Check logs: `tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log`
2. Review DEPLOYMENT_GUIDE.md for detailed steps
3. Check DEPLOYMENT_CHECKLIST.md for verification steps

---

**Ready to deploy?** Run: `./auto-deploy.sh`
