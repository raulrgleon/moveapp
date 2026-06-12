#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/moveapp"
ENV_FILE="$APP_DIR/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r'
}

CRON_SECRET="$(read_env CRON_SECRET)"
APP_URL="$(read_env NEXT_PUBLIC_APP_URL)"

if [[ -z "$CRON_SECRET" ]]; then
  echo "CRON_SECRET not set in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "$APP_URL" ]]; then
  APP_URL="http://127.0.0.1:3000"
fi

curl -sf -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/reminders"
