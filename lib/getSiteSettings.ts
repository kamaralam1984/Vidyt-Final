// Single source for reading SiteSettings (maintenance / registration / announcement)
// from MongoDB. Cached in-process for 30s so high-traffic call sites (middleware,
// signup endpoints, layout) don't slam the DB.

import connectDB from './mongodb';
import mongoose from 'mongoose';

export interface SiteSettingsValues {
  maintenanceMode: boolean;
  registrationOpen: boolean;
  announcement: string;
  announcementActive: boolean;
}

const DEFAULTS: SiteSettingsValues = {
  maintenanceMode: false,
  registrationOpen: true,
  announcement: '',
  announcementActive: false,
};

const SiteSettingsSchema = new mongoose.Schema(
  {
    id: { type: String, default: 'default', unique: true },
    maintenanceMode: { type: Boolean, default: false },
    registrationOpen: { type: Boolean, default: true },
    announcement: { type: String, default: '' },
    announcementActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

let cache: { data: SiteSettingsValues; expiresAt: number } | null = null;

export async function getSiteSettings(force = false): Promise<SiteSettingsValues> {
  const now = Date.now();
  if (!force && cache && now < cache.expiresAt) return cache.data;
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ id: 'default' }).lean();
    const data: SiteSettingsValues = {
      maintenanceMode: !!(doc as any)?.maintenanceMode,
      registrationOpen: (doc as any)?.registrationOpen !== false,
      announcement: String((doc as any)?.announcement || ''),
      announcementActive: !!(doc as any)?.announcementActive,
    };
    cache = { data, expiresAt: now + 30_000 };
    return data;
  } catch {
    return DEFAULTS;
  }
}

export function invalidateSiteSettingsCache() {
  cache = null;
}
