module.exports = {
  apps: [
    {
      name: "moveapp",
      cwd: "/var/www/moveapp",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_restarts: 10,
      min_uptime: "10s",
      exp_backoff_restart_delay: 1000,
    },
  ],
};
