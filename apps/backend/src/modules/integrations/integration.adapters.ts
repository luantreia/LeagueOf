import axios, { AxiosInstance } from 'axios';
import { config } from '@/config/environment';
import { logger } from '@/core/logging/logger';
import { AppError } from '@/shared/utils/app-error';

/**
 * Base adapter interface for third-party integrations
 */
export interface IIntegrationAdapter {
  name: string;
  isEnabled: boolean;
  initialize(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

/**
 * Base adapter class with common functionality
 */
export abstract class BaseIntegrationAdapter implements IIntegrationAdapter {
  abstract name: string;
  abstract isEnabled: boolean;
  protected client?: AxiosInstance;

  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      logger.info(`${this.name} integration is disabled`);
      return;
    }

    logger.info(`Initializing ${this.name} integration...`);
  }

  async healthCheck(): Promise<boolean> {
    return this.isEnabled;
  }

  protected createClient(baseURL: string, headers: any = {}): AxiosInstance {
    return axios.create({
      baseURL,
      headers,
      timeout: 10000,
    });
  }
}

/**
 * Riot Games API Adapter
 */
export class RiotGamesAdapter extends BaseIntegrationAdapter {
  name = 'Riot Games API';
  isEnabled = config.features.thirdPartyIntegrations && !!config.thirdParty.riotApiKey;

  async initialize(): Promise<void> {
    await super.initialize();
    
    if (this.isEnabled) {
      this.client = this.createClient('https://americas.api.riotgames.com', {
        'X-Riot-Token': config.thirdParty.riotApiKey,
      });
    }
  }

  async getSummonerByName(region: string, summonerName: string): Promise<any> {
    if (!this.isEnabled || !this.client) {
      throw new AppError('Riot Games integration not available', 503);
    }

    try {
      const response = await this.client.get(
        `/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          baseURL: `https://${region}.api.riotgames.com`,
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Riot API error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch summoner data', 500);
    }
  }

  async getMatchHistory(_region: string, puuid: string, count: number = 20): Promise<any> {
    if (!this.isEnabled || !this.client) {
      throw new AppError('Riot Games integration not available', 503);
    }

    try {
      const response = await this.client.get(
        `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        {
          params: { count },
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Riot API error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch match history', 500);
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      await this.client?.get('/lol/status/v4/platform-data', {
        baseURL: 'https://na1.api.riotgames.com',
      });
      return true;
    } catch (error) {
      logger.error('Riot API health check failed:', error);
      return false;
    }
  }
}

/**
 * Steam API Adapter
 */
export class SteamAdapter extends BaseIntegrationAdapter {
  name = 'Steam API';
  isEnabled = config.features.thirdPartyIntegrations && !!config.thirdParty.steamApiKey;

  async initialize(): Promise<void> {
    await super.initialize();
    
    if (this.isEnabled) {
      this.client = this.createClient('https://api.steampowered.com');
    }
  }

  async getPlayerSummaries(steamIds: string[]): Promise<any> {
    if (!this.isEnabled || !this.client) {
      throw new AppError('Steam integration not available', 503);
    }

    try {
      const response = await this.client.get('/ISteamUser/GetPlayerSummaries/v0002/', {
        params: {
          key: config.thirdParty.steamApiKey,
          steamids: steamIds.join(','),
        },
      });
      return response.data.response.players;
    } catch (error: any) {
      logger.error('Steam API error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch player data', 500);
    }
  }

  async getOwnedGames(steamId: string): Promise<any> {
    if (!this.isEnabled || !this.client) {
      throw new AppError('Steam integration not available', 503);
    }

    try {
      const response = await this.client.get('/IPlayerService/GetOwnedGames/v0001/', {
        params: {
          key: config.thirdParty.steamApiKey,
          steamid: steamId,
          include_appinfo: true,
          include_played_free_games: true,
        },
      });
      return response.data.response.games;
    } catch (error: any) {
      logger.error('Steam API error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch games data', 500);
    }
  }
}

/**
 * Discord Webhook Adapter
 */
export class DiscordAdapter extends BaseIntegrationAdapter {
  name = 'Discord Webhook';
  isEnabled = config.features.thirdPartyIntegrations && !!config.thirdParty.discordWebhook;

  async initialize(): Promise<void> {
    await super.initialize();
    
    if (this.isEnabled) {
      this.client = this.createClient(config.thirdParty.discordWebhook!);
    }
  }

  async sendMessage(content: string, embeds?: any[]): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Discord integration not available');
      return;
    }

    try {
      await this.client.post('', {
        content,
        embeds,
      });
    } catch (error: any) {
      logger.error('Discord webhook error:', error.response?.data || error.message);
    }
  }

  async sendMatchNotification(matchData: any): Promise<void> {
    const embed = {
      title: '🎮 Match Completed',
      description: `Match "${matchData.name}" has been completed!`,
      color: 0x00ff00,
      fields: [
        {
          name: 'Winner',
          value: matchData.winner || 'Draw',
          inline: true,
        },
        {
          name: 'Duration',
          value: `${Math.floor(matchData.duration / 60)} minutes`,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await this.sendMessage('', [embed]);
  }
}

/**
 * Integration Manager
 */
export class IntegrationManager {
  private static instance: IntegrationManager;
  private adapters: Map<string, IIntegrationAdapter>;

  private constructor() {
    this.adapters = new Map();
  }

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing integrations...');

    // Register adapters
    this.registerAdapter('riot', new RiotGamesAdapter());
    this.registerAdapter('steam', new SteamAdapter());
    this.registerAdapter('discord', new DiscordAdapter());

    // Initialize all adapters
    await Promise.all(
      Array.from(this.adapters.values()).map(adapter => adapter.initialize())
    );

    logger.info('Integrations initialized');
  }

  registerAdapter(key: string, adapter: IIntegrationAdapter): void {
    this.adapters.set(key, adapter);
  }

  getAdapter<T extends IIntegrationAdapter>(key: string): T | undefined {
    return this.adapters.get(key) as T | undefined;
  }

  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    await Promise.all(
      Array.from(this.adapters.entries()).map(async ([key, adapter]) => {
        results[key] = await adapter.healthCheck();
      })
    );

    return results;
  }
}
