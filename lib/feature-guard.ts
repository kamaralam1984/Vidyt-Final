import connectDB from '@/lib/mongodb';
import PlatformControl from '@/models/PlatformControl';

export async function checkFeatureAccess(platformName: string, featureKey?: string, userPlan: string = 'free'): Promise<{ allowed: boolean; reason?: string }> {
    await connectDB();
    
    // Default to true if controls haven't been setup yet
    const control = await PlatformControl.findOne({ platform: platformName });
    if (!control) {
        return { allowed: true };
    }

    // 1. Check Global Platform Toggle
    if (!control.isEnabled) {
        return { allowed: false, reason: `The ${platformName} platform has been disabled by the admin.` };
    }

    // 2. Check Plan-Based Access restriction
    if (control.allowedPlans && control.allowedPlans.length > 0) {
        if (!control.allowedPlans.includes(userPlan)) {
            return { allowed: false, reason: `Your current plan (${userPlan}) does not have access to ${platformName}.` };
        }
    }

    // 3. Check specific Feature-Level Toggle if requested
    if (featureKey && control.features instanceof Map) {
         // If the map exists and contains the key but it is explicitly set to false
         if (control.features.has(featureKey) && control.features.get(featureKey) === false) {
             return { allowed: false, reason: `The ${featureKey} feature is currently disabled by the admin.` };
         }
    }

    return { allowed: true };
}
