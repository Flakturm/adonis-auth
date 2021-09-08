module.exports = {
  apps: [
    {
      name: 'adonis-app',
      script: './build/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
    },
  ],
}
