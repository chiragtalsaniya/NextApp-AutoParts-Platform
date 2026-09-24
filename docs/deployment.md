# Linux Deployment

The GitHub Actions workflow at `.github/workflows/deploy.yml` deploys the CRM build and API to `http://yogrind.shop` when changes are pushed to `main`.

## GitHub secrets

Configure these repository secrets:

- `DEPLOY_HOST`: Linux server hostname or IP
- `DEPLOY_PORT`: SSH port, usually `22`
- `DEPLOY_USER`: deployment user
- `DEPLOY_SSH_KEY`: private SSH key for that user
- `DB_PASSWORD`: MySQL password for the production `nextapp_user`
- `JWT_SECRET`: long random secret used to sign API tokens

In GitHub, open **Settings -> Secrets and variables -> Actions -> New repository
secret** and add each name/value. Use SSH key authentication for deployment;
do not store an SSH login password in the repository or workflow.

The workflow uses `/var/www/nextapp-autoparts` as the server directory. The user must be able to write there and run `npm`, `pm2`, and the database migration command.

## One-command Linux deployment

From the repository root, use the bootstrap script. It installs Node.js 24,
MySQL, Nginx, PM2, configures the server, builds the CRM, uploads the API and
CRM, runs the MySQL initializer, and starts the API with PM2:

```bash
DEPLOY_USER=root \
DB_PASSWORD='use-a-strong-database-password' \
JWT_SECRET="$(openssl rand -hex 32)" \
./scripts/deploy-linux.sh
```

Use a non-root SSH user with passwordless `sudo` where possible. The script
defaults to `yogrind.shop`; override `DEPLOY_HOST`, `DEPLOY_PORT`, or
`DEPLOY_PATH` when needed. It never commits or uploads a local `.env` file.

## Server setup

Install Node.js 24, MySQL, Nginx, and PM2 on the server. Create the production environment file at:

`/var/www/nextapp-autoparts/apps/NextApp-API/.env`

Use the values from `apps/NextApp-API/.env.example`, including a strong `JWT_SECRET`, database credentials, and:

```env
NODE_ENV=production
WEB_ORIGINS=https://yogrind.shop
```

The workflow never uploads `.env` files. It creates the production API `.env`
from `DB_PASSWORD` and `JWT_SECRET` GitHub Secrets over SSH, with file mode
`600`.

Development localhost origins are intentionally not included in the production
allowlist. Use a separate local `.env` and local API process when developing.

## Nginx

Point the domain to the server and configure Nginx to serve the CRM build and proxy API requests:

```nginx
server {
    listen 80;
    server_name yogrind.shop;

    root /var/www/nextapp-autoparts/apps/NextApp-CRM/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

The deployed API health check is `http://yogrind.shop/api/health`.

## Local development

Start the local API and applications separately with:

```bash
npm run dev:all
```
