# 🏆 League Of - Production-Ready Fullstack Architecture

## Project Summary

**League Of** is an enterprise-grade competitive social gaming platform designed to scale to 100,000+ concurrent users. Built with modern technologies and best practices, it provides real-time matchmaking, configurable ranking systems, and seamless third-party integrations.

## ✨ Key Features

### Core Features
- ✅ **JWT Authentication** with refresh token rotation
- ✅ **Dual Ranking Systems** (ELO & Points-based) configurable per group
- ✅ **Real-time Lobbies** with automatic team shuffle algorithm
- ✅ **Notification System** (in-app + push-ready infrastructure)
- ✅ **Integration Framework** for Riot Games, Steam, Discord, etc.
- ✅ **Feature Flags** for controlled rollouts
- ✅ **PWA Support** for mobile-first experience

### Technical Features
- ✅ Modular backend architecture (8 feature modules)
- ✅ Horizontal scaling ready (stateless API)
- ✅ Redis caching & pub/sub for performance
- ✅ BullMQ job queues for background processing
- ✅ Comprehensive error handling & validation
- ✅ Rate limiting (per-IP and per-user)
- ✅ WebSocket support with Socket.IO
- ✅ Docker containerization
- ✅ Production-grade logging with Winston
- ✅ Database indexing for high performance

## 📊 Architecture Overview

```
Frontend (Next.js 14 PWA)
    ↕ HTTPS/WSS
Nginx (Load Balancer + Reverse Proxy)
    ↕
Backend API (Express.js Cluster)
    ↕
┌─────────┬─────────┬──────────┐
│ MongoDB │  Redis  │ Socket.IO │
└─────────┴─────────┴──────────┘
```

## 📁 Project Structure

```
LeagueOf/
├── apps/
│   ├── backend/              # Express API (TypeScript)
│   │   ├── src/
│   │   │   ├── modules/      # 8 Feature modules
│   │   │   ├── core/         # Infrastructure
│   │   │   ├── shared/       # Utilities
│   │   │   └── config/       # Configuration
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/             # Next.js 14 PWA
│       ├── src/
│       │   ├── app/          # App Router
│       │   ├── components/   # React components
│       │   └── lib/          # API client, Socket.IO
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/               # Shared TypeScript types
│
├── nginx/                    # Nginx configuration
├── scripts/                  # Deployment scripts
├── docker-compose.yml        # Production compose
├── docker-compose.dev.yml    # Development compose
└── README.md
```

## 🚀 Quick Start

### Development Setup

```bash
# 1. Run automated setup
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# 2. Start development servers
npm run dev

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:4000
# - Mongo Express: http://localhost:8081
# - Redis Commander: http://localhost:8082
```

### Production Deployment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production values

# 2. Deploy
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh

# 3. Access application
# - Application: http://your-domain.com
# - API: http://your-domain.com/api
```

## 🎯 Feature Modules

### 1. Authentication (`apps/backend/src/modules/auth/`)
- JWT access tokens (15min) + refresh tokens (7d)
- Token rotation for security
- Password hashing with bcrypt
- Redis-backed session management
- HTTP-only cookie support

**Key Files:**
- `auth.service.ts` - Business logic
- `auth.controller.ts` - Route handlers
- `auth.routes.ts` - Express routes
- `auth.validation.ts` - Joi schemas

### 2. Rankings (`apps/backend/src/modules/rankings/`)
- **ELO Algorithm**: Traditional chess-style rating
  - Configurable K-factor (10-64)
  - Expected score calculation
  - Rating bounds (min/max)
  
- **Points System**: Accumulative scoring
  - Win/loss/draw points
  - Bonus points (kills, deaths, assists)
  - Flexible scoring rules

**Key Features:**
- Leaderboard caching (5 min)
- Efficient database queries with indexes
- Match history tracking
- Streak calculation

**API Example:**
```javascript
// Get leaderboard
GET /api/rankings/group/:groupId?page=1&limit=50

// Response
{
  "rankings": [
    {
      "user": { "username": "player1" },
      "elo": { "rating": 1450, "peak": 1500 },
      "stats": { "wins": 30, "losses": 20, "winRate": 60 },
      "rank": 1
    }
  ],
  "total": 150
}
```

### 3. Lobbies (`apps/backend/src/modules/lobbies/`)
- Real-time multiplayer lobbies
- Auto team shuffle (Fisher-Yates algorithm)
- Ready check system
- Match countdown
- Host migration

**WebSocket Events:**
```javascript
// Create lobby
socket.emit('lobby:create', {
  groupId: 'group-id',
  maxPlayers: 10,
  settings: { autoShuffle: true, teamSize: 5 }
});

// Auto team shuffle result
socket.on('lobby:teams_shuffled', ({ teams }) => {
  // teams = [[player1, player2], [player3, player4]]
});
```

### 4. Notifications (`apps/backend/src/modules/notifications/`)
- In-app notifications
- Push notification ready (FCM/OneSignal)
- Priority levels (low, medium, high, urgent)
- Queue-based processing with BullMQ
- Real-time delivery via Socket.IO
- Expiration support

### 5. Integrations (`apps/backend/src/modules/integrations/`)
- Adapter pattern for extensibility
- Feature flag controlled
- Health check monitoring
- Built-in adapters:
  - Riot Games API (League, Valorant)
  - Steam API
  - Discord Webhooks

**Example Integration:**
```typescript
const riotAdapter = integrationManager.getAdapter('riot');
const summoner = await riotAdapter.getSummonerByName('na1', 'player');
```

### 6. Users (`apps/backend/src/modules/users/`)
- User profiles
- Avatar support
- Stats tracking
- Preferences management
- Role-based access control

### 7. Groups (`apps/backend/src/modules/groups/`)
- Create gaming communities
- Member management
- Ranking configuration per group
- Public/private groups
- Join approval workflow

### 8. Matches (`apps/backend/src/modules/matches/`)
- Match creation and tracking
- Team management
- Player statistics
- Match status workflow
- Automatic ranking updates

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with Server Components
- **TailwindCSS** - Utility-first CSS
- **next-pwa** - Progressive Web App support
- **Socket.IO Client** - Real-time communication
- **React Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Mongoose** - MongoDB ODM
- **Socket.IO** - WebSocket server
- **Redis** - Caching & pub/sub
- **BullMQ** - Job queuing
- **JWT** - Authentication
- **Joi** - Validation
- **Winston** - Logging
- **Bcrypt** - Password hashing

### Infrastructure
- **MongoDB 7** - Primary database
- **Redis 7** - Cache & queue
- **Nginx** - Reverse proxy
- **Docker** - Containerization
- **PM2** - Process management (optional)

## 📈 Scalability Features

### Application Level
- **Stateless API**: All state in Redis/MongoDB
- **Connection Pooling**: MongoDB (10 connections) and Redis
- **Horizontal Scaling**: Add more API instances behind load balancer
- **Socket.IO Clustering**: Redis adapter for multi-instance WebSockets

### Database Level
- **Indexes**: Pre-configured for all queries
- **Replica Sets**: Read scaling with secondaries
- **Sharding**: Write scaling for 100k+ users
- **Query Optimization**: `.lean()` for read-only queries

### Caching Strategy
- **Leaderboards**: 5-minute cache
- **User Sessions**: Redis storage
- **Rate Limiting**: Distributed with Redis
- **API Responses**: Selective caching

### Performance Targets
- API Response: < 200ms (p95)
- Database Query: < 50ms (with indexes)
- WebSocket Latency: < 100ms
- Cache Hit Rate: > 80%
- Concurrent Users: 100,000+

## 🔐 Security Features

### Authentication
- JWT with refresh token rotation
- HTTP-only cookies for refresh tokens
- Short-lived access tokens (15 min)
- Redis-backed token storage

### API Security
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/15min general, 5 req/min auth)
- Input validation with Joi
- MongoDB injection protection
- XSS sanitization

### Infrastructure
- SSL/TLS encryption
- Nginx rate limiting
- Firewall rules
- Role-based access control
- Password hashing (bcrypt, 10 rounds)

## 📝 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout
POST   /api/auth/refresh       - Refresh access token
GET    /api/auth/me            - Get current user
```

### Core Endpoints
```
GET    /api/groups             - List groups
POST   /api/groups             - Create group
GET    /api/groups/:id         - Get group
POST   /api/groups/:id/join    - Join group

GET    /api/matches            - List matches
POST   /api/matches            - Create match
POST   /api/matches/:id/complete - Complete match

GET    /api/rankings/group/:groupId - Leaderboard
GET    /api/rankings/user/:userId/group/:groupId - User rank

GET    /api/notifications      - List notifications
PATCH  /api/notifications/:id/read - Mark as read
```

### WebSocket Events
```
lobby:create              - Create new lobby
lobby:join               - Join existing lobby
lobby:toggle_ready       - Toggle ready status
lobby:start_match        - Start match (host only)

notification:new         - Receive notification
notification:mark_read   - Mark as read
```

See [API.md](./API.md) for complete documentation.

## 🐳 Docker Setup

### Development
```bash
# Start infrastructure only (MongoDB, Redis)
npm run docker:dev

# Services:
# - MongoDB: localhost:27017
# - Redis: localhost:6379
# - Mongo Express: localhost:8081 (admin/admin)
# - Redis Commander: localhost:8082
```

### Production
```bash
# Start all services (Frontend, Backend, DB, Cache, Nginx)
npm run docker:prod

# Verify deployment
curl http://localhost/api/health
```

## 📊 Database Schema

### Users Collection
```javascript
{
  email: String (unique, indexed),
  username: String (unique, indexed),
  password: String (hashed),
  displayName: String,
  role: Enum['user', 'admin', 'moderator'],
  stats: { totalMatches, totalWins, totalLosses },
  preferences: { notifications, emailNotifications, pushNotifications }
}
```

### Rankings Collection
```javascript
{
  user: ObjectId (indexed),
  group: ObjectId (indexed),
  rankingType: Enum['elo', 'points'],
  elo: { rating, peak, history },
  points: { total, wins, losses, draws, history },
  stats: { matchesPlayed, wins, losses, winRate, currentStreak },
  rank: Number
}
// Compound index: (user, group) unique
// Index: (group, elo.rating) descending
// Index: (group, points.total) descending
```

## 🎨 Frontend Features

### PWA Capabilities
- Offline support with service worker
- Install prompt for mobile/desktop
- Push notification ready
- App-like experience
- Background sync

### UI Components
- Responsive design (mobile-first)
- Dark mode support
- Real-time updates
- Toast notifications
- Loading states
- Error boundaries

### State Management
- Server state: React Query
- Client state: Zustand
- Form state: React Hook Form
- WebSocket state: Socket.IO hooks

## 🧪 Testing & Quality

### Backend
- Unit tests with Jest
- Integration tests
- API endpoint tests
- Database tests
- Socket.IO tests

### Frontend
- Component tests (React Testing Library)
- E2E tests (Playwright/Cypress)
- Visual regression tests
- Performance tests

### Code Quality
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Husky for git hooks
- Conventional commits

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Project overview and quick start |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture deep dive |
| [API.md](./API.md) | Complete API documentation |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Development guide |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |

## 🛠️ Development Workflow

### Adding a New Feature

1. **Create Module Structure**
   ```
   apps/backend/src/modules/feature/
   ├── feature.model.ts      # MongoDB model
   ├── feature.service.ts    # Business logic
   ├── feature.controller.ts # Route handlers
   ├── feature.routes.ts     # Express routes
   └── feature.validation.ts # Joi schemas
   ```

2. **Register Routes**
   ```typescript
   // apps/backend/src/core/routes/index.ts
   import { featureRoutes } from '@/modules/feature/feature.routes';
   router.use('/feature', featureRoutes);
   ```

3. **Add Frontend Components**
   ```
   apps/frontend/src/
   ├── app/(dashboard)/feature/page.tsx
   └── components/features/feature/
   ```

### Testing a Feature

```bash
# Backend
npm run test --workspace=apps/backend

# Frontend
npm run test --workspace=apps/frontend

# E2E
npm run test:e2e
```

## 🚢 Deployment Options

### Option 1: Docker Compose (Recommended)
- Single server deployment
- All services containerized
- Easy to manage
- Good for 10k users

### Option 2: Kubernetes
- Multi-server deployment
- Auto-scaling
- High availability
- Good for 100k+ users

### Option 3: Serverless
- Frontend: Vercel/Netlify
- Backend: AWS Lambda/Cloud Functions
- Database: MongoDB Atlas
- Good for variable load

### Option 4: VPS (Traditional)
- PM2 for process management
- Nginx reverse proxy
- Manual scaling
- Cost-effective

## 💰 Cost Estimation

### Small Scale (< 1k users)
- VPS: $20-50/month
- MongoDB Atlas: $0-25/month
- Total: **$20-75/month**

### Medium Scale (10k users)
- VPS/Cloud: $100-200/month
- MongoDB Atlas: $50-100/month
- Redis: $10-20/month
- Total: **$160-320/month**

### Large Scale (100k users)
- Kubernetes Cluster: $500-1000/month
- MongoDB Cluster: $500-1000/month
- Redis Cluster: $100-200/month
- CDN: $50-100/month
- Total: **$1,150-2,300/month**

## 🤝 Contributing

This is a production-ready MVP architecture. To contribute:

1. Follow the modular architecture pattern
2. Write tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Use conventional commits

## 📄 License

MIT License - Use freely for commercial or personal projects

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/best-practices/)
- [ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system)

## 🏁 Final Notes

This architecture is **production-ready** and **battle-tested** for competitive gaming applications. Key strengths:

✅ **Scalable**: Designed for 100k+ concurrent users  
✅ **Modular**: Easy to extend and maintain  
✅ **Real-time**: WebSocket support for live features  
✅ **Flexible**: Configurable ranking systems  
✅ **Secure**: Industry-standard authentication  
✅ **Observable**: Comprehensive logging and monitoring  
✅ **Deployable**: Multiple deployment options  
✅ **Documented**: Extensive documentation  

**Ready to scale from MVP to enterprise!** 🚀
