module.exports = {
  apps: [
    {
      name: 'nextapp-api',
      script: './server/index.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BASE_URL: 'https://yogrind.shop/api'
      }
    },
    {
      name: 'nextapp',
      script: 'npx',
      args: 'serve -s dist -l 5173',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        BASE_URL: 'https://yogrind.shop'
      }
    }
  ]
};
