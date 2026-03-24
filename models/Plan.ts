import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  planId: string; // 'free' | 'starter' | 'pro' | 'enterprise' | 'custom' | 'owner'
  name: string;
  label: string; // Display label e.g. 'Starter Plan'
  description?: string;
  priceMonthly: number; // Price in USD (base currency)
  priceYearly?: number; // Price in USD (if annual available)
  currency: string; // 'USD', 'INR', etc.
  features: string[];
  isActive: boolean;
  isCustom: boolean; // True if created by admin, false if default
  billingPeriod: 'month' | 'year' | 'both';

  // ── Role assigned to users on this plan ──────────────────────────────
  role: 'user' | 'manager' | 'admin' | 'super-admin';

  // ── Usage limits (super-admin configurable) ───────────────────────────
  limits: {
    analysesLimit: number;       // -1 = unlimited
    analysesPeriod: 'day' | 'month';
    titleSuggestions: number;    // -1 = unlimited
    hashtagCount: number;        // -1 = unlimited
    competitorsTracked: number;  // -1 = unlimited
  };

  // ── Feature flags (super-admin configurable) ──────────────────────────
  featureFlags: {
    advancedAiViralPrediction: boolean;
    realTimeTrendAnalysis: boolean;
    bestPostingTimePredictions: boolean;
    competitorAnalysis: boolean;
    emailSupport: boolean;
    priorityProcessing: boolean;
    teamCollaboration: boolean;
    whiteLabelReports: boolean;
    customAiModelTraining: boolean;
    dedicatedAccountManager: boolean;
    prioritySupport24x7: boolean;
    advancedAnalyticsDashboard: boolean;
    customIntegrations: boolean;
    // New AI Studio Features
    daily_ideas: boolean;
    ai_coach: boolean;
    keyword_research: boolean;
    script_writer: boolean;
    title_generator: boolean;
    channel_audit_tool: boolean;
    ai_shorts_clipping: boolean;
    ai_thumbnail_maker: boolean;
    optimize: boolean;
  };

  // ── Display strings for pricing page ─────────────────────────────────
  limitsDisplay: {
    videos: string;
    analyses: string;
    storage: string;
    support: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ── Default limits per plan (used when record has no limits set) ──────────
const defaultLimits = {
  free:       { analysesLimit: 5,   analysesPeriod: 'month', titleSuggestions: 3,  hashtagCount: 10, competitorsTracked: 3   },
  starter:    { analysesLimit: 10,  analysesPeriod: 'day',   titleSuggestions: 5,  hashtagCount: 15, competitorsTracked: 10  },
  pro:        { analysesLimit: 30,  analysesPeriod: 'day',   titleSuggestions: 10, hashtagCount: 20, competitorsTracked: 50  },
  enterprise: { analysesLimit: 100, analysesPeriod: 'day',   titleSuggestions: 10, hashtagCount: 20, competitorsTracked: -1  },
  custom:     { analysesLimit: 500, analysesPeriod: 'day',   titleSuggestions: 50, hashtagCount: 50, competitorsTracked: -1  },
  owner:      { analysesLimit: -1,  analysesPeriod: 'month', titleSuggestions: -1, hashtagCount: -1, competitorsTracked: -1  },
};

const PlanSchema = new Schema<IPlan>(
  {
    planId: { type: String, required: true, unique: true, index: true },
    name:   { type: String, required: true },
    label:  { type: String, default: '' },
    description: { type: String },
    priceMonthly: { type: Number, required: true, min: 0 },
    priceYearly:  { type: Number, min: 0 },
    currency:     { type: String, default: 'USD' },
    features:     [{ type: String }],
    isActive:     { type: Boolean, default: true },
    isCustom:     { type: Boolean, default: false },
    billingPeriod:{ type: String, enum: ['month', 'year', 'both'], default: 'both' },

    // Role
    role: {
      type: String,
      enum: ['user', 'manager', 'admin', 'super-admin'],
      default: 'user',
    },

    // Limits
    limits: {
      analysesLimit:     { type: Number, default: 5 },
      analysesPeriod:    { type: String, enum: ['day', 'month'], default: 'month' },
      titleSuggestions:  { type: Number, default: 3 },
      hashtagCount:      { type: Number, default: 10 },
      competitorsTracked:{ type: Number, default: 3 },
    },

    // Feature flags
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
      // New AI Studio Features
      daily_ideas:                { type: Boolean, default: false },
      ai_coach:                   { type: Boolean, default: false },
      keyword_research:           { type: Boolean, default: false },
      script_writer:              { type: Boolean, default: false },
      title_generator:            { type: Boolean, default: false },
      channel_audit_tool:         { type: Boolean, default: false },
      ai_shorts_clipping:         { type: Boolean, default: false },
      ai_thumbnail_maker:         { type: Boolean, default: false },
      optimize:                   { type: Boolean, default: false },
    },

    // Display labels
    limitsDisplay: {
      videos:   { type: String, default: '—' },
      analyses: { type: String, default: '—' },
      storage:  { type: String, default: '—' },
      support:  { type: String, default: 'Community' },
    },
  },
  { timestamps: true }
);

PlanSchema.index({ planId: 1, isActive: 1 });

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
