# Deployment

## Infrastructure

- **VPS:** IONOS L+ (6 vCore, 8 GB RAM, 240 GB NVMe SSD)
- **OS:** Ubuntu 24.04 LTS
- **Domain:** `krieger2501.de` (and `*.krieger2501.de` subdomains)
- **Stack:** Docker Compose, Caddy (auto TLS), PostgreSQL 17

---

## Initial server setup (one-time)

SSH in as root:

```bash
# Create a non-root user
adduser nexo
usermod -aG sudo nexo

# Harden SSH — paste your public key first
mkdir -p /home/nexo/.ssh
cat >> /home/nexo/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAA... your-public-key
EOF
chmod 700 /home/nexo/.ssh
chmod 600 /home/nexo/.ssh/authorized_keys
chown -R nexo:nexo /home/nexo/.ssh

# Disable root login and password auth
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
systemctl restart ssh

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status

# Switch to the new user for everything below
su - nexo
```

---

## Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker -v   # verify
```

---

## Point DNS

In the IONOS domain control panel, add A records for each subdomain:

| Hostname                 | Type | Value      |
| ------------------------ | ---- | ---------- |
| `krieger2501.de`         | A    | `<VPS IP>` |
| `auth.krieger2501.de`    | A    | `<VPS IP>` |
| `finance.krieger2501.de` | A    | `<VPS IP>` |

Wait for propagation before continuing (5–30 min). Verify:

```bash
dig +short auth.krieger2501.de   # should return your VPS IP
```

Caddy will fail to obtain TLS certificates if DNS isn't pointing at the server yet.

---

## Update OAuth redirect URIs

In each provider's developer console, **add** the production URI alongside the localhost one you added during development. Do not remove the localhost entries.

| Provider | Production redirect URI                                 |
| -------- | ------------------------------------------------------- |
| Google   | `https://auth.krieger2501.de/api/auth/callback/google`  |
| GitHub   | `https://auth.krieger2501.de/api/auth/callback/github`  |
| Discord  | `https://auth.krieger2501.de/api/auth/callback/discord` |

---

## Clone and configure

```bash
cd ~
git clone https://github.com/YOUR_ORG/nexo
cd nexo
cp .env.example .env
nano .env
```

Generate strong secrets:

```bash
openssl rand -hex 32   # run twice: once for AUTH_SECRET, once for FINANCE_CLIENT_SECRET
```

Fill in `.env`:

```bash
POSTGRES_PASSWORD=<strong password>
DATABASE_URL=postgres://nexo:<POSTGRES_PASSWORD>@postgres:5432/nexo
AUTH_SECRET=<openssl output 1>
FINANCE_CLIENT_SECRET=<openssl output 2>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

---

## Deploy

On the server, always pass `-f docker-compose.yml` explicitly to skip the local override file:

```bash
docker compose -f docker-compose.yml up -d --build
```

This will:

1. Build all Docker images
2. Start PostgreSQL
3. Run migrations (waits for Postgres to be healthy)
4. Start auth, finance, landing
5. Start Caddy — issues Let's Encrypt certificates automatically

Monitor startup:

```bash
docker compose logs -f              # all services
docker compose logs -f caddy        # watch for TLS cert issuance
docker compose logs -f migrate      # confirm migrations ran
docker compose ps                   # check all services are Up
```

---

## Seed your email

```bash
docker compose exec postgres psql -U nexo -d nexo \
  -c "INSERT INTO auth.allowed_emails (email) VALUES ('your@email.com');"
```

Open `https://auth.krieger2501.de/login` and sign in. That's your admin account.

---

## Updating after a push

```bash
cd ~/nexo
git pull
docker compose -f docker-compose.yml up -d --build
```

To rebuild a single service without touching the others:

```bash
docker compose -f docker-compose.yml up -d --build finance
```

---

## Backups

Set up a nightly `pg_dump` cron job:

```bash
sudo mkdir -p /backups
sudo chown nexo:nexo /backups

crontab -e
```

Add:

```
0 3 * * * docker compose -f /home/nexo/nexo/docker-compose.yml exec -T postgres pg_dump -U nexo nexo | gzip > /backups/nexo-$(date +\%Y\%m\%d).sql.gz
```

### Restoring from a backup

```bash
gunzip -c /backups/nexo-20260501.sql.gz | \
  docker compose exec -T postgres psql -U nexo -d nexo
```

### Optional: offsite backup with rclone

```bash
# Install rclone
sudo apt install rclone

# Configure a Backblaze B2 bucket (free tier covers ~10 GB)
rclone config

# Add a daily sync after the dump
# In crontab, after the pg_dump line:
30 3 * * * rclone sync /backups b2:your-bucket-name/nexo-backups
```

---

## Useful commands on the server

```bash
# View logs for a specific service
docker compose logs -f auth

# Open a Postgres shell
docker compose exec postgres psql -U nexo -d nexo

# Restart a single service
docker compose restart finance

# Stop everything
docker compose -f docker-compose.yml down

# Stop and remove volumes (DESTRUCTIVE — wipes the database)
docker compose -f docker-compose.yml down -v
```

---

## When adding a new app

1. Add the service to `docker-compose.yml`
2. Add the subdomain to `Caddyfile`
3. Add the DNS A record in IONOS
4. Add the OAuth redirect URI in each provider's console
5. Deploy: `docker compose -f docker-compose.yml up -d --build`

See [Adding a New App](adding-an-app.md) for the full checklist.
