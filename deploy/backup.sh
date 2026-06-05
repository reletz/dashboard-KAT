#!/usr/bin/env bash
# Backup DB SQLite/libSQL secara aman (pakai .backup, BUKAN cp — cp DB WAL bisa korup).
# Dipanggil oleh kat-portal-backup.service (timer harian). Butuh sqlite3 CLI.
set -euo pipefail

DB="${DB_PATH:-/var/lib/kat-portal/portal.db}"
DEST="${BACKUP_DIR:-/var/lib/kat-portal/backups}"
KEEP="${BACKUP_KEEP:-7}"

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/portal-$STAMP.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$OUT'"
else
  # Fallback kalau sqlite3 tak ada: VACUUM INTO juga konsisten.
  echo "sqlite3 tidak ada — fallback ke cp (kurang aman untuk WAL aktif)"
  cp "$DB" "$OUT"
fi

# Rotasi: simpan KEEP terbaru.
ls -1t "$DEST"/portal-*.db 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
echo "backup → $OUT"
