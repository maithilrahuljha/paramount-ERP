# PMN ERP Platform - Deployment Guide

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

#### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/pmn_erp
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pmn_erp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy

```bash
# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec app npx drizzle-kit push

# Seed database
docker-compose exec app npx tsx src/scripts/seed.ts

# View logs
docker-compose logs -f app
```

---

### Option 2: Manual VPS Deployment

#### Prerequisites
- Ubuntu 22.04 LTS
- Node.js 20 LTS
- PostgreSQL 16
- Nginx
- PM2

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. Configure PostgreSQL

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE USER pmn_user WITH PASSWORD 'secure_password';
CREATE DATABASE pmn_erp OWNER pmn_user;
GRANT ALL PRIVILEGES ON DATABASE pmn_erp TO pmn_user;
EOF
```

#### 3. Deploy Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-org/pmn-erp.git
cd pmn-erp

# Install dependencies
npm ci

# Create environment file
cat > .env << EOF
DATABASE_URL=postgresql://pmn_user:secure_password@localhost:5432/pmn_erp
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# Build application
npm run build

# Run migrations
npx drizzle-kit push

# Seed database
npx tsx src/scripts/seed.ts
```

#### 4. Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pmn-erp',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/pmn-erp',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Configure PM2 to start on boot
pm2 startup
```

#### 5. Configure Nginx

```nginx
# /etc/nginx/sites-available/pmn-erp
server {
    listen 80;
    server_name erp.pmn.edu.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pmn-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d erp.pmn.edu.in

# Auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

### Option 3: Google Cloud Run

#### 1. Build Container

```bash
# Build for Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/pmn-erp
```

#### 2. Deploy to Cloud Run

```bash
gcloud run deploy pmn-erp \
  --image gcr.io/PROJECT_ID/pmn-erp \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET"
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for JWT tokens (min 32 chars) |
| JWT_EXPIRES_IN | No | Token expiration (default: 24h) |
| TWO_FA_ISSUER | No | 2FA issuer name (default: PMN ERP Platform) |
| NODE_ENV | Yes | Environment (production/development) |

---

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Change default admin password
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup system configured
- [ ] Monitoring set up
- [ ] Log rotation configured

---

## Backup Strategy

### Database Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump pmn_erp | gzip > /backups/pmn_erp_$DATE.sql.gz

# Keep last 30 days
find /backups -name "pmn_erp_*.sql.gz" -mtime +30 -delete
```

### Automated with cron

```bash
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## Monitoring

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### Health Check Endpoint

```
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Troubleshooting

### Application won't start
1. Check logs: `pm2 logs pmn-erp`
2. Verify environment variables
3. Check database connection

### Database connection failed
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Verify network/firewall rules

### 502 Bad Gateway
1. Check if app is running: `pm2 status`
2. Verify Nginx config
3. Check port binding
