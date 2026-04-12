export interface PostingTime {
  day: string;
  hour: number;
  confidence: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function generatePostingHeatmap(platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'): Array<{ day: string; hour: number; engagement: number }> {
  // Platform-specific optimal posting times
  const platformOptimalTimes: Record<string, { day: string; hour: number }> = {
    youtube: { day: 'Tuesday', hour: 14 },
    facebook: { day: 'Wednesday', hour: 13 },
    instagram: { day: 'Monday', hour: 11 },
    tiktok: { day: 'Thursday', hour: 19 },
  };
  
  const optimal = platformOptimalTimes[platform] || platformOptimalTimes.youtube;
  const heatmap: Array<{ day: string; hour: number; engagement: number }> = [];
  
  DAYS.forEach(day => {
    for (let hour = 8; hour <= 22; hour++) {
      let engagement = 30 + Math.random() * 40; // Base engagement
      
      // Higher engagement for optimal day/hour
      if (day === optimal.day && Math.abs(hour - optimal.hour) <= 2) {
        engagement = 70 + Math.random() * 30;
      }
      
      // Weekdays generally better
      const dayIndex = DAYS.indexOf(day);
      if (dayIndex >= 1 && dayIndex <= 5) {
        engagement += 10;
      }
      
      heatmap.push({
        day,
        hour,
        engagement: Math.round(engagement),
      });
    }
  });
  
  return heatmap;
}

export function predictBestPostingTime(videoCategory?: string, platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'): PostingTime {
  // Simplified prediction algorithm
  // In production, analyze historical engagement data
  
  // Platform-specific optimal times based on research
  const platformDefaults: Record<string, { day: string; hour: number }> = {
    youtube: { day: 'Tuesday', hour: 14 }, // 2 PM
    facebook: { day: 'Wednesday', hour: 13 }, // 1 PM
    instagram: { day: 'Monday', hour: 11 }, // 11 AM
  };
  
  const defaultTime = platformDefaults[platform] || platformDefaults.youtube;
  let optimalDay = defaultTime.day;
  let optimalHour = defaultTime.hour;
  
  if (videoCategory) {
    const category = videoCategory.toLowerCase();
    
    // Adjust based on category
    if (category.includes('comedy') || category.includes('entertainment')) {
      optimalDay = 'Wednesday';
      optimalHour = 20; // 8 PM
    } else if (category.includes('education') || category.includes('tutorial')) {
      optimalDay = 'Tuesday';
      optimalHour = 10; // 10 AM
    } else if (category.includes('music') || category.includes('dance')) {
      optimalDay = 'Friday';
      optimalHour = 18; // 6 PM
    }
  }
  
  // Add some randomization for variety
  const dayVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  const dayIndex = (DAYS.indexOf(optimalDay) + dayVariation + 7) % 7;
  optimalDay = DAYS[dayIndex];
  
  const hourVariation = Math.floor(Math.random() * 3) - 1;
  optimalHour = Math.max(8, Math.min(22, optimalHour + hourVariation));
  
  // Calculate confidence (higher for weekdays)
  const isWeekday = dayIndex >= 1 && dayIndex <= 5;
  const confidence = isWeekday ? 75 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 15);

  return {
    day: optimalDay,
    hour: optimalHour,
    confidence: Math.min(100, confidence),
  };
}
