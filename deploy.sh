#!/bin/bash
# Swissalytics - Deploy script for Jelastic Docker
# Usage: ssh into docker node and run this script

set -e

IMAGE="ghcr.io/pixelab-ch/swissalytics:latest"
CONTAINER_NAME="swissalytics"

echo "=== Swissalytics Deploy ==="

# Pull latest image
echo "[1/4] Pulling latest image..."
docker pull "$IMAGE"

# Stop existing container if running
echo "[2/4] Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Run new container
echo "[3/4] Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 80:3000 \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGIN=https://swissalytics.com \
  -e GOOGLE_PAGESPEED_API_KEY="${GOOGLE_PAGESPEED_API_KEY:-}" \
  -e SUPABASE_URL="${SUPABASE_URL:-}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}" \
  -e IP_HASH_SALT="${IP_HASH_SALT:-}" \
  "$IMAGE"

# Verify
echo "[4/4] Verifying..."
sleep 3
if docker ps | grep -q "$CONTAINER_NAME"; then
  echo "OK - Swissalytics running on port 80"
  docker logs --tail 5 "$CONTAINER_NAME"
else
  echo "FAIL - Container not running"
  docker logs "$CONTAINER_NAME"
  exit 1
fi
