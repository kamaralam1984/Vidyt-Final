#!/usr/bin/env node
/**
 * Seed Plans Script (Enhanced)
 * Usage: node -r dotenv/config scripts/seed-plans.js
 * 
 * Deletes all existing plans and inserts the 5 canonical plans with 
 * full configuration (USD pricing, limits, roles, and feature flags).
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in environment');
  process.exit(1);
}

// ──────────────── Full Plan Schema for Seeding ────────────────
const PlanSchema = new mongoose.Schema({
  planId:       { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true },
  label:        { type: String, default: '' },
  description:  { type: String },
  priceMonthly: { type: Number, required: true, min: 0 },
  priceYearly:  { type: Number, min: 0 },
  currency:     { type: String, default: 'USD' },
  features:     [{ type: String }],
  isActive:     { type: Boolean, default: true },
  isCustom:     { type: Boolean, default: false },
  billingPeriod:{ type: String, enum: ['month', 'year', 'both'], default: 'both' },
  
  // New Fields
  role: { type: String, enum: ['user', 'manager', 'admin', 'super-admin'], default: 'user' },
  limits: {
    analysesLimit:     { type: Number, default: 5 },
    analysesPeriod:    { type: String, enum: ['day', 'month'], default: 'month' },
    titleSuggestions:  { type: Number, default: 3 },
    hashtagCount:      { type: Number, default: 10 },
    competitorsTracked:{ type: Number, default: 3 },
  },
  navFeatureAccess: { type: mongoose.Schema.Types.Mixed, default: {} },
  featureFlags: {
    advancedAiViralPrediction:  { type: Boolean, default: false },
    realTimeTrendAnalysis:      { type: Boolean, default: false },
    bestPostingTimePredictions: { type: Boolean, default: false },
    competitorAnalysis:         { type: Boolean, default: false },
    emailSupport:               { type: Boolean, default: false },
    priorityProcessing:         { type: Boolean, default: false },
    teamCollaboration:          { type: Boolean, default: false },
    whiteLabelReports:          { type: Boolean, default: false },
    customAiModelTraining:      { type: Boolean, default: false },
    dedicatedAccountManager:    { type: Boolean, default: false },
    prioritySupport24x7:        { type: Boolean, default: false },
    advancedAnalyticsDashboard: { type: Boolean, default: false },
    customIntegrations:         { type: Boolean, default: false },
  },
  limitsDisplay: {
    videos:   { type: String, default: '—' },
    analyses: { type: String, default: '—' },
    storage:  { type: String, default: '—' },
    support:  { type: String, default: 'Community' },
  },
}, { timestamps: true });

// ──────────────── Full Plans Data ────────────────
const PLANS = [
  {
    planId: 'free',
    name: 'Free',
    label: 'Free Plan',
    role: 'user',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    billingPeriod: 'both',
    features: ['5 video analyses per month', 'Basic viral score prediction', 'Hashtag generator (10)', 'Community support'],
    limits: { analysesLimit: 5, analysesPeriod: 'month', titleSuggestions: 3, hashtagCount: 10, competitorsTracked: 3 },
    featureFlags: { 
      emailSupport: false, realTimeTrendAnalysis: false, competitorAnalysis: false,
      daily_ideas: false, ai_coach: false, keyword_research: false, script_writer: false,
      title_generator: false, channel_audit_tool: false, ai_shorts_clipping: false,
      ai_thumbnail_maker: false, optimize: false
    },
    navFeatureAccess: {
      dashboard: true,
      videos: true,
      youtube_seo: false,
      facebook_seo: false,
      instagram_seo: false,
      viral_optimizer: false,
      channel_audit: false,
      facebook_audit: false,
      trending: true,
      hashtags: true,
      posting_time: true,
      analytics: true,
      calendar: false,
      script_generator: false,
      ai_coach: false,
      thumbnail_generator: false,
      hook_generator: false,
      shorts_creator: false,
      youtube_growth: false,
    },

    limitsDisplay: { videos: '5/month', analyses: 'Basic', storage: '—', support: 'Community' },
  },
  {
    planId: 'starter',
    name: 'Starter',
    label: 'Starter Plan',
    role: 'user',
    priceMonthly: 3,
    priceYearly: 30,
    currency: 'USD',
    billingPeriod: 'both',
    features: ['10 video analyses per day', 'Standard viral prediction', 'Real-time trends', 'Email support'],
    limits: { analysesLimit: 10, analysesPeriod: 'day', titleSuggestions: 5, hashtagCount: 15, competitorsTracked: 10 },
    featureFlags: { 
      advancedAiViralPrediction: true, realTimeTrendAnalysis: true, emailSupport: true, competitorAnalysis: true,
      daily_ideas: true, ai_coach: false, keyword_research: true, script_writer: true,
      title_generator: true, channel_audit_tool: false, ai_shorts_clipping: false,
      ai_thumbnail_maker: true, optimize: false
    },

    limitsDisplay: { videos: '10/days', analyses: 'Standard', storage: '—', support: 'Email' },
  },
  {
    planId: 'pro',
    name: 'Pro',
    label: 'Pro Plan',
    role: 'manager',
    priceMonthly: 15,
    priceYearly: 150,
    currency: 'USD',
    billingPeriod: 'both',
    features: ['30 video analyses per day', 'Advanced AI prediction', 'Best posting times', 'Priority email support'],
    limits: { analysesLimit: 30, analysesPeriod: 'day', titleSuggestions: 10, hashtagCount: 20, competitorsTracked: 50 },
    featureFlags: { 
      advancedAiViralPrediction: true, realTimeTrendAnalysis: true, bestPostingTimePredictions: true, 
      emailSupport: true, competitorAnalysis: true, priorityProcessing: true,
      daily_ideas: true, ai_coach: true, keyword_research: true, script_writer: true,
      title_generator: true, channel_audit_tool: true, ai_shorts_clipping: true,
      ai_thumbnail_maker: true, optimize: true
    },

    limitsDisplay: { videos: '30/days', analyses: 'Advanced', storage: '—', support: 'Priority Email' },
  },
  {
    planId: 'enterprise',
    name: 'Enterprise',
    label: 'Enterprise Plan',
    role: 'admin',
    priceMonthly: 25,
    priceYearly: 250,
    currency: 'USD',
    billingPeriod: 'both',
    features: ['100 video analyses per day', 'Team collaboration', 'White-label reports', '24/7 priority support'],
    limits: { analysesLimit: 100, analysesPeriod: 'day', titleSuggestions: 10, hashtagCount: 20, competitorsTracked: -1 },
    featureFlags: { 
      advancedAiViralPrediction: true, realTimeTrendAnalysis: true, bestPostingTimePredictions: true, 
      emailSupport: true, competitorAnalysis: true, priorityProcessing: true, teamCollaboration: true,
      whiteLabelReports: true, customAiModelTraining: true, dedicatedAccountManager: true, prioritySupport24x7: true,
      advancedAnalyticsDashboard: true, customIntegrations: true
    },
    limitsDisplay: { videos: '100/days', analyses: 'Custom AI', storage: 'Unlimited', support: '24/7 Priority' },
  },
  {
    planId: 'custom',
    name: 'Custom',
    label: 'Custom Plan',
    role: 'admin',
    priceMonthly: 50,
    priceYearly: 500,
    currency: 'USD',
    billingPeriod: 'both',
    isCustom: true,
    features: ['Unlimited video processing', 'Bespoke AI models', 'Dedicated infrastructure', 'Custom usage limits'],
    limits: { analysesLimit: 500, analysesPeriod: 'day', titleSuggestions: 50, hashtagCount: 50, competitorsTracked: -1 },
    featureFlags: { 
      advancedAiViralPrediction: true, realTimeTrendAnalysis: true, bestPostingTimePredictions: true, 
      emailSupport: true, competitorAnalysis: true, priorityProcessing: true, teamCollaboration: true,
      whiteLabelReports: true, customAiModelTraining: true, dedicatedAccountManager: true, prioritySupport24x7: true,
      advancedAnalyticsDashboard: true, customIntegrations: true,
      daily_ideas: true, ai_coach: true, keyword_research: true, script_writer: true,
      title_generator: true, channel_audit_tool: true, ai_shorts_clipping: true,
      ai_thumbnail_maker: true, optimize: true
    },

    limitsDisplay: { videos: '500/days', analyses: 'Custom AI', storage: 'Unlimited', support: 'Dedicated' },
  },
];

async function main() {
  console.log('🚀 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

  // ─── Step 1: Delete old plans ───
  const deleted = await Plan.deleteMany({});
  console.log(`🗑️  Old plans deleted: ${deleted.deletedCount}`);

  // ─── Step 2: Insert new plans with full config ───
  await Plan.insertMany(PLANS);
  console.log(`✅ ${PLANS.length} plans inserted with full configuration (limits, roles, features).`);

  // ─── Summary ───
  const count = await Plan.countDocuments();
  console.log(`\n📦 Total plans in DB: ${count}`);
  console.log('🎉 Seed complete!');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
