export interface Feature {
  id: string;
  label: string;
  group: 'sidebar' | 'dashboard' | 'other';
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
  { id: 'engagement_graph', label: 'Engagement Graph', group: 'dashboard', defaultRoles: ['user', 'manager', 'admin', 'super-admin'] },
];
