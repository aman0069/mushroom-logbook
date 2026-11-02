#!/usr/bin/with-contenv bashio
set -e

export PORT="${PORT:-3001}"
export HA_URL="${HA_URL:-http://supervisor/core}"
export HA_TOKEN="${HA_TOKEN:-${SUPERVISOR_TOKEN:-}}"

mkdir -p /data

npx prisma db push --skip-generate

exec npm run server
