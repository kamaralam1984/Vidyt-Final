# Plan to Role Mapping Summary
## हर Plan का अपना Role और Capabilities

---

## 📊 Quick Overview

```
    Free Plan            Starter Plan           Pro Plan            Enterprise Plan
    (Role: user)         (Role: user)           (Role: manager)     (Role: admin)
    
    Level 1              Level 1                Level 2             Level 3
    ┌──────────────┐    ┌──────────────┐      ┌──────────────┐    ┌──────────────┐
    │ Basic User   │    │ Basic User   │      │ Team Manager │    │ Admin User   │
    │ Video Upload │    │ Video Upload │      │ All Videos   │    │ All Videos   │
    │ Analysis     │    │ + AI Studio  │      │ + Team mgmt  │    │ + API Access │
    │ No Team      │    │ + Calendar   │      │ + Analytics  │    │ + Branding   │
    │ No API       │    │ + Email Sup  │      │ + Email Sup  │    │ + Models     │
    └──────────────┘    └──────────────┘      └──────────────┘    └──────────────┘
         $0/mo              $3/mo               $15/mo              $25/mo
```

---

## 🎯 Plan Configuration Details

### 1. **Free Plan** → **user** Role

#### Role Level
- Tier: **Level 1** (Lowest)
- Upgrade to: Starter

#### Permissions
✅ Can Do:
- Upload videos
- Analyze videos (5/month)
- View own dashboard
- Generate hashtags & titles
- View basic viral score
- View trends
- Community support

❌ Cannot Do:
- Create teams
- View team analytics
- Use content calendar
- Use API
- White-label anything
- Train AI models
- Advanced analytics

#### Permission Check Code
```typescript
hasRole(user, 'user') ✅
hasMinRole(user, 'manager') ❌

canPerform(user, 'uploadVideo') ✅
canPerform(user, 'createTeam') ❌
canPerform(user, 'useAPI') ❌
```

#### Database Values
```json
{
  "planId": "free",
  "name": "Free",
  "priceMonthly": 0,
  "role": "user",
  "limits": {
    "analysesLimit": 5,
    "analysesPeriod": "month",
    "teamMembers": 1,
    "scheduledPosts": 0
  }
}
```

---

### 2. **Starter Plan** → **user** Role

#### Role Level
- Tier: **Level 1** (Same as Free, but with more features)
- Upgrade to: Pro

#### Permissions
✅ Can Do:
- All free plan actions
- Analyze videos (10/day)
- Use AI Studio (Script Writer, etc.)
- Create schedules (10/month)
- View growth analytics
- Email support
- Hashtag research

❌ Cannot Do:
- Create teams
- View team analytics
- Use content calendar (scheduling)
- Use API
- White-label
- Train AI models
- Advanced + custom reports

#### Permission Check Code
```typescript
hasRole(user, 'user') ✅
hasMinRole(user, 'manager') ❌

canPerform(user, 'uploadVideo') ✅
canPerform(user, 'useAIStudio') ✅
canPerform(user, 'createTeam') ❌
canPerform(user, 'useAPI') ❌
```

#### Database Values
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
    "teamMembers": 1,
    "scheduledPosts": 10
  }
}
```

---

### 3. **Pro Plan** → **manager** Role

#### Role Level
- Tier: **Level 2** (Team Leader)
- Upgrade to: Enterprise
- Downgrade to: Starter

#### Permissions
✅ Can Do:
- All user plan actions
- Analyze videos (30/day)
- **Create teams** ⭐
- Invite team members (up to 3)
- View team analytics
- Content calendar with bulk scheduling
- Competitor analysis
- Priority email support
- Advanced analytics
- Schedule posts (50 posts)
- Export reports

❌ Cannot Do:
- Use API
- White-label reports
- Train custom AI models
- Manage users
- Create plans
- Access super admin panel

#### Permission Check Code
```typescript
hasRole(user, 'manager') ✅
hasMinRole(user, 'manager') ✅
hasMinRole(user, 'admin') ❌

canPerform(user, 'createTeam') ✅
canPerform(user, 'inviteMembers') ✅
canPerform(user, 'useAPI') ❌
canPerform(user, 'managePlans') ❌
```

#### Database Values
```json
{
  "planId": "pro",
  "name": "Pro",
  "priceMonthly": 15,
  "role": "manager",
  "limits": {
    "analysesLimit": 30,
    "analysesPeriod": "day",
    "titleSuggestions": 10,
    "hashtagCount": 20,
    "competitorsTracked": 50,
    "teamMembers": 3,
    "scheduledPosts": 50,
    "connectedChannels": 5
  },
  "featureFlags": {
    "teamCollaboration": true,
    "contentCalendar": true,
    "schedulePost": true,
    "competitorAnalysis": true,
    "advancedAnalyticsDashboard": true
  }
}
```

---

### 4. **Enterprise Plan** → **admin** Role

#### Role Level
- Tier: **Level 3** (Administrator)
- Upgrade to: Custom
- Downgrade to: Pro

#### Permissions
✅ Can Do:
- All manager plan actions
- Analyze videos (100/day)
- Unlimited team members
- Unlimited scheduled posts
- **Use API** ⭐
- Create & manage API keys
- Create webhooks
- Custom integrations
- **White-label reports** ⭐
- Custom branding
- **Train custom AI models** ⭐
- Dedicated account manager
- 24/7 priority support
- Manage all team members
- View audit logs

❌ Cannot Do:
- Manage other users
- Create plans
- Manage discounts
- Access super admin panel
- Set custom domain

#### Permission Check Code
```typescript
hasRole(user, 'admin') ✅
hasMinRole(user, 'admin') ✅
hasMinRole(user, 'super-admin') ❌

canPerform(user, 'useAPI') ✅
canPerform(user, 'whiteLabel') ✅
canPerform(user, 'trainCustomModels') ✅
canPerform(user, 'managePlans') ❌
canPerform(user, 'managePlans') ❌
```

#### Database Values
```json
{
  "planId": "enterprise",
  "name": "Enterprise",
  "priceMonthly": 25,
  "role": "admin",
  "limits": {
    "analysesLimit": 100,
    "analysesPeriod": "day",
    "teamMembers": -1,
    "scheduledPosts": -1,
    "connectedChannels": -1,
    "competitorsTracked": -1,
    "apiRateLimit": 1000
  },
  "featureFlags": {
    "teamCollaboration": true,
    "whiteLabel": true,
    "useAPI": true,
    "customIntegrations": true,
    "trainCustomModels": true,
    "dedicatedAccountManager": true,
    "prioritySupport24x7": true
  }
}
```

---

### 5. **Custom Plan** → **admin** Role

#### Role Level
- Tier: **Level 3** (Same as Enterprise)
- For: Enterprise clients with special requirements

#### Permissions
- Same as Enterprise Plan
- `role: "admin"`
- Custom pricing & limits negotiated
- Custom features enabled as needed

#### Database Values
```json
{
  "planId": "custom",
  "name": "Custom",
  "priceMonthly": 50,
  "role": "admin",
  "isCustom": true,
  "limits": {
    "analysesLimit": 500,
    "apiRateLimit": 5000,
    "teamMembers": -1,
    "scheduledPosts": -1
  },
  "featureFlags": {
    // All features enabled
    "advancedAiViralPrediction": true,
    "realTimeTrendAnalysis": true,
    "teamCollaboration": true,
    "whiteLabel": true,
    "useAPI": true,
    "customIntegrations": true,
    "trainCustomModels": true
  }
}
```

---

### 6. **Owner/Super-Admin** → **super-admin** Role

#### Role Level
- Tier: **Level 4** (Highest - Internal Only)
- For: System administrators & company owners only

#### Permissions
✅ Can Do:
- **Everything** ✅
- All admin features
- **Manage all users** ⭐
- **Create/edit plans** ⭐
- **Create discounts** ⭐
- **Manage payments** ⭐
- **View metrics & analytics** ⭐
- **Database access** ⭐
- **Email configuration** ⭐
- Full system control

#### Permission Check Code
```typescript
hasRole(user, 'super-admin') ✅
hasMinRole(user, 'super-admin') ✅

canPerform(user, 'createPlans') ✅
canPerform(user, 'managePlans') ✅
canPerform(user, 'managePlans') ✅
canPerform(user, 'accessSuperAdmin') ✅
```

#### Database Values
```json
{
  "planId": "owner",
  "name": "Owner",
  "role": "super-admin",
  "limits": {
    "analysesLimit": -1,
    "teamMembers": -1,
    "apiRateLimit": -1
  },
  "featureFlags": {
    // All features enabled
    "*": true
  }
}
```

---

## 🔄 Role Hierarchy & Promotion

```
User (Level 1)
    ↓ Upgrade to Pro
Manager (Level 2)
    ↓ Upgrade to Enterprise
Admin (Level 3)
    ↓ Assigned by owner
Super-Admin (Level 4)
```

### When User Upgrades Free → Starter
```
Before:
- Plan: free
- Role: user
- Team members: 1
- Analyses: 5/month
- Features: basic

After:
- Plan: starter
- Role: user  ← Same role!
- Team members: 1
- Analyses: 10/day
- Features: basic + AI Studio
```

### When User Upgrades Starter → Pro
```
Before:
- Plan: starter
- Role: user
- Team members: 1
- Analyses: 10/day

After:
- Plan: pro
- Role: manager  ← Role promoted!
- Team members: 3
- Analyses: 30/day
- + Team features
+ Analytics
+ Calendar
```

### When User Upgrades Pro → Enterprise
```
Before:
- Plan: pro
- Role: manager
- Team members: 3
- Analyses: 30/day

After:
- Plan: enterprise
- Role: admin  ← Role promoted!
- Team members: unlimited
- Analyses: 100/day
- + API access
+ White-label
+ Custom models
```

---

## 📋 Permission Matrix by Plan

| Action | Free | Starter | Pro | Enterprise | Custom | Super-Admin |
|--------|------|---------|-----|------------|--------|------------|
| Upload Video | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analyze Video | ✅ 5/mo | ✅ 10/day | ✅ 30/day | ✅ 100/day | ✅ Custom | ✅ ∞ |
| Use AI Studio | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Team | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Team Analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Content Calendar | ❌ | ✅ scheduling | ✅ all | ✅ all | ✅ all | ✅ |
| Use API | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| White-Label | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Train Models | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Plans | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 API Endpoint Example by Role

### Endpoint: POST /api/team/create

```
Free (user)     → 403 Forbidden - "Upgrade to Pro"
Starter (user)  → 403 Forbidden - "Upgrade to Pro"
Pro (manager)   → ✅ 200 OK - Team created
Enterprise (admin) → ✅ 200 OK - Team created
Custom (admin)  → ✅ 200 OK - Team created
Super-Admin     → ✅ 200 OK - Team created
```

### Endpoint: POST /api/keys/create (API)

```
Free (user)     → 403 Forbidden - "Upgrade to Enterprise"
Starter (user)  → 403 Forbidden - "Upgrade to Enterprise"
Pro (manager)   → 403 Forbidden - "Upgrade to Enterprise"
Enterprise (admin) → ✅ 200 OK - API key created
Custom (admin)  → ✅ 200 OK - API key created
Super-Admin     → ✅ 200 OK - API key created
```

### Endpoint: POST /api/admin/plans (Create Plan)

```
Free (user)     → 403 Forbidden
Starter (user)  → 403 Forbidden
Pro (manager)   → 403 Forbidden
Enterprise (admin) → 403 Forbidden
Custom (admin)  → 403 Forbidden
Super-Admin     → ✅ 200 OK - Plan created
```

---

## 🎯 Selection Guide - Which Plan for Which User?

### Use **Free** when:
- User is trying the platform
- Single individual creator
- Testing features
- Basic needs only

### Use **Starter** ($3/mo) when:
- Growing content creator
- Using AI Studio features needed
- Want scheduling (basic)
- Budget-conscious

### Use **Pro** ($15/mo) when:
- Team of 2-3 people
- Need team collaboration
- Advanced analytics required
- Competitor tracking needed
- Growing channel (10K+ subscribers)

### Use **Enterprise** ($25/mo) when:
- Team of 4+ people
- Need API access
- Custom integrations needed
- White-label solution required
- Large agency or business
- Dedicated support wanted
- Custom AI model training

### Use **Custom** (Negotiated) when:
- Enterprise needs special pricing
- Unique requirements
- High volume usage
- Long-term partnership
- Special integrations needed

---

## 🔄 Switching Plans

### Can User Change Plans?
✅ **Yes!** At any time

### What Happens to Data?
✅ All data preserved
- Videos stay
- Analytics stay
- Teams stay
- Scheduled posts stay

### What Gets Disabled?
- Features unavailable on lower plan
- Team is hidden (data preserved)
- API keys disabled (can re-enable on upgrade)

### Example: Upgrade Pro → Enterprise
```
Before: Can create team with 3 members
Action: Upgrade plan
After: 
  - Team still exists ✅
  - Can now add unlimited members ✅
  - API access unlocked ✅
  - White-label enabled ✅
```

### Example: Downgrade Enterprise → Pro
```
Before: Team with 10 members, using API
Action: Downgrade plan
After:
  - Team still exists ✅ (but limited to 3 members for invites)
  - API keys disabled ❌ (but can be re-enabled on upgrade)
  - 10 members stay in system ✅
```

---

## 📊 Current Seed Data

The seed-plans.js file creates these plans:

```javascript
PLANS = [
  { planId: 'free', role: 'user', priceMonthly: 0 },
  { planId: 'starter', role: 'user', priceMonthly: 3 },
  { planId: 'pro', role: 'manager', priceMonthly: 15 },
  { planId: 'enterprise', role: 'admin', priceMonthly: 25 },
  { planId: 'custom', role: 'admin', priceMonthly: 50 },
]
```

To reseed:
```bash
node -r dotenv/config scripts/seed-plans.js
```

---

## ✅ Verification Checklist

After setting up plans, verify:

- [ ] Free plan has `role: 'user'` ✅
- [ ] Starter plan has `role: 'user'` ✅
- [ ] Pro plan has `role: 'manager'` ✅
- [ ] Enterprise plan has `role: 'admin'` ✅
- [ ] Custom plan has `role: 'admin'` ✅
- [ ] User can create team on Pro ✅
- [ ] User cannot use API on Pro ✅
- [ ] User can use API on Enterprise ✅
- [ ] Super-admin can manage plans ✅
- [ ] Permissions are enforced in API ✅
- [ ] Frontend shows/hides features ✅
- [ ] Roles change on plan upgrade ✅
- [ ] Data preserved on downgrade ✅
- [ ] Limits enforced per plan ✅

---

## 🚀 Summary

```
🎯 Plan Hierarchy:

Free ---------- Starter -------- Pro ---------- Enterprise
(user)         (user)          (manager)      (admin)
Level 1        Level 1         Level 2        Level 3
No Team        No Team         Team Support   Full Admin
Basic Features Better Features + Team Mgmt    + API + Brand

                                              ↑
                                         Custom Plan
                                         (admin)
                                         Negotiated
```

---

**Version**: 1.0  
**Last Updated**: March 28, 2026  
**Status**: Ready for Implementation

For implementation guide, see: [RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md)
