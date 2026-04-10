# Update Domain After Deployment

The deployment script is configured to use the VPS IP (`69.164.195.230`) as a temporary domain. Once you have your actual domain, follow these steps to update it.

## Step 1: SSH into VPS

```bash
ssh root@69.164.195.230
```

## Step 2: Update Nginx Configuration

### Update API Configuration
```bash
nano /etc/nginx/sites-available/vaultlogix-api
```

Replace all instances of `69.164.195.230` with your actual domain:
- Change `server_name 69.164.195.230;` to `server_name api.yourdomain.com;`
- Change SSL certificate paths to match your domain

### Update Web Configuration
```bash
nano /etc/nginx/sites-available/vaultlogix-web
```

Replace all instances of `69.164.195.230` with your actual domain:
- Change `server_name 69.164.195.230;` to `server_name yourdomain.com www.yourdomain.com;`
- Change SSL certificate paths to match your domain

## Step 3: Update Backend .env

```bash
nano /var/www/vaultlogix/backend/.env
```

Update the `APP_URL` variable:
```
APP_URL=https://yourdomain.com
```

## Step 4: Update Frontend .env

```bash
nano /var/www/vaultlogix/frontend/.env
```

Update the API URL:
```
VITE_API_URL=https://api.yourdomain.com/api
```

Rebuild frontend:
```bash
cd /var/www/vaultlogix/frontend
npm run build
cp -r dist/* /var/www/vaultlogix-web/
```

## Step 5: Setup SSL Certificates

```bash
# For your main domain
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain
certbot certonly --nginx -d api.yourdomain.com
```

## Step 6: Update Nginx SSL Paths

Edit both Nginx configs and update SSL certificate paths:

### In vaultlogix-api:
```nginx
ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
```

### In vaultlogix-web:
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

## Step 7: Restart Services

```bash
# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Restart PHP-FPM
systemctl restart php8.1-fpm
```

## Step 8: Update DNS Records

Point your domain to the VPS IP:

```
A Record: yourdomain.com → 69.164.195.230
A Record: www.yourdomain.com → 69.164.195.230
A Record: api.yourdomain.com → 69.164.195.230
```

Wait 5-10 minutes for DNS propagation.

## Step 9: Verify

Test the API:
```bash
curl https://api.yourdomain.com/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Open frontend in browser:
```
https://yourdomain.com
```

## Quick Reference Commands

```bash
# SSH into VPS
ssh root@69.164.195.230

# Edit API Nginx config
nano /etc/nginx/sites-available/vaultlogix-api

# Edit Web Nginx config
nano /etc/nginx/sites-available/vaultlogix-web

# Edit backend .env
nano /var/www/vaultlogix/backend/.env

# Edit frontend .env
nano /var/www/vaultlogix/frontend/.env

# Rebuild frontend
cd /var/www/vaultlogix/frontend && npm run build && cp -r dist/* /var/www/vaultlogix-web/

# Setup SSL
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
certbot certonly --nginx -d api.yourdomain.com

# Test and restart
nginx -t && systemctl restart nginx
```

## Current Setup (Using IP)

- **API URL:** http://69.164.195.230/api
- **Web URL:** http://69.164.195.230
- **SSH:** ssh root@69.164.195.230

## After Adding Domain

- **API URL:** https://api.yourdomain.com/api
- **Web URL:** https://yourdomain.com
- **SSH:** ssh root@69.164.195.230 (same)

---

**Note:** The application is fully functional with the IP address. You can test everything now and add your domain whenever you're ready!
