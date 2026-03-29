# Plan Management Quick Reference Card

## 🎯 At a Glance

यह एक quick reference card है जिसे आप हमेशा पास रख सकते हैं।

---

## 📍 URLs & Access Points

| Feature | URL | Role |
|---------|-----|------|
| Plan Manager | `/admin/super` → "Manage Plans" | super-admin |
| Discounts | `/admin/super` → "Plan Discounts" | super-admin |
| Assign Plans | `/admin/super` → "User Plans" | super-admin |
| View Plans | `/subscription` | public |
| API Docs | `/api/docs` | developers |

---

## 🚀 Quick Actions

### Create Plan (60 seconds)
```
1. /admin/super → Manage Plans
2. Click "Create New Plan"
3. ID: "new_plan" | Name: "New Plan" | Price: 9.99
4. Toggle features ✅/❌
5. Save
```

### Assign to User (30 seconds)
```
1. /admin/super → User Plans
2. Search email: user@example.com
3. Select plan: "pro"
4. Duration: 30 days
5. Confirm
```

### Create Discount (20 seconds)
```
1. /admin/super → Plan Discounts
2. Click "Create"
3. Plan: "pro" | %%: 30 | 
4. Valid: Now to Next Friday
5. Save
```

---

## 💾 Database Fields

### Plan Document
```javascript
{
  planId: "pro",           // Unique ID
  name: "Pro",             // Display name
  priceMonthly: 15,        // Monthly price
  priceYearly: 150,        // Yearly price
  currency: "USD",         // Currency
  features: [              // Feature list
    "30 analyses/day",
    "AI tools"
  ],
  limits: {
    analysesLimit: 30,
    analysesPeriod: "day",
    titleSuggestions: 10,
    hashtagCount: 20
  },
  featureFlags: {
    scriptWriter: true,
    teamCollaboration: false
  },
  isActive: true,          // Soft delete flag
  isCustom: false          // Is custom plan?
}
```

### Discount Document
```javascript
{
  planId: "pro",
  label: "Spring Sale",
  percentage: 30,
  startsAt: Date,
  endsAt: Date
}
```

---

## 🔌 API Quick Reference

### Plans API
```
GET  /api/admin/plans           - List plans
POST /api/admin/plans           - Create plan
PATCH /api/admin/plans          - Update plan
DELETE /api/admin/plans?id=x    - Delete plan
```

### Discounts API
```
GET  /api/admin/plan-discounts          - List discounts
POST /api/admin/plan-discounts          - Create discount
PATCH /api/admin/plan-discounts         - Update discount
DELETE /api/admin/plan-discounts?id=x   - Delete discount
```

### User Plans API
```
GET  /api/admin/user-plans?email=x     - Get user plan
POST /api/admin/user-plans             - Assign plan
PATCH /api/admin/user-plans            - Extend/cancel
DELETE /api/admin/user-plans?email=x   - Reset to free
```

---

## 🛠️ Feature Flags Checklist

### Core Features
- [ ] Video Upload
- [ ] YouTube Import
- [ ] Social Imports (FB, IG, TT)
- [ ] Thumbnail Analysis
- [ ] Hook Analysis
- [ ] Title Optimization
- [ ] Hashtag Generation

### AI Studio
- [ ] Script Writer
- [ ] Daily Ideas
- [ ] AI Coach
- [ ] Channel Audit
- [ ] Optimize Tool

### Analytics
- [ ] Overview Dashboard
- [ ] Performance Analytics
- [ ] Growth Analytics
- [ ] Analytics Dashboard
- [ ] Custom Reports

### Team/Collab
- [ ] Team Management
- [ ] Content Calendar
- [ ] Social Posting
- [ ] Scheduled Posts
- [ ] Bulk Operations

### Support
- [ ] Email Support
- [ ] Priority Support
- [ ] Live Chat
- [ ] 24/7 Support

### Advanced
- [ ] Competitor Analysis
- [ ] API Access
- [ ] Custom Integrations
- [ ] White-Label
- [ ] Custom Models

---

## 📊 Default Limits Template

```javascript
// Copy & modify for new plan
{
  limits: {
    analysesLimit: 10,         // -1 = unlimited
    analysesPeriod: "day",     // "day" or "month"
    titleSuggestions: 5,       // -1 = unlimited
    hashtagCount: 15,          // -1 = unlimited
    competitorsTracked: 10,    // -1 = unlimited
    teamMembers: 1,            // -1 = unlimited
    scheduledPosts: 10,        // -1 = unlimited
    connectedChannels: 2,      // -1 = unlimited
    apiRateLimit: 50,          // calls/minute
    dataRetentionDays: 90      // days
  }
}
```

---

## 🎯 Default Feature Flags Template

```javascript
{
  featureFlags: {
    // Core
    videoUpload: true,
    youtubeImport: true,
    facebookImport: false,
    instagramImport: false,
    tiktokImport: false,
    
    // Analysis
    thumbnailAnalysis: true,
    hookAnalysis: true,
    titleOptimization: true,
    hashtagGeneration: true,
    contentStrategy: false,
    
    // AI Studio
    scriptWriter: false,
    dailyIdeas: false,
    aiCoach: false,
    keywordResearch: false,
    channelAudit: false,
    optimize: false,
    
    // Analytics
    overviewDashboard: true,
    performanceAnalytics: true,
    growthAnalytics: false,
    advancedAnalyticsDashboard: false,
    dataExport: false,
    
    // Content
    contentCalendar: false,
    schedulePost: false,
    bulkScheduling: false,
    
    // Support
    emailSupport: false,
    prioritySupport: false,
    liveChat: false,
    prioritySupport24x7: false,
    
    // Advanced
    competitorAnalysis: false,
    realTimeTrendAnalysis: false,
    bestPostingTimePredictions: false,
    teamCollaboration: false,
    whiteLabelReports: false,
    customAiModelTraining: false,
    customIntegrations: false,
    apiAccess: false
  }
}
```

---

## 🔍 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Plan not showing | Check `isActive: true` in DB |
| Feature not working | Verify feature flag enabled |
| User can't access | Check subscription dates |
| Discount not applying | Check `startsAt < now < endsAt` |
| API failing | Check super-admin role |
| Rate limit hit | Increase `apiRateLimit` |

---

## 📱 Popular Plan Configs

### Free (Everyone Trial)
```
price: 0
analyses: 5/month
features: Basic
```

### Starter (Creators)
```
price: $3/mo
analyses: 10/day
features: AI tools + calendaring
```

### Pro (Teams)
```
price: $15/mo
analyses: 30/day
features: All + team collaboration
```

### Enterprise (Agencies)
```
price: $25+/mo
analyses: 100/day
features: Everything + dedicated support
```

---

## ⚡ Performance Tips

### Database Indexes
```javascript
// Already indexed:
db.plans.createIndex({ planId: 1 })
db.plans.createIndex({ isActive: 1 })
db.discounts.createIndex({ planId: 1, startsAt: 1, endsAt: 1 })
```

### Caching
```javascript
// Cache active plans for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// On first request: fetch from DB
// On subsequent: serve from cache
// On update: clear cache
```

### Query Optimization
```javascript
// Good - only fetch active plans
db.plans.find({ isActive: true }, { __v: 0 })

// Avoid - fetches everything
db.plans.find()
```

---

## 🔐 Security Checklist

- [ ] Verify user is super-admin before operations
- [ ] Validate plan ID is unique
- [ ] Check prices are positive numbers
- [ ] Ensure dates are valid (end > start)
- [ ] Rate limit plan discount creation
- [ ] Log all plan modifications
- [ ] Use HTTPS for all API calls
- [ ] Validate user email format

---

## 📞 Command Reference

### List Plans
```bash
curl http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer {token}"
```

### Create Plan
```bash
curl -X POST http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "custom",
    "name": "Custom",
    "priceMonthly": 19.99,
    "features": ["Feature 1", "Feature 2"]
  }'
```

### Update Plan
```bash
curl -X PATCH http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"id": "plan_id", "priceMonthly": 24.99}'
```

### Assign Plan to User
```bash
curl -X POST http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "plan": "pro",
    "duration": 30
  }'
```

---

## 🧪 Testing Plans

### Test Free Plan Flow
1. Create free account
2. Verify limits work (5 analyses/month)
3. Verify features disabled appropriately
4. Try upgrade

### Test Paid Plan Flow
1. Create account
2. Assign plan via admin
3. Verify all features enabled
4. Test rate limiting
5. Test downgrade

### Test Discount Flow
1. Create promo discount (30% off)
2. View pricing page
3. Verify discount displays
4. Attempt purchase
5. Verify discount applied

---

## 💾 Backup & Recovery

### Backup Plans
```bash
# Export all plans
mongoexport --uri="mongodb_uri" \
  --collection=plans \
  --out=plans_backup.json

# Export discounts
mongoexport --uri="mongodb_uri" \
  --collection=plancounts \
  --out=discounts_backup.json
```

### Restore Plans
```bash
# Restore from backup
mongoimport --uri="mongodb_uri" \
  --collection=plans \
  --file=plans_backup.json \
  --mode=insert
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| [PLAN_MANAGEMENT_SYSTEM.md](PLAN_MANAGEMENT_SYSTEM.md) | Complete API docs |
| [PLAN_MANAGEMENT_PRACTICAL_GUIDE.md](PLAN_MANAGEMENT_PRACTICAL_GUIDE.md) | How-to guide |
| [PLAN_COMPARISON_MATRIX.md](PLAN_COMPARISON_MATRIX.md) | Feature matrix |
| [models/Plan.ts](models/Plan.ts) | Plan schema |
| [lib/planLimits.ts](lib/planLimits.ts) | Limit logic |

---

## ✅ Deployment Checklist

Before deploying plan changes:

- [ ] All plans tested in staging
- [ ] Feature flags verified
- [ ] Limits tested with actual usage
- [ ] Pricing reviewed by finance
- [ ] Email customers about changes
- [ ] Update pricing page
- [ ] Monitor for errors in logs
- [ ] Check payment processing
- [ ] Verify analytics tracking
- [ ] Document changes in changelog

---

## 🎓 Training Checklist

For new admins:

- [ ] Read PLAN_MANAGEMENT_SYSTEM.md
- [ ] Understand Plan schema in models/Plan.ts
- [ ] Test creating a plan
- [ ] Test assigning plan to user
- [ ] Test creating discount
- [ ] Learn API endpoints
- [ ] Understand feature flags
- [ ] Know how to troubleshoot
- [ ] Review security requirements
- [ ] Shadow experienced admin

---

## 📞 Support Contacts

| Issue | Contact | Channel |
|-------|---------|---------|
| Technical (API) | dev-team | Slack |
| Pricing/Billing | finance | Email |
| Customer Issues | support | Help desk |
| Database | devops | Oncall |

---

**Quick Reference Card v1.0**  
Print and keep on your desk! 📋
