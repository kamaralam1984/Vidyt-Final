export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/adminAuth';

/**
 * Returns the full system architecture map — pages, APIs, models, services,
 * workers, and the data-flow connections between them.
 *
 * This is a static manifest that describes how the platform is wired together.
 * The super-admin Workflows page renders it as an interactive graph.
 */

// ── Page Routes ──────────────────────────────────────────────────────────────
const PAGES = [
  // Public
  { id: 'p-home', path: '/', label: 'Home / Landing', group: 'public' },
  { id: 'p-pricing', path: '/pricing', label: 'Pricing', group: 'public' },
  { id: 'p-about', path: '/about', label: 'About', group: 'public' },
  { id: 'p-contact', path: '/contact', label: 'Contact', group: 'public' },
  { id: 'p-blog', path: '/blog', label: 'Blog', group: 'public' },
  { id: 'p-privacy', path: '/privacy-policy', label: 'Privacy Policy', group: 'public' },
  { id: 'p-cookie', path: '/cookie-policy', label: 'Cookie Policy', group: 'public' },
  { id: 'p-refund', path: '/refund-policy', label: 'Refund Policy', group: 'public' },
  { id: 'p-terms', path: '/terms', label: 'Terms of Service', group: 'public' },
  // Auth
  { id: 'p-auth', path: '/auth', label: 'Login / Auth', group: 'auth' },
  { id: 'p-register', path: '/register', label: 'Register', group: 'auth' },
  { id: 'p-forgot', path: '/forgot-password', label: 'Forgot Password', group: 'auth' },
  { id: 'p-reset', path: '/reset-password', label: 'Reset Password', group: 'auth' },
  // Dashboard
  { id: 'p-dash', path: '/dashboard', label: 'Dashboard', group: 'dashboard' },
  { id: 'p-dash-channels', path: '/dashboard/channels', label: 'Channels', group: 'dashboard' },
  { id: 'p-dash-analytics', path: '/dashboard/analytics', label: 'Analytics', group: 'dashboard' },
  { id: 'p-dash-upload', path: '/dashboard/upload', label: 'Upload', group: 'dashboard' },
  { id: 'p-dash-viral', path: '/dashboard/viral-intelligence', label: 'Viral Intelligence', group: 'dashboard' },
  { id: 'p-dash-keyword', path: '/dashboard/keyword-intelligence', label: 'Keyword Intelligence', group: 'dashboard' },
  { id: 'p-calendar', path: '/calendar', label: 'Content Calendar', group: 'dashboard' },
  { id: 'p-analytics', path: '/analytics', label: 'User Analytics', group: 'dashboard' },
  // AI Tools
  { id: 'p-ai', path: '/ai', label: 'AI Tools Hub', group: 'ai' },
  { id: 'p-ai-hook', path: '/ai/hook-generator', label: 'Hook Generator', group: 'ai' },
  { id: 'p-ai-script', path: '/ai/script-generator', label: 'Script Generator', group: 'ai' },
  { id: 'p-ai-shorts', path: '/ai/shorts-creator', label: 'Shorts Creator', group: 'ai' },
  { id: 'p-ai-thumb', path: '/ai/thumbnail-generator', label: 'Thumbnail Generator', group: 'ai' },
  { id: 'p-ai-channel', path: '/ai/channel-intelligence', label: 'Channel Intelligence', group: 'ai' },
  // Admin
  { id: 'p-admin', path: '/admin', label: 'Admin Dashboard', group: 'admin' },
  { id: 'p-admin-analytics', path: '/admin/analytics', label: 'Admin Analytics', group: 'admin' },
  // Super Admin
  { id: 'p-super-dash', path: '/admin/super/dashboard', label: 'Super Dashboard', group: 'super' },
  { id: 'p-super-analytics', path: '/admin/super/analytics', label: 'Super Analytics', group: 'super' },
  { id: 'p-super-live', path: '/admin/super/live', label: 'Live Tracking', group: 'super' },
  { id: 'p-super-users', path: '/admin/super/users', label: 'User Management', group: 'super' },
  { id: 'p-super-revenue', path: '/admin/super/revenue', label: 'Revenue', group: 'super' },
  { id: 'p-super-plans', path: '/admin/super/plans', label: 'Plan Management', group: 'super' },
  { id: 'p-super-system', path: '/admin/super/system', label: 'System Controls', group: 'super' },
  { id: 'p-super-workflows', path: '/admin/super/workflows', label: 'Workflows', group: 'super' },
];

// ── API Endpoints ────────────────────────────────────────────────────────────
const APIS = [
  // Auth
  { id: 'a-login', path: '/api/auth/login', method: 'POST', label: 'Login', group: 'auth', model: 'User', service: null },
  { id: 'a-register', path: '/api/auth/register', method: 'POST', label: 'Register', group: 'auth', model: 'User', service: 'email' },
  { id: 'a-verify', path: '/api/auth/verify-email', method: 'POST', label: 'Verify Email', group: 'auth', model: 'User', service: 'email' },
  { id: 'a-reset-pwd', path: '/api/auth/reset-password', method: 'POST', label: 'Reset Password', group: 'auth', model: 'User', service: 'email' },
  { id: 'a-google', path: '/api/auth/google', method: 'POST', label: 'Google OAuth', group: 'auth', model: 'User', service: null },
  { id: 'a-refresh', path: '/api/auth/refresh', method: 'POST', label: 'Refresh Token', group: 'auth', model: 'User', service: null },
  // AI
  { id: 'a-ai-hook', path: '/api/ai/hooks', method: 'POST', label: 'Generate Hooks', group: 'ai', model: 'AIHook', service: 'ai/models' },
  { id: 'a-ai-script', path: '/api/ai/scripts', method: 'POST', label: 'Generate Script', group: 'ai', model: 'AIScript', service: 'ai/models' },
  { id: 'a-ai-shorts', path: '/api/ai/shorts', method: 'POST', label: 'Create Shorts', group: 'ai', model: 'AIShorts', service: 'ai/models' },
  { id: 'a-ai-thumb', path: '/api/ai/thumbnails', method: 'POST', label: 'Generate Thumbnail', group: 'ai', model: 'AIThumbnail', service: 'ai/models' },
  { id: 'a-ai-analyze', path: '/api/ai/analyze', method: 'POST', label: 'AI Analyze Video', group: 'ai', model: 'Analysis', service: 'ai/videoAnalysis' },
  // YouTube
  { id: 'a-yt-search', path: '/api/youtube/search', method: 'GET', label: 'YouTube Search', group: 'youtube', model: null, service: 'youtube' },
  { id: 'a-yt-video', path: '/api/youtube/video', method: 'GET', label: 'Video Details', group: 'youtube', model: 'Video', service: 'youtube' },
  { id: 'a-yt-channel', path: '/api/youtube/channel', method: 'GET', label: 'Channel Details', group: 'youtube', model: 'Channel', service: 'youtube' },
  { id: 'a-yt-callback', path: '/api/youtube/callback', method: 'GET', label: 'OAuth Callback', group: 'youtube', model: 'User', service: null },
  { id: 'a-yt-upload', path: '/api/youtube/upload', method: 'POST', label: 'Upload Video', group: 'youtube', model: 'ScheduledPost', service: 'youtube' },
  // Channels
  { id: 'a-channels', path: '/api/channels', method: 'GET|POST', label: 'User Channels CRUD', group: 'channels', model: 'Channel', service: 'youtube/channelAnalytics' },
  { id: 'a-channel-audit', path: '/api/channels/audit', method: 'POST', label: 'Channel Audit', group: 'channels', model: 'Channel', service: 'youtube/channelAnalytics' },
  // Analytics
  { id: 'a-analytics', path: '/api/analytics', method: 'GET', label: 'User Analytics', group: 'analytics', model: 'ActivityLog', service: 'analytics' },
  { id: 'a-track', path: '/api/analytics/track', method: 'POST', label: 'Track Event', group: 'analytics', model: 'TrackingLog', service: null },
  // Payments
  { id: 'a-pay-create', path: '/api/payments/create-order', method: 'POST', label: 'Create Order', group: 'payments', model: 'Payment', service: 'payments/razorpay' },
  { id: 'a-pay-verify', path: '/api/payments/verify', method: 'POST', label: 'Verify Payment', group: 'payments', model: 'Payment', service: 'payments/razorpay' },
  { id: 'a-pay-paypal', path: '/api/payments/paypal', method: 'POST', label: 'PayPal Payment', group: 'payments', model: 'Payment', service: 'payments/paypal' },
  { id: 'a-webhook-rp', path: '/api/webhooks/razorpay', method: 'POST', label: 'Razorpay Webhook', group: 'payments', model: 'Payment', service: 'payments/razorpay' },
  // Users
  { id: 'a-user-me', path: '/api/users/me', method: 'GET', label: 'Get Profile', group: 'users', model: 'User', service: null },
  { id: 'a-user-update', path: '/api/users/me', method: 'PUT', label: 'Update Profile', group: 'users', model: 'User', service: null },
  { id: 'a-user-delete', path: '/api/users/delete', method: 'DELETE', label: 'Delete Account', group: 'users', model: 'User', service: 'email' },
  // Notifications
  { id: 'a-notif', path: '/api/notifications', method: 'GET', label: 'Get Notifications', group: 'notifications', model: 'Notification', service: null },
  // Chat
  { id: 'a-chat', path: '/api/chat', method: 'POST', label: 'AI Chat', group: 'chat', model: 'ChatMessage', service: 'ai/copilot' },
  // Predictions
  { id: 'a-predict', path: '/api/predictions', method: 'POST', label: 'Viral Prediction', group: 'predictions', model: 'ViralPrediction', service: 'ml/ensemble' },
  // Trends
  { id: 'a-trends', path: '/api/trends', method: 'GET', label: 'Trending Content', group: 'trends', model: null, service: 'trends' },
  // Scheduler
  { id: 'a-schedule', path: '/api/schedule', method: 'POST', label: 'Schedule Post', group: 'scheduler', model: 'ScheduledPost', service: 'scheduler' },
  // Admin
  { id: 'a-admin-users', path: '/api/admin/users', method: 'GET', label: 'List Users', group: 'admin', model: 'User', service: null },
  { id: 'a-admin-plans', path: '/api/admin/plans', method: 'GET|POST', label: 'Manage Plans', group: 'admin', model: 'Plan', service: null },
  { id: 'a-admin-roles', path: '/api/admin/roles', method: 'GET|POST', label: 'Manage Roles', group: 'admin', model: 'Role', service: null },
  // Super Admin
  { id: 'a-super-live', path: '/api/admin/super/analytics/live', method: 'GET', label: 'Live Users', group: 'super', model: 'UserSession', service: null },
  { id: 'a-super-overview', path: '/api/admin/super/analytics/overview', method: 'GET', label: 'Overview Stats', group: 'super', model: 'User', service: null },
  { id: 'a-super-revenue', path: '/api/admin/super/analytics/revenue', method: 'GET', label: 'Revenue Stats', group: 'super', model: 'Payment', service: null },
  { id: 'a-super-funnel', path: '/api/admin/super/analytics/funnel', method: 'GET', label: 'Conversion Funnel', group: 'super', model: 'FunnelEvent', service: null },
  { id: 'a-super-heatmap', path: '/api/admin/super/analytics/heatmap', method: 'GET', label: 'Page Heatmap', group: 'super', model: 'TrackingPageStatsDaily', service: null },
  { id: 'a-super-visitor', path: '/api/admin/super/analytics/visitor-stats', method: 'GET', label: 'Visitor Stats', group: 'super', model: 'UserSession', service: null },
  { id: 'a-super-controls', path: '/api/admin/super/controls', method: 'GET|POST', label: 'Platform Controls', group: 'super', model: null, service: null },
  // Cron
  { id: 'a-cron-marketing', path: '/api/cron/marketing-emails', method: 'GET', label: 'Marketing Emails Cron', group: 'cron', model: 'MarketingEmail', service: 'email' },
  // Compliance
  { id: 'a-compliance-abuse', path: '/api/compliance/abuse', method: 'GET|POST', label: 'Abuse Logs', group: 'compliance', model: 'AbuseLog', service: null },
];

// ── Models ───────────────────────────────────────────────────────────────────
const MODELS = [
  { id: 'm-user', name: 'User', category: 'core', fields: ['email', 'name', 'subscription', 'role', 'uniqueId'] },
  { id: 'm-pending', name: 'PendingUser', category: 'core', fields: ['email', 'otp', 'expiresAt'] },
  { id: 'm-video', name: 'Video', category: 'content', fields: ['videoId', 'title', 'channelId', 'stats'] },
  { id: 'm-channel', name: 'Channel', category: 'content', fields: ['channelId', 'title', 'subscribers', 'userId'] },
  { id: 'm-analysis', name: 'Analysis', category: 'content', fields: ['videoId', 'seoScore', 'viralScore', 'tags'] },
  { id: 'm-scheduled', name: 'ScheduledPost', category: 'content', fields: ['userId', 'videoFile', 'scheduledAt', 'status'] },
  { id: 'm-competitor', name: 'Competitor', category: 'content', fields: ['userId', 'channelId', 'tracking'] },
  { id: 'm-aihook', name: 'AIHook', category: 'ai', fields: ['userId', 'topic', 'hooks', 'model'] },
  { id: 'm-aiscript', name: 'AIScript', category: 'ai', fields: ['userId', 'topic', 'script', 'model'] },
  { id: 'm-aishorts', name: 'AIShorts', category: 'ai', fields: ['userId', 'videoUrl', 'clips'] },
  { id: 'm-aithumb', name: 'AIThumbnail', category: 'ai', fields: ['userId', 'prompt', 'imageUrl'] },
  { id: 'm-aimodel', name: 'AIModelVersion', category: 'ai', fields: ['provider', 'model', 'status', 'latency'] },
  { id: 'm-payment', name: 'Payment', category: 'billing', fields: ['userId', 'amount', 'currency', 'status', 'provider'] },
  { id: 'm-subscription', name: 'Subscription', category: 'billing', fields: ['userId', 'planId', 'status', 'expiresAt'] },
  { id: 'm-plan', name: 'Plan', category: 'billing', fields: ['name', 'price', 'features', 'limits'] },
  { id: 'm-discount', name: 'PlanDiscount', category: 'billing', fields: ['code', 'percentage', 'validUntil'] },
  { id: 'm-session', name: 'UserSession', category: 'analytics', fields: ['userId', 'sessionId', 'country', 'city', 'isActive'] },
  { id: 'm-tracking', name: 'TrackingLog', category: 'analytics', fields: ['userId', 'page', 'eventType', 'country'] },
  { id: 'm-pagestats', name: 'TrackingPageStatsDaily', category: 'analytics', fields: ['page', 'day', 'visits'] },
  { id: 'm-funnel', name: 'FunnelEvent', category: 'analytics', fields: ['userId', 'step', 'plan', 'amount'] },
  { id: 'm-activity', name: 'ActivityLog', category: 'analytics', fields: ['userId', 'action', 'resource', 'timestamp'] },
  { id: 'm-timeline', name: 'ActivityTimeline', category: 'analytics', fields: ['userId', 'type', 'data'] },
  { id: 'm-engagement', name: 'EngagementMetrics', category: 'analytics', fields: ['videoId', 'views', 'likes', 'comments'] },
  { id: 'm-chatmsg', name: 'ChatMessage', category: 'chat', fields: ['sessionId', 'role', 'content'] },
  { id: 'm-chatsession', name: 'ChatSession', category: 'chat', fields: ['userId', 'title', 'messages'] },
  { id: 'm-notif', name: 'Notification', category: 'system', fields: ['userId', 'type', 'message', 'read'] },
  { id: 'm-webhook', name: 'Webhook', category: 'system', fields: ['userId', 'url', 'events', 'active'] },
  { id: 'm-apikey', name: 'ApiKey', category: 'system', fields: ['userId', 'key', 'name', 'permissions'] },
  { id: 'm-role', name: 'Role', category: 'system', fields: ['name', 'permissions', 'description'] },
  { id: 'm-team', name: 'Team', category: 'system', fields: ['name', 'ownerId', 'members'] },
  { id: 'm-viral', name: 'ViralPrediction', category: 'ml', fields: ['videoId', 'score', 'factors'] },
  { id: 'm-dataset', name: 'ViralDataset', category: 'ml', fields: ['features', 'label', 'source'] },
  { id: 'm-growth', name: 'YoutubeGrowth', category: 'ml', fields: ['channelId', 'projections'] },
  { id: 'm-abuse', name: 'AbuseLog', category: 'compliance', fields: ['userId', 'type', 'details'] },
  { id: 'm-deletion', name: 'DeletionLog', category: 'compliance', fields: ['userId', 'reason', 'completedAt'] },
  { id: 'm-control', name: 'ControlLog', category: 'compliance', fields: ['action', 'admin', 'timestamp'] },
  { id: 'm-marketing', name: 'MarketingEmail', category: 'marketing', fields: ['userId', 'emailType', 'status'] },
  { id: 'm-preview', name: 'Preview', category: 'content', fields: ['videoId', 'thumbnailUrl', 'title'] },
];

// ── Services ─────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 's-email', name: 'email', label: 'Email Service', desc: 'Resend + SMTP hybrid email delivery', category: 'core' },
  { id: 's-otp', name: 'otp', label: 'OTP Service', desc: 'Email OTP generation & verification', category: 'core' },
  { id: 's-ai-models', name: 'ai/models', label: 'AI Models', desc: 'Multi-provider AI (OpenAI, Gemini, Groq, etc.)', category: 'ai' },
  { id: 's-ai-video', name: 'ai/videoAnalysis', label: 'Video Analysis', desc: 'AI-powered video SEO & viral scoring', category: 'ai' },
  { id: 's-ai-copilot', name: 'ai/copilot', label: 'AI Copilot', desc: 'Conversational AI assistant', category: 'ai' },
  { id: 's-ai-adaptive', name: 'ai/adaptiveLearning', label: 'Adaptive Learning', desc: 'AI model performance tracking', category: 'ai' },
  { id: 's-ai-embed', name: 'ai/embeddings', label: 'Embeddings', desc: 'Vector embeddings for similarity', category: 'ai' },
  { id: 's-ml-ensemble', name: 'ml/ensemble', label: 'ML Ensemble', desc: 'Viral prediction ensemble models', category: 'ml' },
  { id: 's-ml-features', name: 'ml/featureUtils', label: 'Feature Utils', desc: 'ML feature extraction', category: 'ml' },
  { id: 's-yt', name: 'youtube', label: 'YouTube Service', desc: 'YouTube Data API v3 integration', category: 'youtube' },
  { id: 's-yt-channel', name: 'youtube/channelAnalytics', label: 'Channel Analytics', desc: 'Deep channel analysis', category: 'youtube' },
  { id: 's-yt-video', name: 'youtube/videoStats', label: 'Video Stats', desc: 'Video performance tracking', category: 'youtube' },
  { id: 's-yt-upload', name: 'youtube/uploads', label: 'YouTube Upload', desc: 'Video upload to YouTube', category: 'youtube' },
  { id: 's-scheduler', name: 'scheduler', label: 'Scheduler', desc: 'Content calendar & auto-posting', category: 'automation' },
  { id: 's-razorpay', name: 'payments/razorpay', label: 'Razorpay', desc: 'Indian payment gateway', category: 'payments' },
  { id: 's-paypal', name: 'payments/paypal', label: 'PayPal', desc: 'International payments', category: 'payments' },
  { id: 's-trends', name: 'trends', label: 'Trends Discovery', desc: 'Trending content discovery engine', category: 'analytics' },
  { id: 's-analytics', name: 'analytics', label: 'Analytics Engine', desc: 'Advanced analytics & insights', category: 'analytics' },
  { id: 's-hashtag', name: 'hashtagGeneration', label: 'Hashtag Generator', desc: 'AI hashtag optimization', category: 'content' },
  { id: 's-title', name: 'titleOptimization', label: 'Title Optimizer', desc: 'SEO title optimization', category: 'content' },
  { id: 's-hooks', name: 'hookAnalysis', label: 'Hook Analysis', desc: 'Video hook effectiveness scoring', category: 'content' },
  { id: 's-multiplatform', name: 'multiplatform', label: 'Multi-Platform', desc: 'Facebook, Instagram, TikTok analyzers', category: 'content' },
  { id: 's-pipeline', name: 'dataPipeline', label: 'Data Pipeline', desc: 'Video data ingestion & processing', category: 'data' },
  { id: 's-webhooks', name: 'webhooks', label: 'Webhooks', desc: 'Outgoing webhook delivery', category: 'system' },
];

// ── Workers ──────────────────────────────────────────────────────────────────
const WORKERS = [
  { id: 'w-ai', name: 'aiWorker', label: 'AI Worker', desc: 'Processes AI generation jobs (hooks, scripts, shorts, thumbnails)', queue: 'ai-jobs' },
  { id: 'w-posting', name: 'postingWorker', label: 'Posting Worker', desc: 'Auto-publishes scheduled content to YouTube', queue: 'posting-jobs' },
  { id: 'w-tracking', name: 'trackingWorker', label: 'Tracking Worker', desc: 'Batches & persists analytics events from BullMQ queue', queue: 'tracking-events' },
];

// ── Data Flow Connections ────────────────────────────────────────────────────
// Each entry: { from, to, label, dataFlow }
const CONNECTIONS = [
  // Auth flows
  { from: 'p-auth', to: 'a-login', label: 'Login request', dataFlow: 'email+password → JWT token' },
  { from: 'p-register', to: 'a-register', label: 'Registration', dataFlow: 'user data → OTP email → User record' },
  { from: 'a-register', to: 's-email', label: 'Send verification', dataFlow: 'email + OTP' },
  { from: 'a-register', to: 'm-user', label: 'Create user', dataFlow: 'User document' },
  { from: 'a-verify', to: 'm-user', label: 'Verify email', dataFlow: 'emailVerified = true' },
  { from: 'p-auth', to: 'a-google', label: 'Google login', dataFlow: 'Google token → JWT' },
  // Dashboard flows
  { from: 'p-dash', to: 'a-user-me', label: 'Load profile', dataFlow: 'JWT → User data' },
  { from: 'p-dash-channels', to: 'a-channels', label: 'Load channels', dataFlow: 'userId → Channel[]' },
  { from: 'p-dash-analytics', to: 'a-analytics', label: 'Load analytics', dataFlow: 'userId → stats' },
  { from: 'p-dash-upload', to: 'a-yt-upload', label: 'Upload video', dataFlow: 'video file + metadata → YouTube' },
  { from: 'p-dash-viral', to: 'a-predict', label: 'Predict viral', dataFlow: 'videoId → viral score' },
  // AI Tool flows
  { from: 'p-ai-hook', to: 'a-ai-hook', label: 'Generate hooks', dataFlow: 'topic → AI → hooks[]' },
  { from: 'a-ai-hook', to: 's-ai-models', label: 'AI inference', dataFlow: 'prompt → OpenAI/Gemini/Groq' },
  { from: 'a-ai-hook', to: 'm-aihook', label: 'Save result', dataFlow: 'AIHook document' },
  { from: 'p-ai-script', to: 'a-ai-script', label: 'Generate script', dataFlow: 'topic → AI → script' },
  { from: 'a-ai-script', to: 's-ai-models', label: 'AI inference', dataFlow: 'prompt → AI provider' },
  { from: 'a-ai-script', to: 'm-aiscript', label: 'Save result', dataFlow: 'AIScript document' },
  { from: 'p-ai-shorts', to: 'a-ai-shorts', label: 'Create shorts', dataFlow: 'videoUrl → clips' },
  { from: 'a-ai-shorts', to: 'w-ai', label: 'Queue job', dataFlow: 'BullMQ job → AI Worker' },
  { from: 'p-ai-thumb', to: 'a-ai-thumb', label: 'Generate thumbnail', dataFlow: 'prompt → AI image' },
  { from: 'a-ai-thumb', to: 's-ai-models', label: 'AI image gen', dataFlow: 'prompt → DALL-E/Stable Diffusion' },
  { from: 'p-ai-channel', to: 'a-channel-audit', label: 'Audit channel', dataFlow: 'channelId → full audit report' },
  { from: 'a-channel-audit', to: 's-yt-channel', label: 'Fetch data', dataFlow: 'YouTube API → channel stats' },
  // Payment flows
  { from: 'p-pricing', to: 'a-pay-create', label: 'Start payment', dataFlow: 'planId → Razorpay order' },
  { from: 'a-pay-create', to: 's-razorpay', label: 'Create order', dataFlow: 'amount + currency → orderId' },
  { from: 'a-pay-verify', to: 's-razorpay', label: 'Verify signature', dataFlow: 'paymentId → verified' },
  { from: 'a-pay-verify', to: 'm-payment', label: 'Save payment', dataFlow: 'Payment document' },
  { from: 'a-pay-verify', to: 'm-user', label: 'Upgrade plan', dataFlow: 'subscription = paid tier' },
  { from: 'a-pay-verify', to: 's-email', label: 'Send receipt', dataFlow: 'Payment receipt email' },
  { from: 'a-webhook-rp', to: 's-razorpay', label: 'Verify webhook', dataFlow: 'signature validation' },
  { from: 'a-webhook-rp', to: 'm-payment', label: 'Update status', dataFlow: 'payment status sync' },
  // Tracking flows
  { from: 'a-track', to: 'w-tracking', label: 'Queue event', dataFlow: 'BullMQ → tracking worker' },
  { from: 'w-tracking', to: 'm-tracking', label: 'Batch insert', dataFlow: 'TrackingLog documents' },
  { from: 'w-tracking', to: 'm-session', label: 'Update session', dataFlow: 'UserSession heartbeat' },
  { from: 'w-tracking', to: 'm-pagestats', label: 'Aggregate', dataFlow: 'daily page stats upsert' },
  // Super Admin flows
  { from: 'p-super-live', to: 'a-super-live', label: 'Live data', dataFlow: 'active sessions + geo' },
  { from: 'p-super-live', to: 'a-super-visitor', label: 'Stats', dataFlow: 'country-wise daily/weekly/monthly/yearly' },
  { from: 'p-super-live', to: 'a-super-heatmap', label: 'Heatmap', dataFlow: 'page visit heatmap' },
  { from: 'p-super-analytics', to: 'a-super-overview', label: 'Overview', dataFlow: 'totalUsers, newToday, revenue' },
  { from: 'p-super-revenue', to: 'a-super-revenue', label: 'Revenue data', dataFlow: 'payment aggregations' },
  // Marketing automation
  { from: 'a-cron-marketing', to: 'm-user', label: 'Find users', dataFlow: 'free users, new users, paid users' },
  { from: 'a-cron-marketing', to: 'm-marketing', label: 'Track emails', dataFlow: 'MarketingEmail records' },
  { from: 'a-cron-marketing', to: 's-email', label: 'Send emails', dataFlow: 'welcome, drip, upgrade emails' },
  // Scheduler flows
  { from: 'p-calendar', to: 'a-schedule', label: 'Schedule post', dataFlow: 'video + time → ScheduledPost' },
  { from: 'a-schedule', to: 'm-scheduled', label: 'Save schedule', dataFlow: 'ScheduledPost document' },
  { from: 'w-posting', to: 'm-scheduled', label: 'Pick job', dataFlow: 'due ScheduledPosts' },
  { from: 'w-posting', to: 's-yt-upload', label: 'Upload', dataFlow: 'video → YouTube API' },
  // Chat
  { from: 'a-chat', to: 's-ai-copilot', label: 'AI response', dataFlow: 'message → AI → reply' },
  { from: 'a-chat', to: 'm-chatmsg', label: 'Save message', dataFlow: 'ChatMessage document' },
];

// ── Workflow Automations ─────────────────────────────────────────────────────
const WORKFLOWS = [
  {
    id: 'wf-welcome',
    name: 'Welcome Email Flow',
    trigger: 'User registers',
    steps: [
      { order: 1, action: 'Create User record', target: 'User model' },
      { order: 2, action: 'Send verification OTP email', target: 'Email Service' },
      { order: 3, action: 'User verifies email', target: 'Verify Email API' },
      { order: 4, action: 'Cron: Send welcome email (within 24h)', target: 'Marketing Cron' },
      { order: 5, action: 'Start drip sequence (every 2 days)', target: 'Marketing Cron' },
    ],
    status: 'active',
  },
  {
    id: 'wf-drip',
    name: 'Free User Drip Campaign',
    trigger: 'User on free plan > 2 days',
    steps: [
      { order: 1, action: 'Drip 1: AI Video Analyzer feature', target: 'Email Service' },
      { order: 2, action: 'Drip 2: Tag & Title Generator', target: 'Email Service' },
      { order: 3, action: 'Drip 3: Competitor Tracking', target: 'Email Service' },
      { order: 4, action: 'Drip 4: AI Script Generator', target: 'Email Service' },
      { order: 5, action: 'Drip 5: Upgrade to Pro CTA', target: 'Email Service' },
    ],
    status: 'active',
  },
  {
    id: 'wf-upgrade',
    name: 'Paid User Upgrade Flow',
    trigger: 'Starter/Pro user > 14 days on plan',
    steps: [
      { order: 1, action: 'Check current plan tier', target: 'User model' },
      { order: 2, action: 'Send tier-specific upgrade email', target: 'Email Service' },
      { order: 3, action: 'Track email delivery', target: 'MarketingEmail model' },
    ],
    status: 'active',
  },
  {
    id: 'wf-payment',
    name: 'Payment Processing Flow',
    trigger: 'User selects plan on pricing page',
    steps: [
      { order: 1, action: 'Create Razorpay/PayPal order', target: 'Payment Service' },
      { order: 2, action: 'User completes payment', target: 'Payment Gateway' },
      { order: 3, action: 'Verify payment signature', target: 'Verify API' },
      { order: 4, action: 'Update user subscription', target: 'User model' },
      { order: 5, action: 'Send payment receipt email', target: 'Email Service' },
      { order: 6, action: 'Log funnel event: payment_success', target: 'FunnelEvent model' },
    ],
    status: 'active',
  },
  {
    id: 'wf-ai-gen',
    name: 'AI Content Generation',
    trigger: 'User requests AI generation',
    steps: [
      { order: 1, action: 'Check user feature access & limits', target: 'Feature Guard' },
      { order: 2, action: 'Route to best AI provider', target: 'AI Router' },
      { order: 3, action: 'Generate content (OpenAI → Gemini → Groq fallback)', target: 'AI Models Service' },
      { order: 4, action: 'Save result to database', target: 'AI Model (Hook/Script/etc.)' },
      { order: 5, action: 'Update usage stats', target: 'User model' },
      { order: 6, action: 'Return result to frontend', target: 'API Response' },
    ],
    status: 'active',
  },
  {
    id: 'wf-tracking',
    name: 'Real-time Tracking Pipeline',
    trigger: 'User navigates / interacts',
    steps: [
      { order: 1, action: 'Client sends tracking event', target: 'Track API' },
      { order: 2, action: 'Resolve IP → geolocation', target: 'Geolocation Service' },
      { order: 3, action: 'Push to BullMQ queue', target: 'Tracking Queue' },
      { order: 4, action: 'Worker batches events (1s / 200 max)', target: 'Tracking Worker' },
      { order: 5, action: 'Insert TrackingLog + update UserSession', target: 'MongoDB' },
      { order: 6, action: 'Aggregate daily page stats', target: 'TrackingPageStatsDaily' },
      { order: 7, action: 'Emit socket event for live dashboard', target: 'Socket.IO' },
    ],
    status: 'active',
  },
  {
    id: 'wf-schedule-post',
    name: 'Scheduled Post Auto-Publish',
    trigger: 'Scheduled time reached',
    steps: [
      { order: 1, action: 'Posting Worker picks due posts', target: 'ScheduledPost model' },
      { order: 2, action: 'Auto-generate SEO metadata if missing', target: 'AI Models Service' },
      { order: 3, action: 'Upload video to YouTube', target: 'YouTube Upload Service' },
      { order: 4, action: 'Update post status to published', target: 'ScheduledPost model' },
      { order: 5, action: 'Send notification to user', target: 'Notification model' },
    ],
    status: 'active',
  },
  {
    id: 'wf-channel-audit',
    name: 'Channel Intelligence Audit',
    trigger: 'User requests channel audit',
    steps: [
      { order: 1, action: 'Fetch channel data from YouTube API', target: 'YouTube Service' },
      { order: 2, action: 'Analyze growth patterns', target: 'Channel Analytics Service' },
      { order: 3, action: 'Run AI analysis on content strategy', target: 'AI Models Service' },
      { order: 4, action: 'Generate audit report', target: 'Channel model' },
      { order: 5, action: 'Return interactive report to user', target: 'Frontend' },
    ],
    status: 'active',
  },
];

export async function GET(request: Request) {
  try {
    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    return NextResponse.json({
      pages: PAGES,
      apis: APIS,
      models: MODELS,
      services: SERVICES,
      workers: WORKERS,
      connections: CONNECTIONS,
      workflows: WORKFLOWS,
      stats: {
        totalPages: PAGES.length,
        totalApis: APIS.length,
        totalModels: MODELS.length,
        totalServices: SERVICES.length,
        totalWorkers: WORKERS.length,
        totalConnections: CONNECTIONS.length,
        totalWorkflows: WORKFLOWS.length,
      },
    });
  } catch (error) {
    console.error('[Workflows API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
