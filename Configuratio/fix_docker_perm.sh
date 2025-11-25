#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/compose.yml"

DOCKER="sudo docker"
COMPOSE="sudo docker compose"

echo "==> Checking Docker availability"
if ! $DOCKER version >/dev/null 2>&1; then
  echo "ERROR: Docker not available for sudo. Is Docker installed and the service running?"
  exit 1
fi

echo "==> Showing current containers"
$DOCKER ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Label "com.docker.compose.project"}}'

echo "==> Attempting a graceful compose down (ignore errors)"
$COMPOSE -f "$COMPOSE_FILE" down || true

echo "==> Force removing lingering containers by name"
for name in grafana telegraf influxdb; do
  ids=$($DOCKER ps -a --filter "name=^/${name}$" --format '{{.ID}}' || true)
  if [[ -n "${ids}" ]]; then
    echo "   - Removing ${name} -> ${ids}"
    $DOCKER rm -f ${ids} || true
  fi
done

echo "==> Force removing anonymous containers from prior compose runs"
proj_label=$($DOCKER ps -a --format '{{.ID}} {{.Label "com.docker.compose.project"}}' | awk '$2!=""{print $2}' | sort -u | tr '\n' ' ')
for proj in $proj_label; do
  echo "   - Checking project: $proj"
  ids=$($DOCKER ps -a --filter "label=com.docker.compose.project=${proj}" --format '{{.ID}}' || true)
  if [[ -n "${ids}" ]]; then
    echo "     Removing containers: ${ids}"
    $DOCKER rm -f ${ids} || true
  fi
done

echo "==> Restarting Docker engine"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart docker
else
  echo "Systemd not found; skipping systemctl restart. Manually restart Docker if needed."
fi

echo "==> Pruning leftover networks (safe)"
$DOCKER network prune -f || true

echo "==> Validating compose file syntax"
$COMPOSE -f "$COMPOSE_FILE" config --quiet

echo "==> Starting fresh deployment"
$COMPOSE -f "$COMPOSE_FILE" up -d

echo "==> Status:"
$DOCKER ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
