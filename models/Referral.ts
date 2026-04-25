import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId; // user who shared the link
  referredId: mongoose.Types.ObjectId; // user who signed up via link
  code: string;                         // e.g. "REF-abc123"
  status: 'pending' | 'credited';
  bonusCredits: number;                 // extra analyses granted
  createdAt: Date;
  creditedAt?: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'credited'], default: 'pending' },
    bonusCredits: { type: Number, default: 5 }, // 5 bonus analyses per referral
    creditedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Referral ||
  mongoose.model<IReferral>('Referral', ReferralSchema);
