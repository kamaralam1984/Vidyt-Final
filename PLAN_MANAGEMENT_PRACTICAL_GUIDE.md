# Plan Management - Practical Implementation Guide

## 🎯 Quick Start: Plan Management

यह guide आपको बताता है कि कैसे plans को create, edit, और manage करें।

---

## 📋 Table of Contents

1. [Super Admin Panel Access](#super-admin-panel-access)
2. [Plan Creation Workflow](#plan-creation-workflow)
3. [Feature Configuration](#feature-configuration)
4. [Plan Assignment](#plan-assignment)
5. [Discounts Management](#discounts-management)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 Super Admin Panel Access

### Access Path
```
URL: https://yourdomain.com/admin/super
Role Required: super-admin
```

### Left Sidebar Navigation
```
📊 Admin Dashboard
├── 👥 User Management
│   ├── All Users
│   ├── User Roles
│   └── User Activity
├── 💳 Billing & Plans
│   ├── Plan Discounts ⭐
│   ├── Manage Plans ⭐
│   └── User Plans ⭐
├── ⚙️ Settings
│   ├── System Configuration
│   ├── API Keys
│   └── Email Templates
├── 📊 Analytics
│   ├── System Health
│   ├── Usage Statistics
│   └── Revenue Tracking
└── 🔔 Notifications
    ├── Email Settings
    └── Alert Rules
```

---

## 📦 Plan Creation Workflow

### Step 1: Navigate to Plan Manager

1. Go to `/admin/super`
2. Click **Billing & Plans** in sidebar
3. Select **Manage Plans**

### Step 2: Create New Plan

Click **"Create New Plan"** button and fill out:

#### Basic Information
```
Plan Details Form
│
├─ Plan ID *
│  └─ Must be unique, lowercase, no spaces
│     Example: "professional", "business", "growth"
│
├─ Plan Name *
│  └─ Display name for users
│     Example: "Professional Plan"
│
├─ Description
│  └─ Short description (max 200 characters)
│     Example: "Perfect for growing creators"
│
└─ Billing Period *
   └─ Options: "month", "year", "both"
```

#### Pricing Information
```
Pricing Form
│
├─ Currency
│  └─ Default: USD
│
├─ Monthly Price
│  └─ Examples: 0 (free), 9.99, 19.99, 49.99
│
└─ Yearly Price (Optional)
   └─ Recommended: monthly × 10 for discount
      Example: monthly $19.99 → yearly $199.99
```

#### Features List
```
Add features as list items:

✓ 30 video analyses per day
✓ Advanced viral prediction
✓ Team collaboration
✓ Priority email support
✓ White-label reports
✓ Custom integrations
```

### Step 3: Configure Feature Flags

Toggle each feature on/off:

```
Video & Content Analysis
├─ ☑ Video Upload
├─ ☑ YouTube Import
├─ ☑ Facebook Import
├─ ☑ Instagram Import
├─ ☑ TikTok Import
├─ ☑ Thumbnail Analysis
├─ ☑ Hook Analysis
├─ ☑ Title Optimization
├─ ☑ Hashtag Generation
└─ ☑ Content Strategy

AI Studio Features
├─ ☑ Script Writer
├─ ☑ Thumbnail Ideas
├─ ☑ Hook Generator
├─ ☑ Shorts Creator
├─ ☑ Title Generator
├─ ☑ Daily Ideas
├─ ☑ AI Coach
├─ ☑ Keyword Research
├─ ☑ Channel Audit Tool
└─ ☑ Optimize Tool

Analytics & Reporting
├─ ☑ Overview Dashboard
├─ ☑ Performance Analytics
├─ ☑ Engagement Analytics
├─ ☑ Growth Analytics
├─ ☑ Heatmap Analytics
├─ ☑ Insights Dashboard
├─ ☑ Custom Reports
├─ ☑ Advanced Analytics Dashboard
└─ ☑ Data Export

Social & Integration
├─ ☑ YouTube Integration
├─ ☑ Facebook Integration
├─ ☑ Instagram Integration
├─ ☑ TikTok Integration
├─ ☑ Multi-Channel Management
├─ ☑ Social Posting
└─ ☑ Custom Integrations

Content Management
├─ ☑ Content Calendar
├─ ☑ Schedule Posts
├─ ☑ Bulk Scheduling
├─ ☑ Post Templates
└─ ☑ Calendar Analytics

Support & Services
├─ ☑ Email Support
├─ ☑ Priority Support
├─ ☑ Live Chat
├─ ☑ Dedicated Account Manager
└─ ☑ Priority Support 24/7

Advanced Features
├─ ☑ Competitor Analysis
├─ ☑ Real-Time Trend Analysis
├─ ☑ Best Posting Times
├─ ☑ Advanced AI Prediction
├─ ☑ Team Collaboration
├─ ☑ White-Label Reports
├─ ☑ Custom API Access
└─ ☑ Custom AI Training
```

### Step 4: Set Usage Limits

```
Usage Limits Form
│
├─ Analyses Limit *
│  └─ Max video analyses per period
│     Examples: 5, 10, 30, 100, -1 (unlimited)
│
├─ Analyses Period *
│  └─ Options: "day", "month"
│
├─ Title Suggestions
│  └─ Max per operation. -1 = unlimited
│
├─ Hashtag Count
│  └─ Max hashtags generated
│
├─ Competitors Tracked
│  └─ Max competitors to follow. -1 = unlimited
│
├─ Team Members
│  └─ Max team size. -1 = unlimited
│
├─ Scheduled Posts
│  └─ Max posts to schedule. -1 = unlimited
│
├─ Connected Channels
│  └─ Max social channels. -1 = unlimited
│
├─ API Rate Limit
│  └─ Calls per minute
│
└─ Data Retention Days
   └─ How long to keep analytics data
```

### Step 5: Display Configuration

Configure how limits appear to users:

```
Display Settings
│
├─ Videos Display
│  └─ "30/day", "100/month", "Unlimited"
│
├─ Analyses Display
│  └─ "Basic", "Advanced", "Custom AI"
│
├─ Storage Display
│  └─ "100GB", "—", "Unlimited"
│
└─ Support Display
   └─ "Community", "Email", "Priority", "24/7 Dedicated"
```

### Step 6: Save Plan

Click **"Create Plan"** button

✅ Plan created successfully

---

## 📝 Example: Create "Growth Plan"

### Fill Form with These Values:

```
📋 PLAN DETAILS
Plan ID: growth
Plan Name: Growth Plan
Description: Ideal for expanding creators
Billing Period: both

💰 PRICING
Currency: USD
Monthly Price: 12.99
Yearly Price: 129.99

✨ FEATURES
✓ 20 video analyses per day
✓ All social media imports
✓ Advanced viral prediction
✓ Content calendar
✓ Competitor analysis
✓ Email support

⚙️ FEATURE FLAGS (Enable these)
✓ Video Upload
✓ YouTube/Facebook/Instagram Import
✓ Thumbnail Analysis
✓ Title Optimization
✓ Hashtag Generation
✓ Daily Ideas
✓ AI Coach
✓ Script Writer
✓ Channel Audit
✓ Content Calendar
✓ Analytics Dashboard
✓ Competitor Analysis
✓ Email Support
✓ Priority Processing

📊 LIMITS
Analyses Limit: 20
Analyses Period: day
Title Suggestions: 8
Hashtag Count: 20
Competitors Tracked: 25
Team Members: 2
Scheduled Posts: 30
Connected Channels: 3
API Rate Limit: 100/min

📺 DISPLAY
Videos: 20/day
Analyses: Advanced
Storage: —
Support: Email
```

---

## 🎛️ Feature Configuration

### Enabling/Disabling Features

**When to Enable Features:**
- User payment is valid
- Server resources available
- Feature is fully tested
- Legal compliance confirmed

**When to Disable Features:**
- Maintaining features for maintenance
- Testing new features
- Budget constraints
- User feedback issues

### Feature Dependencies

Some features depend on others:

```
Advanced AI Prediction
↓ requires
├─ Video Upload
├─ Viral Prediction Engine
└─ ML Model Access

Team Collaboration
↓ requires
├─ User Authentication
├─ Database Storage
└─ Workspace Management

White-Label Reports
↓ requires
├─ Advanced Analytics
├─ PDF Export
└─ Custom Branding

Custom Integrations
↓ requires
├─ API Access
├─ OAuth Setup
└─ Rate Limiting
```

---

## 👥 Plan Assignment

### Assign Plan to User

#### Method 1: Via Super Admin Panel

1. Go to **Billing & Plans** → **User Plans**
2. Search user by email
3. Click **Assign Plan**
4. Select plan from dropdown
5. Choose billing period (month/year)
6. Set duration (days)
7. Click **Confirm**

#### Method 2: Via API

```bash
curl -X POST http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "plan": "pro",
    "billingPeriod": "month",
    "duration": 30
  }'
```

### Extend User Subscription

```bash
curl -X PATCH http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "action": "extend",
    "duration": 30
  }'
```

### Cancel User Subscription

```bash
curl -X PATCH http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "action": "cancel"
  }'
```

### Reset User to Free Plan

```bash
curl -X DELETE http://localhost:3000/api/admin/user-plans?email=user@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View User's Current Plan

```bash
curl -X GET "http://localhost:3000/api/admin/user-plans?email=user@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "subscription": "pro",
    "plan": {
      "id": "pro",
      "name": "Pro Plan",
      "price": 15,
      "features": [...]
    },
    "subscriptionStatus": "active",
    "startDate": "2024-03-22T00:00:00Z",
    "endDate": "2024-04-22T00:00:00Z",
    "daysRemaining": 30
  }
}
```

---

## 🏷️ Discounts Management

### Create Time-Limited Discount

#### Via Panel

1. Go to **Billing & Plans** → **Plan Discounts**
2. Click **Create Discount**
3. Fill form:
   - **Plan**: Select plan
   - **Label**: "Holi Sale", "Black Friday", etc.
   - **Percentage**: 10-50
   - **Start Date**: When discount begins
   - **End Date**: When discount expires
4. Click **Create**

#### Via API

```bash
curl -X POST http://localhost:3000/api/admin/plan-discounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "pro",
    "label": "Spring Sale 2024",
    "percentage": 30,
    "startsAt": "2024-03-22T00:00:00",
    "endsAt": "2024-03-29T23:59:59"
  }'
```

### Edit Discount

```bash
curl -X PATCH http://localhost:3000/api/admin/plan-discounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "discount_id_here",
    "percentage": 50,
    "endsAt": "2024-03-31T23:59:59"
  }'
```

### Delete Discount

```bash
curl -X DELETE "http://localhost:3000/api/admin/plan-discounts?id=discount_id" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View All Active Discounts

```bash
curl -X GET http://localhost:3000/api/admin/plan-discounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💡 Best Practices

### Pricing Strategy
- Free plan: Start users
- Starter: Entry-level ($3-10)
- Pro: Standard ($15-30)
- Enterprise: Premium ($50+)

### Feature Distribution
- Free: 15-20% features
- Starter: 40-50% features
- Pro: 70-80% features
- Enterprise: 100% features

### Frequency
- Don't change pricing too often
- Minimum 30 days notice for increases
- Grandfather existing users
- Test thoroughly before launch

### Monitoring
- Track plan adoption
- Monitor churn rate
- Analyze feature usage
- Gather user feedback

---

## 🔍 Troubleshooting

### Issue: Plan not appearing on pricing page

**Solution:**
```bash
# Check if plan is active in database
db.plans.findOne({ planId: "your_plan" })

# Should show: { isActive: true }

# If false, update it:
db.plans.updateOne(
  { planId: "your_plan" },
  { $set: { isActive: true } }
)
```

### Issue: User can't see assigned plan

**Solution:**
1. Clear browser cache
2. User logs out and logs back in
3. Check if plan assignment date is correct
4. Verify user's subscription field in database

### Issue: Discount not applying

**Solution:**
```bash
# Check discount is within date range
db.plancounts.findOne({ _id: ObjectId("discount_id") })

# Should show current date is between startsAt and endsAt
```

### Issue: Feature flag not working

**Solution:**
1. Check `models/Plan.ts` for flag name
2. Verify component checks correct flag name
3. Test in browser console:
   ```javascript
   // Check if user has feature enabled
   const user = await fetch('/api/auth/me').then(r => r.json());
   console.log(user.subscription);
   ```

### Issue: API rate limit too low

**Solution:**
```bash
# Update plan limits
curl -X PATCH http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "plan_id",
    "limits": {
      "apiRateLimit": 500
    }
  }'
```

---

## 📊 Monitoring & Analytics

### Check Plan Usage

```bash
# Get all users and their plans
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get plan statistics
curl -X GET http://localhost:3000/api/admin/analytics/plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Track Feature Usage

```javascript
// Check which features are being used
const analytics = await fetch(`/api/admin/analytics/feature-usage`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Shows usage statistics for each feature
```

---

## 🚀 Quick Reference Commands

### Create Plan (CLI)
```bash
node -r dotenv/config scripts/seed-plans.js
```

### View Database Plans
```bash
mongosh
use viralboost
db.plans.find()
db.plans.findOne({ planId: "pro" })
```

### Delete Plan (Soft Delete - Recommended)
```bash
# Via API
curl -X DELETE http://localhost:3000/api/admin/plans?id=plan_id \
  -H "Authorization: Bearer YOUR_TOKEN"

# This sets isActive: false (safe)
```

---

**Version**: 1.0  
**Last Updated**: March 2026  
**Status**: Ready to Use
