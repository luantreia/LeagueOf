import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  _id: mongoose.Types.ObjectId;
  email?: string;
  phone?: string;
  code: string;
  type: 'claim_guest';
  expiresAt: Date;
  used: boolean;
  guestIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
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
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['claim_guest'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    guestIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Guest',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
verificationCodeSchema.index({ email: 1, used: 1, expiresAt: 1 });
verificationCodeSchema.index({ phone: 1, used: 1, expiresAt: 1 });
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationCode = mongoose.model<IVerificationCode>('VerificationCode', verificationCodeSchema);
