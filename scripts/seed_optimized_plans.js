const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const PlanSchema = new mongoose.Schema({
  planId: String,
  name: String,
  label: String,
  description: String,
  priceMonthly: Number,
  priceYearly: Number,
  currency: String,
  features: [String],
  role: String,
  isActive: Boolean,
  limits: Object,
  limitsDisplay: Object,
  featureFlags: Object,
}, { timestamps: true });

const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

const optimizedPlans = [
  {
    planId: 'free',
    name: 'Free',
    label: 'Free Plan',
    description: 'Get started with core tools',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    isActive: true,
    role: 'user',
    features: ['5 video analyses per month', 'Keyword Intelligence (10/day)', 'Trending (3/day)', 'Hashtag generator (10)', 'Community support'],
    limits: {
      video_upload: 5,
      video_analysis: 5,
      analysesLimit: 5,
      analysesPeriod: 'month',
      schedule_posts: 0,
      bulk_scheduling: 0,
      titleSuggestions: 3,
      hashtagCount: 10,
      competitorsTracked: 3,
      featureLimits: {
        analyses:           { value: 5,  period: 'month' },
        videoUploads:       { value: 5,  period: 'month' },
        keyword_research:   { value: 10, period: 'day' },
        trendAnalysis:      { value: 3,  period: 'day' },
        hashtagsPerPost:    { value: 10, period: 'lifetime' },
      },
    },
    limitsDisplay: { videos: '5/month', analyses: '5/month', storage: '—', support: 'Community' },
    navFeatureAccess: {
      dashboard: true,
      videos: true,
      keyword_intelligence: true,
      youtube_seo: false,
      facebook_seo: false,
      instagram_seo: false,
      viral_optimizer: false,
      facebook_audit: false,
      trending: true,
      hashtags: true,
      posting_time: false,
      analytics: false,
      calendar: false,
      script_generator: false,
      ai_coach: false,
      thumbnail_generator: false,
      hook_generator: false,
      shorts_creator: false,
      youtube_growth: false,
    },
    featureFlags: {
      daily_ideas: false,
      ai_coach: false,
      keyword_research: true,
      script_writer: false,
      title_generator: false,
      channel_audit_tool: false,
      ai_shorts_clipping: false,
      ai_thumbnail_maker: false
    }
  },
  {
    planId: 'starter',
    name: 'Starter',
    label: 'Starter Plan',
    description: 'For rising creators and small brands',
    priceMonthly: 2,
    priceYearly: 20,
    currency: 'USD',
    isActive: true,
    role: 'user',
    features: ['1 video analysis per day', '5 Video schedules', 'Standard Viral Prediction', 'Email Support'],
    limits: {
      video_upload: 1,
      video_analysis: 1,
      schedule_posts: 5,
      bulk_scheduling: 0,
      titleSuggestions: 5,
      hashtagCount: 15,
      competitorsTracked: 5
    },
    limitsDisplay: { videos: '1/day', analyses: '1/day', storage: '—', support: 'Email' },
    featureFlags: {
      daily_ideas: true,
      ai_coach: false,
      keyword_research: false,
      script_writer: false,
      title_generator: true,
      channel_audit_tool: false,
      ai_shorts_clipping: false,
      ai_thumbnail_maker: false
    }
  },
  {
    planId: 'pro',
    name: 'Pro',
    label: 'Professional',
    description: 'Everything you need to go viral daily',
    priceMonthly: 8,
    priceYearly: 80,
    currency: 'USD',
    isActive: true,
    role: 'manager',
    features: ['5 analyses PER DAY', '30 Video schedules', 'Advanced AI prediction', 'Priority Support'],
    limits: {
      video_upload: 5,
      video_analysis: 5,
      schedule_posts: 30,
      bulk_scheduling: 25,
      titleSuggestions: 10,
      hashtagCount: 20,
      competitorsTracked: 25
    },
    limitsDisplay: { videos: '5/day', analyses: '5/Day', storage: '—', support: 'Priority' },
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
    name: 'Enterprise',
    label: 'Enterprise Plan',
    description: 'Scale multiple channels with team power',
    priceMonthly: 20,
    priceYearly: 200,
    currency: 'USD',
    isActive: true,
    role: 'admin',
    features: ['15 analyses PER DAY', 'Unlimited schedules', 'White-label Reports', '24/7 Dedicated Support'],
    limits: {
      video_upload: 15,
      video_analysis: 15,
      schedule_posts: -1,
      bulk_scheduling: -1,
      titleSuggestions: 25,
      hashtagCount: 30,
      competitorsTracked: 100
    },
    limitsDisplay: { videos: '15/day', analyses: '15/Day', storage: '—', support: 'VIP' },
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

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Deactivate old plans instead of deleting (Safer for existing users)
    await Plan.updateMany({}, { isActive: false });
    console.log('Deactivated existing plans');

    for (const planData of optimizedPlans) {
      await Plan.findOneAndUpdate(
        { planId: planData.planId },
        { ...planData, isActive: true },
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated Plan: ${planData.name}`);
    }

    console.log('Optimized seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
