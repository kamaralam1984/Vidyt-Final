import connectDB from '../lib/mongodb';
import Usage from '../models/Usage';
import Notification from '../models/Notification';
import { checkUsageLimit, recordUsage } from '../lib/usageControl';
import { getPlanLimits } from '../lib/planLimits';

async function verifyUsageControl() {
  console.log('🧪 Starting Usage Control Verification...');
  await connectDB();

  const testUserId = '65f1a2b3c4d5e6f7a8b9c0d1'; // Sample ID
  const testPlanId = 'free';
  const feature = 'video_analysis';
  const today = new Date().toISOString().split('T')[0];

  // 1. Cleanup previous test data
  await Usage.deleteMany({ userId: testUserId });
  await Notification.deleteMany({ userId: testUserId });
  console.log('🧹 Cleaned up test data.');

  // 2. Check initial limit (Free: 5)
  const limits = getPlanLimits(testPlanId);
  console.log(`📊 Plan: ${testPlanId}, Feature: ${feature}, Limit: ${limits.video_analysis}`);

  // 3. Increment usage to 4 (80% threshold)
  console.log('📈 Simulating usage up to 4/5 (80%)...');
  for (let i = 0; i < 4; i++) {
    await recordUsage(testUserId, feature);
  }

  // 4. Verify 80% warning
  const check80 = await checkUsageLimit(testUserId, testPlanId, feature);
  console.log(`🔔 80% Check: allowed=${check80.allowed}, current=${check80.current}`);
  
  const notification80 = await Notification.findOne({ userId: testUserId, type: 'warning' });
  if (notification80) {
    console.log(`✅ Success: 80% warning notification triggered: "${notification80.message}"`);
  } else {
    console.warn('❌ Failure: 80% warning notification NOT triggered.');
  }

  // 5. Reach 100%
  console.log('📈 Reaching 100% (5/5)...');
  await recordUsage(testUserId, feature);
  const check100 = await checkUsageLimit(testUserId, testPlanId, feature);
  console.log(`🚫 100% Check: allowed=${check100.allowed}, current=${check100.current}`);

  const notification100 = await Notification.findOne({ userId: testUserId, type: 'limit_reached' });
  if (notification100) {
    console.log(`✅ Success: 100% limit reached notification triggered: "${notification100.message}"`);
  } else {
    console.warn('❌ Failure: 100% limit reached notification NOT triggered.');
  }

  // 6. Verify Block
  if (!check100.allowed) {
    console.log('✅ Success: Further requests are correctly BLOCKED.');
  } else {
    console.error('❌ Failure: Request was NOT blocked at 100% limit.');
  }

  console.log('\n✨ Usage Control Verification Complete!');
  process.exit(0);
}

verifyUsageControl().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
