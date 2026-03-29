# Protected API Endpoints - Implementation Template
## सभी API endpoints को protect करने के लिए template और examples

---

## 🎯 Why Protect Endpoints?

हर endpoint जो data access करता है, उसे role-check होना चाहिए।
बिना check के, कोई भी free user enterprise features access कर सकता है।

---

## 📋 List of Endpoints That Need Protection

### 1. Video Management
- [ ] `POST /api/videos/upload` - uploadVideo
- [ ] `POST /api/videos/analyze` - analyzeVideo  
- [ ] `DELETE /api/videos/[id]` - deleteVideo
- [ ] `POST /api/videos/bulk` - bulkUpload

### 2. AI Studio
- [ ] `POST /api/ai-studio/script` - scriptWriter
- [ ] `POST /api/ai-studio/thumbnails` - thumbnailIdeas
- [ ] `POST /api/ai-studio/hooks` - hookGenerator
- [ ] `POST /api/ai-studio/shorts` - shortsCreator

### 3. Team Management
- [ ] `POST /api/team/create` - createTeam (manager+)
- [ ] `POST /api/team/invite` - inviteMembers (manager+)
- [ ] `PUT /api/team/members/[id]` - manageTeamMembers (manager+)
- [ ] `DELETE /api/team/members/[id]` - removeMembers (manager+)

### 4. Analytics
- [ ] `GET /api/analytics` - viewOwnAnalytics (user+)
- [ ] `GET /api/analytics/advanced` - viewAdvancedAnalytics (manager+)
- [ ] `GET /api/analytics/team` - viewTeamAnalytics (manager+)
- [ ] `POST /api/reports/export` - exportReports (manager+)

### 5. API & Integration
- [ ] `POST /api/keys/create` - createAPIKeys (admin+)
- [ ] `POST /api/webhooks/create` - manageWebhooks (admin+)
- [ ] `POST /api/integrations/custom` - customIntegrations (admin+)

### 6. Admin Only
- [ ] `GET /api/admin/plans` - managePlans (super-admin)
- [ ] `POST /api/admin/plans` - createPlans (super-admin)
- [ ] `PATCH /api/admin/plans/[id]` - editPlans (super-admin)
- [ ] `POST /api/admin/users/[id]/role` - assignPlanToUser (super-admin)

---

## 🔧 Template 1: Simple Role Check

### Before (No Protection)
```typescript
// File: app/api/videos/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { videoId } = await request.json();
  
  // No permission check! Free users can access this!
  const analysis = await analyzeVideo(videoId);
  
  return NextResponse.json({ analysis });
}
```

### After (With Protection)
```typescript
// File: app/api/videos/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { canPerform } from '@/lib/permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // ✅ Check: Can user analyze videos?
  if (!canPerform(user, 'analyzeVideo')) {
    return NextResponse.json(
      { error: 'Free plan: Only 3 analyses/month allowed' },
      { status: 403 }
    );
  }
  
  const { videoId } = await request.json();
  const analysis = await analyzeVideo(videoId);
  
  return NextResponse.json({ analysis });
}
```

---

## 🔧 Template 2: Minimum Role Check

### Protect: Only Manager+ Can Create Teams
```typescript
// File: app/api/team/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, apiSuccess, apiError } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // ✅ Enforce: Must be "manager" role minimum
  const check = requireRole(user, 'manager', 'createTeam');
  if (check.denied) return check.response;
  
  // User is manager+ level, safe to proceed
  const { teamName, description } = await request.json();
  
  const team = await Team.create({
    name: teamName,
    description,
    ownerId: user.id,
  });
  
  return apiSuccess(team, 'Team created successfully');
}
```

---

## 🔧 Template 3: Usage Limit Check

### Protect: Check Daily Analysis Limit
```typescript
// File: app/api/analytics/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, apiError, apiSuccess } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // ✅ Check: Get today's analysis count
  const analysesToday = await getAnalysesCount(user.id);
  
  // ✅ Enforce limit based on role
  const limitCheck = checkUsageLimit(user, 'analyzeVideo', analysesToday);
  if (!limitCheck.withinLimit) {
    return apiError(
      `Daily limit reached: ${limitCheck.used}/${limitCheck.limit}`,
      'LIMIT_EXCEEDED',
      429 // Rate limit status code
    );
  }
  
  // Limit not exceeded, safe to analyze
  const analysis = await performAnalysis(user.id);
  return apiSuccess(analysis);
}
```

---

## 🔧 Template 4: Multiple Permissions Check

### Protect: Need Multiple Permissions
```typescript
// File: app/api/reports/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { canPerformAll, apiError, apiSuccess } from '@/lib/permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // ✅ Check: User needs BOTH permissions
  if (!canPerformAll(user, ['viewAdvancedAnalytics', 'exportReports'])) {
    return apiError(
      'Pro plan required for custom reports',
      'UPGRADE_REQUIRED',
      403
    );
  }
  
  // Both permissions confirmed
  const report = await generateCustomReport(user.id);
  return apiSuccess(report);
}
```

---

## 🔧 Template 5: API Key Only (Admin+)

### Protect: Super Admin Only
```typescript
// File: app/api/admin/plans/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hasRole, apiSuccess, apiError } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // ✅ Check: Strict role check (super-admin ONLY)
  if (!hasRole(user, 'super-admin')) {
    return apiError(
      'Super admin access required',
      'FORBIDDEN',
      403
    );
  }
  
  // Only super-admin can reach this point
  const { planName, role } = await request.json();
  const plan = await Plan.create({ name: planName, role });
  
  return apiSuccess(plan, 'Plan created by super-admin');
}
```

---

## 🔧 Template 6: Protected Route Decorator

### Use Decorator Pattern (Optional)
```typescript
// File: app/api/custom-models/train/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, apiSuccess } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';

// Using the decorator pattern for cleaner code
const handler = protectedRoute('admin', 'trainCustomModels')(
  async (request: NextRequest, user: AuthUser) => {
    // Code inside here already has permission verified
    const model = await trainModel(user.id);
    return apiSuccess(model, 'Model training started');
  }
);

export const POST = handler;
```

---

## 🔧 Template 7: Get Features & Limits

### Check What User Can Access
```typescript
// File: app/api/features/available/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoleFeatures, apiSuccess } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function GET(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // ✅ Get all features and limits for user's role
  const features = getRoleFeatures(user.role);
  
  return apiSuccess({
    role: user.role,
    plan: user.subscription,
    features,
    message: `User has ${features.teamMembers} team member slots, ${features.analysesPerDay} analyses/day`
  });
}
```

---

## 📝 Step-by-Step: Protect Your Endpoint

### Step 1: Import Required Functions
```typescript
import { canPerform, requireRole, checkUsageLimit } from '@/lib/api-permissions';
import { apiSuccess, apiError } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';
```

### Step 2: Get User from Request
```typescript
export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;
  
  // If middleware didn't provide user, return 401
  if (!user) {
    return apiError('Authentication required', 'NO_AUTH', 401);
  }
  
  // User is authenticated, now check permissions
}
```

### Step 3: Add Permission Check
```typescript
// Option A: Simple permission check
if (!canPerform(user, 'actionName')) {
  return apiError('Not allowed', 'FORBIDDEN', 403);
}

// Option B: Minimum role requirement
const check = requireRole(user, 'manager');
if (check.denied) return check.response;

// Option C: Usage limit check
const limit = checkUsageLimit(user, 'analyzeVideo', currentUsageCount);
if (!limit.withinLimit) {
  return apiError('Limit exceeded', 'LIMIT_EXCEEDED', 429);
}
```

### Step 4: Custom Error Messages
```typescript
// Provide helpful upgrade messages
const roleNames = {
  'user': 'Free',
  'manager': 'Pro',
  'admin': 'Enterprise',
  'super-admin': 'Super Admin'
};

if (!canPerform(user, 'createTeam')) {
  const requiredRole = 'manager';
  return apiError(
    `${roleNames[requiredRole]} plan required for team features`,
    'UPGRADE_REQUIRED',
    403
  );
}
```

---

## 🎨 Frontend: Show Permission Status

### React Component Example
```typescript
'use client';
import { canPerform, hasMinRole } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';

export function TeamManager() {
  const { user } = useAuth();
  
  // Check permission before rendering
  if (!canPerform(user, 'createTeam')) {
    return (
      <div className="p-4 bg-blue-100 rounded">
        <p>Team features available in Pro plan</p>
        <a href="/pricing" className="text-blue-600 underline">
          Upgrade to Pro
        </a>
      </div>
    );
  }
  
  // User has permission, show feature
  return (
    <div>
      <h2>Manage Teams</h2>
      <CreateTeamForm />
    </div>
  );
}
```

---

## 🧪 Testing Protected Endpoints

### Test with Different Users

#### Test 1: Free User Accessing Pro Feature
```bash
# User has free plan (user role)
curl -H "Authorization: Bearer $FREE_USER_TOKEN" \
  -X POST http://localhost:3000/api/team/create \
  -d '{"name":"Test Team"}'

# Expected Response: 403 Forbidden
# {
#   "error": "Pro plan required for team features",
#   "code": "UPGRADE_REQUIRED"
# }
```

#### Test 2: Pro User Accessing Pro Feature
```bash
# User has pro plan (manager role)
curl -H "Authorization: Bearer $PRO_USER_TOKEN" \
  -X POST http://localhost:3000/api/team/create \
  -d '{"name":"Test Team"}'

# Expected Response: 201 Created (or success)
# {
#   "success": true,
#   "data": { "id": "team_123", "name": "Test Team" }
# }
```

#### Test 3: Admin Accessing Super Admin Feature
```bash
# User has enterprise plan (admin role)
curl -H "Authorization: Bearer $ADMIN_USER_TOKEN" \
  -X POST http://localhost:3000/api/admin/plans \
  -d '{"name":"New Plan"}'

# Expected Response: 403 Forbidden
# {
#   "error": "Super admin access required",
#   "code": "FORBIDDEN"
# }
```

---

## ✅ Verification Checklist

After protecting each endpoint:

- [ ] Endpoint checks user authentication (401 if missing)
- [ ] Endpoint checks user permissions (403 if denied)
- [ ] Endpoint returns helpful error messages
- [ ] Endpoint logs permission denials (for audit)
- [ ] Frontend hides feature if permission denied
- [ ] Tested with each role type
- [ ] User gets helpful upgrade message
- [ ] No sensitive data leaked in error responses

---

## 🚀 Implementation Order

Protect endpoints in this priority order:

### Priority 1: Revenue Critical (Today)
- Team creation & management
- API key generation
- Plan management endpoints
- Custom model training

### Priority 2: Important (This Week)
- Advanced analytics access
- Content calendar & scheduling
- Bulk operations
- White-label features

### Priority 3: Nice to Have (Next Week)
- Basic analytics views
- Individual feature APIs
- Minor utility endpoints

---

## 💾 Copy-Paste Template

```typescript
// ============================================================================
// File: app/api/[path]/route.ts
// Purpose: [What this endpoint does]
// Role Required: [user | manager | admin | super-admin]
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, apiSuccess, apiError } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  // Step 1: Get user from request
  const user = (request as any).user as AuthUser;
  
  // Step 2: Check permission
  const check = requireRole(user, 'manager'); // Change role as needed
  if (check.denied) return check.response;
  
  // Step 3: Get request body
  const body = await request.json();
  
  // Step 4: Validate input
  if (!body.requiredField) {
    return apiError('Missing required field', 'VALIDATION_ERROR', 400);
  }
  
  try {
    // Step 5: Process request
    const result = await processAction(body);
    
    // Step 6: Return success
    return apiSuccess(result, 'Action completed successfully');
  } catch (error: any) {
    console.error('Error:', error);
    return apiError('Failed to process', 'SERVER_ERROR', 500);
  }
}
```

---

**All ready! Start protecting endpoints now!** 🚀
