# Role-Based Access Control (RBAC) System
## Plan के हिसाब से Role & Permissions

---

## 📊 Role Hierarchy

```
📊 Permission Level (Low → High)
│
├─ Level 1: user (Free/Starter)
│           └─ Basic features only
│
├─ Level 2: manager (Pro)
│           └─ Team features + Advanced analytics
│
├─ Level 3: admin (Enterprise)
│           └─ All features + Team management
│
└─ Level 4: super-admin (Owner)
            └─ Full system control + Plan management
```

---

## 🎯 Plan To Role Mapping

| Plan | Role | Price | Can Do |
|------|------|-------|--------|
| **Free** | `user` | $0 | Basic analysis, limited features |
| **Starter** | `user` | $3 | AI studio, more analyses, email support |
| **Pro** | `manager` | $15 | Team collab, content calendar, all analytics |
| **Enterprise** | `admin` | $25 | Team management, white-label, API access |
| **Custom** | `admin` | Custom | Everything + dedicated support |
| **Owner** | `super-admin` | — | Plan management, user management, everything |

---

## 🔑 Role Definitions

### 1. **user** Role (Free/Starter Plans)

#### Access Level
- ✅ Personal dashboard
- ✅ Video uploads & analysis
- ✅ View own analytics
- ❌ Team management
- ❌ API access
- ❌ Plan management

#### Permissions
```javascript
{
  // Dashboard
  canViewOwnDashboard: true,
  canViewOwnAnalytics: true,
  
  // Videos
  canUploadVideo: true,
  canAnalyzeVideo: true,
  canDeleteOwnVideos: true,
  
  // Features
  canUseAIStudio: true, // Starter only
  canCreateSchedules: true, // Starter only
  
  // Team
  canCreateTeam: false,
  canInviteMembers: false,
  canManageTeam: false,
  
  // Admin
  canAccessAdmin: false,
  canManagePlans: false,
  canManageUsers: false,
  
  // API
  canUseAPI: false,
  
  // Limits
  analysesPerDay: 5 // Depends on plan
}
```

#### Actionable Features
- Upload & analyze videos
- Generate hashtags/titles
- View trends
- Basic viral prediction
- Email support (Starter only)

---

### 2. **manager** Role (Pro Plan)

#### Access Level
- ✅ Team management
- ✅ All user features
- ✅ Advanced analytics
- ✅ Content calendar
- ❌ API access
- ❌ System management

#### Permissions
```javascript
{
  // All User Permissions
  canViewOwnDashboard: true,
  canUploadVideo: true,
  canAnalyzeVideo: true,
  
  // Team Management
  canCreateTeam: true,
  canInviteMembers: true,
  canManageTeamMembers: true,
  canCreateWorkspaces: true,
  canManageWorkspaces: true,
  
  // Analytics
  canViewTeamAnalytics: true,
  canViewAdvancedAnalytics: true,
  canExportReports: true,
  canCreateCustomReports: true,
  
  // Content
  canUseContentCalendar: true,
  canSchedulePosts: true,
  canBulkSchedule: true,
  canUsePostTemplates: true,
  
  // Competitor
  canTrackCompetitors: true,
  canComparePerformance: true,
  
  // Admin
  canAccessAdmin: false,
  canAccessTeamAdmin: true,
  canManagePlans: false,
  canManageUsers: false,
  
  // Limits
  analysesPerDay: 30,
  teamMembers: 3,
  scheduledPosts: 50
}
```

#### Actionable Features
- Create & manage teams
- Advanced analytics & reports
- Content calendar & scheduling
- Competitor tracking
- All pro features
- Priority support

---

### 3. **admin** Role (Enterprise Plan)

#### Access Level
- ✅ Full team control
- ✅ API access
- ✅ Custom branding
- ✅ Team administration
- ❌ Super admin features
- ❌ Plan management

#### Permissions
```javascript
{
  // All Manager + User Permissions
  canViewOwnDashboard: true,
  canUploadVideo: true,
  canManageTeamMembers: true,
  canViewTeamAnalytics: true,
  
  // Full Team Admin
  canManageAllTeamMembers: true,
  canSetMemberRoles: true,
  canRemoveMembers: true,
  canViewAuditLogs: true,
  canExportTeamData: true,
  
  // Advanced Features
  canUseAPI: true,
  canManageAPIKeys: true,
  canAccessWebhooks: true,
  canCreateCustomIntegrations: true,
  
  // Branding & Customization
  canCustomizeBranding: true,
  canWhiteLabelReports: true,
  canSetCustomDomain: false,
  canUseCustomCSS: false,
  
  // AI Training
  canTrainCustomModels: true,
  canFineTuneModels: true,
  
  // Admin Access
  canAccessAdmin: true,
  canAccessTeamAdmin: true,
  canManagePlans: false,
  canManageUsers: false,
  canManageSystem: false,
  
  // Limits
  analysesPerDay: 100,
  teamMembers: -1, // Unlimited
  scheduledPosts: -1,
  competitorsTracked: -1,
  connectedChannels: -1
}
```

#### Actionable Features
- API access & custom integrations
- White-label reports
- Custom AI model training
- Full team administration
- Audit logs & security
- Dedicated account manager
- 24/7 priority support

---

### 4. **super-admin** Role (Owner/Internal Only)

#### Access Level
- ✅ Complete system control
- ✅ Plan management
- ✅ User management
- ✅ All features

#### Permissions
```javascript
{
  // All Permissions
  canEverythingAsAdmin: true,
  
  // Plan Management
  canCreatePlans: true,
  canEditPlans: true,
  canDeletePlans: true,
  canCreateDiscounts: true,
  canManageDiscounts: true,
  canAssignPlansToUsers: true,
  
  // User Management
  canViewAllUsers: true,
  canManageAllUsers: true,
  canChangeUserRoles: true,
  canSuspendUsers: true,
  canResetPasswords: true,
  
  // System Management
  canAccessSystemSettings: true,
  canManageDatabase: true,
  canViewSystemLogs: true,
  canConfigurePayments: true,
  canManageEmails: true,
  canManageWebhooks: true,
  canBackupData: true,
  
  // Admin Panel
  canAccessSuperAdmin: true,
  
  // Limits
  analysesPerDay: -1, // Unlimited
  teamMembers: -1,
  scheduledPosts: -1,
  competitorsTracked: -1,
  allFeatures: true
}
```

#### Actionable Features
- Complete system control
- Plan & discount management
- User & role management
- System configuration
- Payment gateway setup
- Email template management
- Database maintenance
- Full audit access

---

## 🛡️ Permission Matrix

| Action | user | manager | admin | super-admin |
|--------|------|---------|-------|-------------|
| Upload videos | ✅ | ✅ | ✅ | ✅ |
| Analyze videos | ✅ | ✅ | ✅ | ✅ |
| Create team | ❌ | ✅ | ✅ | ✅ |
| Invite members | ❌ | ✅ | ✅ | ✅ |
| View team analytics | ❌ | ✅ | ✅ | ✅ |
| Use content calendar | ❌ | ✅ | ✅ | ✅ |
| Use API | ❌ | ❌ | ✅ | ✅ |
| White-label reports | ❌ | ❌ | ✅ | ✅ |
| Train AI models | ❌ | ❌ | ✅ | ✅ |
| Manage all users | ❌ | ❌ | ❌ | ✅ |
| Create plans | ❌ | ❌ | ❌ | ✅ |
| Manage discounts | ❌ | ❌ | ❌ | ✅ |
| System admin | ❌ | ❌ | ❌ | ✅ |

---

## 📋 Detailed Permission Breakdown

### Video & Analysis Operations

#### Upload & Process Videos
```javascript
// Who can do this?
ALLOWED_ROLES: ['user', 'manager', 'admin', 'super-admin']

// Restrictions
{
  user: { dailyLimit: 5, storageGB: 1 },
  manager: { dailyLimit: 30, storageGB: 50 },
  admin: { dailyLimit: 100, storageGB: 1000 },
  superAdmin: { dailyLimit: -1, storageGB: -1 } // Unlimited
}
```

#### Use AI Studio Features
```javascript
// Who can do this?
ALLOWED_ROLES: ['user', 'manager', 'admin', 'super-admin']

// But with restrictions
{
  user: { // Only starter+
    scriptWriter: false,
    dailyIdeas: false,
    aiCoach: false
  },
  manager: { // All features
    scriptWriter: true,
    dailyIdeas: true,
    aiCoach: true
  },
  admin: { // All + custom training
    everythingInManager: true,
    customModelTraining: true
  },
  superAdmin: { // Everything
    unlimited: true
  }
}
```

---

### Team Management

#### Create & Manage Team
```javascript
// Who can do this?
ALLOWED_ROLES: ['manager', 'admin', 'super-admin']
NOT_ALLOWED: ['user']

// What they can do
{
  manager: {
    canCreateTeam: true,
    canInviteUpto: 3, // Must match plan limit
    canRemoveMembers: true,
    canChangeRolesWithin: ['user', 'manager'], // Can't promote to admin
  },
  admin: {
    canCreateTeam: true,
    canInviteUnlimited: true,
    canRemoveMembers: true,
    canChangeAnyRoles: true,
    canManageBilling: true,
  },
  superAdmin: {
    canDoAnything: true,
  }
}
```

---

### Analytics & Reporting

#### View Advanced Analytics
```javascript
// Who can do this?
ALLOWED_ROLES: ['manager', 'admin', 'super-admin']
NOT_ALLOWED: ['user'] // Starter+ users get basic only

// Access Level
{
  user: {
    canViewBasicMetrics: true,
    canViewPersonalAnalytics: true,
    canExportBasicReports: false,
  },
  manager: {
    canViewAdvancedMetrics: true,
    canViewTeamAnalytics: true,
    canCreateCustomReports: true,
    canExportAdvancedReports: true,
    canAccessBenchmarking: true,
  },
  admin: {
    allManagerAccess: true,
    canAccessAdvancedDashboard: true,
    canCreateWhiteLabelReports: true,
    unlimitedExports: true,
  },
  superAdmin: {
    everything: true,
    canViewSystemAnalytics: true,
    canViewRevenue: true,
  }
}
```

---

### API & Integration

#### API Access & Management
```javascript
// Who can do this?
ALLOWED_ROLES: ['admin', 'super-admin']
NOT_ALLOWED: ['user', 'manager']

// What they can do
{
  admin: {
    canCreateAPIKeys: true,
    canCreateUpto: 5,
    canSetRateLimit: false, // Tech support sets
    canAccessWebhooks: true,
    canCreateIntegrations: true,
    monthlyAPICallLimit: 10000,
  },
  superAdmin: {
    canCreateAPIKeys: true,
    canCreateUnlimited: true,
    canSetRateLimit: true, // Can customize
    canAccessWebhooks: true,
    canCreateCustomIntegrations: true,
    monthlyAPICallLimit: -1, // Unlimited
    canManageOthersKeys: true,
  }
}
```

---

### Admin & System Management

#### Access Super Admin Panel
```javascript
// Who can do this?
ALLOWED_ROLES: ['super-admin']
NOT_ALLOWED: ['user', 'manager', 'admin']

// Can do
{
  superAdmin: {
    canAccessSuperAdminPanel: true,
    canManagePlans: true,
    canManageUsers: true,
    canManageDiscounts: true,
    canViewSystemLogs: true,
    canBackupDatabase: true,
    canConfigurePayments: true,
    canManageEmails: true,
  }
}
```

---

## 🔐 Permission Checking Implementation

### Helper Function
```typescript
// lib/permissions.ts

interface UserPermissions {
  role: 'user' | 'manager' | 'admin' | 'super-admin';
  subscription: 'free' | 'starter' | 'pro' | 'enterprise' | 'custom';
}

export const ROLE_HIERARCHY = {
  'user': 1,
  'manager': 2,
  'admin': 3,
  'super-admin': 4,
};

export function hasRole(
  user: UserPermissions, 
  requiredRole: string
): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
}

export function canDoAction(
  user: UserPermissions,
  action: string
): boolean {
  const PERMISSIONS = {
    'createTeam': ['manager', 'admin', 'super-admin'],
    'useAPI': ['admin', 'super-admin'],
    'accessSuperAdmin': ['super-admin'],
    'uploadVideo': ['user', 'manager', 'admin', 'super-admin'],
    'viewAnalytics': ['user', 'manager', 'admin', 'super-admin'],
    'createPlans': ['super-admin'],
    'whiteLabel': ['admin', 'super-admin'],
  };
  
  const allowedRoles = PERMISSIONS[action] || [];
  return allowedRoles.includes(user.role);
}
```

---

## 📋 API Endpoint Protection

### Example: Create Team Endpoint
```typescript
// app/api/team/create/route.ts

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // Check role permission
    if (!canDoAction(user, 'createTeam')) {
      return NextResponse.json(
        { error: 'Only managers and above can create teams' },
        { status: 403 }
      );
    }
    
    // Continue with creation...
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## 🎯 Access Control Examples

### Example 1: Free User trying to create team
```
User: john@example.com
Plan: Free
Role: user

Action: createTeam

Check:
- Has role 'user'? ✅
- Is 'createTeam' allowed for 'user'? ❌
- Can create team? NO

Response: Error - "Upgrade to Pro to create teams"
```

### Example 2: Pro User creating team
```
User: jane@example.com
Plan: Pro
Role: manager

Action: createTeam

Check:
- Has role 'manager'? ✅
- Is 'createTeam' allowed for 'manager'? ✅
- Can create team? YES

Response: Team created successfully
```

### Example 3: Super Admin managing plans
```
User: admin@company.com
Plan: Owner
Role: super-admin

Action: createPlan

Check:
- Has role 'super-admin'? ✅
- Is 'createPlan' allowed for 'super-admin'? ✅
- Can create plan? YES

Response: Plan creation form loaded
```

---

## 🔄 Role Transition When Plan Changes

### When User Upgrades Plan

```javascript
// Upgrade from Free → Starter
{
  before: { plan: 'free', role: 'user' },
  action: 'upgrade to starter',
  after: { plan: 'starter', role: 'user' }
  // Role stays same, features unlock
}

// Upgrade from Starter → Pro
{
  before: { plan: 'starter', role: 'user' },
  action: 'upgrade to pro',
  after: { plan: 'pro', role: 'manager' }
  // Role promoted to 'manager'
  // New features unlocked
}

// Upgrade from Pro → Enterprise
{
  before: { plan: 'pro', role: 'manager' },
  action: 'upgrade to enterprise',
  after: { plan: 'enterprise', role: 'admin' }
  // Role promoted to 'admin'
  // All admin features unlocked
}
```

### When User Downgrades Plan

```javascript
// Downgrade from Pro → Starter
{
  before: { plan: 'pro', role: 'manager' },
  action: 'downgrade to starter',
  after: { plan: 'starter', role: 'user' }
  // Role demoted to 'user'
  // Team features hidden (but data preserved)
}

// Downgrade from Enterprise → Pro
{
  before: { plan: 'enterprise', role: 'admin' },
  action: 'downgrade to pro',
  after: { plan: 'pro', role: 'manager' }
  // Role demoted to 'manager'
  // Admin features hidden (but data preserved)
}
```

---

## 📍 Features Locked Behind Roles

### User Role Features
```
✅ Basic Video Analysis
✅ Trending Topics
✅ Hashtag Generator
✅ Title Suggestions
✅ Basic Viral Score
❌ Team Management
❌ Content Calendar
❌ API Access
❌ White-Label
```

### Manager Role Features
```
✅ Everything in User
✅ Team Management (up to 3 members)
✅ Content Calendar
✅ Advanced Analytics
✅ Competitor Tracking
✅ Email Support
❌ API Access
❌ Custom Branding
❌ White-Label
```

### Admin Role Features
```
✅ Everything in Manager
✅ Team Management (unlimited)
✅ API Access
✅ Custom Branding
✅ White-Label Reports
✅ Custom AI Training
✅ 24/7 Priority Support
❌ Plan Management
❌ Super Admin Features
```

### Super-Admin Features
```
✅ Everything in Admin
✅ Plan Management
✅ User Management
✅ System Configuration
✅ Payment Gateway
✅ Email Templates
✅ Database Management
✅ Audit Logs
✅ Full Access
```

---

## 🚀 Implementation Checklist

When setting up roles:

- [ ] Each plan has correct `role` in database
- [ ] Role hierarchy is enforced in auth.ts
- [ ] API endpoints check user role
- [ ] Frontend hides features based on role
- [ ] Team feature limited by role
- [ ] API keys limited by role
- [ ] Admin panel accessible only to super-admin
- [ ] Audit logs track role changes
- [ ] Email notifications on role changes
- [ ] User education on role restrictions

---

## 📞 Support by Role

| Role | Support Level | Response Time |
|------|---------------|----------------|
| user | Community | Self-help |
| manager | Email | 24 hours |
| admin | Priority Email | 12 hours |
| super-admin | Dedicated | ASAP |

---

**Document Version**: 1.0  
**Last Updated**: March 28, 2026  
**Status**: Ready for Implementation
