# ViralBoost AI - Plan Features & Configuration Guide

## 📋 Overview

यह गाइड सभी website systems और functions को विस्तार से दर्शाती है जिन्हें आप plans में configure कर सकते हैं।

---

## 🏗️ Website Systems & Functions

### 1. **Authentication & User Management System**

#### Features:
- Email/Password login
- Unique ID + PIN login
- OAuth integrations
- OTP verification
- Password reset & recovery
- User profile management
- Role-based access control (RBAC)

#### Plan Configuration:
```json
{
  "featureFlags": {
    "emailSupport": true,
    "advancedSecurityFeatures": false,
    "ssoIntegration": false
  },
  "limits": {
    "teamMembers": 1,
    "apiKeys": 1
  }
}
```

#### API Endpoints:
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - User registration
- `POST /api/auth/otp/send` - Send OTP
- `POST /api/auth/otp/verify` - Verify OTP
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user

---

### 2. **Video Analysis & Processing System**

#### Features:
- **Video Upload**: Upload video files (MP4, WebM, etc.)
- **YouTube Import**: Paste YouTube URL for analysis
- **Facebook/Instagram/TikTok Import**: Import from social platforms
- **Thumbnail Analysis**: Detect faces, emotions, color contrast
- **Video Hook Analysis**: Analyze first 3 seconds (motion, faces, brightness)
- **Title Optimization**: Generate viral title suggestions
- **Hashtag Generation**: Create optimized hashtags
- **Viral Prediction**: Calculate viral probability score
- **Content Strategy**: Content recommendations
- **Bulk Upload**: Process multiple videos at once

#### Plan Configuration:
```json
{
  "limits": {
    "analysesLimit": 30,
    "analysesPeriod": "day",
    "maxVideoSize": 1000,
    "maxTitleSuggestions": 10,
    "maxHashtagCount": 20,
    "bulkUploadLimit": 5
  },
  "featureFlags": {
    "videoUpload": true,
    "youtubeImport": true,
    "facebookImport": true,
    "instagramImport": true,
    "tiktokImport": true,
    "thumbnailAnalysis": true,
    "hookAnalysis": true,
    "titleOptimization": true,
    "hashtagGeneration": true,
    "contentStrategy": true,
    "bulkUpload": true
  }
}
```

#### API Endpoints:
- `POST /api/videos/upload` - Upload video
- `POST /api/videos/youtube` - Import from YouTube
- `POST /api/videos/facebook` - Import from Facebook
- `POST /api/videos/instagram` - Import from Instagram
- `POST /api/videos/tiktok` - Import from TikTok
- `POST /api/videos/bulk` - Bulk upload
- `GET /api/analytics` - Get analysis results
- `GET /api/viral/predict` - Get viral prediction

---

### 3. **AI Studio System**

#### Features:
- **Script Writer**: AI-powered script generation
- **Thumbnail Maker**: AI thumbnail generation ideas
- **Hook Generator**: Generate engaging hooks
- **AI Shorts Creator**: Create short-form content
- **Title Generator**: Generate titles
- **Daily Ideas**: Daily content ideas
- **AI Coach**: Get coaching tips
- **Keyword Research**: Research keywords
- **Channel Audit Tool**: Audit YouTube channel
- **Optimize Tool**: Content optimization

#### Plan Configuration:
```json
{
  "featureFlags": {
    "scriptWriter": true,
    "thumbnailIdeas": true,
    "hookGenerator": true,
    "shortsCreator": true,
    "titleGenerator": true,
    "dailyIdeas": true,
    "aiCoach": true,
    "keywordResearch": true,
    "channelAudit": true,
    "optimize": true
  },
  "limits": {
    "dailyIdeaRequestsLimit": -1,
    "scriptGenerationsLimit": 10,
    "keywordResearchLimit": 50
  }
}
```

#### API Endpoints:
- `POST /api/ai/script-writer` - Generate script
- `POST /api/ai/thumbnail` - Generate thumbnail ideas
- `POST /api/ai/hook` - Generate hooks
- `POST /api/ai/shorts` - Create shorts
- `POST /api/ai/train` - Train custom AI model
- `POST /api/ai/predict` - Make predictions

---

### 4. **Analytics & Dashboard System**

#### Features:
- **Overview Dashboard**: Quick stats and metrics
- **Performance Analytics**: Video performance tracking
- **Engagement Analytics**: Engagement metrics
- **Growth Analytics**: Growth tracking
- **Heatmap Analytics**: Posting time heatmap
- **Retention Analytics**: User retention analysis
- **Benchmark Analytics**: Compare with competitors
- **Insights Dashboard**: AI-powered insights
- **Custom Reports**: Generate custom reports
- **Export Data**: Export analytics as PDF/CSV

#### Plan Configuration:
```json
{
  "featureFlags": {
    "overviewDashboard": true,
    "performanceAnalytics": true,
    "engagementAnalytics": true,
    "growthAnalytics": true,
    "heatmapAnalytics": true,
    "retentionAnalytics": true,
    "benchmarkAnalytics": true,
    "insightsDashboard": true,
    "customReports": false,
    "advancedAnalyticsDashboard": false,
    "dataExport": true
  },
  "limits": {
    "reportGenerationsPerMonth": 10,
    "customReportsLimit": 0,
    "dataRetentionDays": 90
  }
}
```

#### API Endpoints:
- `GET /api/analytics/overview` - Get overview stats
- `GET /api/analytics/performance` - Get performance data
- `GET /api/analytics/engagement` - Get engagement stats
- `GET /api/analytics/growth` - Get growth analytics
- `GET /api/analytics/heatmap` - Get posting time heatmap
- `GET /api/analytics/insights` - Get AI insights
- `POST /api/analytics/export` - Export analytics
- `GET /api/analytics/benchmark` - Benchmark against competitors

---

### 5. **Social Media Integration System**

#### Features:
- **YouTube Integration**: Connect YouTube channel
- **Facebook Integration**: Connect Facebook page
- **Instagram Integration**: Connect Instagram account
- **TikTok Integration**: Connect TikTok account
- **Channel Analytics**: Track channel metrics
- **Multi-Channel Management**: Manage multiple channels
- **Social Posting**: Post directly to social platforms

#### Plan Configuration:
```json
{
  "featureFlags": {
    "youtubeIntegration": true,
    "facebookIntegration": true,
    "instagramIntegration": true,
    "tiktokIntegration": true,
    "multiChannelManagement": true,
    "socialPosting": true
  },
  "limits": {
    "connectedChannels": 3,
    "connectedAccounts": 5
  }
}
```

#### API Endpoints:
- `POST /api/channel/connect-youtube` - Connect YouTube
- `POST /api/channel/connect-facebook` - Connect Facebook
- `GET /api/channel/list` - List connected channels
- `POST /api/schedule/post` - Schedule social post
- `GET /api/youtube/analytics` - YouTube analytics

---

### 6. **Content Calendar & Scheduling System**

#### Features:
- **Content Calendar**: Visual calendar view
- **Schedule Posts**: Schedule posts for future
- **Bulk Scheduling**: Schedule multiple posts
- **Reminder Notifications**: Get reminders
- **Post Templates**: Use content templates
- **Calendar Analytics**: View calendar stats

#### Plan Configuration:
```json
{
  "featureFlags": {
    "contentCalendar": true,
    "schedulePost": true,
    "bulkScheduling": false,
    "postTemplates": true,
    "calendarAnalytics": false
  },
  "limits": {
    "scheduledPostsLimit": 10,
    "bulkScheduleLimit": 50,
    "calendarViewMonths": 3
  }
}
```

#### API Endpoints:
- `GET /api/schedule/calendar` - Get calendar data
- `POST /api/schedule/post` - Schedule a post
- `PATCH /api/schedule/:id` - Edit scheduled post
- `DELETE /api/schedule/:id` - Delete scheduled post
- `GET /api/schedule/templates` - Get templates

---

### 7. **Trending Topics & Hashtag System**

#### Features:
- **Trending Topics Engine**: Find trending topics
- **Hashtag Generator**: Generate relevant hashtags
- **Hashtag Research**: Research hashtag performance
- **Trending Alerts**: Get trending alerts
- **Niche-specific Trends**: Industry-specific trends
- **Hashtag Analytics**: Track hashtag performance

#### Plan Configuration:
```json
{
  "featureFlags": {
    "trendingTopics": true,
    "hashtagGenerator": true,
    "hashtagResearch": true,
    "trendingAlerts": false,
    "realTimeTrendAnalysis": false,
    "nicheSpecificTrends": false
  },
  "limits": {
    "hashtagCount": 20,
    "trendingSearchesPerDay": 10,
    "hashtagResearchLimit": 50
  }
}
```

#### API Endpoints:
- `GET /api/trending/topics` - Get trending topics
- `POST /api/hashtags/generate` - Generate hashtags
- `GET /api/hashtags/research` - Research hashtags
- `GET /api/trending/alerts` - Get trending alerts

---

### 8. **Competitor Analysis System**

#### Features:
- **Competitor Tracking**: Track competitor channels
- **Performance Comparison**: Compare metrics
- **Strategy Analysis**: Analyze competitor strategies
- **Growth Tracking**: Track competitor growth
- **Benchmark Reports**: Benchmark against competitors
- **Competitor Alerts**: Get alerted on competitor actions

#### Plan Configuration:
```json
{
  "featureFlags": {
    "competitorAnalysis": true,
    "performanceComparison": true,
    "strategyAnalysis": false,
    "growthTracking": false,
    "benchmarkReports": false,
    "competitorAlerts": false
  },
  "limits": {
    "competitorsTracked": 50,
    "competitorComparisonsPerMonth": 20,
    "strategyInsightsLimit": 10
  }
}
```

#### API Endpoints:
- `POST /api/competitor/add` - Add competitor
- `GET /api/competitor/list` - List competitors
- `GET /api/competitor/compare` - Compare metrics
- `GET /api/competitor/analysis` - Get analysis

---

### 9. **Subscription & Billing System**

#### Features:
- **Plan Management**: Create/edit/delete plans
- **Discount Management**: Create promotional discounts
- **User Plan Assignment**: Assign plans to users
- **Subscription Management**: Manage user subscriptions
- **Payment Processing**: Process payments
- **Invoice Management**: Generate invoices
- **Usage Tracking**: Track plan usage
- **Billing History**: View billing history

#### Plan Configuration:
```json
{
  "featureFlags": {
    "plansManagement": false,
    "discountManagement": false,
    "userPlanAssignment": false,
    "paymentProcessing": true,
    "invoiceGeneration": true,
    "usageTracking": true,
    "billingHistory": true
  ],
  "limits": {
    "priceMonthly": 15,
    "priceYearly": 150,
    "maxTeamSize": 1
  }
}
```

#### API Endpoints:
- `GET /api/subscriptions/plans` - Get all plans
- `POST /api/admin/plans` - Create plan (super-admin)
- `PATCH /api/admin/plans` - Edit plan (super-admin)
- `DELETE /api/admin/plans` - Delete plan (super-admin)
- `GET /api/admin/plan-discounts` - Get discounts (super-admin)
- `POST /api/admin/plan-discounts` - Create discount (super-admin)
- `POST /api/admin/user-plans` - Assign plan (super-admin)
- `GET /api/subscriptions/usage` - Check usage
- `GET /api/subscriptions/invoices` - Get invoices

---

### 10. **Team & Collaboration System**

#### Features:
- **Team Management**: Create and manage teams
- **Member Roles**: Assign member roles
- **Workspace Sharing**: Share workspaces
- **Collaboration Tools**: Collaborate on content
- **Permission Management**: Control access
- **Team Analytics**: View team analytics
- **Audit Logs**: Track team actions

#### Plan Configuration:
```json
{
  "featureFlags": {
    "teamManagement": false,
    "memberRoles": false,
    "workspaceSharing": false,
    "collaborationTools": false,
    "permissionManagement": false,
    "teamCollaboration": false,
    "auditLogs": false
  },
  "limits": {
    "teamMembers": 1,
    "workspacesPerTeam": 1,
    "projectsPerWorkspace": 5
  }
}
```

#### API Endpoints:
- `POST /api/team/create` - Create team
- `POST /api/team/members/add` - Add member
- `PATCH /api/team/members/:id/role` - Change member role
- `GET /api/team/analytics` - Team analytics
- `GET /api/team/audit-logs` - Audit logs

---

### 11. **Support & Documentation System**

#### Features:
- **Email Support**: Email support access
- **Priority Support**: Get priority responses
- **24/7 Support**: Round-the-clock support
- **Knowledge Base**: Access knowledge base
- **Live Chat**: Live chat support
- **Documentation Access**: Full documentation

#### Plan Configuration:
```json
{
  "featureFlags": {
    "emailSupport": true,
    "prioritySupport": false,
    "liveChat": false,
    "dedicatedAccountManager": false,
    "prioritySupport24x7": false
  },
  "limits": {
    "supportTicketsPerMonth": 20,
    "responseTimeHours": 24,
    "documentsAccessLevel": "basic"
  }
}
```

#### API Endpoints:
- `POST /api/support/ticket` - Create support ticket
- `GET /api/support/tickets` - Get your tickets
- `GET /api/docs` - Get documentation

---

### 12. **Customization & White-Label System**

#### Features:
- **White-Label Reports**: Branded reports
- **Custom Branding**: Custom logo/colors
- **Custom Domain**: Use custom domain
- **Custom CSS**: Custom styling
- **API Access**: Full API access

#### Plan Configuration:
```json
{
  "featureFlags": {
    "whiteLabelReports": false,
    "customBranding": false,
    "customDomain": false,
    "customCss": false,
    "apiAccess": false,
    "customIntegrations": false
  },
  "limits": {
    "apiRateLimit": 100,
    "apiCallsPerMonth": 1000,
    "customDomainsAllowed": 0
  }
}
```

#### API Endpoints:
- `GET /api/settings/branding` - Get branding settings
- `PATCH /api/settings/branding` - Update branding
- `GET /api/settings/domain` - Get custom domain settings

---

### 13. **Machine Learning & Model Training**

#### Features:
- **Viral Prediction Model**: Advanced viral prediction
- **Custom Model Training**: Train custom AI models
- **Model Fine-tuning**: Fine-tune existing models
- **Advanced Analytics**: Advanced analytics features

#### Plan Configuration:
```json
{
  "featureFlags": {
    "advancedAiViralPrediction": true,
    "customAiModelTraining": false,
    "modelFineTuning": false,
    "advancedAnalyticsDashboard": false,
    "priorityProcessing": false
  },
  "limits": {
    "modelTrainingLimit": 0,
    "trainingDataRecords": 0,
    "processingPriority": "standard"
  }
}
```

#### API Endpoints:
- `POST /api/ai/train` - Train model (super-admin)
- `POST /api/ai/predict` - Make prediction
- `GET /api/ai/models` - List models
- `PATCH /api/ai/models/:id` - Update model

---

## 📊 Default Plan Configurations

### **Free Plan**
```json
{
  "planId": "free",
  "name": "Free",
  "priceMonthly": 0,
  "role": "user",
  "limits": {
    "analysesLimit": 5,
    "analysesPeriod": "month",
    "titleSuggestions": 3,
    "hashtagCount": 10,
    "competitorsTracked": 3
  },
  "featureFlags": {
    "videoUpload": true,
    "youtubeImport": true,
    "thumbnailAnalysis": true,
    "hookAnalysis": true,
    "titleOptimization": true,
    "hashtagGeneration": true,
    "dailyIdeas": false,
    "emailSupport": false,
    "contentCalendar": false,
    "bulkUpload": false,
    "advancedAiViralPrediction": false
  }
}
```

### **Starter Plan** ($3/month)
```json
{
  "planId": "starter",
  "name": "Starter",
  "priceMonthly": 3,
  "role": "user",
  "limits": {
    "analysesLimit": 10,
    "analysesPeriod": "day",
    "titleSuggestions": 5,
    "hashtagCount": 15,
    "competitorsTracked": 10
  },
  "featureFlags": {
    "videoUpload": true,
    "youtubeImport": true,
    "facebookImport": true,
    "thumbnailAnalysis": true,
    "hookAnalysis": true,
    "titleOptimization": true,
    "hashtagGeneration": true,
    "dailyIdeas": true,
    "scriptWriter": true,
    "emailSupport": true,
    "contentCalendar": true,
    "advancedAiViralPrediction": true
  }
}
```

### **Pro Plan** ($15/month)
```json
{
  "planId": "pro",
  "name": "Pro",
  "role": "manager",
  "priceMonthly": 15,
  "limits": {
    "analysesLimit": 30,
    "analysesPeriod": "day",
    "titleSuggestions": 10,
    "hashtagCount": 20,
    "competitorsTracked": 50,
    "teamMembers": 3,
    "scheduledPostsLimit": 50,
    "connectedChannels": 5
  },
  "featureFlags": {
    "videoUpload": true,
    "allSocialImports": true,
    "allAnalysis": true,
    "dailyIdeas": true,
    "aiCoach": true,
    "keywordResearch": true,
    "scriptWriter": true,
    "emailSupport": true,
    "prioritySupport": true,
    "contentCalendar": true,
    "bulkScheduling": true,
    "competitorAnalysis": true,
    "teamCollaboration": true,
    "advancedAnalyticsDashboard": true
  }
}
```

### **Enterprise Plan** ($25/month)
```json
{
  "planId": "enterprise",
  "name": "Enterprise",
  "role": "admin",
  "priceMonthly": 25,
  "limits": {
    "analysesLimit": 100,
    "analysesPeriod": "day",
    "teamMembers": -1,
    "scheduledPostsLimit": -1,
    "connectedChannels": -1
  },
  "featureFlags": {
    "allFeatures": true,
    "whiteLabelReports": true,
    "customBranding": true,
    "teamCollaboration": true,
    "customAiModelTraining": true,
    "dedicatedAccountManager": true,
    "prioritySupport24x7": true,
    "customIntegrations": true,
    "advancedAnalyticsDashboard": true
  }
}
```

---

## 🔧 Plan Management API Reference

### Create New Plan
```bash
POST /api/admin/plans
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "custom",
  "name": "Custom Plan",
  "priceMonthly": 19.99,
  "priceYearly": 199.99,
  "currency": "USD",
  "billingPeriod": "both",
  "features": [
    "30 video analyses per day",
    "Advanced AI features",
    "Priority support"
  ],
  "limits": {
    "analysesLimit": 30,
    "analysesPeriod": "day",
    "titleSuggestions": 10,
    "hashtagCount": 20,
    "competitorsTracked": 50,
    "teamMembers": 5
  },
  "featureFlags": {
    "videoUpload": true,
    "allSocialImports": true,
    "advancedAiViralPrediction": true,
    "contentCalendar": true,
    "teamCollaboration": true,
    "emailSupport": true,
    "prioritySupport": true,
    "bulkUpload": true
  }
}
```

### Update Plan
```bash
PATCH /api/admin/plans
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "plan_id_here",
  "priceMonthly": 24.99,
  "features": ["Updated features here"],
  "limits": {
    "analysesLimit": 50
  }
}
```

### Create Discount
```bash
POST /api/admin/plan-discounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "pro",
  "label": "Launch Special",
  "percentage": 30,
  "startsAt": "2024-03-22T00:00:00",
  "endsAt": "2024-03-29T23:59:59"
}
```

### Assign Plan to User
```bash
POST /api/admin/user-plans
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "plan": "pro",
  "billingPeriod": "month",
  "duration": 30
}
```

### Extend User Subscription
```bash
PATCH /api/admin/user-plans
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "extend",
  "duration": 30
}
```

---

## 🎯 How to Configure Plans

### Step 1: Access Super Admin Panel
1. Login as super-admin
2. Go to `/admin/super`
3. Navigate to **Billing & Plans** section

### Step 2: Create or Edit Plans
1. Click **Manage Plans**
2. Fill in plan details:
   - Plan ID (unique identifier)
   - Plan name
   - Monthly/yearly price
   - Features list
   - Enable/disable feature flags
   - Set usage limits

### Step 3: Configure Feature Flags
For each plan, toggle these features:
- Video analysis capabilities
- AI Studio features
- Social media integrations
- Analytics & reporting
- Team collaboration
- Support level
- Custom features

### Step 4: Set Usage Limits
Configure limits for:
- Daily/monthly video analyses
- Title suggestions count
- Hashtag generation count
- Template limit
- Team members
- Scheduled posts
- Connected channels
- API rate limits

### Step 5: Create Promotions
1. Click **Plan Discounts**
2. Create time-limited discounts
3. Set percentage off
4. Apply to specific plans

### Step 6: Assign Plans to Users
1. Click **User Plans**
2. Search user by email
3. Assign plan with duration
4. View subscription status

---

## 📈 Feature Rollout Strategy

### Tier 1: Basic Features (Free Plan)
- Video upload & analysis
- Basic viral prediction
- Title suggestions
- Hashtag generation

### Tier 2: Advanced Features (Starter/Pro)
- All Tier 1 features
- All social media imports
- AI Studio tools
- Content calendar
- Competitor analysis
- Priority support

### Tier 3: Enterprise Features (Enterprise/Custom)
- All Tier 2 features
- Team collaboration
- Custom API access
- White-label reports
- Custom AI training
- Dedicated support

---

## 🔐 Security & Limits

### Rate Limiting per Plan:
- **Free**: 5 API calls/minute
- **Starter**: 50 API calls/minute
- **Pro**: 200 API calls/minute
- **Enterprise**: Unlimited

### Concurrent Users:
- **Free**: 1 user
- **Starter**: 1-2 users
- **Pro**: 3-5 users
- **Enterprise**: Unlimited

### Data Retention:
- **Free**: 30 days
- **Starter**: 90 days
- **Pro**: 1 year
- **Enterprise**: Unlimited

---

## 📝 Notes for Plan Configuration

1. **Always validate** feature compatibility before enabling
2. **Set realistic limits** based on server capacity
3. **Monitor usage** to optimize plan tiers
4. **Update pricing** based on market trends
5. **Test thoroughly** before activating new plans
6. **Document changes** for audit trail
7. **Get super-admin approval** before major changes

---

## 🚀 Quick Reference Checklist

When creating a new plan:

- [ ] Set unique plan ID
- [ ] Add plan name and description
- [ ] Set monthly and yearly pricing
- [ ] Define feature flags (enable/disable features)
- [ ] Set usage limits appropriately
- [ ] Test with sample user
- [ ] Verify all features work
- [ ] Document the plan
- [ ] Announce to users if public
- [ ] Monitor adoption and adjust

---

**Last Updated**: March 2026  
**Version**: 1.0  
**Status**: Production Ready
