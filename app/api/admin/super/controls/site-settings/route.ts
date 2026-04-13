export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Simple key-value settings stored in a single document
const SiteSettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'default', unique: true },
  maintenanceMode: { type: Boolean, default: false },
  registrationOpen: { type: Boolean, default: true },
  announcement: { type: String, default: '' },
  announcementActive: { type: Boolean, default: false },
}, { timestamps: true });

const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const settings = await SiteSettings.findOne({ id: 'default' }).lean() || {
    maintenanceMode: false,
    registrationOpen: true,
    announcement: '',
    announcementActive: false,
  };

  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();

  const update: Record<string, any> = {};
  if (typeof body.maintenanceMode === 'boolean') update.maintenanceMode = body.maintenanceMode;
  if (typeof body.registrationOpen === 'boolean') update.registrationOpen = body.registrationOpen;
  if (typeof body.announcement === 'string') update.announcement = body.announcement.slice(0, 500);
  if (typeof body.announcementActive === 'boolean') update.announcementActive = body.announcementActive;

  await SiteSettings.findOneAndUpdate(
    { id: 'default' },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}
