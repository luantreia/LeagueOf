# League Of - Development Guide

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm 9+

## Quick Start

```bash
# Run automated setup
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Start development
npm run dev
```

## Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your configuration

# Frontend  
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit apps/frontend/.env.local with your configuration
```

### 3. Start Infrastructure

```bash
# Start MongoDB and Redis
npm run docker:dev

# Services will be available at:
# - MongoDB: localhost:27017
# - Redis: localhost:6379
# - Mongo Express: http://localhost:8081 (admin/admin)
# - Redis Commander: http://localhost:8082
```

### 4. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend    # Backend on :4000
npm run dev:frontend   # Frontend on :3000
```

## Project Structure

```
LeagueOf/
├── apps/
│   ├── backend/              # Express API
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules
│   │   │   │   ├── auth/     # Authentication
│   │   │   │   ├── users/    # User management
│   │   │   │   ├── groups/   # Group management
│   │   │   │   ├── matches/  # Match system
│   │   │   │   ├── rankings/ # Ranking algorithms
│   │   │   │   ├── lobbies/  # Real-time lobbies
│   │   │   │   ├── notifications/ # Notification system
│   │   │   │   └── integrations/  # Third-party APIs
│   │   │   ├── core/         # Core infrastructure
│   │   │   │   ├── middleware/
│   │   │   │   ├── database/
│   │   │   │   ├── cache/
│   │   │   │   ├── queue/
│   │   │   │   └── sockets/
│   │   │   ├── shared/       # Utilities
│   │   │   └── config/       # Configuration
│   │   └── Dockerfile
│   └── frontend/             # Next.js PWA
│       ├── src/
│       │   ├── app/          # App router
│       │   ├── components/   # React components
│       │   └── lib/          # Utilities
│       └── Dockerfile
├── packages/
│   └── shared/               # Shared types
└── docker-compose.yml        # Production setup
```

## Development Workflows

### Adding a New Module

1. Create module directory in `apps/backend/src/modules/`
2. Implement: model, service, controller, routes, validation
3. Register routes in `apps/backend/src/core/routes/index.ts`

### Working with Rankings

```typescript
// ELO Configuration
{
  rankingType: 'elo',
  eloSettings: {
    kFactor: 32,        // Rating change sensitivity
    initialRating: 1200, // Starting rating
    minRating: 0,
    maxRating: 3000
  }
}

// Points Configuration
{
  rankingType: 'points',
  pointsSettings: {
    winPoints: 3,
    lossPoints: -1,
    drawPoints: 1,
    killPoints: 1,      // Optional
    deathPoints: -1,    // Optional
    assistPoints: 0.5   // Optional
  }
}
```

### Real-time Features

```typescript
// Client-side Socket.IO usage
import { useSocket } from '@/lib/socket/socket-provider';

function MyComponent() {
  const { socket, isConnected } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Join lobby
    socket.emit('lobby:create', {
      groupId: 'group-id',
      name: 'My Lobby',
      maxPlayers: 10,
      gameMode: '5v5',
      settings: {
        autoShuffle: true,
        teamSize: 5,
        numberOfTeams: 2
      }
    });
    
    // Listen for events
    socket.on('lobby:created', (data) => {
      console.log('Lobby created:', data);
    });
    
    return () => {
      socket.off('lobby:created');
    };
  }, [socket]);
}
```

### Database Queries

```typescript
// Efficient leaderboard query
const rankings = await Ranking.find({ group: groupId, isActive: true })
  .sort({ 'elo.rating': -1 })
  .limit(50)
  .populate('user', 'username displayName avatar')
  .lean();

// Match with players
const match = await Match.findById(matchId)
  .populate('teams.players.user', 'username displayName')
  .populate('group');
```

## Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test --workspace=apps/backend

# Frontend tests only
npm run test --workspace=apps/frontend

# Watch mode
npm run test:watch
```

## Building for Production

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:backend
npm run build:frontend
```

## Docker Development

```bash
# Start dev services
npm run docker:dev

# Stop services
npm run docker:down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart service
docker-compose -f docker-compose.dev.yml restart mongodb
```

## Common Tasks

### Reset Database

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Check API Health

```bash
curl http://localhost:4000/api/health
```

### View Backend Logs

```bash
# Development
npm run dev:backend

# Production
pm2 logs leagueof-backend
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000
kill -9 <PID>
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

### Module Resolution

If you encounter module resolution errors:

```bash
# Clear caches
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install
```

## Performance Tips

1. **Database Indexing**: Indexes are pre-configured in models
2. **Redis Caching**: Leaderboards cached for 5 minutes
3. **Query Optimization**: Use `.lean()` for read-only queries
4. **Socket Rooms**: Join specific rooms to reduce broadcasts

## Security Notes

- Never commit `.env` files
- Rotate JWT secrets regularly
- Use strong passwords for production
- Enable rate limiting in production
- Configure CORS properly
- Use HTTPS in production

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/best-practices/)
- [Redis Documentation](https://redis.io/documentation)
