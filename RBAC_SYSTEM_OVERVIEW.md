# Role-Based Access Control (RBAC) System - Complete Implementation
## हर Plan को उसका Role मिले और User उसी के हिसाब से काम करे

---

## 🎯 What's Done

✅ **Complete RBAC System** implemented with:
- Role-based permissions system
- Plan to role mapping
- Permission checking utilities
- Implementation guide
- Step-by-step checklist

---

## 📚 Documentation Files Created

### 1. **ROLE_BASED_ACCESS_CONTROL.md**
   **Purpose**: Complete role system documentation
   
   Contains:
   - 4 main roles (user, manager, admin, super-admin)
   - Detailed permissions for each role
   - Permission matrix
   - Role transitions on plan upgrade/downgrade
   - Feature locks by role
   
   **For**: Understanding the complete system

---

### 2. **PLAN_ROLE_MAPPING.md**
   **Purpose**: Which role for which plan
   
   Contains:
   - Plan to role mapping
   - What each plan can do
   - Permission examples per plan
   - Database values for each plan
   - Verification checklist
   
   **For**: Quick reference of plan capabilities

---

### 3. **lib/permissions.ts**
   **Purpose**: Actual permission checking code
   
   Contains:
   - `canPerform()` function
   - `hasMinRole()` function
   - `hasRole()` function
   - `checkPermission()` function
   - `getRoleFeatures()` function
   - All permission definitions
   
   **For**: Using in API routes and components

---

### 4. **RBAC_IMPLEMENTATION_GUIDE.md**
   **Purpose**: How to use permissions in code
   
   Contains:
   - API endpoint protection examples
   - Frontend permission checks
   - React component examples
   - Real code examples
   - Common patterns
   
   **For**: Developers implementing permission checks

---

### 5. **RBAC_IMPLEMENTATION_CHECKLIST.md**
   **Purpose**: Step-by-step implementation plan
   
   Contains:
   - 6 implementation phases
   - Detailed checklist for each phase
   - Test procedures
   - Troubleshooting guide
   - Deployment steps
   
   **For**: Project managers and implementation teams

---

## 🚀 Quick Start (5 minutes)

### 1. Understand the Role Hierarchy
```
Free & Starter → user (Level 1)
Pro            → manager (Level 2)
Enterprise     → admin (Level 3)
Super-Admin    → super-admin (Level 4)
```

### 2. See Role-Plan Mapping
- Read: [PLAN_ROLE_MAPPING.md](PLAN_ROLE_MAPPING.md)
- See each plan's exact permissions

### 3. Protect an API Endpoint
```typescript
// In your API route
import { canPerform } from '@/lib/permissions';

if (!canPerform(user, 'createTeam')) {
  return NextResponse.json(
    { error: 'Pro plan required' },
    { status: 403 }
  );
}
```

### 4. Hide Frontend Feature
```typescript
// In your React component
import { usePermission } from '@/hooks/usePermission';

export function TeamSection() {
  const { can } = usePermission();
  
  return can('createTeam') ? <TeamManager /> : <UpgradePrompt />;
}
```

Done! 🎉

---

## 📖 Reading Guide

### If you want to...

**Understand how roles work**
→ Read: [ROLE_BASED_ACCESS_CONTROL.md](ROLE_BASED_ACCESS_CONTROL.md)

**Know what each plan can do**
→ Read: [PLAN_ROLE_MAPPING.md](PLAN_ROLE_MAPPING.md)

**Implement in API routes**
→ Read: [RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md) - API Section

**Implement in frontend**
→ Read: [RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md) - Frontend Section

**See real code examples**
→ Read: [RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md) - Examples Section

**Plan implementation project**
→ Read: [RBAC_IMPLEMENTATION_CHECKLIST.md](RBAC_IMPLEMENTATION_CHECKLIST.md)

**Get permission function reference**
→ Check: [lib/permissions.ts](lib/permissions.ts)

---

## 🎯 Key Concepts

### Plan → Role Mapping
```javascript
{
  free:       { role: 'user' },      // Basic access
  starter:    { role: 'user' },      // More features
  pro:        { role: 'manager' },   // Team features
  enterprise: { role: 'admin' },     // API + Advanced
}
```

### Role Hierarchy
```
user (1)
  ↓
manager (2)
  ↓
admin (3)
  ↓
super-admin (4)
```

### Permission Check
```typescript
// Method 1: Can user perform action?
canPerform(user, 'createTeam')  // Returns boolean

// Method 2: Does user have minimum role?
hasMinRole(user, 'manager')     // Returns boolean

// Method 3: Check and return error
checkPermission(user, 'createTeam')  // Returns { error } or null
```

---

## 📊 Role Capabilities Summary

### **user** Role
✅ Upload videos  
✅ Analyze videos  
✅ View own analytics  
✅ Use AI Studio (starter+ only)  
❌ Create teams  
❌ Use API  
❌ White-label  

### **manager** Role
✅ Everything user can do  
✅ Create teams  
✅ Invite team members  
✅ View team analytics  
✅ Content calendar  
✅ Advanced analytics  
❌ Use API  
❌ White-label  

### **admin** Role
✅ Everything manager can do  
✅ Use API  
✅ Create API keys  
✅ White-label reports  
✅ Train custom models  
✅ Manage team unlimited  
❌ Manage plans  
❌ System admin  

### **super-admin** Role
✅ Everything admin can do  
✅ Create / edit plans  
✅ Manage discounts  
✅ Manage users  
✅ System configuration  
✅ Full system control  

---

## 🔧 Implementation Phases

### Phase 1: Setup (2 hours)
- Verify plans in database have correct roles
- Create lib/permissions.ts file
- Test basic permission logic

### Phase 2: Protect Backend (4-6 hours)
- Add permission checks to API endpoints
- Test each endpoint with multiple roles
- Verify error handling

### Phase 3: Frontend (2-3 hours)
- Create permission hook
- Hide features based on role
- Update navigation menu
- Add upgrade prompts

### Phase 4: Testing (4-6 hours)
- Create test users for each role
- Test all permissions
- Test plan upgrades
- Test frontend gatekeeping

### Phase 5: Monitoring (1-2 hours)
- Add permission logging
- Create metrics dashboard
- Set up alerts

### Phase 6: Documentation (2 hours)
- Create developer docs
- Create user docs
- Train team

---

## 💡 Common Use Cases

### Use Case 1: Create Team Endpoint
```typescript
// Who can create teams?
// → manager, admin, super-admin (not user)

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!canPerform(user, 'createTeam')) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
  }
  // Create team...
}
```

### Use Case 2: API Keys Endpoint
```typescript
// Who can create API keys?
// → admin, super-admin (not user, not manager)

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!canPerform(user, 'createAPIKeys')) {
    return NextResponse.json({ error: 'Enterprise plan required' }, { status: 403 });
  }
  // Create API key...
}
```

### Use Case 3: Plan Management
```typescript
// Who can create plans?
// → super-admin only

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!hasRole(user, 'super-admin')) {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 });
  }
  // Create plan...
}
```

### Use Case 4: Advanced Analytics
```typescript
// Who can view advanced analytics?
// → manager+ (user can only see basic)

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!hasMinRole(user, 'manager')) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
  }
  // Return advanced analytics...
}
```

### Use Case 5: Frontend Gatekeeping
```typescript
// Hide team features from free users

export function Teams() {
  const { user } = useAuth();
  
  if (!canPerform(user, 'createTeam')) {
    return (
      <div className="p-4 bg-blue-50">
        <p>Team features available in Pro</p>
        <a href="/pricing">Upgrade now</a>
      </div>
    );
  }
  
  return <TeamManager />;
}
```

---

## 🔍 Permission Reference

### Complete List of All Permissions
See: [lib/permissions.ts - PERMISSIONS object](lib/permissions.ts#L25)

### Quick Reference
```typescript
// Video & Analysis
uploadVideo, analyzeVideo, deleteVideo, bulkUpload

// AI Studio
useAIStudio, scriptWriter, thumbnailIdeas, hookGenerator, 
shortsCreator, aiCoach, channelAudit

// Analytics
viewOwnAnalytics, viewAdvancedAnalytics, viewTeamAnalytics, 
exportReports, createCustomReports, whiteLabel

// Team Management
createTeam, inviteMembers, manageTeamMembers, removeMembers, 
setMemberRoles, viewAuditLogs

// Content Management
useContentCalendar, schedulePost, bulkScheduling

// Competitor Analysis
trackCompetitors, comparePerformance, benchmarking

// API & Integration
useAPI, createAPIKeys, manageWebhooks, customIntegrations

// Admin
accessAdmin, accessTeamAdmin

// Super Admin
accessSuperAdmin, createPlans, editPlans, deletePlans, 
managePlans, createDiscounts, manageDiscounts, 
assignPlanToUser, manageUsers

// AI Training
trainCustomModels, fineTuneModels
```

---

## 🎓 Examples by Scenario

### Scenario 1: Protect Entire Feature
```typescript
// Protect: Team Management feature

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // Check: Can user manage teams?
  if (!canPerform(user, 'createTeam')) {
    return NextResponse.json({
      error: 'Pro plan required for team features'
    }, { status: 403 });
  }
  
  // Continue with team logic...
}
```

### Scenario 2: Multiple Permission Check
```typescript
// Protect: Advanced report generation

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // Check: Should have ALL of these permissions
  if (!canPerformAll(user, ['viewAdvancedAnalytics', 'exportReports'])) {
    return NextResponse.json({
      error: 'Pro plan required'
    }, { status: 403 });
  }
  
  // Generate report...
}
```

### Scenario 3: Role-Based Limits
```typescript
// Apply: Different limits per user role

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const features = getRoleFeatures(user.role);
  
  // Check: User hasn't exceeded analysis limit
  if (userAnalysesThisDay >= features.analysesPerDay && 
      features.analysesPerDay !== -1) {
    return NextResponse.json({
      error: `Daily limit reached (${features.analysesPerDay})`
    }, { status: 429 });
  }
  
  // Continue with analysis...
}
```

### Scenario 4: Admin Only
```typescript
// Protect: Only super-admin can do this

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  // Check: Is super-admin?
  if (!hasRole(user, 'super-admin')) {
    return NextResponse.json({
      error: 'Super admin only'
    }, { status: 403 });
  }
  
  // Delete data...
}
```

---

## ✅ Verification Checklist

After implementation, verify:

**Database Level**
- [ ] Free plan has `role: 'user'`
- [ ] Starter plan has `role: 'user'`
- [ ] Pro plan has `role: 'manager'`
- [ ] Enterprise plan has `role: 'admin'`
- [ ] Custom plan has `role: 'admin'`

**Code Level**
- [ ] lib/permissions.ts created with all functions
- [ ] All API endpoints check permissions
- [ ] Error handling includes 403 responses
- [ ] Frontend hides features by role

**Testing Level**
- [ ] Test users created for each plan
- [ ] Each permission tested
- [ ] Upgrades work correctly
- [ ] Limits enforced properly

**Frontend Level**
- [ ] Private features hidden from free users
- [ ] Menu items show/hide correctly
- [ ] Upgrade prompts display
- [ ] No feature leakage

---

## 🚀 Next Steps

### Immediate (Today)
1. Read [ROLE_BASED_ACCESS_CONTROL.md](ROLE_BASED_ACCESS_CONTROL.md)
2. Read [PLAN_ROLE_MAPPING.md](PLAN_ROLE_MAPPING.md)
3. Review [lib/permissions.ts](lib/permissions.ts)

### Short-term (This Week)
1. Follow [RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md)
2. Protect critical API endpoints
3. Add frontend permission checks
4. Create test user accounts

### Medium-term (This Month)
1. Complete all phases from [RBAC_IMPLEMENTATION_CHECKLIST.md](RBAC_IMPLEMENTATION_CHECKLIST.md)
2. Test thoroughly with multiple users
3. Deploy to production
4. Monitor and refine

---

## 📞 Quick Help

**Question**: How do I check if user can do an action?  
**Answer**: `canPerform(user, 'actionName')`

**Question**: How do I check if user has minimum role?  
**Answer**: `hasMinRole(user, 'manager')`

**Question**: Which actions are available?  
**Answer**: See [lib/permissions.ts - PERMISSIONS object](lib/permissions.ts#L25)

**Question**: How do I hide a feature?  
**Answer**: See [RBAC_IMPLEMENTATION_GUIDE.md - Frontend Section](RBAC_IMPLEMENTATION_GUIDE.md#react-component-example)

**Question**: How do I protect an endpoint?  
**Answer**: See [RBAC_IMPLEMENTATION_GUIDE.md - API Section](RBAC_IMPLEMENTATION_GUIDE.md#method-1-simple-check)

---

## 📁 File Structure

```
viralboost-ai/
├── lib/
│   └── permissions.ts                    ← Permission logic
├── ROLE_BASED_ACCESS_CONTROL.md          ← System overview
├── PLAN_ROLE_MAPPING.md                  ← Plan details
├── RBAC_IMPLEMENTATION_GUIDE.md           ← How to implement
├── RBAC_IMPLEMENTATION_CHECKLIST.md       ← Step-by-step plan
└── RBAC_SYSTEM_OVERVIEW.md               ← This file
```

---

## 🎯 Summary

✅ **What You Have**:
- Complete role-based permission system
- 4 tiers of access control
- Plan to role mapping
- Real, usable permission functions
- Step-by-step implementation guides
- Complete documentation

✅ **What Users Get**:
- Free plan: Basic features
- Starter plan: More features, same role
- Pro plan: Team features
- Enterprise plan: API + Advanced
- Custom plan: Everything + negotiable

✅ **How It Works**:
1. Each plan has a role (user, manager, admin, super-admin)
2. Each role has specific permissions
3. API endpoints check permissions
4. Frontend hides features by role
5. Users see exactly what their plan allows

---

**Status**: ✅ Complete & Ready to Implement  
**Version**: 1.0  
**Last Updated**: March 28, 2026  

Start with: [ROLE_BASED_ACCESS_CONTROL.md](ROLE_BASED_ACCESS_CONTROL.md)
