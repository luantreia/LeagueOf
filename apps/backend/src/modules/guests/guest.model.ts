import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  _id: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  claimedBy?: mongoose.Types.ObjectId;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    claimedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
guestSchema.index({ group: 1, email: 1 });
guestSchema.index({ group: 1, phone: 1 });
guestSchema.index({ email: 1, claimedBy: 1 });
guestSchema.index({ phone: 1, claimedBy: 1 });

export const Guest = mongoose.model<IGuest>('Guest', guestSchema);
