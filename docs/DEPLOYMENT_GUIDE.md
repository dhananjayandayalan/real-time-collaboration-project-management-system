# Deployment Guide — Real-Time Collaboration Project Management System

> **To export as PDF:** Open this file in VS Code and press `Ctrl+Shift+P` → "Markdown: Open Preview" → right-click → Print → Save as PDF.
> Alternatively run: `npx md-to-pdf docs/DEPLOYMENT_GUIDE.md`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [DigitalOcean (Droplet)](#3-digitalocean-droplet)
4. [AWS (EC2)](#4-aws-ec2)
5. [Google Cloud Platform (Compute Engine)](#5-google-cloud-platform-compute-engine)
6. [Microsoft Azure (Virtual Machine)](#6-microsoft-azure-virtual-machine)
7. [Render.com (PaaS — Easiest)](#7-rendercom-paas--easiest)
8. [Railway (PaaS — Easiest)](#8-railway-paas--easiest)
9. [SSL / HTTPS Setup (Let's Encrypt)](#9-ssl--https-setup-lets-encrypt)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

The following must be installed **locally** before deploying:

| Tool | Version | Purpose |
|---|---|---|
| Docker | >= 24.x | Container runtime |
| Docker Compose | >= 2.x | Multi-container orchestration |
| Git | >= 2.x | Source control |
| Node.js | >= 20.x | Local build (optional) |

You also need:
- A **domain name** pointed to your server IP (e.g., `yourdomain.com`)
- An **SSH key pair** for server access
- A **GitHub account** (for CI/CD)

---

## 2. Pre-Deployment Checklist

Before deploying to any platform, complete these steps locally.

### 2.1 Set Up Environment Variables

```bash
# Copy the production template
cp .env.production.example .env

# Edit with your actual values
nano .env
```

Required values to fill in:

```env
POSTGRES_USER=pmuser
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=project_management
DATABASE_URL=postgresql://pmuser:<password>@postgres:5432/project_management

REDIS_PASSWORD=<strong-random-password>
REDIS_URL=redis://:<password>@redis:6379

JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>

ALLOWED_ORIGINS=https://yourdomain.com
VITE_REALTIME_URL=https://yourdomain.com
```

> **Generate strong secrets:** `openssl rand -base64 64`

### 2.2 Test the Production Build Locally

```bash
# Build all Docker images
docker-compose -f docker-compose.prod.yml build

# Run the stack
docker-compose -f docker-compose.prod.yml up -d

# Verify health
docker-compose -f docker-compose.prod.yml ps
```

Confirm all services show `healthy` or `running` before proceeding.

---

## 3. DigitalOcean (Droplet)

**Recommended spec:** 4 GB RAM / 2 vCPUs / 80 GB SSD ($24/month)

### Step 1 — Create a Droplet

1. Log in to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click **Create → Droplet**
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic / Regular → 4 GB RAM
   - **Region:** Choose closest to your users
   - **Authentication:** SSH Key (add your public key)
4. Click **Create Droplet**
5. Note the **public IP address**

### Step 2 — Point Your Domain

In your domain registrar's DNS settings, add an **A record**:

```
Type: A
Name: @  (or subdomain like app)
Value: <droplet-ip>
TTL: 3600
```

### Step 3 — Connect and Set Up the Server

```bash
# SSH into the droplet
ssh root@<droplet-ip>

# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Git
apt install git -y

# Create a non-root deploy user (recommended)
adduser deploy
usermod -aG docker deploy
```

### Step 4 — Clone and Configure the App

```bash
# Switch to deploy user
su - deploy

# Clone the repository
git clone https://github.com/<your-username>/real-time-collaboration-project-management-system.git
cd real-time-collaboration-project-management-system

# Set up environment
cp .env.production.example .env
nano .env   # Fill in your values
```

### Step 5 — Add SSL Certificates

```bash
# Install Certbot
apt install certbot -y

# Get certificate (stop nginx first if running)
certbot certonly --standalone -d yourdomain.com

# Certificates are saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Copy to project ssl folder
mkdir -p docker/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/
chmod 600 docker/ssl/*.pem
```

### Step 6 — Run Database Migrations and Deploy

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start infrastructure first
docker compose -f docker-compose.prod.yml up -d postgres redis

# Wait for postgres to be healthy
docker compose -f docker-compose.prod.yml ps

# Run migrations for all services
docker compose -f docker-compose.prod.yml run --rm auth-service \
  sh -c "cd /app/apps/auth-service && npx prisma migrate deploy"

docker compose -f docker-compose.prod.yml run --rm project-service \
  sh -c "cd /app/apps/project-service && npx prisma migrate deploy"

docker compose -f docker-compose.prod.yml run --rm task-service \
  sh -c "cd /app/apps/task-service && npx prisma migrate deploy"

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Step 7 — Set Up Auto-Renewal for SSL

```bash
# Add a cron job for certificate renewal
crontab -e

# Add this line:
0 3 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/deploy/real-time-collaboration-project-management-system/docker/ssl/ && \
  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/deploy/real-time-collaboration-project-management-system/docker/ssl/ && \
  docker compose -f /home/deploy/real-time-collaboration-project-management-system/docker-compose.prod.yml restart nginx
```

### Step 8 — Set Up Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## 4. AWS (EC2)

**Recommended:** `t3.medium` (2 vCPU, 4 GB RAM) — ~$30/month

### Step 1 — Launch an EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose:
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance type:** `t3.medium`
   - **Key pair:** Create or select existing
   - **Security group:** Allow inbound on ports `22`, `80`, `443`
   - **Storage:** 30 GB gp3
3. Click **Launch Instance**

### Step 2 — Allocate an Elastic IP

1. Go to **EC2 → Elastic IPs → Allocate Elastic IP**
2. Click **Associate** and link it to your instance
3. Point your domain's **A record** to this Elastic IP

### Step 3 — Connect and Install Dependencies

```bash
# SSH into the instance
ssh -i your-key.pem ubuntu@<elastic-ip>

# Update and install Docker
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y
sudo apt install git -y
```

### Step 4 — Configure AWS Security Group

In **EC2 → Security Groups → Inbound Rules**, ensure:

| Type | Protocol | Port | Source |
|---|---|---|---|
| SSH | TCP | 22 | Your IP |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

### Step 5 — Deploy the Application

Follow the same **Steps 4–7** from the DigitalOcean section above (clone, configure, SSL, run migrations, start services).

### Optional — Use AWS RDS and ElastiCache

For production-grade databases, replace the local `postgres` and `redis` containers with managed AWS services:

```env
# Use RDS PostgreSQL endpoint
DATABASE_URL=postgresql://pmuser:<password>@<rds-endpoint>:5432/project_management

# Use ElastiCache Redis endpoint
REDIS_URL=redis://<elasticache-endpoint>:6379
```

Then remove the `postgres` and `redis` services from `docker-compose.prod.yml`.

---

## 5. Google Cloud Platform (Compute Engine)

**Recommended:** `e2-standard-2` (2 vCPU, 8 GB RAM) — ~$50/month

### Step 1 — Create a VM Instance

1. Go to **GCP Console → Compute Engine → VM Instances → Create**
2. Configure:
   - **Name:** `pm-system-vm`
   - **Machine type:** `e2-standard-2`
   - **Boot disk:** Ubuntu 22.04 LTS, 30 GB
   - **Firewall:** Check "Allow HTTP traffic" and "Allow HTTPS traffic"
3. Click **Create**

### Step 2 — Set Up a Static IP

1. Go to **VPC Network → External IP addresses**
2. Change the VM's IP from **Ephemeral** to **Static**
3. Point your domain's **A record** to this static IP

### Step 3 — Connect via Cloud Shell or SSH

```bash
# Using gcloud CLI
gcloud compute ssh pm-system-vm --zone=<your-zone>

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

sudo apt install docker-compose-plugin git -y
```

### Step 4 — Configure Firewall Rules

```bash
# Via gcloud CLI
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 --target-tags https-server
```

### Step 5 — Deploy the Application

Follow **Steps 4–7** from the DigitalOcean section.

### Optional — Use Cloud SQL and Memorystore

```env
# Cloud SQL (PostgreSQL)
DATABASE_URL=postgresql://pmuser:<password>@/<db-name>?host=/cloudsql/<connection-name>

# Memorystore (Redis)
REDIS_URL=redis://<memorystore-ip>:6379
```

---

## 6. Microsoft Azure (Virtual Machine)

**Recommended:** `Standard_B2s` (2 vCPU, 4 GB RAM) — ~$35/month

### Step 1 — Create a Virtual Machine

1. Go to **Azure Portal → Virtual Machines → Create**
2. Configure:
   - **Image:** Ubuntu Server 22.04 LTS
   - **Size:** `Standard_B2s`
   - **Authentication:** SSH public key
   - **Inbound ports:** Allow `22`, `80`, `443`
3. Click **Review + Create**

### Step 2 — Assign a Static Public IP

1. Go to the VM → **Networking → IP configurations**
2. Change the public IP to **Static**
3. Point your domain's **A record** to this IP

### Step 3 — Connect and Install Dependencies

```bash
# SSH into the VM
ssh azureuser@<vm-public-ip>

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker azureuser
newgrp docker

sudo apt install docker-compose-plugin git -y
```

### Step 4 — Open Ports via NSG

In **Azure Portal → VM → Networking → Add inbound port rule**:

- Port 80 — HTTP
- Port 443 — HTTPS

### Step 5 — Deploy the Application

Follow **Steps 4–7** from the DigitalOcean section.

---

## 7. Render.com (PaaS — Easiest)

Render is the simplest option — no server management required. Each service deploys as a **Web Service** or **Background Worker**.

> **Cost:** Free tier available; paid plans from $7/service/month.

### Step 1 — Push Code to GitHub

```bash
git remote add origin https://github.com/<your-username>/real-time-collaboration-project-management-system.git
git push -u origin main
```

### Step 2 — Create a PostgreSQL Database

1. Go to [render.com](https://render.com) → **New → PostgreSQL**
2. Name it `pm-postgres`
3. Copy the **Internal Database URL** — you'll use it as `DATABASE_URL`

### Step 3 — Create a Redis Instance

1. **New → Redis**
2. Name it `pm-redis`
3. Copy the **Internal Redis URL** — use as `REDIS_URL`

### Step 4 — Deploy Each Service

For **Auth Service**, **Project Service**, **Task Service**, **Realtime Service**:

1. **New → Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `apps/auth-service` (adjust per service)
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `node dist/index.js`
   - **Environment Variables:** Add all variables from `.env.production.example`

### Step 5 — Deploy the Frontend

1. **New → Static Site**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `apps/client`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:** Add `VITE_REALTIME_URL=<realtime-service-url>`

> Render provides automatic HTTPS on all services — no SSL setup needed.

---

## 8. Railway (PaaS — Easiest)

Railway supports monorepos natively and is the fastest way to deploy.

> **Cost:** $5/month hobby plan; usage-based pricing.

### Step 1 — Create a Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Connect your repository

### Step 2 — Add Databases

Inside your project:
- Click **New → Database → PostgreSQL**
- Click **New → Database → Redis**
- Railway auto-injects `DATABASE_URL` and `REDIS_URL` environment variables

### Step 3 — Configure Each Service

For each service, create a **New Service → GitHub Repo** and set:

| Setting | Value |
|---|---|
| Root Directory | `apps/auth-service` (per service) |
| Build Command | `npm ci && npm run build --workspace=apps/auth-service` |
| Start Command | `node apps/auth-service/dist/index.js` |

Add environment variables from `.env.production.example`.

### Step 4 — Deploy Frontend

1. **New Service → GitHub Repo**
2. Set **Root Directory** to `apps/client`
3. Railway auto-detects Vite and builds it
4. Set `VITE_REALTIME_URL` to the realtime service's Railway URL

> Railway provides automatic HTTPS and custom domain support.

---

## 9. SSL / HTTPS Setup (Let's Encrypt)

For VPS deployments (DigitalOcean, AWS, GCP, Azure), use **Certbot** to get free SSL certificates.

### Install Certbot

```bash
sudo apt install certbot -y
```

### Obtain Certificate (Standalone Mode)

Stop Nginx before running (it needs port 80):

```bash
docker compose -f docker-compose.prod.yml stop nginx

sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

docker compose -f docker-compose.prod.yml start nginx
```

### Copy Certificates to Project

```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/
sudo chmod 644 docker/ssl/*.pem
```

### Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot installs a cron job automatically at:
# /etc/cron.d/certbot
# Runs twice daily
```

---

## 10. Post-Deployment Verification

Run these checks after every deployment.

### Health Checks

```bash
# All services should return {"status":"ok"}
curl https://yourdomain.com/health
curl https://yourdomain.com/api/auth/health  # via Nginx proxy
```

### Service Logs

```bash
# View logs for all services
docker compose -f docker-compose.prod.yml logs -f

# View logs for a specific service
docker compose -f docker-compose.prod.yml logs -f auth-service
docker compose -f docker-compose.prod.yml logs -f task-service
```

### Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should show **Up (healthy)**.

### Functional Tests

| Action | Expected Result |
|---|---|
| Visit `https://yourdomain.com` | Login page loads |
| Register a new user | Redirected to Projects page |
| Create a project | Project appears in the list |
| Create a task | Task appears on the Kanban board |
| Open two browser tabs, update a task in one | Other tab updates in real time |
| Check online presence indicator | Shows "Connected" |

---

## 11. Troubleshooting

### Services Not Starting

```bash
# Check detailed container logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Restart a specific service
docker compose -f docker-compose.prod.yml restart <service-name>

# Rebuild images after code changes
docker compose -f docker-compose.prod.yml up -d --build
```

### Database Connection Errors

```bash
# Verify DATABASE_URL is set correctly
docker compose -f docker-compose.prod.yml exec auth-service env | grep DATABASE_URL

# Check if postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Run migrations manually
docker compose -f docker-compose.prod.yml exec auth-service \
  sh -c "cd /app/apps/auth-service && npx prisma migrate deploy"
```

### Redis Connection Errors

```bash
# Test Redis connection
docker compose -f docker-compose.prod.yml exec redis \
  redis-cli -a <your-redis-password> ping
# Should return: PONG
```

### Nginx / SSL Issues

```bash
# Test Nginx config
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Check SSL certificate validity
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### WebSocket Not Connecting

Ensure your Nginx config has the correct WebSocket upgrade headers for `/socket.io`:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400;
```

### Out of Disk Space

```bash
# Remove unused Docker images and containers
docker system prune -af

# Check disk usage
df -h
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Restart the memory-heavy service
docker compose -f docker-compose.prod.yml restart <service-name>
```

---

## Quick Reference — Useful Commands

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Rebuild and restart (after code changes)
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker compose -f docker-compose.prod.yml exec auth-service \
  sh -c "cd /app/apps/auth-service && npx prisma migrate deploy"

# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View logs for one service
docker compose -f docker-compose.prod.yml logs -f auth-service

# Check container health
docker compose -f docker-compose.prod.yml ps

# Remove everything (data included — careful!)
docker compose -f docker-compose.prod.yml down -v
```

---

*Generated for: Real-Time Collaboration Project Management System*
*Author: Dhananjayan D — dhananjayan.dayalan@gmail.com*
