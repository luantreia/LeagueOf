# League Of - API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "Display Name"
}
```

**Response 201**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user-id",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "role": "user"
    },
    "accessToken": "jwt-token"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

## Groups

### List Groups
```http
GET /api/groups
Authorization: Bearer {token}
```

### Get Group
```http
GET /api/groups/:id
Authorization: Bearer {token}
```

### Create Group
```http
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Gaming Group",
  "description": "Competitive gaming group",
  "gameType": "League of Legends",
  "settings": {
    "isPublic": true,
    "maxMembers": 100,
    "requireApproval": false
  },
  "rankingConfig": {
    "type": "elo",
    "eloSettings": {
      "kFactor": 32,
      "initialRating": 1200,
      "minRating": 0,
      "maxRating": 3000
    }
  }
}
```

### Join Group
```http
POST /api/groups/:id/join
Authorization: Bearer {token}
```

### Leave Group
```http
POST /api/groups/:id/leave
Authorization: Bearer {token}
```

## Rankings

### Get Leaderboard
```http
GET /api/rankings/group/:groupId?page=1&limit=50
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "rankings": [
    {
      "_id": "ranking-id",
      "user": {
        "username": "player1",
        "displayName": "Player One",
        "avatar": "url"
      },
      "elo": {
        "rating": 1450,
        "peak": 1500
      },
      "stats": {
        "matchesPlayed": 50,
        "wins": 30,
        "losses": 20,
        "winRate": 60
      },
      "rank": 1
    }
  ],
  "total": 150
}
```

### Get User Ranking
```http
GET /api/rankings/user/:userId/group/:groupId
Authorization: Bearer {token}
```

## Matches

### List Matches
```http
GET /api/matches?groupId=group-id&status=completed
Authorization: Bearer {token}
```

### Get Match
```http
GET /api/matches/:id
Authorization: Bearer {token}
```

### Create Match
```http
POST /api/matches
Authorization: Bearer {token}
Content-Type: application/json

{
  "group": "group-id",
  "name": "Finals Match",
  "gameType": "5v5",
  "teams": [
    {
      "name": "Team A",
      "players": [
        { "user": "user-id-1" },
        { "user": "user-id-2" }
      ]
    },
    {
      "name": "Team B",
      "players": [
        { "user": "user-id-3" },
        { "user": "user-id-4" }
      ]
    }
  ],
  "isRanked": true
}
```

### Complete Match
```http
POST /api/matches/:id/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "winner": 0,
  "teams": [
    {
      "score": 25,
      "players": [
        {
          "user": "user-id-1",
          "stats": {
            "kills": 15,
            "deaths": 5,
            "assists": 10
          }
        }
      ]
    }
  ]
}
```

## Notifications

### Get Notifications
```http
GET /api/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "notifications": [
    {
      "_id": "notification-id",
      "type": "match",
      "title": "Match Starting",
      "message": "Your match is about to start",
      "priority": "high",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "unread": 5
}
```

### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer {token}
```

### Mark All as Read
```http
POST /api/notifications/mark-all-read
Authorization: Bearer {token}
```

### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer {token}
```

## WebSocket Events

### Connection
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:4000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected');
});
```

### Lobby Events

**Create Lobby**
```javascript
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

socket.on('lobby:created', (data) => {
  console.log('Lobby created:', data.lobby);
});
```

**Join Lobby**
```javascript
socket.emit('lobby:join', {
  lobbyId: 'lobby-id',
  username: 'Player Name'
});

socket.on('lobby:joined', (data) => {
  console.log('Joined lobby:', data.lobby);
});
```

**Toggle Ready**
```javascript
socket.emit('lobby:toggle_ready', {
  lobbyId: 'lobby-id'
});

socket.on('lobby:updated', (data) => {
  console.log('Lobby updated:', data.lobby);
});
```

**Start Match**
```javascript
socket.emit('lobby:start_match', {
  lobbyId: 'lobby-id'
});

socket.on('lobby:match_starting', (data) => {
  console.log('Match starting in', data.countdown, 'seconds');
});

socket.on('lobby:match_started', (data) => {
  console.log('Match started:', data.lobby);
});
```

### Notification Events

**Get Unread Count**
```javascript
socket.emit('notification:get_unread_count');

socket.on('notification:unread_count', (data) => {
  console.log('Unread notifications:', data.count);
});
```

**Receive Notification**
```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

**Mark as Read**
```javascript
socket.emit('notification:mark_read', {
  notificationId: 'notification-id'
});
```

## Error Responses

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [] // Optional detailed errors
}
```

**Common Status Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per minute
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Pagination

All list endpoints support pagination:

```http
GET /api/resource?page=1&limit=20
```

Response includes:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Third-Party Integrations

### Riot Games API
```http
GET /api/integrations/riot/summoner/:region/:name
Authorization: Bearer {token}
```

### Steam API
```http
GET /api/integrations/steam/player/:steamId
Authorization: Bearer {token}
```

### Integration Health Check
```http
GET /api/integrations/health
Authorization: Bearer {token}
```

## Postman Collection

Import the Postman collection for easy testing:
[Download Collection](./postman/leagueof-collection.json)
