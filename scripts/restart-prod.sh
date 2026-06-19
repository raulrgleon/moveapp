#!/usr/bin/env bash
set -euo pipefail
cd /var/www/moveapp
pm2 start ecosystem.config.cjs --update-env
pm2 save
echo "MovePilot production restarted with fresh .env"
