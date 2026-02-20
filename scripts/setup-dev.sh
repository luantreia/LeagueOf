#!/bin/bash

# League Of - Development Setup Script

set -e

echo "🚀 Setting up League Of development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment files
echo "⚙️  Setting up environment files..."

if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Created apps/backend/.env"
fi

if [ ! -f "apps/frontend/.env.local" ]; then
    cp apps/frontend/.env.example apps/frontend/.env.local
    echo "✅ Created apps/frontend/.env.local"
fi

# Start Docker services
echo "🐳 Starting Docker services (MongoDB, Redis)..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker ps | grep -q leagueof-mongodb-dev; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB failed to start"
    exit 1
fi

if docker ps | grep -q leagueof-redis-dev; then
    echo "✅ Redis is running"
else
    echo "❌ Redis failed to start"
    exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📝 Next steps:"
echo "   1. Run 'npm run dev' to start both backend and frontend"
echo "   2. Visit http://localhost:3000 for the frontend"
echo "   3. Visit http://localhost:4000/api/health for the backend"
echo "   4. Visit http://localhost:8081 for MongoDB Express (admin/admin)"
echo "   5. Visit http://localhost:8082 for Redis Commander"
echo ""
echo "🛠️  Useful commands:"
echo "   - npm run dev              # Start both services"
echo "   - npm run dev:backend      # Start backend only"
echo "   - npm run dev:frontend     # Start frontend only"
echo "   - npm run docker:down      # Stop Docker services"
echo ""
