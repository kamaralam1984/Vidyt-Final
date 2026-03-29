# Role-Based Access Control - Implementation Guide
## Developers के लिए Permission System कैसे use करें

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoint Protection](#api-endpoint-protection)
3. [Frontend Permission Checks](#frontend-permission-checks)
4. [Examples](#examples)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Import Permissions
```typescript
import { canPerform, checkPermission, hasMinRole } from '@/lib/permissions';
```

### Step 2: Add Permission Check
```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // Check permission
  if (!canPerform(user, 'createTeam')) {
    return NextResponse.json(
      { error: 'You need Pro plan to create teams' },
      { status: 403 }
    );
  }
  
  // Continue with logic
}
```

### Step 3: Done! 🎉

---

## 🔐 Protecting API Endpoints

### Method 1: Simple Check
```typescript
// app/api/team/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { canPerform } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // Check if user is logged in
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ✅ Check permission
    if (!canPerform(user, 'createTeam')) {
      return NextResponse.json(
        { error: 'You need Pro plan to create teams' },
        { status: 403 }
      );
    }
    
    // ✅ Permission granted - continue
    const body = await request.json();
    // ... create team logic
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
```

### Method 2: Using checkPermission Helper
```typescript
import { checkPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // ✅ Check permission and get error if denied
    const error = checkPermission(user, 'createTeam');
    if (error) {
      return NextResponse.json(
        { error: error.error },
        { status: error.status }
      );
    }
    
    // Permission granted
    // ... continue with logic
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  }
}
```

### Method 3: Role-Level Check
```typescript
import { hasMinRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // Check if user is manager or above
  if (!hasMinRole(user, 'manager')) {
    return NextResponse.json(
      { error: 'Managers and above only' },
      { status: 403 }
    );
  }
  
  // Continue...
}
```

### Method 4: Multiple Permissions
```typescript
import { canPerformAll, canPerformAny } from '@/lib/permissions';

// Check ALL permissions (all must be true)
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!canPerformAll(user, ['createTeam', 'manageTeamMembers'])) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  // Continue...
}

// Check ANY permission (at least one must be true)
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!canPerformAny(user, ['downloadReport', 'exportData'])) {
    return NextResponse.json(
      { error: 'No export permissions' },
      { status: 403 }
    );
  }
  
  // Continue...
}
```

---

## 🎨 Frontend Permission Checks

### React Component Example
```typescript
// components/CreateTeamButton.tsx

import { useAuth } from '@/context/AuthContext';
import { canPerform, getRoleFeatures } from '@/lib/permissions';

export function CreateTeamButton() {
  const { user } = useAuth();
  
  // Check if user can create team
  const canCreate = user ? canPerform(user, 'createTeam') : false;
  
  if (!canCreate) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm">
          Pro plan required to create teams.{' '}
          <a href="/pricing" className="text-blue-600 hover:underline">
            Upgrade now
          </a>
        </p>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => /* create team */}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Create Team
    </button>
  );
}
```

### Show Feature Based on Role
```typescript
// components/FeatureGate.tsx

import { getRoleFeatures } from '@/lib/permissions';

export function AnalyticsSection({ userRole }) {
  const features = getRoleFeatures(userRole);
  
  if (!features.canAccessAdmin) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        <p>Advanced analytics available in Pro plans</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Show analytics */}
    </div>
  );
}
```

### Conditional UI Rendering
```typescript
// components/AdminPanel.tsx

import { hasRole } from '@/lib/permissions';

export function AdminPanel({ user }) {
  // Only show to super-admin
  if (!hasRole(user, 'super-admin')) {
    return <div>Access denied</div>;
  }
  
  return (
    <div>
      {/* Admin features */}
    </div>
  );
}

export function TeamManagement({ user }) {
  // Show to manager+
  const canManager = user && (
    hasRole(user, 'manager') ||
    hasRole(user, 'admin') ||
    hasRole(user, 'super-admin')
  );
  
  if (!canManager) {
    return <div>Team features available in Pro</div>;
  }
  
  return (
    <div>
      {/* Team management UI */}
    </div>
  );
}
```

---

## 📚 Examples

### Example 1: Create Team Endpoint

```typescript
// app/api/team/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { canPerform } from '@/lib/permissions';
import Team from '@/models/Team';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // ✅ Permission check
    if (!user || !canPerform(user, 'createTeam')) {
      return NextResponse.json(
        { error: 'You need Pro plan to create teams' },
        { status: 403 }
      );
    }
    
    // Get request body
    const { teamName, description } = await request.json();
    
    // Validate input
    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name required' },
        { status: 400 }
      );
    }
    
    // Connect DB and create team
    await connectDB();
    const team = await Team.create({
      name: teamName,
      description: description || '',
      owner: user.id,
      members: [user.id],
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      team: {
        id: team._id,
        name: team.name,
        owner: team.owner,
      },
    });
    
  } catch (error: any) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
```

### Example 2: Invite Team Member (with limit check)

```typescript
// app/api/team/invite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { canPerform, getRoleFeatures } from '@/lib/permissions';
import Team from '@/models/Team';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // ✅ Check permission
    if (!user || !canPerform(user, 'inviteMembers')) {
      return NextResponse.json(
        { error: 'You need Pro plan to invite team members' },
        { status: 403 }
      );
    }
    
    // Get request body
    const { teamId, emailAddress } = await request.json();
    
    // Connect DB
    await connectDB();
    
    // Get team
    const team = await Team.findById(teamId);
    if (!team || team.owner !== user.id) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // ✅ Check team member limit
    const features = getRoleFeatures(user.role as any);
    if (team.members.length >= features.teamMembers && features.teamMembers !== -1) {
      return NextResponse.json(
        { error: `Maximum team members (${features.teamMembers}) reached` },
        { status: 400 }
      );
    }
    
    // Find user to invite
    const inviteUser = await User.findOne({ email: emailAddress });
    if (!inviteUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Add to team
    if (!team.members.includes(inviteUser._id)) {
      team.members.push(inviteUser._id);
      await team.save();
    }
    
    return NextResponse.json({
      success: true,
      message: `${emailAddress} added to team`,
    });
    
  } catch (error: any) {
    console.error('Invite member error:', error);
    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 }
    );
  }
}
```

### Example 3: View Advanced Analytics

```typescript
// app/api/analytics/advanced/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { canPerform, hasMinRole } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // ✅ Check if user is manager or above
    if (!user || !hasMinRole(user, 'manager')) {
      return NextResponse.json(
        { error: 'Advanced analytics require Pro plan' },
        { status: 403 }
      );
    }
    
    // Also can check specific action
    if (!canPerform(user, 'viewAdvancedAnalytics')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Fetch and return analytics
    const analytics = {
      views: 1500,
      clicks: 300,
      avgEngagement: 20.5,
      topPerformers: [...],
    };
    
    return NextResponse.json({
      success: true,
      data: analytics,
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

### Example 4: Create API Key (Admin only)

```typescript
// app/api/keys/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { canPerform } from '@/lib/permissions';
import APIKey from '@/models/APIKey';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // ✅ Check permission
    if (!user || !canPerform(user, 'createAPIKeys')) {
      return NextResponse.json(
        { error: 'API access requires Enterprise plan' },
        { status: 403 }
      );
    }
    
    // Generate API key
    const apiKey = generateRandomKey();
    
    // Save to database
    const keyDoc = await APIKey.create({
      key: apiKey,
      userId: user.id,
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      message: 'Save this API key safely',
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
```

### Example 5: Plan Management (Super Admin only)

```typescript
// app/api/admin/plans/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { canPerform, hasRole } from '@/lib/permissions';
import Plan from '@/models/Plan';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // ✅ Check super-admin permission
    if (!user || !hasRole(user, 'super-admin')) {
      return NextResponse.json(
        { error: 'Super admin only' },
        { status: 403 }
      );
    }
    
    // Alternative check
    if (!canPerform(user, 'createPlans')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Create plan
    const plan = await Plan.create({
      planId: body.planId,
      name: body.name,
      priceMonthly: body.priceMonthly,
      role: body.role,
      features: body.features,
      // ... other fields
    });
    
    return NextResponse.json({
      success: true,
      plan: plan,
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
```

---

## 🔍 Checking All Available Actions

```typescript
import { getAllActions, getMinRoleFor } from '@/lib/permissions';

// Get all actions for a role
const managerActions = getAllActions('manager');
console.log(managerActions);
// Output: ['uploadVideo', 'analyzeVideo', 'createTeam', 'inviteMembers', ...]

// Get minimum role for an action
const minRole = getMinRoleFor('useAPI');
console.log(minRole); // Output: 'admin'

// Check what users with 'user' role can do
const userActions = getAllActions('user');
console.log(userActions);
// Output: ['uploadVideo', 'analyzeVideo', 'viewOwnAnalytics', ...]
```

---

## 🔄 Managing User Permissions

```typescript
import { canManageUser } from '@/lib/permissions';

// Check if user A can manage user B
const canManage = canManageUser(managerUser, normalUser);

if (!canManage) {
  return NextResponse.json(
    { error: 'Cannot manage this user' },
    { status: 403 }
  );
}

// Super admin can manage anyone
// Admin can manage user/manager (not admin)
// Manager can manage other users
// User cannot manage anyone
```

---

## 🎁 Get Upgrade Message

```typescript
import { getUpgradeMessage } from '@/lib/permissions';

// Get user-friendly upgrade message
const msg = getUpgradeMessage('useAPI', 'user');
// Output: "Please upgrade to Enterprise plan to use api."

const msg2 = getUpgradeMessage('createTeam', 'user');
// Output: "Please upgrade to Pro plan to create team."
```

---

## 📱 Permission Checking in Frontend

```typescript
// hooks/usePermission.ts

import { useAuth } from '@/context/AuthContext';
import { canPerform, getRoleFeatures } from '@/lib/permissions';

export function usePermission() {
  const { user } = useAuth();
  
  return {
    canPerform: (action: string) => canPerform(user, action as any),
    getRoleFeatures: () => user ? getRoleFeatures(user.role as any) : null,
  };
}

// Usage in component
export function MyComponent() {
  const { canPerform, getRoleFeatures } = usePermission();
  const features = getRoleFeatures();
  
  if (!canPerform('createTeam')) {
    return <UpgradePrompt />;
  }
  
  return <TeamCreator />;
}
```

---

## ⚠️ Troubleshooting

### Permission Denied Despite Having Plan

**Check:**
1. User's plan is correctly assigned
2. Plan has correct role in database
3. User session is fresh (logout/login)
4. No role override in database

```bash
# Check user's plan and role
db.users.findOne({ email: "user@example.com" })
# Should show: { plan: "pro", role: "manager" }

# Check plan configuration
db.plans.findOne({ planId: "pro" })
# Should show: { role: "manager" }
```

### Action Not Listed in Permissions

**Solution:**
Add the action to `PERMISSIONS` object in `lib/permissions.ts`:

```typescript
export const PERMISSIONS = {
  // ... existing actions
  myNewAction: ['manager', 'admin', 'super-admin'],
};
```

### Permission Check Not Working

**Common Issues:**
- User object is null (not logged in)
- Action name is wrong
- Role name is misspelled
- Database connection failed

**Debug:**
```typescript
console.log('User:', user);
console.log('Role:', user?.role);
console.log('Can perform:', canPerform(user, 'createTeam'));
```

---

## 📋 Checklist After Adding Permission

- [ ] Import permission function at top of file
- [ ] Check permission before processing request
- [ ] Return 403 if access denied
- [ ] Return 401 if user not logged in
- [ ] Test with different user roles
- [ ] Check database for correct role assignment
- [ ] Update frontend to hide denied features
- [ ] Document permission requirement in code
- [ ] Add to permission constants if new action
- [ ] Test upgrade flow

---

## 🚀 Best Practices

### ✅ DO

- Check permissions at the start of endpoint
- Use specific action names from PERMISSIONS
- Return clear error messages
- Test with multiple user roles
- Log permission failures for debugging
- Update frontend to match backend permissions

### ❌ DON'T

- Check permissions only in frontend
- Create custom permission checks
- Skip permission check "just this once"
- Hardcode role names
- Trust client-sent role information
- Forget to handle null users

---

## 📞 Quick Reference

```typescript
// Check single action
canPerform(user, 'createTeam')

// Check role level
hasMinRole(user, 'manager')

// Check specific role
hasRole(user, 'super-admin')

// Check multiple actions (all)
canPerformAll(user, ['action1', 'action2'])

// Check multiple actions (any)
canPerformAny(user, ['action1', 'action2'])

// Get error and status
checkPermission(user, 'action')

// Get all actions for role
getAllActions('manager')

// Get minimum role for action
getMinRoleFor('useAPI')

// Get role features
getRoleFeatures('pro')

// Check if can manage another user
canManageUser(manager, target)

// Get upgrade message
getUpgradeMessage('useAPI', 'user')
```

---

**Version**: 1.0  
**Last Updated**: March 28, 2026  
**Status**: Ready to Use
