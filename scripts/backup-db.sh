#!/bin/bash
# Sprint 27 - Backup PostgreSQL cada 6h
# Cron: 0 */6 * * * /path/to/scripts/backup-db.sh
# Retención 30 días

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M)
# pg_dump usa postgresql:// (no asyncpg)
CONN="${PG_DUMP_URL:-postgresql://aria:aria_secret@localhost:5433/aria}"

mkdir -p "$BACKUP_DIR"
pg_dump "$CONN" | gzip > "$BACKUP_DIR/aria_${DATE}.sql.gz"
# Retención
find "$BACKUP_DIR" -name "aria_*.sql.gz" -mtime +$RETENTION_DAYS -delete
