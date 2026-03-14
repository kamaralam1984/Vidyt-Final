// Lazy load these packages to avoid issues in Next.js
let nlp: any = null;
let analyzer: any = null;

function getNLP() {
  if (!nlp) {
    try {
      nlp = require('compromise');
    } catch (e) {
      console.warn('compromise not available, using fallback');
    }
  }
  return nlp;
}

function getSentimentAnalyzer() {
  if (!analyzer) {
    try {
      const natural = require('natural');
      const { SentimentAnalyzer, PorterStemmer } = natural;
      analyzer = new SentimentAnalyzer('English', PorterStemmer, ['negation']);
    } catch (e) {
      console.warn('natural not available, using fallback');
    }
  }
  return analyzer;
}

export interface TitleAnalysis {
  keywords: string[];
  emotionalTriggers: string[];
  length: number;
  clickPotential: number;
  optimizedTitles: string[];
  score: number;
}

const EMOTIONAL_TRIGGERS = [
  'amazing', 'incredible', 'shocking', 'unbelievable', 'secret', 'hidden',
  'ultimate', 'best', 'worst', 'never', 'always', 'must', 'should',
  'you', 'your', 'this', 'that', 'how', 'why', 'what', 'when',
  'free', 'easy', 'simple', 'fast', 'instant', 'guaranteed',
  'proven', 'expert', 'insider', 'exclusive', 'limited', 'now'
];

export interface TitleAnalysisOptions {
  maxSuggestions?: number; // Free: 3, Pro: 10, Enterprise: 10. Default 5.
}

export function analyzeTitle(title: string, options: TitleAnalysisOptions = {}): TitleAnalysis {
  const maxSuggestions = Math.min(20, Math.max(1, options.maxSuggestions ?? 5));
  try {
    // Ensure title is a string and not empty
    if (!title || typeof title !== 'string') {
      title = 'Untitled Video';
    }

    const nlpInstance = getNLP();
    let keywords: string[] = [];
    
    // Extract keywords (nouns and important words)
    if (nlpInstance) {
      try {
        const doc = nlpInstance(title);
        keywords = doc.nouns().out('array').slice(0, 10);
      } catch (e) {
        // Fallback: extract words manually
        keywords = title.split(/\s+/).filter(word => word.length > 3).slice(0, 10);
      }
    } else {
      // Fallback: extract words manually
      keywords = title.split(/\s+/).filter(word => word.length > 3).slice(0, 10);
    }
    
    // Detect emotional triggers
    const words = title.toLowerCase().split(/\s+/);
    const emotionalTriggers = words.filter(word => 
      EMOTIONAL_TRIGGERS.some(trigger => word.includes(trigger))
    );
    
    // Calculate length score
    const length = title.length;
    const lengthScore = length >= 30 && length <= 60 ? 100 : 
                       length < 30 ? (length / 30) * 100 :
                       Math.max(0, 100 - ((length - 60) / 2));
    
    // Calculate click potential
    let sentiment = 0;
    const sentimentAnalyzer = getSentimentAnalyzer();
    if (sentimentAnalyzer) {
      try {
        sentiment = sentimentAnalyzer.getSentiment(words);
      } catch (e) {
        // Fallback sentiment calculation
        sentiment = 0;
      }
    }
    
    const clickPotential = calculateClickPotential({
      length,
      emotionalTriggers: emotionalTriggers.length,
      sentiment,
      hasQuestion: title.includes('?'),
      hasNumber: /\d+/.test(title),
    });
    
    // Generate optimized titles (count by plan: Free 3, Pro/Enterprise 10)
    const optimizedTitles = generateOptimizedTitles(title, keywords, emotionalTriggers, maxSuggestions);
    
    // Calculate overall score
    const score = calculateTitleScore({
      lengthScore,
      clickPotential,
      emotionalTriggers: emotionalTriggers.length,
    });

    return {
      keywords,
      emotionalTriggers,
      length,
      clickPotential,
      optimizedTitles,
      score,
    };
  } catch (error: any) {
    console.error('Error analyzing title:', error);
    // Return default analysis if something fails
    return {
      keywords: title.split(/\s+/).slice(0, 5),
      emotionalTriggers: [],
      length: title.length,
      clickPotential: 50,
      optimizedTitles: [title, `Watch ${title}`, `Check out ${title}`].slice(0, maxSuggestions),
      score: 50,
    };
  }
}

function calculateClickPotential(factors: {
  length: number;
  emotionalTriggers: number;
  sentiment: number;
  hasQuestion: boolean;
  hasNumber: boolean;
}): number {
  let score = 50; // Base score
  
  // Length optimization (30-60 chars is optimal)
  if (factors.length >= 30 && factors.length <= 60) {
    score += 20;
  } else if (factors.length < 30) {
    score += (factors.length / 30) * 20;
  } else {
    score += Math.max(0, 20 - ((factors.length - 60) / 2));
  }
  
  // Emotional triggers boost
  score += Math.min(15, factors.emotionalTriggers * 5);
  
  // Questions increase curiosity
  if (factors.hasQuestion) score += 10;
  
  // Numbers increase specificity
  if (factors.hasNumber) score += 5;
  
  return Math.min(100, Math.round(score));
}

function generateOptimizedTitles(
  originalTitle: string,
  keywords: string[],
  emotionalTriggers: string[],
  maxSuggestions: number = 5
): string[] {
  const titles: string[] = [];
  
  titles.push(emotionalTriggers.length ? originalTitle : `Amazing ${originalTitle}`);
  if (!originalTitle.includes('?')) titles.push(`How to ${originalTitle.toLowerCase()}`);
  else titles.push(originalTitle);
  titles.push(keywords.length > 0 ? `The Ultimate Guide to ${keywords[0]}` : `Ultimate ${originalTitle}`);
  titles.push(`The Secret Behind ${originalTitle}`);
  if (!originalTitle.toLowerCase().includes('you')) titles.push(`You Need to See ${originalTitle}`);
  else titles.push(originalTitle);
  titles.push(`Why ${originalTitle} Matters`);
  titles.push(`${originalTitle} - Don't Miss This!`);
  if (keywords[1]) titles.push(`Top Tips: ${keywords[1]} and ${originalTitle}`);
  titles.push(`Discover ${originalTitle}`);
  titles.push(`The Truth About ${originalTitle}`);
  
  const uniqueTitles = Array.from(new Set(titles));
  while (uniqueTitles.length < maxSuggestions) {
    uniqueTitles.push(`${originalTitle} - Must Watch! (${uniqueTitles.length + 1})`);
  }
  return uniqueTitles.slice(0, maxSuggestions);
}

function calculateTitleScore(factors: {
  lengthScore: number;
  clickPotential: number;
  emotionalTriggers: number;
}): number {
  const lengthWeight = 0.3;
  const clickWeight = 0.5;
  const triggerWeight = 0.2;
  
  const score = 
    (factors.lengthScore * lengthWeight) +
    (factors.clickPotential * clickWeight) +
    (Math.min(100, factors.emotionalTriggers * 20) * triggerWeight);
  
  return Math.min(100, Math.round(score));
}
