#!/bin/bash

# Production Deployment Script

set -e

echo "🚀 Deploying League Of to production..."

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | xargs)
fi

# Build and deploy
echo "🔨 Building production images..."
docker-compose build

echo "🚢 Starting production services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Health checks
echo "🏥 Running health checks..."

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed (HTTP $BACKEND_HEALTH)"
    exit 1
fi

FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed (HTTP $FRONTEND_HEALTH)"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "📝 Access points:"
echo "   - Frontend: http://localhost"
echo "   - Backend: http://localhost/api"
echo ""
