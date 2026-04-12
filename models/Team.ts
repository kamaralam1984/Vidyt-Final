import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamMember {
  userId: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: Date;
}

export interface ITeam extends Document {
  name: string;
  ownerId: string;
  members: ITeamMember[];
  inviteToken?: string;
  inviteTokenExpires?: Date;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  ownerId: { type: String, required: true, index: true },
  members: [{
    userId: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  inviteToken: { type: String },
  inviteTokenExpires: { type: Date },
  maxMembers: { type: Number, default: 10 },
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
