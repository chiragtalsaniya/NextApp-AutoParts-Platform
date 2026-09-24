#!/usr/bin/env bash
set -Eeuo pipefail

SERVER_HOST="${DEPLOY_HOST:-yogrind.shop}"
SERVER_PORT="${DEPLOY_PORT:-22}"
SERVER_USER="${DEPLOY_USER:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/nextapp-autoparts}"
SERVER_ORIGIN="http://${SERVER_HOST}"
DB_NAME="${DB_NAME:-nextapp_crm}"
DB_USER="${DB_USER:-nextapp_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
JWT_SECRET="${JWT_SECRET:-}"
SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${SERVER_USER}" ]]; then
  echo "Set DEPLOY_USER to the Linux SSH user." >&2
  exit 1
fi

if [[ -z "${DB_PASSWORD}" ]]; then
  read -r -s -p "MySQL password for ${DB_USER}: " DB_PASSWORD
  printf '\n'
fi

if [[ -z "${JWT_SECRET}" ]]; then
  JWT_SECRET="$(openssl rand -hex 32)"
  echo "Generated a JWT secret for this server deployment."
fi

command -v ssh >/dev/null || { echo "ssh is required." >&2; exit 1; }
command -v rsync >/dev/null || { echo "rsync is required." >&2; exit 1; }
command -v npm >/dev/null || { echo "npm is required." >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required." >&2; exit 1; }

ssh_opts=(-p "${SERVER_PORT}")
rsync_opts=(-az --delete -e "ssh -p ${SERVER_PORT}")

printf 'Deploying to %s:%s\n' "${SERVER_HOST}" "${DEPLOY_PATH}"

# Bootstrap Ubuntu/Debian packages and create the application directory.
ssh "${ssh_opts[@]}" "${SSH_TARGET}" "DEPLOY_PATH='${DEPLOY_PATH}' bash -s" <<'REMOTE_BOOTSTRAP'
set -Eeuo pipefail
sudo -n apt-get update
sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg nginx mysql-server rsync

if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 24 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -n -E bash -
  sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null; then
  sudo -n npm install --global pm2
fi

sudo -n mkdir -p "${DEPLOY_PATH}"
sudo -n chown -R "$(id -un):$(id -gn)" "${DEPLOY_PATH}"
REMOTE_BOOTSTRAP

# Configure the MySQL database and application environment without writing secrets to Git.
ENV_PAYLOAD="$(printf 'NODE_ENV=production\nPORT=3001\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_NAME=%s\nDB_USER=%s\nDB_PASSWORD=%s\nJWT_SECRET=%s\nWEB_ORIGINS=%s\n' \
  "${DB_NAME}" "${DB_USER}" "${DB_PASSWORD}" "${JWT_SECRET}" "${SERVER_ORIGIN}" | base64 | tr -d '\n')"

ssh "${ssh_opts[@]}" "${SSH_TARGET}" \
  "DB_NAME='${DB_NAME}' DB_USER='${DB_USER}' DB_PASSWORD='${DB_PASSWORD}' DEPLOY_PATH='${DEPLOY_PATH}' ENV_PAYLOAD='${ENV_PAYLOAD}' bash -s" <<'REMOTE_CONFIG'
set -Eeuo pipefail
sudo -n mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

mkdir -p "${DEPLOY_PATH}/apps/NextApp-API"
printf '%s' "${ENV_PAYLOAD}" | base64 -d > "${DEPLOY_PATH}/apps/NextApp-API/.env"
chmod 600 "${DEPLOY_PATH}/apps/NextApp-API/.env"

sudo -n tee /etc/nginx/sites-available/nextapp-autoparts >/dev/null <<NGINX
server {
    listen 80;
    server_name ${SERVER_HOST};

    root ${DEPLOY_PATH}/apps/NextApp-CRM/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
sudo -n ln -sfn /etc/nginx/sites-available/nextapp-autoparts /etc/nginx/sites-enabled/nextapp-autoparts
sudo -n rm -f /etc/nginx/sites-enabled/default
sudo -n nginx -t
sudo -n systemctl enable --now nginx mysql
sudo -n systemctl reload nginx
REMOTE_CONFIG

# Build on the current machine, then upload only server-required application files.
cd "${ROOT_DIR}"
npm ci --workspace=apps/NextApp-CRM --workspace=apps/NextApp-API --workspace=packages/shared-types --include-workspace-root
VITE_API_URL="${SERVER_ORIGIN}/api" \
  npm run build --workspace=apps/NextApp-CRM

rsync "${rsync_opts[@]}" \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude 'node_modules/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'apps/NextApp-Mobile/' \
  "${ROOT_DIR}/" "${SSH_TARGET}:${DEPLOY_PATH}/"

ssh "${ssh_opts[@]}" "${SSH_TARGET}" "DEPLOY_PATH='${DEPLOY_PATH}' bash -s" <<'REMOTE_DEPLOY'
set -Eeuo pipefail
cd "${DEPLOY_PATH}"
npm ci --omit=dev --workspace=apps/NextApp-API --workspace=packages/shared-types --include-workspace-root
npm run migrate --workspace=apps/NextApp-API

pm2 delete nextapp-api >/dev/null 2>&1 || true
pm2 start index.js --name nextapp-api --cwd "${DEPLOY_PATH}/apps/NextApp-API" --update-env
pm2 save
sleep 2
curl --fail --silent --show-error http://127.0.0.1:3001/api/health
REMOTE_DEPLOY

printf 'Deployment complete: %s\n' "${SERVER_ORIGIN}"
