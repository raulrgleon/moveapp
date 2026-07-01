#!/usr/bin/env bash
# Deploy MovePilot from GitHub to this server.
# Usage: ./scripts/deploy.sh
set -euo pipefail

APP_DIR="/var/www/moveapp"
BRANCH="${DEPLOY_BRANCH:-main}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1:3000/dashboard}"
PREV_STATIC_TMP=""

cd "$APP_DIR"

cleanup() {
  if [[ -n "${PREV_STATIC_TMP}" && -d "${PREV_STATIC_TMP}" ]]; then
    rm -rf "${PREV_STATIC_TMP}"
  fi
}
trap cleanup EXIT

if [[ ! -f .env.local ]]; then
  echo "ERROR: .env.local missing — aborting." >&2
  exit 1
fi

echo "==> Pull origin/${BRANCH}"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Install dependencies"
npm install

echo "==> Prisma client"
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env.local"
set +a
npx prisma generate

if [[ "${DEPLOY_DB_PUSH:-0}" == "1" ]]; then
  echo "==> Prisma db push (DEPLOY_DB_PUSH=1)"
  npx prisma db push
fi

echo "==> Build"
# Keep previous hashed static assets to reduce ChunkLoadError during deploy windows.
# This allows stale clients to still fetch old chunk files while they refresh.
if [[ -d "$APP_DIR/.next/static" ]]; then
  PREV_STATIC_TMP="$(mktemp -d)"
  cp -a "$APP_DIR/.next/static/." "${PREV_STATIC_TMP}/"
fi

npm run build

if [[ -n "${PREV_STATIC_TMP}" && -d "${PREV_STATIC_TMP}" ]]; then
  echo "==> Restore previous static chunks for compatibility"
  mkdir -p "$APP_DIR/.next/static"
  cp -an "${PREV_STATIC_TMP}/." "$APP_DIR/.next/static/" || true
fi

echo "==> Restart PM2"
pm2 restart moveapp

echo "==> Health check"
sleep 2
code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
if [[ "$code" != "200" ]]; then
  echo "ERROR: health check returned HTTP $code for $HEALTH_URL" >&2
  exit 1
fi

echo "Deploy OK — $(git log -1 --oneline) — HTTP $code"
