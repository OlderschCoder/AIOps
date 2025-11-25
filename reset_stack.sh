#!/usr/bin/env bash
set -euo pipefail

DOCKER="sudo docker"
COMPOSE="sudo docker compose"

echo "[1/5] Showing running containers..."
$DOCKER ps || true

echo "[2/5] Bringing stack down if partially running..."
$COMPOSE -f compose.yml down || true

echo "[3/5] Force remove any lingering containers by name..."
for c in influxdb telegraf grafana; do
  if $DOCKER ps -a --format '{{.Names}}' | grep -q "^$c$"; then
    echo " - removing $c"
    $DOCKER rm -f "$c" || true
  fi
done

echo "[4/5] Validate compose file syntax..."
$COMPOSE -f compose.yml config --quiet

echo "[5/5] Starting fresh..."
$COMPOSE -f compose.yml up -d

echo "Done. Current status:"
$DOCKER ps --format 'table {{.Names}}	{{.Status}}	{{.Ports}}'
