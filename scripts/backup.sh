#!/usr/bin/env bash
set -euo pipefail

CONTAINER="${CONTAINER:-oficina-livre-db}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

FILE="$BACKUP_DIR/oficina-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$CONTAINER" pg_dump -U oficina -d oficina_livre > "$FILE"
gzip "$FILE"
echo "Backup criado: $FILE.gz"
