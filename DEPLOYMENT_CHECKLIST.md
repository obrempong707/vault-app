# VaultLogix Deployment Checklist

## Pre-Deployment

- [ ] Linode VPS created (Ubuntu 22.04 LTS recommended)
- [ ] SSH key configured for passwordless access
- [ ] Domain name purchased and DNS configured
- [ ] GitHub repository created and code pushed
- [ ] All environment variables documented
- [ ] Database credentials generated
- [ ] SSL certificate provider selected (Let's Encrypt recommended)

## VPS Setup Phase

### System & Dependencies
- [ ] SSH into VPS: `ssh root@YOUR_VPS_IP`
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] Install PHP 8.1 and extensions
- [ ] Install MySQL Server
- [ ] Install Composer
- [ ] Install Nginx
- [ ] Install Certbot (SSL)
- [ ] Install Supervisor (queue workers)

### Database Setup
- [ ] Create MySQL database: `vaultlogix`
- [ ] Create MySQL user: `vaultlogix`
- [ ] Set secure password
- [ ] Grant privileges
- [ ] Test connection

### Application Setup
- [ ] Create `/var/www/vaultlogix` directory
- [ ] Clone repository from GitHub
- [ ] Copy `.env.example` to `.env`
- [ ] Configure `.env` with production values:
  - [ ] `APP_ENV=production`
  - [ ] `APP_DEBUG=false`
  - [ ] `APP_URL=https://api.yourdomain.com`
  - [ ] Database credentials
  - [ ] Cache driver (Redis recommended)
  - [ ] Queue connection (Redis recommended)
- [ ] Run: `composer install --no-dev --optimize-autoloader`
- [ ] Run: `php artisan key:generate`
- [ ] Run: `php artisan migrate --force`
- [ ] Run: `composer run prod-optimize`
- [ ] Set correct permissions:
  ```bash
  chown -R www-data:www-data /var/www/vaultlogix
  chmod -R 755 /var/www/vaultlogix
  chmod -R 775 /var/www/vaultlogix/storage
  chmod -R 775 /var/www/vaultlogix/bootstrap/cache
  ```

## Web Server Configuration

### Nginx Setup
- [ ] Create Nginx config for API: `/etc/nginx/sites-available/vaultlogix-api`
- [ ] Create Nginx config for Frontend: `/etc/nginx/sites-available/vaultlogix-web`
- [ ] Enable sites: `ln -s /etc/nginx/sites-available/vaultlogix-* /etc/nginx/sites-enabled/`
- [ ] Remove default site: `rm /etc/nginx/sites-enabled/default`
- [ ] Test config: `nginx -t`
- [ ] Restart Nginx: `systemctl restart nginx`

### SSL Certificate
- [ ] Install Certbot: `apt install -y certbot python3-certbot-nginx`
- [ ] Generate certificate: `certbot certonly --nginx -d api.yourdomain.com`
- [ ] Generate certificate: `certbot certonly --nginx -d yourdomain.com`
- [ ] Enable auto-renewal: `systemctl enable certbot.timer`
- [ ] Test renewal: `certbot renew --dry-run`

## Frontend Deployment

### Option A: Same Server
- [ ] Build frontend: `npm run build`
- [ ] Copy dist to web root: `cp -r dist /var/www/vaultlogix/frontend-dist`
- [ ] Set permissions: `chown -R www-data:www-data /var/www/vaultlogix/frontend-dist`
- [ ] Configure Nginx for frontend
- [ ] Test frontend loads

### Option B: CDN (Netlify/Vercel)
- [ ] Push frontend to GitHub
- [ ] Connect to Netlify/Vercel
- [ ] Configure build command: `npm run build`
- [ ] Configure publish directory: `dist`
- [ ] Set environment: `VITE_API_URL=https://api.yourdomain.com/api`
- [ ] Deploy and test

## Background Jobs & Cron

### Supervisor (Queue Workers)
- [ ] Create supervisor config: `/etc/supervisor/conf.d/vaultlogix-worker.conf`
- [ ] Start supervisor: `systemctl restart supervisor`
- [ ] Verify workers running: `supervisorctl status`

### Cron Jobs
- [ ] Edit crontab: `crontab -e -u www-data`
- [ ] Add schedule runner: `* * * * * cd /var/www/vaultlogix/backend && php artisan schedule:run >> /dev/null 2>&1`

## Monitoring & Logging

- [ ] Check Laravel logs: `tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log`
- [ ] Check Nginx error logs: `tail -f /var/log/nginx/error.log`
- [ ] Check Nginx access logs: `tail -f /var/log/nginx/access.log`
- [ ] Check PHP-FPM logs: `tail -f /var/log/php8.1-fpm.log`
- [ ] Install monitoring tools: `apt install -y htop iotop nethogs`

## Backup & Recovery

- [ ] Create backup script: `/usr/local/bin/backup-vaultlogix.sh`
- [ ] Schedule daily backups via cron
- [ ] Test backup restoration
- [ ] Document recovery procedure

## Testing & Verification

### API Testing
- [ ] Test login endpoint:
  ```bash
  curl https://api.yourdomain.com/api/login -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  ```
- [ ] Test shipments endpoint
- [ ] Test vault assets endpoint
- [ ] Test public tracking endpoint
- [ ] Verify rate limiting works
- [ ] Verify authentication required for protected routes

### Frontend Testing
- [ ] Open https://yourdomain.com in browser
- [ ] Verify page loads without errors
- [ ] Check browser console for errors
- [ ] Test API calls from frontend
- [ ] Verify login functionality
- [ ] Test all major features

### Security Testing
- [ ] Run SSL Labs test: https://www.ssllabs.com/ssltest/
- [ ] Verify HTTPS redirect works
- [ ] Check security headers present
- [ ] Test CORS configuration
- [ ] Verify rate limiting
- [ ] Test authentication flows

## Performance Optimization

- [ ] Enable gzip compression in Nginx
- [ ] Configure caching headers
- [ ] Enable OPcache in PHP
- [ ] Configure Redis for caching (if available)
- [ ] Setup CDN for static assets (optional)
- [ ] Monitor response times

## Documentation

- [ ] Document VPS IP and access details
- [ ] Document domain configuration
- [ ] Document database credentials (secure location)
- [ ] Document deployment procedure
- [ ] Document backup/restore procedure
- [ ] Document monitoring procedures
- [ ] Create runbook for common issues

## Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Verify all features working
- [ ] Test backup restoration
- [ ] Setup monitoring alerts
- [ ] Schedule regular backups
- [ ] Plan security updates
- [ ] Document lessons learned
- [ ] Celebrate deployment! 🎉

## Troubleshooting Reference

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check PHP-FPM: `systemctl status php8.1-fpm` |
| Database connection error | Verify MySQL: `mysql -u vaultlogix -p vaultlogix -e "SELECT 1;"` |
| Permission denied | Fix permissions: `chown -R www-data:www-data /var/www/vaultlogix` |
| Nginx not finding PHP | Verify socket: `ls -la /run/php/php8.1-fpm.sock` |
| SSL certificate error | Renew: `certbot renew --force-renewal` |
| High memory usage | Check processes: `htop` |
| Slow response times | Check logs and optimize queries |

## Quick Commands

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# View Laravel logs
tail -f /var/www/vaultlogix/backend/storage/logs/laravel.log

# Restart services
systemctl restart nginx
systemctl restart php8.1-fpm
systemctl restart mysql

# Check disk space
df -h

# Check memory
free -h

# Restart supervisor workers
supervisorctl restart all

# Run migrations
php artisan migrate --force

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Backup database
mysqldump -u vaultlogix -p vaultlogix > backup.sql

# Restore database
mysql -u vaultlogix -p vaultlogix < backup.sql
```

---

**Estimated Deployment Time:** 1-2 hours (including SSL setup)

**Support:** Refer to DEPLOYMENT_GUIDE.md for detailed instructions
