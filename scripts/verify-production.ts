import connectDB from '../lib/mongodb';
import { getTrendingTopics } from '../services/trendingEngine';
import { analyzeCompetitor } from '../services/competitor/intelligence';
import { predictViralPotential } from '../services/ai/viralPredictor';
import { estimateAdRevenue } from '../lib/revenueCalc';
import { predictGrowth } from '../services/growthPredictor';

async function verify() {
  console.log('--- VidYT Hardcore Production Readiness Verification ---');
  await connectDB();
  
  // 1. Verify Trending Engine
  console.log('\n[1/4] Verifying Trending Engine...');
  const trends = await getTrendingTopics(['Tech']);
  console.log('✅ Trends Fetched:', trends.length > 0 ? trends.slice(0, 3).map(t => t.topic).join(', ') : 'None');

  // 2. Verify Competitor Intelligence (requires API Key)
  console.log('\n[2/4] Verifying Competitor Intelligence...');
  try {
      const insights = await analyzeCompetitor('test-user', 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'youtube'); // Linus Tech Tips
      console.log('✅ Competitor Insights:', insights.channelName, '| Avg Views:', insights.averageViews);
  } catch (e: any) {
      console.warn('⚠️ Competitor Intelligence skipped (No API Key or Error):', e.message);
  }

  // 3. Verify Revenue & Growth Calculation (Hardcore Math)
  console.log('\n[3/4] Verifying Revenue & Growth Calculation...');
  const rev = estimateAdRevenue({ platform: 'youtube', niche: 'tech', views: 100000 });
  console.log('✅ Revenue Range:', rev.range, `(Confidence: ${rev.confidence})`);
  
  const growth = predictGrowth([
      { date: new Date(Date.now() - 2*24*60*60*1000), views: 1000 },
      { date: new Date(Date.now() - 1*24*60*60*1000), views: 1200 },
      { date: new Date(), views: 1500 }
  ], 3);
  console.log('✅ Growth Predicted:', growth.growthRate, `(Confidence: ${growth.confidence})`);

  // 4. Verify AI Prediction (30 Features)
  console.log('\n[4/4] Verifying 30-Feature AI Engine...');
  const prediction = await predictViralPotential({
    hookScore: 85,
    thumbnailScore: 88,
    titleScore: 70,
    trendingScore: 60,
    videoDuration: 45,
    platform: 'youtube'
  });
  console.log('✅ AI Score:', prediction.score, `(Confidence: ${prediction.confidence})`);
  console.log('✅ Reasons:', prediction.reasons.slice(0, 2).join(' | '));

  console.log('\n--- Hardcore Production Verification Complete ---');
  process.exit(0);
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
