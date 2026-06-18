#!/usr/bin/env bash
# Daily PostgreSQL backup for MovePilotAi. Install cron:
#   0 3 * * * /var/www/moveapp/scripts/backup-db.sh >> /var/log/moveapp-backup.log 2>&1
set -euo pipefail

APP_DIR="/var/www/moveapp"
ENV_FILE="$APP_DIR/.env.local"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/moveapp}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r' | tr -d '"'
}

DATABASE_URL="$(read_env DATABASE_URL)"
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL not set in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/moveapp_${STAMP}.sql.gz"

pg_dump "$DATABASE_URL" | gzip -9 > "$OUT"
echo "Backup saved: $OUT ($(du -h "$OUT" | cut -f1))"

find "$BACKUP_DIR" -name 'moveapp_*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
