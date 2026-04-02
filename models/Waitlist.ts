import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
  source: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    source: {
      type: String,
      default: 'browser_extension',
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure exact lowercase
WaitlistSchema.pre('save', function (this: IWaitlist, next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

const Waitlist: Model<IWaitlist> =
  mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);

export default Waitlist;
