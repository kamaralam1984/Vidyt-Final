/**
 * Backfill existing SeoPage documents with rich content + quality scores.
 *
 * Why: pages created before the Quality SEO Engine v2 have ~200-word thin
 * content. Google rejects those. This script rebuilds content via
 * seoContentBuilder (1500+ words, category-aware, FAQs, pricing section)
 * and recomputes qualityScore so the promote-seo-pages cron can pick the
 * best 100/day for the sitemap.
 *
 * Run:  npx tsx scripts/backfill-seo-pages.ts [--dry] [--limit=N]
 *
 * Safe to re-run — operation is idempotent (keyword → same rebuilt content).
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '.env.local' });
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '.env' });

import mongoose from 'mongoose';
import SeoPage from '../models/SeoPage';
import { buildSeoContent } from '../lib/seoContentBuilder';
import { computeQualityScore } from '../lib/qualityScorer';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0; // 0 = all
const BATCH = 50;

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('✖ MONGODB_URI not set. Add it to .env.local and retry.');
    process.exit(1);
  }

  console.log('→ Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✓ Connected');

  const filter: any = {};
  const total = await SeoPage.countDocuments(filter);
  console.log(`→ Found ${total} SeoPage documents to rebuild`);
  console.log(`→ Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}`);
  if (LIMIT) console.log(`→ Limit: ${LIMIT}`);

  const target = LIMIT > 0 ? Math.min(LIMIT, total) : total;
  let processed = 0;
  let updated = 0;
  let scoreHistogram: Record<string, number> = { '90+': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };

  const cursor = SeoPage.find(filter)
    .select('slug keyword viralScore trendingRank views category')
    .limit(target)
    .cursor({ batchSize: BATCH });

  const ops: any[] = [];
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const p: any = doc;
    const kw = (p.keyword || '').trim();
    if (!kw) { processed++; continue; }

    const isTrending = (p.trendingRank || 0) > 0;
    const viralScore = p.viralScore && p.viralScore > 0 ? p.viralScore : 72;

    const built = buildSeoContent(kw, {
      viralScore,
      trendingRank: p.trendingRank || 0,
      isTrending,
    });

    const qualityScore = computeQualityScore({
      wordCount: built.wordCount,
      viralScore,
      trendingRank: p.trendingRank || 0,
      views: p.views || 0,
      hashtagCount: built.hashtags.length,
      faqCount: built.faqs.length,
    });

    // Histogram
    if (qualityScore >= 90) scoreHistogram['90+']++;
    else if (qualityScore >= 80) scoreHistogram['80-89']++;
    else if (qualityScore >= 70) scoreHistogram['70-79']++;
    else if (qualityScore >= 60) scoreHistogram['60-69']++;
    else scoreHistogram['<60']++;

    ops.push({
      updateOne: {
        filter: { slug: p.slug },
        update: {
          $set: {
            title: built.title,
            metaTitle: built.metaTitle,
            metaDescription: built.metaDescription,
            content: built.content,
            hashtags: built.hashtags,
            relatedKeywords: built.relatedKeywords,
            category: built.category,
            wordCount: built.wordCount,
            qualityScore,
            viralScore,
          },
        },
      },
    });

    processed++;
    if (processed % 100 === 0) {
      process.stdout.write(`\r  processed ${processed}/${target}`);
    }

    if (ops.length >= BATCH) {
      if (!DRY_RUN) {
        const r = await SeoPage.bulkWrite(ops, { ordered: false });
        updated += r.modifiedCount || 0;
      } else {
        updated += ops.length;
      }
      ops.length = 0;
    }
  }

  if (ops.length && !DRY_RUN) {
    const r = await SeoPage.bulkWrite(ops, { ordered: false });
    updated += r.modifiedCount || 0;
  } else if (ops.length && DRY_RUN) {
    updated += ops.length;
  }

  process.stdout.write('\n');
  console.log(`\n═══ Backfill complete ═══`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Updated:   ${updated}${DRY_RUN ? ' (dry run — no writes)' : ''}`);
  console.log(`\n  Quality score distribution:`);
  console.log(`    90-100:  ${scoreHistogram['90+']}   ← will promote first`);
  console.log(`    80-89:   ${scoreHistogram['80-89']}`);
  console.log(`    70-79:   ${scoreHistogram['70-79']}   (threshold for sitemap)`);
  console.log(`    60-69:   ${scoreHistogram['60-69']}   (below threshold)`);
  console.log(`    <60:     ${scoreHistogram['<60']}`);
  const eligible = scoreHistogram['90+'] + scoreHistogram['80-89'] + scoreHistogram['70-79'];
  console.log(`\n  ✓ ${eligible} pages eligible for sitemap promotion`);
  console.log(`  ✓ Promote cron will flip top 100/day to isIndexable:true`);

  await mongoose.disconnect();
  console.log('✓ Disconnected');
}

run().catch(err => {
  console.error('✖ Backfill failed:', err);
  process.exit(1);
});
