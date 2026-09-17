# Linux Deployment

The GitHub Actions workflow at `.github/workflows/deploy.yml` deploys the CRM build and API to a Linux server when changes are pushed to `main`.

## GitHub secrets

Configure these repository secrets:

- `DEPLOY_HOST`: Linux server hostname or IP
- `DEPLOY_PORT`: SSH port, usually `22`
- `DEPLOY_USER`: deployment user
- `DEPLOY_SSH_KEY`: private SSH key for that user

The workflow uses `/var/www/nextapp-autoparts` as the server directory. The user must be able to write there and run `npm`, `pm2`, and the database migration command.

## Server setup

Install Node.js 24, MySQL, Nginx, and PM2 on the server. Create the production environment file at:

`/var/www/nextapp-autoparts/apps/Nextapp-API/.env`

Use the values from `apps/Nextapp-API/.env.example`, including a strong `JWT_SECRET`, database credentials, and:

```env
NODE_ENV=production
WEB_ORIGINS=https://yogrind.shop,http://localhost:5173,http://localhost:3000,http://localhost:8081
```

The workflow never uploads `.env` files. Secrets and database credentials must be created on the server separately.

## Nginx

Point the domain to the server and configure Nginx to serve the CRM build and proxy API requests:

```nginx
server {
    listen 80;
    server_name yogrind.shop www.yogrind.shop;

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

Enable HTTPS with Certbot after DNS is working. The deployed API health check is `https://yogrind.shop/api/health`.

## Local development

The API accepts the configured localhost origins. Start all applications from the repository root with:

```bash
npm run dev:all
```
