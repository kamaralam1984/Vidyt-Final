export interface Feature {
  id: string;
  label: string;
  group: 'sidebar' | 'dashboard' | 'other' | 'ai_studio' | 'platform' | 'yt_seo_sections' | 'channel_intelligence' | 'quick_tools';
  defaultRoles: string[];
}

export const ALL_FEATURES: Feature[] = [
  // Sidebar items
  { id: 'dashboard', label: 'Dashboard', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'videos', label: 'My Videos', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'youtube_seo', label: 'YouTube Live SEO Analyzer', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'keyword_intelligence', label: 'Keyword Intelligence Engine', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'facebook_seo', label: 'Facebook SEO Analyzer', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'instagram_seo', label: 'Instagram SEO Analyzer', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'viral_optimizer', label: 'AI Viral Optimization Engine', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'facebook_audit', label: 'Facebook Audit', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'trending', label: 'Trending', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'hashtags', label: 'Hashtags', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'posting_time', label: 'Posting Time', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'analytics', label: 'Analytics', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'calendar', label: 'Content Calendar', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'script_generator', label: 'Script Generator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'ai_coach', label: 'AI Coach', group: 'sidebar', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'thumbnail_generator', label: 'Thumbnail Generator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'hook_generator', label: 'Hook Generator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'shorts_creator', label: 'Shorts Creator', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'youtube_growth', label: 'YouTube Growth', group: 'sidebar', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },

  // Dashboard widgets
  { id: 'video_upload', label: 'Video Upload', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'viral_score', label: 'Viral Score Meter', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'score_cards', label: 'Score Cards', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'title_suggestions', label: 'Title Suggestions', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'hashtag_recommendations', label: 'Hashtag Recommendations', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'trending_topics', label: 'Trending Topics', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'posting_time_heatmap', label: 'Posting Time Heatmap', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  // Dashboard Specific Buttons
  { id: 'dashboard_upload_btn', label: 'Dashboard: Upload Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_youtube_btn', label: 'Dashboard: YouTube Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_facebook_btn', label: 'Dashboard: Facebook Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_instagram_btn', label: 'Dashboard: Instagram Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_tiktok_btn', label: 'Dashboard: TikTok Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_analyze_btn', label: 'Dashboard: Analyze Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_seo_analyzer_btn', label: 'Dashboard: SEO Analyzer Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'dashboard_ai_engine_btn', label: 'Dashboard: Ultra AI Engine Button', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },

  { id: 'engagement_graph', label: 'Engagement Graph', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },

  // AI Studio Features (Plan-based)
  { id: 'daily_ideas', label: 'Daily Ideas', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'ai_coach', label: 'AI Coach', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'keyword_research', label: 'Keyword Research', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'script_writer', label: 'Script Writer', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'title_generator', label: 'Title Generator', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'ai_shorts_clipping', label: 'AI Shorts Clipping', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'channel_audit_tool', label: 'Channel Audit Tool', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'ai_thumbnail_maker', label: 'AI Thumbnail Maker', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'optimize', label: 'Optimize', group: 'ai_studio', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },
  
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
  { id: 'platform_youtube', label: 'YouTube Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'platform_facebook', label: 'Facebook Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'platform_instagram', label: 'Instagram Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'platform_tiktok', label: 'TikTok Platform Access', group: 'platform', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'platform_support', label: 'Priority Support Access', group: 'platform', defaultRoles: ['manager', 'admin', 'enterprise', 'super-admin'] },

  // ── YouTube Live SEO Analyzer — Section Controls ──────────────────────────
  { id: 'yt_seo_video_setup',       label: 'YT SEO: Video Setup (Upload/Type)',       group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_seo_score',         label: 'YT SEO: SEO Score Panel',                 group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_ctr_predictor',     label: 'YT SEO: CTR Predictor',                   group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_best_posting_time', label: 'YT SEO: Best Posting Time',               group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_title_score',       label: 'YT SEO: Title Score & Improved Titles',   group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_keywords',          label: 'YT SEO: Keyword Analysis & Viral KWs',    group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_thumbnail',         label: 'YT SEO: Thumbnail Score',                 group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_descriptions',      label: 'YT SEO: AI Description Generator',        group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_hashtags',          label: 'YT SEO: Hashtag Generator',               group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_competitors',       label: 'YT SEO: Top Competitor Videos',           group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_channel_summary',   label: 'YT SEO: Channel Summary & Link',          group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_viral_probability', label: 'YT SEO: Viral Probability Dashboard',     group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_chinki',            label: 'YT SEO: Chinki AI Assistant',             group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'yt_seo_video_analyze',     label: 'YT SEO: Video Content Analysis & Transcription', group: 'yt_seo_sections', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },

  // ── Quick Tools (Dashboard Shortcuts) ────────────────────────────────
  { id: 'qt_youtube_seo',          label: 'Quick Tool: YouTube SEO',          group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_keyword_intelligence', label: 'Quick Tool: Keyword Intelligence',  group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_viral_intelligence',   label: 'Quick Tool: Ultra AI',              group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_script_generator',     label: 'Quick Tool: Script Generator',      group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_thumbnail_generator',  label: 'Quick Tool: Thumbnail Generator',   group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_trending',             label: 'Quick Tool: Trending',              group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_hashtags',             label: 'Quick Tool: Hashtags',              group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_posting_time',         label: 'Quick Tool: Posting Time',          group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_analytics',            label: 'Quick Tool: Analytics',             group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_hook_generator',       label: 'Quick Tool: Hook Generator',        group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_shorts_creator',       label: 'Quick Tool: Shorts Creator',        group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },
  { id: 'qt_viral_optimizer',      label: 'Quick Tool: Viral Optimizer',       group: 'quick_tools', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin'] },

  // ── Channel Intelligence — Section Controls ──────────────────────────
  { id: 'ci_channel_input',         label: 'Channel Intelligence: Channel Input Form',       group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'ci_channel_overview',      label: 'Channel Intelligence: Channel Overview',          group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'ci_ranking_panel',         label: 'Channel Intelligence: Channel Rank',              group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'ci_revenue_calculator',    label: 'Channel Intelligence: Revenue Estimate',          group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'ci_ai_insights',           label: 'Channel Intelligence: AI Insights',               group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'ci_growth_prediction',     label: 'Channel Intelligence: Growth Prediction',         group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
  { id: 'ci_competitor_comparison', label: 'Channel Intelligence: Competitor Comparison',     group: 'channel_intelligence', defaultRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'] },
];


