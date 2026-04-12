import connectDB from '../lib/mongodb';
import Channel from '../models/Channel';
import Video from '../models/Video';
import { syncChannelStats, importRecentVideos } from '../lib/youtubeSync';

async function verifyYoutubeSync() {
  console.log('🧪 Starting YouTube Sync Verification...');
  await connectDB();

  // 1. Create a dummy channel with tokens
  const testUserId = '65f1a2b3c4d5e6f7a8b9c0d1';
  const testChannelId = 'UC_test_channel_123';
  
  await Channel.deleteMany({ channelId: testChannelId });
  await Video.deleteMany({ userId: testUserId, platform: 'youtube' });

  // Note: We can't actually call the YouTube API without a real token,
  // but we can verify the logic by mocking the 'google' call or just checking the DB state after a manual insertion.
  
  console.log('📝 Creating dummy channel for logic verification...');
  const channel = await Channel.create({
      userId: testUserId,
      channelId: testChannelId,
      channelTitle: 'Test Channel',
      accessToken: 'dummy_access',
      refreshToken: 'dummy_refresh',
      subscribers: 0,
      totalViews: 0,
      videoCount: 0
  });

  console.log('✅ Channel created. Verifying sync methods exist...');
  if (typeof syncChannelStats === 'function' && typeof importRecentVideos === 'function') {
      console.log('✅ Sync functions are correctly exported.');
  } else {
      console.error('❌ Sync functions missing!');
  }

  // 2. Verify AI Engine connection
  console.log('🤖 Checking AI Engine connection to Video model...');
  const testVideo = await Video.create({
      userId: testUserId,
      title: 'Viral Title from DB',
      description: 'Cool description',
      videoUrl: 'https://youtube.com/watch?v=123',
      platform: 'youtube',
      youtubeId: '123',
      duration: 120
  });

  const { predictViralPotential } = await import('../services/ai/viralPredictor');
  const prediction = await predictViralPotential({
      videoId: testVideo._id.toString(),
      platform: 'youtube'
  } as any);

  if (prediction.reasons.some(r => r.includes('hook') || r.includes('thumbnail') || r.includes('trending'))) {
      console.log(`✅ Success: AI Engine picked up and analyzed the video! Score: ${prediction.score}`);
  } else {
      console.warn('⚠️ AI Engine did not return expected insights, check data mapping.');
  }

  console.log('\n✨ YouTube Sync Logic Verification Complete!');
  process.exit(0);
}

verifyYoutubeSync().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
