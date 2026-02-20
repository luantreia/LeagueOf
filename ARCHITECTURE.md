# League Of - System Architecture

## Overview

League Of is a production-ready fullstack competitive social gaming platform built with:
- **Frontend**: Next.js 14 (App Router) PWA with TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis for caching, pub/sub, and queuing
- **Real-time**: Socket.IO for WebSocket communications
- **Infrastructure**: Docker, Nginx, PM2

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   Browser    │◄───────►│  Mobile PWA  │                     │
│  │  (Desktop)   │         │    (iOS/      │                     │
│  │              │         │   Android)    │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                         │                              │
│         └─────────────┬───────────┘                              │
│                       │                                          │
│                       │ HTTPS/WSS                                │
│                       ▼                                          │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER / PROXY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Nginx Reverse Proxy                     │ │
│  │  • SSL Termination    • Rate Limiting   • Load Balancing  │ │
│  │  • Static Caching     • Compression     • WebSocket Proxy │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└───────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js    │      │   Next.js    │      │   Next.js    │
│  Frontend    │      │  Frontend    │      │  Frontend    │
│  Instance 1  │      │  Instance 2  │      │  Instance 3  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │ HTTP/WS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Express    │      │   Express    │      │   Express    │ │
│  │   Backend    │◄────►│   Backend    │◄────►│   Backend    │ │
│  │  Instance 1  │      │  Instance 2  │      │  Instance 3  │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                     │                      │          │
│         └─────────────────────┼──────────────────────┘          │
│                               │                                 │
│         ┌─────────────────────┼─────────────────────┐          │
│         │                     │                     │          │
│         ▼                     ▼                     ▼          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │
│  │   Auth      │      │  Rankings   │      │   Lobbies   │   │
│  │   Module    │      │   Module    │      │   Module    │   │
│  └─────────────┘      └─────────────┘      └─────────────┘   │
│                                                                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │
│  │   Users     │      │  Matches    │      │Notifications│   │
│  │   Module    │      │   Module    │      │   Module    │   │
│  └─────────────┘      └─────────────┘      └─────────────┘   │
│                                                                 │
│  ┌─────────────┐      ┌─────────────┐                         │
│  │   Groups    │      │Integrations │                         │
│  │   Module    │      │   Module    │                         │
│  └─────────────┘      └─────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   MongoDB    │      │    Redis     │      │  Socket.IO   │
│   Primary    │◄────►│   Cluster    │◄────►│   Adapter    │
│              │      │              │      │              │
└──────┬───────┘      └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│   MongoDB    │
│  Replica Set │
│  (Secondary) │
└──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     BACKGROUND SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐      ┌────────────────┐                    │
│  │  BullMQ Queue  │      │  Job Workers   │                    │
│  │  • Notifications│      │  • Process jobs│                    │
│  │  • Rankings    │◄────►│  • Send emails │                    │
│  │  • Match Proc. │      │  • Push notif. │                    │
│  └────────────────┘      └────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Riot Games │  │   Steam    │  │  Discord   │               │
│  │    API     │  │    API     │  │  Webhooks  │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │   Sentry   │  │   CDN      │  │   Email    │               │
│  │  (Errors)  │  │ (Assets)   │  │  Service   │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Next.js 14 PWA)

**Technology Stack:**
- Next.js 14 with App Router
- React 18 with Server Components
- TailwindCSS for styling
- Socket.IO client for real-time
- React Query for data fetching
- Zustand for state management

**Key Features:**
- Progressive Web App (offline support)
- Server-side rendering (SSR)
- Static generation where possible
- Optimized bundle splitting
- Image optimization
- Service worker caching

**Directory Structure:**
```
apps/frontend/src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Auth route group
│   ├── (dashboard)/  # Protected routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── ui/           # UI primitives
│   ├── features/     # Feature components
│   └── layouts/      # Layout components
└── lib/              # Utilities
    ├── api/          # API client
    ├── socket/       # Socket.IO setup
    └── hooks/        # Custom hooks
```

### 2. Backend (Express.js)

**Technology Stack:**
- Express.js with TypeScript
- Mongoose ODM for MongoDB
- Socket.IO for WebSockets
- JWT for authentication
- BullMQ for job queuing
- Winston for logging

**Architecture Pattern:** Modular Monolith

**Directory Structure:**
```
apps/backend/src/
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── groups/       # Group management
│   ├── matches/      # Match system
│   ├── rankings/     # Ranking algorithms
│   ├── lobbies/      # Real-time lobbies
│   ├── notifications/# Notification system
│   └── integrations/ # Third-party APIs
├── core/             # Core infrastructure
│   ├── middleware/   # Express middleware
│   ├── database/     # Database connection
│   ├── cache/        # Redis client
│   ├── queue/        # Job queue manager
│   ├── sockets/      # Socket.IO setup
│   └── logging/      # Logger setup
├── shared/           # Shared utilities
│   └── utils/        # Helper functions
└── config/           # Configuration
    └── environment.ts
```

### 3. Data Layer

**MongoDB Collections:**
- `users` - User accounts and profiles
- `groups` - Gaming groups/communities
- `matches` - Match records and results
- `rankings` - User rankings per group
- `notifications` - User notifications
- `sessions` - Refresh tokens (optional)

**Indexes:**
- User: email, username
- Group: owner, members.user
- Match: group, status, teams.players.user
- Ranking: user + group (compound, unique)
- Notification: user + isRead + createdAt

**Redis Keys:**
- `user:refresh_tokens:{userId}` - Refresh tokens
- `user:session:{userId}` - Session data
- `leaderboard:{groupId}:{page}:{limit}` - Cached rankings
- `rate_limit:{ip}` - Rate limiting
- `lobby:{lobbyId}` - Lobby state (optional)

### 4. Real-time System

**Socket.IO Architecture:**
- Namespace: `/` (default)
- Rooms:
  - `user:{userId}` - Personal notifications
  - `lobby:{lobbyId}` - Lobby participants
  - `match:{matchId}` - Match participants

**Event Flow:**
```
Client                    Server                    Redis
  │                         │                         │
  ├─ Connect ──────────────►│                         │
  │                         ├─ Authenticate           │
  │                         ├─ Join rooms             │
  │◄─ Connected ────────────┤                         │
  │                         │                         │
  ├─ lobby:create ─────────►│                         │
  │                         ├─ Create lobby           │
  │                         ├─ Publish ──────────────►│
  │◄─ lobby:created ────────┤                         │
  │                         │◄─ Subscribe ────────────┤
  │                         ├─ Broadcast to room      │
  │◄─ lobby:updated ────────┤                         │
```

### 5. Ranking System

**ELO Algorithm:**
```
Expected Score = 1 / (1 + 10^((OpponentRating - PlayerRating) / 400))
Rating Change = K * (Actual Score - Expected Score)
New Rating = Old Rating + Rating Change
```

**Configuration Options:**
- K-Factor: 10-64 (rating volatility)
- Initial Rating: 0-3000
- Min/Max Rating: Configurable bounds

**Points System:**
- Win: +3 points (default)
- Loss: -1 point (default)
- Draw: +1 point (default)
- Bonus: Kills, deaths, assists (optional)

### 6. Integration Framework

**Adapter Pattern:**
```typescript
interface IIntegrationAdapter {
  name: string;
  isEnabled: boolean;
  initialize(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

**Supported Integrations:**
- Riot Games API (League of Legends, Valorant)
- Steam API (player profiles, games)
- Discord Webhooks (notifications)
- Custom APIs (extensible)

**Feature Flags:**
```env
ENABLE_THIRD_PARTY_INTEGRATIONS=true
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=true
```

## Data Flow

### 1. Authentication Flow

```
User → Frontend → API (/auth/login)
                    ↓
              Validate credentials
                    ↓
              Generate tokens
                    ↓
            ┌───────┴────────┐
            ▼                ▼
       Access Token    Refresh Token
       (15 minutes)     (7 days)
            │                │
            ├────────────────┤
            ▼                ▼
       Store in         Store in
       localStorage     httpOnly cookie
                         & Redis
```

### 2. Match Completion Flow

```
Client                Backend              Database           Queue
  │                      │                    │                │
  ├─ Complete Match ────►│                    │                │
  │                      ├─ Validate          │                │
  │                      ├─ Update ──────────►│                │
  │                      │                    │                │
  │                      ├─ Calculate Rankings│                │
  │                      ├─ Update ──────────►│                │
  │                      │                    │                │
  │                      ├─ Queue Job ────────┼───────────────►│
  │                      │                    │    (Process    │
  │                      │                    │   Notifications)│
  │◄─ Success ───────────┤                    │                │
  │                      │                    │                │
  │                      │◄─ Job Complete ────┼────────────────┤
  │                      ├─ Send Notification │                │
  │◄─ notification:new ──┤  (Socket.IO)       │                │
```

### 3. Lobby Matchmaking Flow

```
Player A         Player B         Server          Redis
  │                │                │               │
  ├─ Create Lobby ────────────────►│               │
  │                │                ├─ Store ──────►│
  │◄─ Lobby Created ────────────────┤               │
  │                │                │               │
  │                ├─ Join Lobby ───►│               │
  │                │                ├─ Update ─────►│
  │◄─ Player Joined ────────────────┤               │
  │◄───────────────┼────────────────┤               │
  │                │                │               │
  ├─ Ready ────────┼───────────────►│               │
  │                ├─ Ready ────────►│               │
  │                │                ├─ Check All    │
  │                │                ├─ Auto Shuffle │
  │◄─ Teams Shuffled ───────────────┤               │
  │◄───────────────┼────────────────┤               │
  │                │                │               │
  │                │                ├─ Start Match  │
  │◄─ Match Started ────────────────┤               │
  │◄───────────────┼────────────────┤               │
```

## Scalability Architecture

### Horizontal Scaling

**Stateless API Servers:**
- No local state storage
- All sessions in Redis
- Load balanced by Nginx

**Socket.IO Clustering:**
```javascript
// Redis adapter for multi-instance Socket.IO
io.adapter(createAdapter(
  redisClient.getPublisher(),
  redisClient.getSubscriber()
));
```

**Database Scaling:**
- MongoDB Replica Set for read scaling
- Sharding for write scaling (100k+ users)
- Connection pooling (10 connections/instance)

**Cache Strategy:**
- Leaderboards cached for 5 minutes
- User sessions in Redis
- Frequently accessed data cached
- Cache invalidation on writes

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 200ms | Optimized |
| Database Query | < 50ms | Indexed |
| WebSocket Latency | < 100ms | Direct |
| Cache Hit Rate | > 80% | Configured |
| Concurrent Users | 100k+ | Scalable |

## Security Architecture

### Authentication & Authorization

**JWT Strategy:**
- Access Token: 15 minutes (short-lived)
- Refresh Token: 7 days (rotated)
- HTTP-only cookies for refresh tokens
- Token blacklisting not needed (short TTL)

**Password Security:**
- Bcrypt hashing (10 rounds)
- Minimum 6 characters (configurable)
- No plaintext storage

**Rate Limiting:**
- General API: 100 req/15min
- Auth endpoints: 5 req/min
- Per-IP and per-user limits
- Redis-backed (distributed)

### Data Security

**Input Validation:**
- Joi schema validation
- MongoDB injection protection
- XSS sanitization
- CORS configuration

**API Security:**
- Helmet.js security headers
- HTTPS enforced in production
- CSRF protection (cookies)
- SQL injection N/A (NoSQL)

### Infrastructure Security

**Network:**
- Firewall rules (UFW)
- SSL/TLS encryption
- Nginx rate limiting
- DDoS protection (CloudFlare)

**Access Control:**
- Role-based permissions
- Group membership validation
- Resource ownership checks

## Monitoring & Observability

### Application Monitoring

**Metrics:**
- Request rate
- Response time (p50, p95, p99)
- Error rate
- CPU/Memory usage
- Database query time
- Cache hit rate
- WebSocket connection count

**Logging:**
- Winston structured logging
- Daily rotating files
- Log levels: error, warn, info, debug
- Sentry error tracking (optional)

**Health Checks:**
```
GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 86400
}
```

### Database Monitoring

- Query performance
- Index usage
- Connection pool stats
- Replication lag
- Disk usage

### Alerts

- High error rate (> 5%)
- Slow response time (> 1s)
- High memory usage (> 80%)
- Database connection issues
- Redis connection issues

## Deployment Architecture

### Development
```
Local Machine
  ├─ Docker Compose (MongoDB, Redis)
  ├─ npm run dev:backend (Port 4000)
  └─ npm run dev:frontend (Port 3000)
```

### Staging/Production
```
Load Balancer (Nginx)
  ├─ Frontend Instances (PM2 Cluster)
  ├─ Backend Instances (PM2 Cluster)
  ├─ MongoDB Replica Set
  ├─ Redis Cluster
  └─ Background Workers (BullMQ)
```

## Technology Decisions

### Why MongoDB?
- Flexible schema for evolving features
- Excellent indexing for rankings
- Horizontal scaling with sharding
- Good performance for document queries
- Rich aggregation pipeline

### Why Redis?
- Fast in-memory cache
- Pub/sub for WebSocket scaling
- Job queue backend
- Session storage
- Rate limiting

### Why Socket.IO?
- Real-time bidirectional communication
- Automatic reconnection
- Room-based broadcasting
- Redis adapter for scaling
- Fallback to polling

### Why Next.js?
- Server-side rendering
- Built-in PWA support
- Excellent DX
- Image optimization
- API routes (not used here)

## Future Enhancements

1. **Microservices Migration**
   - Extract ranking service
   - Separate notification service
   - API Gateway pattern

2. **Advanced Features**
   - ML-based matchmaking
   - Player behavior analysis
   - Automated tournament generation
   - Video replay system

3. **Performance**
   - GraphQL API
   - Edge caching (CDN)
   - Database read replicas
   - Vertical sharding

4. **Integrations**
   - More gaming platforms
   - Twitch integration
   - Mobile native apps
   - Voice chat integration
