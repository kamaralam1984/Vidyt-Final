import sharp from 'sharp';
import axios from 'axios';

export interface ThumbnailAnalysis {
  facesDetected: number;
  emotion?: string;
  colorContrast: number;
  textReadability: number;
  suggestions: string[];
  score: number;
}

export async function analyzeThumbnail(thumbnailUrl: string): Promise<ThumbnailAnalysis> {
  try {
    // Skip analysis for placeholder thumbnails
    if (thumbnailUrl.includes('placeholder')) {
      return {
        facesDetected: 0,
        colorContrast: 50,
        textReadability: 50,
        suggestions: ['Upload a thumbnail image for detailed analysis'],
        score: 50,
      };
    }

    // Fetch thumbnail (works for YouTube URLs and other remote images)
    const response = await axios.get(thumbnailUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const buffer = Buffer.from(response.data);
    
    const image = await sharp(buffer);
    const stats = await image.stats();

    // Deterministic: no face detection without a real model
    const facesDetected = 0;

    // Real color contrast from image stats
    const colorContrast = calculateColorContrast(stats);

    // Deterministic text-readability proxy from luminance variance (high variance = likely text/edges)
    const textReadability = calculateTextReadabilityFromStats(stats);

    // Emotion from color stats (deterministic)
    const emotion = detectEmotion(stats);
    
    // Generate suggestions
    const suggestions = generateSuggestions({
      facesDetected,
      colorContrast,
      textReadability,
      emotion,
    });
    
    // Calculate score
    const score = calculateThumbnailScore({
      facesDetected,
      colorContrast,
      textReadability,
    });

    return {
      facesDetected,
      emotion,
      colorContrast,
      textReadability,
      suggestions,
      score,
    };
  } catch (error) {
    console.error('Error analyzing thumbnail:', error);
    return {
      facesDetected: 0,
      colorContrast: 50,
      textReadability: 50,
      suggestions: ['Unable to analyze thumbnail - please check the URL'],
      score: 50,
    };
  }
}

function calculateColorContrast(stats: any): number {
  if (!stats.channels || stats.channels.length < 3) {
    return 50;
  }
  const variances = stats.channels.map((ch: any) => ch.stdev || 0);
  const avgVariance = variances.reduce((a: number, b: number) => a + b, 0) / variances.length;
  return Math.min(100, Math.round((avgVariance / 50) * 100));
}

/** Deterministic readability proxy from channel variance (same image = same value). */
function calculateTextReadabilityFromStats(stats: any): number {
  if (!stats.channels || stats.channels.length < 3) return 65;
  const variances = stats.channels.map((ch: any) => ch.stdev || 0);
  const avg = variances.reduce((a: number, b: number) => a + b, 0) / variances.length;
  return Math.min(95, Math.max(50, Math.round(55 + (avg / 40) * 35)));
}

function detectEmotion(stats: any): string {
  if (!stats.channels || stats.channels.length < 3) return 'neutral';
  const means = stats.channels.map((ch: any) => ch.mean || 0);
  const brightness = means.reduce((a: number, b: number) => a + b, 0) / means.length;
  if (brightness > 180) return 'excited';
  if (brightness > 140) return 'happy';
  if (brightness < 80) return 'curious';
  return 'neutral';
}

function generateSuggestions(analysis: Partial<ThumbnailAnalysis>): string[] {
  const suggestions: string[] = [];
  
  if (analysis.facesDetected === 0) {
    suggestions.push('Consider adding a face in the thumbnail for better engagement');
  }
  
  if (analysis.colorContrast && analysis.colorContrast < 60) {
    suggestions.push('Increase color contrast to make the thumbnail stand out');
  }
  
  if (analysis.textReadability && analysis.textReadability < 70) {
    suggestions.push('Improve text readability with better contrast and larger fonts');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Thumbnail looks good! Consider A/B testing different versions');
  }
  
  return suggestions;
}

function calculateThumbnailScore(analysis: Omit<ThumbnailAnalysis, 'score' | 'emotion' | 'suggestions'>): number {
  let score = 0;
  score += Math.min(40, analysis.facesDetected * 20);
  score += (analysis.colorContrast / 100) * 30;
  score += (analysis.textReadability / 100) * 30;
  return Math.min(100, Math.round(score));
}

/** Analyze thumbnail from a buffer (e.g. uploaded file). Same image = same result. */
export async function analyzeThumbnailFromBuffer(buffer: Buffer): Promise<ThumbnailAnalysis> {
  try {
    const image = await sharp(buffer);
    const stats = await image.stats();
    const facesDetected = 0;
    const colorContrast = calculateColorContrast(stats);
    const textReadability = calculateTextReadabilityFromStats(stats);
    const emotion = detectEmotion(stats);
    const suggestions = generateSuggestions({
      facesDetected,
      colorContrast,
      textReadability,
      emotion,
    });
    const score = calculateThumbnailScore({
      facesDetected,
      colorContrast,
      textReadability,
    });
    return {
      facesDetected,
      emotion,
      colorContrast,
      textReadability,
      suggestions,
      score,
    };
  } catch (error) {
    console.error('Error analyzing thumbnail from buffer:', error);
    return {
      facesDetected: 0,
      colorContrast: 50,
      textReadability: 50,
      suggestions: ['Unable to analyze image.'],
      score: 50,
    };
  }
}
