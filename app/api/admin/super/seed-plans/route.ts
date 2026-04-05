import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const optimizedPlans = [
  {
    planId: 'free',
    name: 'Free',
    label: 'Trial Plan',
    description: 'Perfect for testing our AI power',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    isActive: true,
    role: 'user',
    features: ['3 AI analyses per month', '1 Video schedule', 'Basic viral score', '24h Community Support'],
    limits: { 
      video_upload: 1, 
      video_analysis: 3, 
      schedule_posts: 1, 
      bulk_scheduling: 0,
      titleSuggestions: 2, 
      hashtagCount: 5, 
      competitorsTracked: 1 
    },
    limitsDisplay: { videos: '1/month', analyses: '3/month', storage: '—', support: 'Community' },
    featureFlags: {
      daily_ideas: true,
      ai_coach: false,
      keyword_research: true,
      script_writer: false,
      title_generator: true,
      channel_audit_tool: false,
      ai_shorts_clipping: false,
      ai_thumbnail_maker: false
    }
  },
  {
    planId: 'starter',
    name: 'Starter',
    label: 'Growth Plan',
    description: 'For rising creators and small brands',
    priceMonthly: 12,
    priceYearly: 99,
    currency: 'USD',
    isActive: true,
    role: 'user',
    features: ['15 AI analyses per month', '5 Video schedules', 'Standard Viral Prediction', 'Email Support'],
    limits: { 
      video_upload: 5, 
      video_analysis: 15, 
      schedule_posts: 5, 
      bulk_scheduling: 5,
      titleSuggestions: 5, 
      hashtagCount: 15, 
      competitorsTracked: 5 
    },
    limitsDisplay: { videos: '5/month', analyses: '15/month', storage: '—', support: 'Email' },
    featureFlags: {
      daily_ideas: true,
      ai_coach: true,
      keyword_research: true,
      script_writer: true,
      title_generator: true,
      channel_audit_tool: true,
      ai_shorts_clipping: false,
      ai_thumbnail_maker: false
    }
  },
  {
    planId: 'pro',
    name: 'Pro',
    label: 'Professional',
    description: 'Everything you need to go viral daily',
    priceMonthly: 39,
    priceYearly: 349,
    currency: 'USD',
    isActive: true,
    role: 'manager',
    features: ['5 analyses PER DAY', 'Unlimited Video schedules', 'Advanced AI prediction', 'Priority Support'],
    limits: { 
      video_upload: 15, 
      video_analysis: 5, 
      schedule_posts: -1, 
      bulk_scheduling: 50,
      titleSuggestions: 15, 
      hashtagCount: 30, 
      competitorsTracked: 20 
    },
    limitsDisplay: { videos: '15/month', analyses: '5/Day', storage: '—', support: 'Priority' },
    featureFlags: {
      daily_ideas: true,
      ai_coach: true,
      keyword_research: true,
      script_writer: true,
      title_generator: true,
      channel_audit_tool: true,
      ai_shorts_clipping: true,
      ai_thumbnail_maker: true
    }
  },
  {
    planId: 'enterprise',
    name: 'Agency',
    label: 'Elite Agency',
    description: 'Scale multiple channels with team power',
    priceMonthly: 99,
    priceYearly: 899,
    currency: 'USD',
    isActive: true,
    role: 'admin',
    features: ['20 analyses PER DAY', 'Unlimited everything', 'White-label Reports', '24/7 Dedicated Support'],
    limits: { 
      video_upload: -1, 
      video_analysis: 20, 
      schedule_posts: -1, 
      bulk_scheduling: -1,
      titleSuggestions: -1, 
      hashtagCount: -1, 
      competitorsTracked: -1 
    },
    limitsDisplay: { videos: 'Unlimited', analyses: '20/Day', storage: '—', support: 'VIP' },
    featureFlags: {
      daily_ideas: true,
      ai_coach: true,
      keyword_research: true,
      script_writer: true,
      title_generator: true,
      channel_audit_tool: true,
      ai_shorts_clipping: true,
      ai_thumbnail_maker: true,
      team_collaboration: true
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdminRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    // Deactivate old pins instead of deleting
    await Plan.updateMany({}, { isActive: false });

    for (const planData of optimizedPlans) {
      await Plan.findOneAndUpdate(
        { planId: planData.planId },
        { ...planData, isActive: true },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Optimized plans seeded successfully via API route.' 
    });

  } catch (error: any) {
    console.error('Seed API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
