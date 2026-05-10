import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User, IUser } from '@/modules/users/user.model';
import { RedisClient } from '@/core/cache/redis';
import { config } from '@/config/environment';
import { AppError } from '@/shared/utils/app-error';
import { logger } from '@/core/logging/logger';
import { Mailer } from '@/core/email/mailer';
import { GuestService } from '@/modules/guests/guest.service';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  private redis = RedisClient.getInstance();
  private mailer = new Mailer();
  private guestService = new GuestService();

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

  async requestPasswordReset(email: string): Promise<void> {
    if (config.env === 'production' && !this.mailer.isConfigured()) {
      logger.error('Password reset requested but email delivery is not configured');
      throw new AppError('El servicio de email no esta configurado', 503);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, isActive: true }).select(
      '+passwordResetTokenHash +passwordResetExpiresAt'
    );

    if (!user) {
      logger.info(`Password reset requested for unknown email: ${normalizedEmail}`);
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    const resetUrl = `${config.app.frontendUrl.replace(/\/$/, '')}/auth/reset-password?token=${rawToken}`;

    await this.mailer.send({
      to: user.email,
      subject: 'Restablece tu contrasena de League Of',
      text: `Usa este link para restablecer tu contrasena. Expira en 1 hora: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h1>Restablecer contrasena</h1>
          <p>Recibimos una solicitud para restablecer tu contrasena de League Of.</p>
          <p>Este enlace expira en 1 hora y solo puede usarse una vez.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">
              Crear nueva contrasena
            </a>
          </p>
          <p>Si no pediste este cambio, ignora este correo.</p>
        </div>
      `,
    });

    logger.info(`Password reset email queued for user: ${user._id}`);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = this.hashPasswordResetToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      isActive: true,
    }).select('+password +passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) {
      throw new AppError('El enlace de recuperacion es invalido o expiro', 400);
    }

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokens = [];
    await user.save();

    await this.redis.del(`user:refresh_tokens:${user._id}`);
    await this.redis.del(`user:session:${user._id}`);

    logger.info(`Password reset completed for user: ${user._id}`);
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

  private hashPasswordResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
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

  async checkForGuests(email?: string, phone?: string): Promise<{ hasGuests: boolean; guestCount: number }> {
    const guests = await this.guestService.findGuestsByEmailOrPhone(email, phone);
    return {
      hasGuests: guests.length > 0,
      guestCount: guests.length,
    };
  }

  async sendGuestVerificationCode(email?: string, phone?: string): Promise<{ code: string; guestIds: string[] }> {
    if (config.env === 'production' && !this.mailer.isConfigured()) {
      logger.error('Guest verification requested but email delivery is not configured');
      throw new AppError('El servicio de email no esta configurado', 503);
    }

    const { code, guestIds } = await this.guestService.generateVerificationCode(email, phone);

    if (email) {
      await this.mailer.send({
        to: email,
        subject: 'Codigo de verificacion - League Of',
        text: `Tu codigo de verificacion es: ${code}. Expira en 15 minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h1>Codigo de verificacion</h1>
            <p>Tu codigo de verificacion es: <strong>${code}</strong></p>
            <p>Este codigo expira en 15 minutos.</p>
            <p>Si no solicitaste este codigo, ignora este correo.</p>
          </div>
        `,
      });
    }

    logger.info(`Verification code sent for email: ${email}, phone: ${phone}`);

    return { code, guestIds };
  }

  async verifyAndClaimGuests(
    userId: string,
    code: string,
    email?: string,
    phone?: string
  ): Promise<{ claimed: boolean; guestCount: number }> {
    const verification = await this.guestService.verifyCode(code, email, phone);

    if (!verification.valid) {
      throw new AppError('Codigo de verificacion invalido o expirado', 400);
    }

    if (!verification.guestIds || verification.guestIds.length === 0) {
      return { claimed: false, guestCount: 0 };
    }

    await this.guestService.claimGuests(userId, verification.guestIds);

    logger.info(`User ${userId} claimed ${verification.guestIds.length} guests`);

    return { claimed: true, guestCount: verification.guestIds.length };
  }
}
