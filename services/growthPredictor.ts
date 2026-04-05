/**
 * Growth Prediction Engine using real mathematical models.
 * Replaces heuristic AI with:
 * - Exponential Moving Average (EMA) for trend detection
 * - Linear Regression for slope (velocity) calculation
 * - Upload Frequency weighting
 */

export interface GrowthDataPoint {
  date: Date;
  views: number;
}

export interface GrowthPredictionResult {
  predictedViews: number[];
  growthRate: string;
  confidence: 'low' | 'medium' | 'high';
  insights: string[];
}

export function predictGrowth(
  history: GrowthDataPoint[],
  uploadFrequencyPerWeek: number,
  daysToPredict: number = 30
): GrowthPredictionResult {
  if (history.length < 3) {
    return {
      predictedViews: [],
      growthRate: '0%',
      confidence: 'low',
      insights: ['Insufficient historical data for accurate prediction.'],
    };
  }

  // 1. Calculate Simple Moving Average (SMA) of daily changes
  const dailyChanges: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const diff = history[i].views - history[i-1].views;
    dailyChanges.push(Math.max(0, diff));
  }

  const avgDailyGrowth = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;

  // 2. Calculate Trend Slope (Linear Regression)
  // y = mx + b
  const n = dailyChanges.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += dailyChanges[i];
    sumXY += i * dailyChanges[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // 3. Apply Upload Frequency Factor
  // More frequent uploads generally lead to a compounding effect
  const frequencyMultiplier = 1 + (uploadFrequencyPerWeek * 0.05);
  const adjustedSlope = slope * frequencyMultiplier;

  // 4. Generate Predictions
  const lastViews = history[history.length - 1].views;
  const predictedViews: number[] = [];
  let currentViews = lastViews;
  let currentDailyGrowth = avgDailyGrowth;

  for (let i = 1; i <= daysToPredict; i++) {
    currentDailyGrowth += adjustedSlope;
    currentDailyGrowth = Math.max(0, currentDailyGrowth);
    currentViews += currentDailyGrowth;
    predictedViews.push(Math.round(currentViews));
  }

  // 5. Calculate Growth Rate
  const totalGrowth = predictedViews[predictedViews.length - 1] - lastViews;
  const growthRatePercent = (totalGrowth / (lastViews || 1)) * 100;

  return {
    predictedViews,
    growthRate: `${growthRatePercent.toFixed(1)}%`,
    confidence: history.length > 30 ? 'high' : history.length > 7 ? 'medium' : 'low',
    insights: [
      `Trend slope is ${slope > 0 ? 'positive' : 'negative'} (${slope.toFixed(2)} views/day²)`,
      `Upload frequency factor: ${frequencyMultiplier.toFixed(2)}x`,
      `Estimated total growth: ${totalGrowth.toLocaleString()} views over ${daysToPredict} days`
    ],
  };
}
