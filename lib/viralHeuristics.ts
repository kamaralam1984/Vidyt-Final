export type Archetype =
  | 'curiosity'
  | 'list'
  | 'authority'
  | 'transformation'
  | 'urgency'
  | 'question'
  | 'contrarian';

export interface ArchetypeDef {
  id: Archetype;
  label: string;
  emoji: string;
  blurb: string;
  patterns: RegExp[];
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'curiosity',
    label: 'Curiosity Gap',
    emoji: '🔓',
    blurb: 'Opens a loop — viewer must click to close it.',
    patterns: [
      /\b(secret|hidden|nobody|no\s*one|truth|behind|reveal|inside|untold|exposed)\b/i,
      /\b(what\s+(happened|nobody)|why\s+.+\s+(won't|will\s+never))\b/i,
      /\b(this|one\s+thing)\b.*\b(changed|will|made)\b/i,
    ],
  },
  {
    id: 'list',
    label: 'List / Number',
    emoji: '🔢',
    blurb: 'Numbered promise = clear payoff.',
    patterns: [
      /^\s*\d+\s+/,
      /\b(top|best)\s+\d+\b/i,
      /\b\d+\s+(ways|tips|reasons|things|tricks|hacks|mistakes|rules|signs)\b/i,
    ],
  },
  {
    id: 'authority',
    label: 'Authority / Proof',
    emoji: '🏆',
    blurb: 'Credentials, data, results — earns trust.',
    patterns: [
      /\b(proven|expert|professional|certified|MIT|Harvard|study|research|science|data)\b/i,
      /\b(I\s+(made|built|earned|grew|spent)|after\s+\d+\s+(years|months|days|hours))\b/i,
      /\$[\d,]+|\d+(k|K|M)\s*(\+|subs|views|followers|months|days)?/,
    ],
  },
  {
    id: 'transformation',
    label: 'Transformation',
    emoji: '🔄',
    blurb: 'Before → After arc.',
    patterns: [
      /\bfrom\s+.+\s+to\s+.+/i,
      /\b(before|after)\s+(and|vs|\&)\b/i,
      /\b(transform|change|turn|become|went\s+from|turned\s+into)\b/i,
    ],
  },
  {
    id: 'urgency',
    label: 'Urgency / FOMO',
    emoji: '⏰',
    blurb: 'Now or never — drives the click today.',
    patterns: [
      /\b(now|today|2025|2026|new|latest|just|breaking|stop|don't\s+miss|last\s+chance)\b/i,
      /\b(before\s+it'?s\s+too\s+late|while\s+you\s+can|limited|deadline)\b/i,
      /!{2,}/,
    ],
  },
  {
    id: 'question',
    label: 'Question / Direct',
    emoji: '❓',
    blurb: 'Asks the viewer directly — pulls them in.',
    patterns: [
      /^(how|what|why|when|where|can|should|is|are|do|does|did)\b/i,
      /\?/,
    ],
  },
  {
    id: 'contrarian',
    label: 'Contrarian',
    emoji: '⚡',
    blurb: 'Breaks the consensus — pattern interrupt.',
    patterns: [
      /\b(don't|stop|never|wrong|lie|myth|fake|mistake|worst|overrated|underrated)\b/i,
      /\bnobody\s+(tells|talks|teaches)\b/i,
      /\b(actually|surprisingly|despite|but\s+nobody)\b/i,
    ],
  },
];

export interface TitleDna {
  primary: Archetype | null;
  primaryDef: ArchetypeDef | null;
  scores: Record<Archetype, number>;
  totalHits: number;
}

export function classifyTitle(title: string): TitleDna {
  const t = title.trim();
  const rawHits = {} as Record<Archetype, number>;
  let totalHits = 0;
  for (const a of ARCHETYPES) {
    const hits = a.patterns.reduce((acc, p) => acc + (p.test(t) ? 1 : 0), 0);
    rawHits[a.id] = hits;
    totalHits += hits;
  }
  const scores = {} as Record<Archetype, number>;
  for (const a of ARCHETYPES) {
    scores[a.id] = totalHits > 0 ? Math.round((rawHits[a.id] / totalHits) * 100) : 0;
  }
  if (totalHits === 0) return { primary: null, primaryDef: null, scores, totalHits };
  const primaryDef = ARCHETYPES.reduce((best, a) =>
    rawHits[a.id] > rawHits[best.id] ? a : best
  , ARCHETYPES[0]);
  return { primary: primaryDef.id, primaryDef, scores, totalHits };
}

export interface OutlierIndex {
  overall: number;
  novelty: number;
  emotional: number;
  curiosity: number;
  interrupt: number;
  notes: string[];
}

export function computeOutlierIndex(title: string): OutlierIndex {
  const t = title.trim();
  const notes: string[] = [];

  if (!t) {
    return { overall: 0, novelty: 0, emotional: 0, curiosity: 0, interrupt: 0, notes: ['Add a title to score.'] };
  }

  const len = t.length;
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  const inSweet = len >= 40 && len <= 65;
  const hasBracket = /[\[\(].*[\]\)]/.test(t);
  const hasNumber = /\d/.test(t);
  const hasEmoji = /\p{Extended_Pictographic}/u.test(t);

  const novelty = Math.min(100,
    (inSweet ? 30 : len < 30 ? 5 : 15) +
    (hasBracket ? 18 : 0) +
    (hasNumber ? 18 : 0) +
    (hasEmoji ? 14 : 0) +
    (wordCount >= 6 && wordCount <= 12 ? 12 : 0) +
    8
  );
  if (!inSweet) notes.push(len < 40 ? 'Title too short — aim 40–65 chars.' : 'Title too long — trim under 65 chars.');
  if (!hasNumber && !hasBracket) notes.push('Add a number or bracket — proven outlier signal.');

  const powerWord = /\b(insane|crazy|shocking|incredible|unbelievable|epic|massive|huge|terrifying|brutal|brilliant|genius|wild|nuts|deadly)\b/i.test(t);
  const allCapsWords = t.split(/\s+/).filter((w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
  const exclam = (t.match(/!/g) || []).length;
  const emotional = Math.min(100,
    (powerWord ? 38 : 0) +
    Math.min(allCapsWords * 14, 28) +
    Math.min(exclam * 12, 18) +
    14
  );
  if (!powerWord && allCapsWords === 0) notes.push('Add one high-impact word (e.g. INSANE, secret, brutal).');

  const openLoop = /\b(this|that|something|one\s+thing|the\s+truth|what\s+happens|here'?s\s+why)\b/i.test(t);
  const isQuestion = /\?/.test(t) || /^(how|what|why|when|can|should)\b/i.test(t);
  const hiddenWords = /\b(hidden|secret|nobody|untold|behind|inside|reveal|exposed)\b/i.test(t);
  const curiosity = Math.min(100,
    (openLoop ? 32 : 0) +
    (isQuestion ? 24 : 0) +
    (hiddenWords ? 30 : 0) +
    14
  );
  if (!openLoop && !hiddenWords && !isQuestion) notes.push('No curiosity loop detected — try "this", "secret", or a question.');

  const contrarian = /\b(don'?t|stop|never|wrong|lie|myth|fake|mistake|worst|hate|overrated)\b/i.test(t);
  const hasParens = /[\(\)\[\]]/.test(t);
  const startsUnusual = /^\d/.test(t) || /^[\(\[]/.test(t);
  const interrupt = Math.min(100,
    (contrarian ? 38 : 0) +
    (hasParens ? 22 : 0) +
    (startsUnusual ? 18 : 0) +
    18
  );
  if (!contrarian && !hasParens) notes.push('Add a pattern-interrupt — brackets, contradiction, or "don\'t/stop".');

  const overall = Math.round((novelty + emotional + curiosity + interrupt) / 4);

  return { overall, novelty, emotional, curiosity, interrupt, notes };
}

export interface HookStrength {
  score: number;
  firstSentence: string;
  signals: { label: string; ok: boolean; weight: number }[];
  verdict: string;
}

export function analyzeHook(script: string): HookStrength {
  const trimmed = script.trim();
  if (!trimmed) {
    return {
      score: 0,
      firstSentence: '',
      signals: [],
      verdict: 'Paste a script to score the first 15 seconds.',
    };
  }

  const firstChunk = trimmed.slice(0, 220);
  const firstSentence = (firstChunk.match(/^[^.!?\n]+[.!?\n]?/) || [firstChunk])[0].trim();

  const signals = [
    { label: 'Opens with hook word (you, this, imagine, what if, stop, never)', weight: 22, ok: /\b(you|your|this|imagine|what\s+if|stop|never|listen)\b/i.test(firstSentence) },
    { label: 'Asks a direct question', weight: 18, ok: /\?/.test(firstSentence) },
    { label: 'Promises payoff in first 15s', weight: 18, ok: /\b(in\s+(this|the\s+next)|by\s+the\s+end|going\s+to\s+show|today\s+I)\b/i.test(firstChunk) },
    { label: 'Avoids "Hi guys / welcome" intro', weight: 16, ok: !/\b(hi\s+(guys|everyone)|hello\s+(guys|everyone)|welcome\s+(back|to))\b/i.test(firstSentence) },
    { label: 'Uses a number / specific stat early', weight: 12, ok: /\d/.test(firstChunk) },
    { label: 'First sentence under 18 words', weight: 14, ok: firstSentence.split(/\s+/).filter(Boolean).length <= 18 },
  ];

  const score = signals.reduce((acc, s) => acc + (s.ok ? s.weight : 0), 0);

  let verdict = 'Weak hook — viewers will bounce in 5s.';
  if (score >= 75) verdict = 'Elite hook — pulls retention from second 1.';
  else if (score >= 55) verdict = 'Solid hook — minor sharpening helps.';
  else if (score >= 35) verdict = 'Average hook — rewrite for stronger pull.';

  return { score, firstSentence, signals, verdict };
}
