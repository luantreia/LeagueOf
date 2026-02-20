import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '@/modules/users/user.model';
import { RedisClient } from '@/core/cache/redis';
import { config } from '@/config/environment';
import { AppError } from '@/shared/utils/app-error';
import { logger } from '@/core/logging/logger';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  private redis = RedisClient.getInstance();

  async register(userData: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create user
    const user = await User.create(userData);

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user._id, refreshToken);

    logger.info(`User registered: ${user._id}`);

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user
    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user._id, refreshToken);

    logger.info(`User logged in: ${user._id}`);

    // Remove password from response
    user.password = undefined as any;

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      // Check if refresh token is stored
      const isValid = await this.verifyRefreshToken(decoded.id, refreshToken);

      if (!isValid) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Find user
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new AppError('User not found', 404);
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Store new refresh token and remove old one
      await this.rotateRefreshToken(user._id, refreshToken, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.removeRefreshToken(userId, refreshToken);
    await this.redis.del(`user:session:${userId}`);
    logger.info(`User logged out: ${userId}`);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.redis.del(`user:refresh_tokens:${userId}`);
    await this.redis.del(`user:session:${userId}`);
    
    await User.findByIdAndUpdate(userId, { refreshTokens: [] });
    
    logger.info(`All sessions terminated for user: ${userId}`);
  }

  private generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.accessTokenExpiration as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret as jwt.Secret, {
      expiresIn: config.jwt.refreshTokenExpiration as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string | mongoose.Types.ObjectId,
    refreshToken: string
  ): Promise<void> {
    const key = `user:refresh_tokens:${userId}`;
    
    // Get existing tokens
    const tokens = await this.redis.get<string[]>(key) || [];
    
    // Add new token (keep max 5 tokens per user)
    tokens.push(refreshToken);
    if (tokens.length > 5) {
      tokens.shift();
    }
    
    // Store with 7 days expiration
    await this.redis.set(key, tokens, 7 * 24 * 60 * 60);

    // Also store in database as backup
    await User.findByIdAndUpdate(userId, {
      $addToSet: { refreshTokens: refreshToken },
    });
  }

  private async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const key = `user:refresh_tokens:${userId}`;
    const tokens = await this.redis.get<string[]>(key);
    
    if (tokens && tokens.includes(refreshToken)) {
      return true;
    }
    
    // Fallback to database
    const user = await User.findById(userId);
    return user?.refreshTokens?.includes(refreshToken) || false;
  }

  private async removeRefreshToken(
    userId: string | mongoose.Types.ObjectId,
    refreshToken: string
  ): Promise<void> {
    const key = `user:refresh_tokens:${userId}`;
    const tokens = await this.redis.get<string[]>(key) || [];
    
    const filtered = tokens.filter((t) => t !== refreshToken);
    await this.redis.set(key, filtered, 7 * 24 * 60 * 60);

    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
  }

  private async rotateRefreshToken(
    userId: string | mongoose.Types.ObjectId,
    oldToken: string,
    newToken: string
  ): Promise<void> {
    await this.removeRefreshToken(userId, oldToken);
    await this.storeRefreshToken(userId, newToken);
  }

  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
