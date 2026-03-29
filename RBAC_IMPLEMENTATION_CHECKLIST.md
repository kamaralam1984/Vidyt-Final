# Role-Based Access Control (RBAC) - Implementation Checklist
## Step-by-Step Implementation Guide

---

## 📚 Documentation Index

```
RBAC System Documentation
├── ROLE_BASED_ACCESS_CONTROL.md
│   ├── Role definitions
│   ├── Permission matrix
│   └── Role hierarchy
│
├── PLAN_ROLE_MAPPING.md
│   ├── Plan to role mapping
│   ├── Permission by plan
│   └── Upgrade/downgrade flow
│
├── lib/permissions.ts
│   ├── Permission checking functions
│   ├── Role hierarchy logic
│   └── Feature flags
│
└── RBAC_IMPLEMENTATION_GUIDE.md
    ├── How to use in API routes
    ├── Frontend permission checks
    └── Code examples
```

---

## 🚀 Implementation Steps

### Phase 1: Setup & Configuration (2 hours)

#### Step 1.1: Verify Plan Database
```bash
# Check if plans have correct roles in database
mongo
use viralboost
db.plans.find({})

# Should show:
# { planId: "free", role: "user" }
# { planId: "starter", role: "user" }
# { planId: "pro", role: "manager" }
# { planId: "enterprise", role: "admin" }
```

**Checklist:**
- [ ] Free plan has `role: user`
- [ ] Starter plan has `role: user`
- [ ] Pro plan has `role: manager`
- [ ] Enterprise plan has `role: admin`
- [ ] Custom plan has `role: admin`

#### Step 1.2: Reseed Plans (if needed)
```bash
# Seed plans with correct roles
node -r dotenv/config scripts/seed-plans.js

# Verify
db.plans.find()
```

**Checklist:**
- [ ] Run seed script successfully
- [ ] Verify all plans in database
- [ ] Check all roles are correct

#### Step 1.3: Review Permissions File
```bash
# Check lib/permissions.ts exists
ls -la lib/permissions.ts

# Should be created in previous steps
```

**Checklist:**
- [ ] Permissions file created
- [ ] All actions defined
- [ ] Role hierarchy constants set

---

### Phase 2: API Route Protection (4-6 hours)

#### Step 2.1: Create Team Endpoint
**File:** `app/api/team/create/route.ts`

```typescript
import { canPerform, checkPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // ✅ Add permission check
  const error = checkPermission(user, 'createTeam');
  if (error) return NextResponse.json(error, { status: error.status });
  
  // Continue with logic...
}
```

**Checklist:**
- [ ] Import permission functions
- [ ] Add permission check
- [ ] Test with free user (should fail)
- [ ] Test with pro user (should succeed)
- [ ] Test with enterprise user (should succeed)

#### Step 2.2: Invite Team Members Endpoint
**File:** `app/api/team/invite/route.ts`

```typescript
import { canPerform, getRoleFeatures } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // ✅ Add permission check
  if (!canPerform(user, 'inviteMembers')) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }
  
  // ✅ Check team member limit
  const features = getRoleFeatures(user.role);
  if (team.members.length >= features.teamMembers && features.teamMembers !== -1) {
    return NextResponse.json(
      { error: `Max ${features.teamMembers} members` },
      { status: 400 }
    );
  }
  
  // Continue...
}
```

**Checklist:**
- [ ] Permission check added
- [ ] Limit check added
- [ ] Test pro user (3 member limit)
- [ ] Test enterprise user (unlimited)

#### Step 2.3: API Keys Endpoint
**File:** `app/api/keys/create/route.ts`

```typescript
import { canPerform } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // ✅ Only admin+ can create API keys
  if (!canPerform(user, 'createAPIKeys')) {
    return NextResponse.json(
      { error: 'Enterprise plan required for API access' },
      { status: 403 }
    );
  }
  
  // Create API key...
}
```

**Checklist:**
- [ ] Permission check added
- [ ] Test free/starter/pro (should fail)
- [ ] Test enterprise/custom/super-admin (should succeed)

#### Step 2.4: Admin Features Endpoint
**File:** `app/api/admin/plans/route.ts`

```typescript
import { hasRole } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // ✅ Only super-admin can create plans
  if (!hasRole(user, 'super-admin')) {
    return NextResponse.json(
      { error: 'Super admin only' },
      { status: 403 }
    );
  }
  
  // Create plan...
}
```

**Checklist:**
- [ ] Super-admin check added
- [ ] Test with admin user (should fail)
- [ ] Test with super-admin (should succeed)

#### Step 2.5: Analytics Endpoints
**File:** `app/api/analytics/advanced/route.ts`

```typescript
import { hasMinRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // ✅ Manager and above only
  if (!hasMinRole(user, 'manager')) {
    return NextResponse.json(
      { error: 'Pro plan required' },
      { status: 403 }
    );
  }
  
  // Return analytics...
}
```

**Checklist:**
- [ ] Min role check added
- [ ] Test user/starter (should fail)
- [ ] Test pro/enterprise (should succeed)

#### Step 2.6: Protect Remaining Endpoints

**Endpoints to protect:**

```
✅ Video/Analysis endpoints
  - uploadVideo → canPerform(user, 'uploadVideo')
  - analyzeVideo → canPerform(user, 'analyzeVideo')
  - bulkUpload → canPerform(user, 'bulkUpload')

✅ AI Studio endpoints
  - scriptWriter → canPerform(user, 'scriptWriter')
  - thumbnailIdeas → canPerform(user, 'thumbnailIdeas')
  - hookGenerator → canPerform(user, 'hookGenerator')
  - aiCoach → canPerform(user, 'aiCoach')

✅ Content Management
  - schedulePost → canPerform(user, 'schedulePost')
  - bulkScheduling → canPerform(user, 'bulkScheduling')

✅ Analytics
  - viewAdvancedAnalytics → hasMinRole(user, 'manager')
  - createCustomReports → canPerform(user, 'createCustomReports')
  - exportReports → canPerform(user, 'exportReports')

✅ Team Management
  - manageTeamMembers → canPerform(user, 'manageTeamMembers')
  - viewAuditLogs → canPerform(user, 'viewAuditLogs')

✅ Competitor Analysis
  - trackCompetitors → canPerform(user, 'trackCompetitors')

✅ Admin (Super-Admin only)
  - managePlans → hasRole(user, 'super-admin')
  - createDiscounts → hasRole(user, 'super-admin')
  - manageUsers → hasRole(user, 'super-admin')
```

**Checklist:**
- [ ] All endpoints reviewed
- [ ] Permission checks added
- [ ] Test with multiple user roles
- [ ] Document protected endpoints

---

### Phase 3: Frontend Permission Checks (2-3 hours)

#### Step 3.1: Create Permission Hook

**File:** `hooks/usePermission.ts`

```typescript
import { useAuth } from '@/context/AuthContext';
import { canPerform, getRoleFeatures } from '@/lib/permissions';

export function usePermission() {
  const { user } = useAuth();
  
  return {
    can: (action: string) => canPerform(user, action as any),
    features: user ? getRoleFeatures(user.role as any) : null,
  };
}
```

**Checklist:**
- [ ] Hook created
- [ ] Test with different user roles
- [ ] Exports correct values

#### Step 3.2: Hide Features Based on Role

**Example: Team Features Component**

```typescript
// components/TeamSection.tsx

export function TeamSection() {
  const { can } = usePermission();
  
  if (!can('createTeam')) {
    return (
      <div className="bg-blue-50 p-4 rounded">
        <p>Team features available with Pro plan</p>
        <a href="/pricing" className="text-blue-600">
          Upgrade now
        </a>
      </div>
    );
  }
  
  return <TeamManager />;
}
```

**Checklist:**
- [ ] Team section gatekeeping added
- [ ] Test with free user (hidden)
- [ ] Test with pro user (shown)

#### Step 3.3: Hide Menu Items

**Example: Navigation Menu**

```typescript
// components/Navbar.tsx

export function Navbar() {
  const { user } = useAuth();
  
  return (
    <nav>
      {/* Always visible */}
      <a href="/dashboard">Dashboard</a>
      <a href="/videos">Videos</a>
      
      {/* Only Pro+ */}
      {hasMinRole(user, 'manager') && (
        <a href="/teams">Teams</a>
      )}
      
      {/* Only Enterprise+ */}
      {hasMinRole(user, 'admin') && (
        <a href="/api-keys">API Keys</a>
      )}
      
      {/* Only Super Admin */}
      {hasRole(user, 'super-admin') && (
        <a href="/admin/super">Admin</a>
      )}
    </nav>
  );
}
```

**Checklist:**
- [ ] Navigation updated
- [ ] Menu items hidden by role
- [ ] Test with each user role

#### Step 3.4: Show Upgrade Prompts

**Example: Upgrade Request Component**

```typescript
// components/UpgradePrompt.tsx

export function UpgradePrompt({ action }) {
  const { user } = useAuth();
  const message = getUpgradeMessage(action, user?.role);
  
  return (
    <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
      <p className="text-sm text-yellow-800">{message}</p>
      <a href="/pricing" className="text-yellow-600 font-bold">
        See pricing plans →
      </a>
    </div>
  );
}
```

**Checklist:**
- [ ] Upgrade prompt component created
- [ ] Shows correct message
- [ ] Links to pricing page

---

### Phase 4: Testing (4-6 hours)

#### Step 4.1: Create Test Users

```bash
# Free user
POST /api/auth/register
{
  "email": "free@test.com",
  "password": "test123"
}
# Should auto-assign free plan

# Starter user
# Manually assign starter plan in admin panel

# Pro user (manager role)
# Manually assign pro plan

# Enterprise user (admin role)
# Manually assign enterprise plan

# Super admin
# Manually create with super-admin role
```

**Checklist:**
- [ ] Free user created
- [ ] Starter user created
- [ ] Pro user created
- [ ] Enterprise user created
- [ ] Super-admin user created

#### Step 4.2: Test Permission Checks

**Test Matrix:**

```
╭─────────────────┬───────┬────────┬──────┬────────────┬──────────────╮
│ Action          │ Free  │Starter │ Pro  │Enterprise  │ Super-Admin  │
├─────────────────┼───────┼────────┼──────┼────────────┼──────────────┤
│ Upload Video    │ ✅ OK │ ✅ OK  │ ✅ OK│ ✅ OK      │ ✅ OK        │
│ Use AI Studio   │ ❌ 403│ ✅ OK  │ ✅ OK│ ✅ OK      │ ✅ OK        │
│ Create Team     │ ❌ 403│ ❌ 403 │ ✅ OK│ ✅ OK      │ ✅ OK        │
│ Use API         │ ❌ 403│ ❌ 403 │ ❌ 403│ ✅ OK      │ ✅ OK        │
│ Create Plans    │ ❌ 403│ ❌ 403 │ ❌ 403│ ❌ 403     │ ✅ OK        │
│ Advanced Analyt │ ❌ 403│ ❌ 403 │ ✅ OK│ ✅ OK      │ ✅ OK        │
╰─────────────────┴───────┴────────┴──────┴────────────┴──────────────╯

✅ = Allowed
❌ = Denied with 403
```

**Test Procedure:**
```bash
# For each action and user:
1. Login with user
2. Call endpoint
3. Verify response:
   - ✅ Actions: 200 OK
   - ❌ Denied: 403 Forbidden with error message
```

**Checklist:**
- [ ] All permissions tested
- [ ] Correct HTTP status codes
- [ ] Error messages clear
- [ ] No false positives/negatives

#### Step 4.3: Test Role Hierarchy

```
Test: User upgrades Free → Starter
Expected:
- Role stays 'user'
- Features unlock
- Team features still hidden

Test: User upgrades Starter → Pro
Expected:
- Role changes to 'manager'
- Team features unlock
- Menu items appear
- API still unavailable

Test: User upgrades Pro → Enterprise
Expected:
- Role changes to 'admin'
- API access unlocked
- Admin features unlocked
- White-label enabled
```

**Checklist:**
- [ ] Free → Starter upgrade tested
- [ ] Starter → Pro upgrade tested
- [ ] Pro → Enterprise upgrade tested
- [ ] Data preserved on upgrade
- [ ] New permissions active

#### Step 4.4: Test Frontend Gatekeeping

```
Test: Free user visits /teams
Expected: See "Upgrade" message, button disabled

Test: Pro user visits /teams
Expected: Team manager page loads

Test: Free user tries /api-keys
Expected: Page redirects to /pricing

Test: Enterprise user visits /api-keys
Expected: API key management loads

Test: Navigation menu viewed as Free user
Expected: Teams, API Keys, Admin links hidden

Test: Navigation menu viewed as Pro user
Expected: Teams visible, API Keys hidden, Admin hidden

Test: Navigation menu viewed as Enterprise user
Expected: Teams, API Keys visible, Admin hidden

Test: Navigation menu viewed as Super Admin
Expected: All links visible
```

**Checklist:**
- [ ] Free user cannot access team features
- [ ] Pro user cannot access API features
- [ ] Enterprise user cannot access admin
- [ ] Super-admin can access everything
- [ ] Menu items show/hide correctly
- [ ] Upgrade prompts display

#### Step 4.5: Test Limits

```
Test: Pro user with team of 3 members tries to add 4th
Expected: Error "Max 3 members reached"

Test: Enterprise user with team tries to add unlimited members
Expected: Success, no limit

Test: Free user makes 6th video analysis
Expected: Error "Limit reached (5/month)"

Test: Starter user makes 11th analysis in a day
Expected: Error "Limit reached (10/day)"
```

**Checklist:**
- [ ] Plan limits enforced
- [ ] Clear error messages
- [ ] Enterprise unlimited works
- [ ] Rate limiting works

---

### Phase 5: Monitoring & Logging (1-2 hours)

#### Step 5.1: Add Permission Logging

```typescript
// lib/permissions.ts - Add logging

export function canPerform(user, action) {
  const allowed = /* check logic */;
  
  if (!allowed) {
    console.log({
      timestamp: new Date(),
      userId: user?.id,
      action,
      role: user?.role,
      denied: true,
    });
  }
  
  return allowed;
}
```

**Checklist:**
- [ ] Denied permissions logged
- [ ] Log includes user ID, action, role
- [ ] Logs accessible for debugging

#### Step 5.2: Track Permission Metrics

**Endpoints to add:**

```typescript
// app/api/admin/metrics/permissions/route.ts

export async function GET(request: NextRequest) {
  // Return:
  // - Permission denials by action
  // - Denials by user role
  // - Denials over time
  // - Most denied actions
}
```

**Checklist:**
- [ ] Permission metrics endpoint created
- [ ] Track denials
- [ ] Track by action
- [ ] Track by role
- [ ] Dashboard shows key metrics

---

### Phase 6: Documentation & Training (2 hours)

#### Step 6.1: Developer Documentation

**Create doc:**
```markdown
# Using the Permission System

## Quick Start
```bash
import { canPerform } from '@/lib/permissions';

// In your API route
if (!canPerform(user, 'createTeam')) {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
}
```

## Available Actions
[List all available actions from PERMISSIONS constant]

## Examples
[Real examples from codebase]
```

**Checklist:**
- [ ] Quick start guide created
- [ ] Action list documented
- [ ] Examples provided
- [ ] Shared with team

#### Step 6.2: User Documentation

**Create page:** `/docs/plan-permissions`

```markdown
# What Can You Do With Your Plan?

## Free Plan
- ✅ Upload videos (5/month)
- ❌ Create teams
- ❌ Use API

## Pro Plan
- ✅ All free features
- ✅ Create teams (3 members)
- ✅ Advanced analytics
- ❌ Use API

## Enterprise Plan  
- ✅ All pro features
- ✅ Unlimited team size
- ✅ Use API
- ✅ White-label reports
```

**Checklist:**
- [ ] User-facing docs created
- [ ] Each plan documented
- [ ] Upgrade paths clear
- [ ] Shared with support team

---

## ✅ Final Checklist

### Database & Configuration
- [ ] All plans have correct roles
- [ ] Plan roles stored in database
- [ ] Seed script creates proper roles
- [ ] User plan assignments work

### Backend Protection
- [ ] lib/permissions.ts created
- [ ] Permission functions exported
- [ ] All critical endpoints protected
- [ ] Error messages clear
- [ ] Limits enforced

### Frontend Gatekeeping
- [ ] Permission hook created
- [ ] Features hidden by role
- [ ] Menu items conditional
- [ ] Upgrade prompts shown
- [ ] No feature leakage

### Testing
- [ ] Test users created
- [ ] All permissions tested
- [ ] Upgrades tested
- [ ] Limits tested
- [ ] No false positives

### Monitoring
- [ ] Permission denials logged
- [ ] Metrics collected
- [ ] Dashboard shows stats
- [ ] Alerts configured

### Documentation
- [ ] Developer docs created
- [ ] User docs created
- [ ] Team trained
- [ ] Deployment checklist done

---

## 🚀 Deployment Steps

### 1. Pre-Deployment (QA)
```bash
# Run full test suite
npm test

# Check all permission endpoints
curl -H "Authorization: Bearer {token}" http://localhost:3000/api/team/create

# Test with multiple user roles
```

### 2. Deploy
```bash
# Build
npm run build

# Deploy to production
npm run start
```

### 3. Post-Deployment
```bash
# Verify permissions working
# Check logs for errors
# Monitor first 24 hours
# Test with real users
```

### 4. Communication
- [ ] Notify team of changes
- [ ] Update documentation
- [ ] Send user email (if applicable)
- [ ] Support team briefing

---

## 📞 Troubleshooting

### Permission Denied But Should Be Allowed

**Check:**
1. User has correct plan assigned
   ```bash
   db.users.findOne({ email: "user@example.com" })
   # Check: plan, role fields
   ```

2. Plan has correct role
   ```bash
   db.plans.findOne({ planId: "pro" })
   # Check: role should be "manager"
   ```

3. Permission is defined
   ```typescript
   // Check PERMISSIONS object in lib/permissions.ts
   // Action should be in list
   ```

4. User session fresh
   ```
   User needs to logout/login for role change
   ```

### Permission Allowed But Should Be Denied

**Check:**
1. Action defined correctly
2. Allowed roles are correct
3. User's actual role (not assumed)
4. Test with fresh login

### Frontend Feature Showing But Should Be Hidden

**Check:**
1. usePermission hook used
2. Correct action name in canPerform()
3. Condition logic correct
4. No typos in component

---

**Version**: 1.0  
**Last Updated**: March 28, 2026  
**Status**: Ready for Implementation

For question see:
- [ROLE_BASED_ACCESS_CONTROL.md](ROLE_BASED_ACCESS_CONTROL.md) - System overview
- [PLAN_ROLE_MAPPING.md](PLAN_ROLE_MAPPING.md) - Plan details
- [RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md) - Code examples
