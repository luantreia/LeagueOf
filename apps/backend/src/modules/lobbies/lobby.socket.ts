import { Server, Socket } from 'socket.io';
import { RedisClient } from '@/core/cache/redis';
import { logger } from '@/core/logging/logger';
import { v4 as uuidv4 } from 'uuid';

interface LobbyPlayer {
  userId: string;
  username: string;
  socketId: string;
  isReady: boolean;
  joinedAt: Date;
}

interface Lobby {
  id: string;
  groupId: string;
  name: string;
  hostId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  gameMode: string;
  status: 'waiting' | 'ready' | 'starting' | 'in_progress';
  settings: {
    autoShuffle: boolean;
    teamSize: number;
    numberOfTeams: number;
  };
  createdAt: Date;
}

export class LobbySocketHandler {
  private static lobbies = new Map<string, Lobby>();
  private static redis = RedisClient.getInstance();

  static handleConnection(io: Server, socket: Socket & { userId?: string }): void {
    // Create lobby
    socket.on('lobby:create', async (data: {
      groupId: string;
      name: string;
      maxPlayers: number;
      gameMode: string;
      settings: any;
    }) => {
      try {
        const lobbyId = uuidv4();
        const lobby: Lobby = {
          id: lobbyId,
          groupId: data.groupId,
          name: data.name,
          hostId: socket.userId!,
          players: [{
            userId: socket.userId!,
            username: data.name, // Should come from user object
            socketId: socket.id,
            isReady: true,
            joinedAt: new Date(),
          }],
          maxPlayers: data.maxPlayers,
          gameMode: data.gameMode,
          status: 'waiting',
          settings: data.settings,
          createdAt: new Date(),
        };

        this.lobbies.set(lobbyId, lobby);
        socket.join(`lobby:${lobbyId}`);

        // Publish lobby creation
        await this.redis.publish('lobby:created', { lobby });

        socket.emit('lobby:created', { lobby });
        logger.info(`Lobby created: ${lobbyId} by ${socket.userId}`);
      } catch (error) {
        logger.error('Error creating lobby:', error);
        socket.emit('lobby:error', { message: 'Failed to create lobby' });
      }
    });

    // Join lobby
    socket.on('lobby:join', async (data: { lobbyId: string; username: string }) => {
      try {
        const lobby = this.lobbies.get(data.lobbyId);
        
        if (!lobby) {
          socket.emit('lobby:error', { message: 'Lobby not found' });
          return;
        }

        if (lobby.players.length >= lobby.maxPlayers) {
          socket.emit('lobby:error', { message: 'Lobby is full' });
          return;
        }

        if (lobby.players.find(p => p.userId === socket.userId)) {
          socket.emit('lobby:error', { message: 'Already in lobby' });
          return;
        }

        const player: LobbyPlayer = {
          userId: socket.userId!,
          username: data.username,
          socketId: socket.id,
          isReady: false,
          joinedAt: new Date(),
        };

        lobby.players.push(player);
        socket.join(`lobby:${data.lobbyId}`);

        io.to(`lobby:${data.lobbyId}`).emit('lobby:player_joined', {
          lobby,
          player,
        });

        socket.emit('lobby:joined', { lobby });
        logger.info(`Player ${socket.userId} joined lobby ${data.lobbyId}`);
      } catch (error) {
        logger.error('Error joining lobby:', error);
        socket.emit('lobby:error', { message: 'Failed to join lobby' });
      }
    });

    // Leave lobby
    socket.on('lobby:leave', async (data: { lobbyId: string }) => {
      await this.handlePlayerLeave(io, socket, data.lobbyId);
    });

    // Toggle ready
    socket.on('lobby:toggle_ready', async (data: { lobbyId: string }) => {
      try {
        const lobby = this.lobbies.get(data.lobbyId);
        
        if (!lobby) {
          socket.emit('lobby:error', { message: 'Lobby not found' });
          return;
        }

        const player = lobby.players.find(p => p.userId === socket.userId);
        if (!player) {
          socket.emit('lobby:error', { message: 'Not in lobby' });
          return;
        }

        player.isReady = !player.isReady;

        io.to(`lobby:${data.lobbyId}`).emit('lobby:updated', { lobby });

        // Check if all ready
        const allReady = lobby.players.every(p => p.isReady);
        if (allReady && lobby.players.length >= 2) {
          lobby.status = 'ready';
          io.to(`lobby:${data.lobbyId}`).emit('lobby:all_ready', { lobby });
        }
      } catch (error) {
        logger.error('Error toggling ready:', error);
        socket.emit('lobby:error', { message: 'Failed to toggle ready' });
      }
    });

    // Start match
    socket.on('lobby:start_match', async (data: { lobbyId: string }) => {
      try {
        const lobby = this.lobbies.get(data.lobbyId);
        
        if (!lobby) {
          socket.emit('lobby:error', { message: 'Lobby not found' });
          return;
        }

        if (lobby.hostId !== socket.userId) {
          socket.emit('lobby:error', { message: 'Only host can start match' });
          return;
        }

        if (lobby.status !== 'ready') {
          socket.emit('lobby:error', { message: 'Not all players ready' });
          return;
        }

        lobby.status = 'starting';

        // Auto shuffle teams if enabled
        if (lobby.settings.autoShuffle) {
          const shuffled = this.shuffleTeams(
            lobby.players,
            lobby.settings.numberOfTeams,
            lobby.settings.teamSize
          );

          io.to(`lobby:${data.lobbyId}`).emit('lobby:teams_shuffled', {
            teams: shuffled,
          });
        }

        // Emit match starting event
        io.to(`lobby:${data.lobbyId}`).emit('lobby:match_starting', {
          lobby,
          countdown: 5,
        });

        // After countdown, start match
        setTimeout(() => {
          lobby.status = 'in_progress';
          io.to(`lobby:${data.lobbyId}`).emit('lobby:match_started', { lobby });
          
          // Here you would create the actual match in the database
          // and transition players to the match view
        }, 5000);

        logger.info(`Match starting in lobby ${data.lobbyId}`);
      } catch (error) {
        logger.error('Error starting match:', error);
        socket.emit('lobby:error', { message: 'Failed to start match' });
      }
    });

    // List lobbies
    socket.on('lobby:list', async (data: { groupId?: string }) => {
      try {
        const lobbies = Array.from(this.lobbies.values())
          .filter(lobby => 
            lobby.status === 'waiting' &&
            (!data.groupId || lobby.groupId === data.groupId)
          );

        socket.emit('lobby:list', { lobbies });
      } catch (error) {
        logger.error('Error listing lobbies:', error);
        socket.emit('lobby:error', { message: 'Failed to list lobbies' });
      }
    });
  }

  static handleDisconnection(io: Server, socket: Socket & { userId?: string }): void {
    // Find and remove player from any lobby
    for (const [lobbyId, lobby] of this.lobbies.entries()) {
      const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        this.handlePlayerLeave(io, socket, lobbyId);
        break;
      }
    }
  }

  private static async handlePlayerLeave(
    io: Server,
    socket: Socket & { userId?: string },
    lobbyId: string
  ): Promise<void> {
    try {
      const lobby = this.lobbies.get(lobbyId);
      
      if (!lobby) {
        return;
      }

      const playerIndex = lobby.players.findIndex(p => p.userId === socket.userId);
      
      if (playerIndex === -1) {
        return;
      }

      const leavingPlayer = lobby.players[playerIndex];
      lobby.players.splice(playerIndex, 1);

      socket.leave(`lobby:${lobbyId}`);

      // If host left, assign new host or close lobby
      if (lobby.hostId === socket.userId) {
        if (lobby.players.length > 0) {
          lobby.hostId = lobby.players[0].userId;
          lobby.players[0].isReady = true;
        } else {
          this.lobbies.delete(lobbyId);
          await this.redis.publish('lobby:closed', { lobbyId });
          logger.info(`Lobby closed: ${lobbyId}`);
          return;
        }
      }

      io.to(`lobby:${lobbyId}`).emit('lobby:player_left', {
        lobby,
        player: leavingPlayer,
      });

      socket.emit('lobby:left', { lobbyId });
      logger.info(`Player ${socket.userId} left lobby ${lobbyId}`);
    } catch (error) {
      logger.error('Error handling player leave:', error);
    }
  }

  /**
   * Fisher-Yates shuffle algorithm for fair team distribution
   */
  private static shuffleTeams(
    players: LobbyPlayer[],
    numberOfTeams: number,
    teamSize: number
  ): LobbyPlayer[][] {
    const shuffled = [...players];
    
    // Shuffle array
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Distribute to teams
    const teams: LobbyPlayer[][] = Array.from({ length: numberOfTeams }, () => []);
    
    shuffled.forEach((player, index) => {
      const teamIndex = index % numberOfTeams;
      if (teams[teamIndex].length < teamSize) {
        teams[teamIndex].push(player);
      }
    });

    return teams;
  }
}
