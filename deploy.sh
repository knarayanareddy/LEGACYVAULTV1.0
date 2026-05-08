#!/bin/bash
# deploy.sh — LegacyVault Full Stack Orchestrator

set -e

echo "🚀 Starting LegacyVault Deployment..."

# 1. Build Anchor program
echo "📦 Building Anchor Program..."
cd legacyvault
anchor build
cd ..

# 2. Build API Docker image
echo "🐳 Building API Container..."
docker build -t legacyvault-api:latest ./api

# 3. Build Indexer Docker image
echo "🐳 Building Indexer Container..."
docker build -t legacyvault-indexer:latest ./indexer

# 4. Start Infrastructure
echo "🏗️  Starting Infrastructure (Postgres, Redis, Prometheus, Grafana)..."
docker-compose -f infra/docker-compose.yml up -d

# 5. Run Migrations
echo "🗄️  Running Database Migrations..."
# Get the actual container name for the API service
API_CONTAINER=$(docker ps --format '{{.Names}}' | grep "api-1" | head -n 1)
if [ -z "$API_CONTAINER" ]; then
  echo "❌ Error: Could not find API container."
  exit 1
fi
docker exec "$API_CONTAINER" npx prisma migrate deploy

echo "✅ Deployment Complete!"
echo "   API: http://localhost:3000"
echo "   Dashboard: http://localhost:5173 (dev mode)"
echo "   Grafana: http://localhost:3001"
