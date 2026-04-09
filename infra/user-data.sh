#!/bin/bash
set -euo pipefail

# ============================================================
# Vocis EC2 First-Boot Provisioning Script (cloud-init)
# ============================================================

# --- System Updates ---
apt-get update && apt-get upgrade -y

# --- Enable Unattended Upgrades ---
apt-get install -y unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# --- Install Node.js 20 LTS via NodeSource ---
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# --- Install Nginx ---
apt-get install -y nginx

# --- Create vocis system user ---
useradd --system --shell /usr/sbin/nologin vocis

# --- Create application directory structure ---
mkdir -p /opt/vocis/releases
chown -R vocis:vocis /opt/vocis

# --- Install Certbot via snap ---
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ============================================================
# systemd service unit for Vocis Next.js Server
# ============================================================
cat > /etc/systemd/system/vocis.service << 'EOF'
[Unit]
Description=Vocis Next.js Server
After=network.target

[Service]
Type=simple
User=vocis
EnvironmentFile=/opt/vocis/.env
Environment=HOSTNAME=127.0.0.1 PORT=3000
ExecStart=/usr/bin/node /opt/vocis/current/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# ============================================================
# Nginx reverse proxy configuration
# ============================================================
cat > /etc/nginx/sites-available/vocis << 'NGINX'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HTTPS server with reverse proxy
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

# --- Enable Nginx site and remove default ---
ln -sf /etc/nginx/sites-available/vocis /etc/nginx/sites-enabled/vocis
rm -f /etc/nginx/sites-enabled/default

# --- Reload systemd and enable services ---
systemctl daemon-reload
systemctl enable vocis
systemctl restart nginx
