# Plan Management System - Complete Implementation

## Overview

A complete system for managing plan discounts, creating/editing plans, and assigning plans to users has been implemented in the Super Admin Dashboard.

## Features Implemented

### 1. **Plan Discounts Management** ✅
**API Endpoint**: `/api/admin/plan-discounts`
- **GET**: Fetch all active discounts
- **POST**: Create new discount offer
- **PATCH**: Edit existing discount (percentage, dates, label)
- **DELETE**: Remove discount offer

**Component**: `PlanDiscountsManager.tsx`
- Create time-bound promotional offers
- Edit discount details
- Delete inactive discounts
- List all active discounts with visual indicators
- Full error handling and success notifications

### 2. **Plan Management (CRUD)** ✅
**API Endpoint**: `/api/admin/plans`
- **GET**: Fetch all active plans
- **POST**: Create new plan with custom prices
- **PATCH**: Edit plan details (name, description, prices, features)
- **DELETE**: Soft delete (deactivate) plan

**Component**: `PlanManager.tsx`
- Create custom plans with unique IDs
- Set different prices for monthly/yearly billing
- Add unlimited features for each plan
- Edit existing plans
- Deactivate plans without losing data

**Plan Model**: `models/Plan.ts`
- `planId`: Unique plan identifier (required)
- `name`: Display name
- `description`: Plan description
- `priceMonthly`: Monthly subscription price
- `priceYearly`: Annual subscription price (optional)
- `currency`: Pricing currency (default: USD)
- `features`: Array of feature descriptions
- `isActive`: Soft delete flag
- `isCustom`: Track custom vs. default plans
- `billingPeriod`: 'month', 'year', or 'both'

### 3. **User Plan Assignment** ✅
**API Endpoint**: `/api/admin/user-plans`
- **GET**: Check user's current plan and subscription status
- **POST**: Assign plan to user with custom duration
- **PATCH**: Extend subscription or cancel plan
- **DELETE**: Reset user to free plan

**Component**: `UserPlanManager.tsx`
- Search users by email
- View current subscription status
- Assign new plans with custom durations
- Extend existing subscriptions
- Cancel active subscriptions
- Reset users to free plan
- Track subscription dates and status

## Usage Guide

### Access Super Admin Panel
1. Navigate to `/admin/super` (requires `super-admin` role)
2. Look for **"Billing & Plans"** section in left sidebar
3. Select from three options:
   - **Plan Discounts** - Manage promotional offers
   - **Manage Plans** - Create/edit plan pricing
   - **User Plans** - Assign plans to users

### Managing Plan Discounts

```bash
# Create discount
POST /api/admin/plan-discounts
{
  "planId": "pro",
  "label": "Holi Sale",
  "percentage": 40,
  "startsAt": "2024-03-08T00:00:00",
  "endsAt": "2024-03-10T23:59:59"
}

# Edit discount
PATCH /api/admin/plan-discounts
{
  "id": "discount_id_here",
  "percentage": 50,
  "endsAt": "2024-03-15T23:59:59"
}

# Delete discount
DELETE /api/admin/plan-discounts?id=discount_id_here
```

### Managing Plans

```bash
# Create new plan
POST /api/admin/plans
{
  "planId": "starter",
  "name": "Starter Plan",
  "description": "Perfect for beginners",
  "priceMonthly": 9.99,
  "priceYearly": 99.99,
  "currency": "USD",
  "features": [
    "Basic analytics",
    "5 videos per day",
    "Email support"
  ],
  "billingPeriod": "both"
}

# Edit plan
PATCH /api/admin/plans
{
  "id": "plan_id",
  "priceMonthly": 12.99,
  "features": ["Updated features here"]
}

# Delete (deactivate) plan
DELETE /api/admin/plans?id=plan_id
```

### Managing User Plans

```bash
# Get user's current plan
GET /api/admin/user-plans?email=user@example.com

# Assign plan to user
POST /api/admin/user-plans
{
  "email": "user@example.com",
  "plan": "pro",
  "billingPeriod": "month",
  "duration": 30
}

# Extend subscription
PATCH /api/admin/user-plans
{
  "email": "user@example.com",
  "action": "extend",
  "duration": 30
}

# Cancel subscription
PATCH /api/admin/user-plans
{
  "email": "user@example.com",
  "action": "cancel"
}

# Reset to free plan
DELETE /api/admin/user-plans?email=user@example.com
```

## Database Models

### PlanDiscount Model
```typescript
interface IPlanDiscount {
  planId: string;           // 'free' | 'pro' | 'enterprise' | 'owner'
  label?: string;           // e.g., "Holi Sale"
  percentage: number;       // 0-100
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Plan Model (NEW)
```typescript
interface IPlan {
  planId: string;           // Unique ID
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  features: string[];
  isActive: boolean;
  isCustom: boolean;
  billingPeriod: 'month' | 'year' | 'both';
  createdAt: Date;
  updatedAt: Date;
}
```

## Features Added to UI

### Super Admin Sidebar
- **Billing & Plans** dropdown with 3 sub-menu items:
  1. Plan Discounts - Manage promotional offers
  2. Manage Plans - Create/edit subscription plans
  3. User Plans - Assign plans to users

## Security

- ✅ All endpoints require `super-admin` role
- ✅ Input validation using Zod schemas
- ✅ Rate limiting on plan discount creation
- ✅ Error handling with meaningful messages
- ✅ Soft deletes for plans (data preservation)
- ✅ Transaction support for user plan updates

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here",
  "status": 400
}
```

Common errors:
- 400: Invalid input validation
- 403: Forbidden (not super-admin)
- 404: Resource not found
- 429: Too many requests (rate limited)
- 500: Server error

## Examples

### Example 1: Create Plan & Add Discount

```bash
# 1. Create new plan
curl -X POST http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "professional",
    "name": "Professional Plan",
    "priceMonthly": 29,
    "priceYearly": 290,
    "features": ["Unlimited videos", "Advanced AI", "Priority support"]
  }'

# 2. Add launch discount
curl -X POST http://localhost:3000/api/admin/plan-discounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "professional",
    "label": "Launch Special",
    "percentage": 30,
    "startsAt": "2024-03-22T00:00:00",
    "endsAt": "2024-03-29T23:59:59"
  }'

# 3. Assign to user
curl -X POST http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "plan": "professional",
    "billingPeriod": "month",
    "duration": 30
  }'
```

### Example 2: Manage User Subscription

```bash
# Extend user's subscription by 15 days
curl -X PATCH http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "action": "extend",
    "duration": 15
  }'

# Cancel user's subscription
curl -X PATCH http://localhost:3000/api/admin/user-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "action": "cancel"
  }'
```

## File Structure

```
/app/api/admin/
  ├── plan-discounts/
  │   └── route.ts (GET, POST, PATCH, DELETE)
  ├── plans/
  │   └── route.ts (GET, POST, PATCH, DELETE) [NEW]
  └── user-plans/
      └── route.ts (GET, POST, PATCH, DELETE) [NEW]

/components/admin/
  ├── PlanDiscountsManager.tsx (Updated)
  ├── PlanManager.tsx [NEW]
  └── UserPlanManager.tsx [NEW]

/models/
  ├── PlanDiscount.ts (Existing)
  ├── Subscription.ts (Existing)
  ├── User.ts (Existing)
  └── Plan.ts [NEW]
```

## Testing Checklist

- [ ] Create a new plan with custom pricing
- [ ] Edit plan details and prices
- [ ] Create promotional discount
- [ ] Assign plan to user by email
- [ ] Extend user subscription
- [ ] Cancel user subscription
- [ ] Reset user to free plan
- [ ] Verify all API error handling
- [ ] Test with invalid inputs
- [ ] Verify super-admin role requirement

## Next Steps

1. **Email Notifications**: Add email notifications when plans are assigned/changed
2. **Bulk Operations**: Implement bulk plan assignment for multiple users
3. **Analytics**: Add tracking for discount usage and effectiveness
4. **Payment Gateway Integration**: Link with Razorpay/Stripe for automatic billing
5. **Subscription Renewal**: Implement automatic renewal logic

## Support

For issues or questions:
1. Check the error messages in the UI
2. Review server logs for detailed error info
3. Verify user has `super-admin` role
4. Ensure all required fields are provided

---

**Last Updated**: March 22, 2026
**Version**: 1.0.0
