import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PlatformControl from '@/models/PlatformControl';

// Public/User route that returns simplified control configs
// This determines what the user can see in the frontend Sidebar
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        
        let userPlan = 'free'; // default
        if (user && user.subscription) {
            userPlan = user.subscription;
        }

        const controls = await PlatformControl.find();
        
        // Filter down the response securely:
        // Expose only: platform, isEnabled (calculated purely for this user's plan)
        const allowedPlatforms: Record<string, any> = {};

        controls.forEach(c => {
            // Is it globally enabled?
            let enabledForUser = c.isEnabled;
            
            // Does the user have a plan strictly required to use it?
            if (enabledForUser && c.allowedPlans && c.allowedPlans.length > 0) {
                enabledForUser = c.allowedPlans.includes(userPlan);
            }

            allowedPlatforms[c.platform] = {
                 isEnabled: enabledForUser,
                 // Also send down the feature sub-toggles
                 features: c.features || {} 
            };
        });

        // If no controls have ever been configured, default everything to true to avoid breaking the frontend
        if (Object.keys(allowedPlatforms).length === 0) {
            return NextResponse.json({
                youtube: { isEnabled: true, features: {} },
                facebook: { isEnabled: true, features: {} },
                instagram: { isEnabled: true, features: {} },
            });
        }

        return NextResponse.json(allowedPlatforms);
    } catch (error: any) {
        console.error('Fetch user controls error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
