export interface Feature {
  id: string;
  label: string;
  group: 'sidebar' | 'dashboard' | 'other' | 'ai_studio' | 'platform';
  defaultRoles: string[];
}

export const ALL_FEATURES: Feature[] = [
  // Sidebar items
  { id: 'dashboard', label: 'Dashboard', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'videos', label: 'My Videos', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'youtube_seo', label: 'YouTube Live SEO Analyzer', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'facebook_seo', label: 'Facebook SEO Analyzer', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'instagram_seo', label: 'Instagram SEO Analyzer', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'viral_optimizer', label: 'AI Viral Optimization Engine', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'channel_audit', label: 'Channel Audit', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'facebook_audit', label: 'Facebook Audit', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'trending', label: 'Trending', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'hashtags', label: 'Hashtags', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'posting_time', label: 'Posting Time', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'analytics', label: 'Analytics', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'calendar', label: 'Content Calendar', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'script_generator', label: 'Script Generator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'ai_coach', label: 'AI Coach', group: 'sidebar', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'thumbnail_generator', label: 'Thumbnail Generator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'hook_generator', label: 'Hook Generator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'shorts_creator', label: 'Shorts Creator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'youtube_growth', label: 'YouTube Growth', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },

  // Dashboard widgets
  { id: 'video_upload', label: 'Video Upload', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'viral_score', label: 'Viral Score Meter', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'score_cards', label: 'Score Cards', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'title_suggestions', label: 'Title Suggestions', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'hashtag_recommendations', label: 'Hashtag Recommendations', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'trending_topics', label: 'Trending Topics', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'posting_time_heatmap', label: 'Posting Time Heatmap', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  // Dashboard Specific Buttons
  { id: 'dashboard_upload_btn', label: 'Dashboard: Upload Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'dashboard_youtube_btn', label: 'Dashboard: YouTube Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'dashboard_facebook_btn', label: 'Dashboard: Facebook Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'dashboard_instagram_btn', label: 'Dashboard: Instagram Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'dashboard_tiktok_btn', label: 'Dashboard: TikTok Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'dashboard_analyze_btn', label: 'Dashboard: Analyze Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },

  { id: 'engagement_graph', label: 'Engagement Graph', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },

  // AI Studio Features (Plan-based)
  { id: 'daily_ideas', label: 'Daily Ideas', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'ai_coach', label: 'AI Coach', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'keyword_research', label: 'Keyword Research', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'script_writer', label: 'Script Writer', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'title_generator', label: 'Title Generator', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'channel_audit_tool', label: 'Channel Audit Tool', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'ai_shorts_clipping', label: 'AI Shorts Clipping', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'ai_thumbnail_maker', label: 'AI Thumbnail Maker', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  { id: 'optimize', label: 'Optimize', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'super-admin'] },
  
  // Existing Plan Features
  { id: 'advancedAiViralPrediction', label: 'Advanced AI Viral Prediction', group: 'ai_studio', defaultRoles: ['pro', 'enterprise', 'owner'] },
  { id: 'realTimeTrendAnalysis', label: 'Real-time Trend Analysis', group: 'ai_studio', defaultRoles: ['pro', 'enterprise', 'owner'] },
  { id: 'bestPostingTimePredictions', label: 'Best Posting Time Predictions', group: 'ai_studio', defaultRoles: ['pro', 'enterprise', 'owner'] },
  { id: 'competitorAnalysis', label: 'Competitor Analysis', group: 'ai_studio', defaultRoles: ['pro', 'enterprise', 'owner'] },
  { id: 'emailSupport', label: 'Email Support', group: 'ai_studio', defaultRoles: ['starter', 'pro', 'enterprise', 'owner'] },
  { id: 'priorityProcessing', label: 'Priority Processing', group: 'ai_studio', defaultRoles: ['pro', 'enterprise', 'owner'] },
  { id: 'teamCollaboration', label: 'Team Collaboration', group: 'ai_studio', defaultRoles: ['enterprise', 'owner'] },
  { id: 'whiteLabelReports', label: 'White-label Reports', group: 'ai_studio', defaultRoles: ['enterprise', 'owner'] },
  { id: 'customAiModelTraining', label: 'Custom AI Model Training', group: 'ai_studio', defaultRoles: ['enterprise', 'owner'] },
  { id: 'dedicatedAccountManager', label: 'Dedicated Account Manager', group: 'ai_studio', defaultRoles: ['enterprise', 'owner'] },
  { id: 'prioritySupport24x7', label: '24/7 Priority Support', group: 'ai_studio', defaultRoles: ['enterprise', 'owner'] },
  { id: 'advancedAnalyticsDashboard', label: 'Advanced Analytics Dashboard', group: 'ai_studio', defaultRoles: ['pro', 'enterprise', 'owner'] },
  { id: 'customIntegrations', label: 'Custom Integrations', group: 'ai_studio', defaultRoles: ['enterprise', 'owner'] },

  // Platform Access (Plan-based)
  { id: 'platform_youtube', label: 'YouTube Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'platform_facebook', label: 'Facebook Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'platform_instagram', label: 'Instagram Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'platform_tiktok', label: 'TikTok Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
  { id: 'platform_support', label: 'Priority Support Access', group: 'platform', defaultRoles: ['manager', 'admin', 'super-admin'] },
];
