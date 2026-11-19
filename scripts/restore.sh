#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Uso: bash scripts/restore.sh <ficheiro.sql|ficheiro.sql.gz>"
  exit 1
fi

FILE="$1"
CONTAINER="${CONTAINER:-oficina-livre-db}"

if [[ "$FILE" == *.gz ]]; then
  TMP="$(mktemp)"
  gzip -dc "$FILE" > "$TMP"
  docker exec -i "$CONTAINER" psql -U oficina -d oficina_livre < "$TMP"
  rm -f "$TMP"
else
  docker exec -i "$CONTAINER" psql -U oficina -d oficina_livre < "$FILE"
fi

echo "Restore concluído."
