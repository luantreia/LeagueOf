import mongoose from 'mongoose';
import { Guest, IGuest } from './guest.model';
import { VerificationCode } from './verification-code.model';
import { Match } from '../matches/match.model';
import { AppError } from '@/shared/utils/app-error';

export class GuestService {
  async createGuest(data: {
    group: string;
    name: string;
    email?: string;
    phone?: string;
  }): Promise<IGuest> {
    const guest = await Guest.create(data);
    return guest;
  }

  async getGuestsByGroup(groupId: string): Promise<IGuest[]> {
    return Guest.find({ group: groupId }).sort({ createdAt: -1 });
  }

  async getGuestById(guestId: string): Promise<IGuest | null> {
    return Guest.findById(guestId);
  }

  async findGuestsByEmailOrPhone(
    email?: string,
    phone?: string
  ): Promise<IGuest[]> {
    const query: { claimedBy?: { $exists: boolean }; email?: string; phone?: string } = { claimedBy: { $exists: false } };
    
    if (email) query.email = email;
    if (phone) query.phone = phone;
    
    return Guest.find(query);
  }

  async claimGuests(
    userId: string,
    guestIds: string[]
  ): Promise<IGuest[]> {
    const guests = await Guest.find({
      _id: { $in: guestIds },
      claimedBy: { $exists: false },
    });

    if (guests.length === 0) {
      throw new AppError('No guests found or already claimed', 400);
    }

    const claimedGuests = await Promise.all(
      guests.map(async (guest) => {
        guest.claimedBy = new mongoose.Types.ObjectId(userId);
        guest.claimedAt = new Date();
        await guest.save();
        return guest;
      })
    );

    // Transfer matches from guests to user
    await this.transferMatchesToUser(userId, guestIds);

    return claimedGuests;
  }

  private async transferMatchesToUser(userId: string, guestIds: string[]): Promise<void> {
    await Match.updateMany(
      { 'teams.players.guest': { $in: guestIds } },
      {
        $set: {
          'teams.players.$[player].user': userId,
          'teams.players.$[player].guest': null,
        },
      },
      {
        arrayFilters: [{ 'player.guest': { $in: guestIds } }],
      }
    );
  }

  async generateVerificationCode(
    email?: string,
    phone?: string
  ): Promise<{ code: string; guestIds: string[] }> {
    const guests = await this.findGuestsByEmailOrPhone(email, phone);
    
    if (guests.length === 0) {
      throw new AppError('No guests found for this email/phone', 404);
    }

    const code = this.generateRandomCode();
    const guestIds = guests.map((g) => g._id.toString());

    // Invalidate previous codes
    await VerificationCode.updateMany(
      { email, phone, used: false },
      { used: true }
    );

    await VerificationCode.create({
      email,
      phone,
      code,
      type: 'claim_guest',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      guestIds: guests.map((g) => g._id),
    });

    return { code, guestIds };
  }

  async verifyCode(
    code: string,
    email?: string,
    phone?: string
  ): Promise<{ valid: boolean; guestIds?: string[] }> {
    const verificationCode = await VerificationCode.findOne({
      code,
      email,
      phone,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationCode) {
      return { valid: false };
    }

    verificationCode.used = true;
    await verificationCode.save();

    return { valid: true, guestIds: verificationCode.guestIds.map((id) => id.toString()) };
  }

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async deleteGuest(guestId: string): Promise<void> {
    const guest = await Guest.findById(guestId);
    
    if (!guest) {
      throw new AppError('Guest not found', 404);
    }

    // Check if guest is in any match
    const matchWithGuest = await Match.findOne({
      'teams.players.guest': guestId,
    });

    if (matchWithGuest) {
      throw new AppError('Cannot delete guest that has participated in matches', 400);
    }

    await Guest.findByIdAndDelete(guestId);
  }
}
