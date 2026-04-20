#!/bin/bash

# Minimal build & restart script
# - Fast frontend rebuild (local `npm run build` + copy to running container if any)
# - Docker image build for backend and restart of backend (and frontend fallback)

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check project files
if [ ! -f "compose.yaml" ] && [ ! -f "docker-compose.yml" ]; then
  echo "❌ Error: Must run from project root (compose.yaml or docker-compose.yml not found)"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "❌ Error: Missing .env file"
  exit 1
fi

# Determine docker compose command and define wrapper function
if command -v docker-compose >/dev/null 2>&1; then
  echo "Using docker-compose"
  compose() { docker-compose -f compose.yaml "$@"; }
elif docker compose version >/dev/null 2>&1; then
  echo "Using docker compose"
  compose() { docker compose -f compose.yaml "$@"; }
else
  echo "❌ Neither 'docker-compose' nor 'docker compose' is available on PATH"
  exit 1
fi

# load env
echo "📋 Loading .env..."
# shellcheck disable=SC1091
source .env

# Fast frontend rebuild (local) and copy into running container if exists
if [ "${SKIP_FRONTEND:-0}" = "1" ]; then
  echo "⚠️  SKIP_FRONTEND=1 set — skipping frontend build and asset copy"
else
  echo "\n🔧 Building frontend (fast local build)..."
  if [ -d "frontend" ]; then
    pushd frontend >/dev/null

    if [ ! -d "node_modules" ]; then
      echo "📥 node_modules not found — installing dependencies (npm ci)..."
      npm ci
    else
      echo "✅ node_modules present — skipping install"
    fi

    echo "🔨 npm run build"
    npm run build
    popd >/dev/null

    FRONTEND_CID=$(compose ps -q frontend 2>/dev/null || true)
    if [ -n "$FRONTEND_CID" ]; then
      echo "📦 Copying built assets into running frontend container ($FRONTEND_CID)..."
      docker cp frontend/dist/. "$FRONTEND_CID":/usr/share/nginx/html/
      echo "🔁 Reloading nginx inside frontend container..."
      docker exec "$FRONTEND_CID" nginx -s reload || true
      echo "✅ Frontend updated in-place"
    else
      echo "⚠️  Frontend container not running — will (re)create from image after docker build"
    fi
  else
    echo "⚠️  frontend directory not found — skipping frontend build"
  fi
fi

# Docker build & restart for backend (fast, use cache to save time)
echo "\n🐳 Building backend Docker image (cached for speed)..."
compose build backend || {
  echo "⚠️  Build failed for backend"
  exit 1
}

echo "▶️  Restarting backend container..."
if ! compose up -d backend; then
  echo "⚠️  'compose up' failed — attempting to recover by removing existing backend container and retrying"
  # Try to find running/created container for backend and remove it
  OLD_CID=$(compose ps -q backend 2>/dev/null || true)
  if [ -n "$OLD_CID" ]; then
    echo "🧹 Removing old backend container ($OLD_CID)"
    docker rm -f "$OLD_CID" || true
  else
    # fallback to common container name
    docker rm -f ecc800-backend || true
  fi

  echo "▶️  Retrying: compose up -d backend"
  compose up -d backend
fi

# If frontend container wasn't running earlier we ensure it's up-to-date and running
if [ -z "${FRONTEND_CID:-}" ]; then
  echo "▶️  Ensuring frontend container is running with updated image..."
  compose up -d frontend
fi

echo "\n✅ Short build & restart complete"

# Show brief status
compose ps --services --filter "status=running"

exit 0
