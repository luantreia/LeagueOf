# League Of - Competitive Social Web App

Production-ready fullstack architecture for competitive social gaming with real-time features, ranking systems, and scalable infrastructure.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), PWA, TailwindCSS
- **Backend**: Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Cache/Pub-Sub**: Redis
- **Real-time**: Socket.io
- **Auth**: JWT with refresh tokens
- **Deployment**: Docker, Nginx

### Key Features
- ✅ Modular backend architecture
- ✅ Configurable ranking systems (ELO & Points-based)
- ✅ Real-time lobbies with auto team shuffle
- ✅ Notification system (in-app + push ready)
- ✅ Third-party API integration framework
- ✅ Feature flags for controlled rollouts
- ✅ Scalable for 100k+ concurrent users

## 📁 Project Structure

```
LeagueOf/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── core/     # Core infrastructure
│   │   │   ├── shared/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   └── Dockerfile
│   └── frontend/         # Next.js PWA
│       ├── src/
│       │   ├── app/      # App router pages
│       │   ├── components/
│       │   ├── lib/      # API clients
│       │   └── hooks/    # React hooks
│       └── Dockerfile
├── packages/
│   └── shared/           # Shared types & constants
├── nginx/                # Reverse proxy config
├── docker-compose.yml    # Production compose
└── docker-compose.dev.yml # Development compose
```

## 🚀 Quick Start

### Development

1. **Clone and install dependencies**
```bash
npm install
```

2. **Start infrastructure (MongoDB, Redis, monitoring)**
```bash
npm run docker:dev
```

3. **Set up environment variables**
```bash
cp .env.example apps/backend/.env
cp .env.example apps/frontend/.env.local
```

4. **Start development servers**
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- MongoDB Express: http://localhost:8081 (admin/admin)
- Redis Commander: http://localhost:8082

### Production

1. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Build and deploy**
```bash
npm run docker:prod
```

3. **Access application**
- Application: http://localhost (via Nginx)
- Health check: http://localhost/api/health

## 🔧 Configuration

### Ranking Systems

Configure per group in the database:
```typescript
{
  rankingType: 'elo' | 'points',
  eloConfig: {
    kFactor: 32,
    initialRating: 1200
  },
  pointsConfig: {
    winPoints: 3,
    lossPoints: -1,
    drawPoints: 1
  }
}
```

### Feature Flags

Enable/disable features via environment variables:
```env
ENABLE_THIRD_PARTY_INTEGRATIONS=true
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Integration Adapters

Add third-party integrations in `apps/backend/src/modules/integrations/adapters/`:
- Riot Games API
- Steam API
- Discord
- Custom APIs

## 📊 Scalability Features

- **Horizontal scaling**: Stateless API design with Redis session store
- **Database indexing**: Optimized queries for high-load scenarios
- **Caching layer**: Redis for session, rankings, and frequently accessed data
- **Real-time optimization**: Socket.io with Redis adapter for multi-instance support
- **Rate limiting**: Per-user and per-IP rate limiting
- **Connection pooling**: MongoDB and Redis connection pools
- **Queue system**: BullMQ for background jobs (notifications, match processing)

## 🔐 Security

- JWT access tokens (15min) + refresh tokens (7 days)
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting on all endpoints
- CORS configuration
- Helmet.js security headers
- MongoDB injection protection
- XSS protection

## 📱 PWA Features

- Offline support
- App-like experience
- Push notifications ready
- Install prompts
- Service worker caching

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
npm run test --workspace=apps/backend

# Frontend tests
npm run test --workspace=apps/frontend
```

## 📈 Monitoring & Logging

- Structured logging with Winston
- Error tracking with Sentry integration
- Health check endpoints
- Performance metrics
- Real-time monitoring dashboard

## 🔄 CI/CD Ready

- GitHub Actions workflows included
- Docker multi-stage builds
- Environment-based deployments
- Automated testing pipeline

## 📚 API Documentation

API documentation available at `/api/docs` when running the backend server.

## 🤝 Contributing

This is a production-ready MVP architecture. Extend modules in `apps/backend/src/modules/` and follow the established patterns.

## 📄 License

MIT
