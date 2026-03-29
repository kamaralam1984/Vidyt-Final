import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  level: number;
  description: string;
  color: string;
  permissions: string[];
  isCustom: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: false,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    level: {
      type: Number,
      default: 2,
      min: 1,
      max: 5,
    },
    description: {
      type: String,
      default: '',
      maxlength: 255,
    },
    color: {
      type: String,
      default: '#FF0000',
      match: /^#[0-9A-F]{6}$/i,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Avoid model recompilation
const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
