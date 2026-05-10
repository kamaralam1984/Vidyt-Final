/**
 * Daily Owner Scripts Cron — Vidyt Growth Edition
 *
 * Generates 1 Hindi + 1 English 5-minute YouTube script every morning, each
 * focused on a specific Vid YT tool (its features, the creator problem it
 * solves, and a CTA to try it free at vidyt.com), then emails them to the
 * owner so they can record and post videos that grow Vid YT.
 *
 * Cron line (9:00 AM IST = 0 9 in IST-tz / 30 3 in UTC):
 *   0 9 * * * /usr/bin/curl -fsS "http://localhost:3000/api/cron/daily-owner-scripts?secret=$CRON_SECRET" >> /var/log/vidyt-daily-scripts.log 2>&1
 *
 * Topic rotation: day-of-year mod pool length, so the same topic doesn't
 * repeat for many weeks. Each pool covers 20 days.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // generateScript can take 30-60s per call

import { NextResponse } from 'next/server';
import { generateScript } from '@/services/ai/aiStudio';
import { sendDailyOwnerScriptsEmail } from '@/services/email';

// Each topic is a Vid YT tool tutorial/demo idea. The script writer is told
// (via VIDYT_CONTEXT below) to demo the tool, explain the benefit, and end
// with a CTA pointing to vidyt.com.
const HINDI_TOPICS = [
  'Vidyt Ka AI Viral Score Predictor — Video Banane Se Pehle Pata Karo Viral Hoga Ya Nahi',
  'Vidyt Ka Free AI Thumbnail Generator — 8 Styles Me High-CTR Thumbnail Banao',
  'Chinki AI — Vidyt Ka Hindi YouTube SEO Sikhane Wala Free Multilingual Assistant',
  'Vidyt Ka YouTube Live SEO Analyzer — Real-Time Title Aur Keywords Ka Score',
  'Vidyt Ke Ultra Optimize Button Se 1 Click Me Title, Description, Keywords Auto-Optimize',
  'Vidyt Ka Smart Scheduling — Apke Channel Ka Best Posting Time Pata Karo',
  'Vidyt Ka AI Script Generator — 5 Min Me Viral YouTube Script Banao Free',
  'Vidyt Ke Keyword Intelligence Engine Se Low-Competition Niche Find Karo',
  'Vidyt Ka Shorts Creator — Long Video Ko Auto-Cut Karke Viral Shorts Banao',
  'Vidyt Ka Channel Intelligence Hub — Competitor Analysis 3 Click Me',
  'Vidyt Ka Hook Generator — Pehle 10 Second Me Audience Ko Pakadne Wale Hooks',
  'Vidyt Ka Viral Optimizer — Existing Video Ka Score Check Aur Improve',
  'Vidyt Ka Multi-Platform SEO — YouTube + Facebook + Instagram Ek Saath',
  'Vidyt Ka Content Calendar Aur Auto-SEO — Schedule Karte Hi Optimize',
  'Vidyt Ke Channel Audit Tool Se Channel Ki Hidden Problems Find Karo',
  'Vidyt Ki AI Title Scoring — 7 Factor CTR Prediction Aur 11.8% Optimization',
  'Vidyt Ke 15 Free AI Tools Ka Full Tour — Ek Bhi Paisa Diye Bina',
  'Vidyt Ka Trending Topics Engine — Daily Fresh Niche Ideas Hindi Creators Ke Liye',
  'Vidyt Ka Description Generator — SEO-Friendly 200+ Word Description Auto',
  'Vidyt Ke Hashtag Strategy Tool Se Viral Reach Boost Karein',
];

const ENGLISH_TOPICS = [
  'Predict Your Video Will Go Viral BEFORE You Hit Publish — Vidyt AI Viral Score Demo',
  'How I Generate Cinematic YouTube Thumbnails in 30 Seconds (Free with Vidyt)',
  'Meet Chinki — The Free Multilingual AI Assistant for YouTube SEO',
  "YouTube Live SEO Analyzer — Real-Time Title and Keyword Scoring with Vidyt",
  "One Click to 11.8% CTR — Inside Vidyt's Ultra Optimize Button",
  'The Best Time to Upload, Per Channel — Vidyt Smart Scheduling Walkthrough',
  'Write a Viral 5-Minute YouTube Script in 60 Seconds — Free Vidyt AI Tool',
  "Find Low-Competition YouTube Niches With Vidyt's Keyword Intelligence Engine",
  'Auto-Cut Long Videos Into Viral Shorts — Vidyt Shorts Creator Demo',
  "Steal Your Competitor's Strategy Ethically — Vidyt Channel Intelligence Hub",
  "10 Hooks That Stop the Scroll — Generated With Vidyt's Hook Generator",
  "Audit Any YouTube Video in 60 Seconds With Vidyt's Viral Optimizer",
  'One Workflow, Three Platforms — YouTube, Facebook, Instagram SEO with Vidyt',
  'Schedule + Auto-Optimize Every Post — Vidyt Content Calendar Tutorial',
  "The 7 Hidden Problems Killing Your Channel — Vidyt Channel Audit Reveals",
  'Why Your Title Scores 40/100 (and How Vidyt Fixes It Instantly)',
  'Tour: 15 Free AI Tools Built Into Vidyt — Watch Before You Pay for Anything',
  "Find Tomorrow's Trending Topic Today — Vidyt Trending Engine",
  'Auto-Write SEO Descriptions That Rank — Vidyt Description Generator',
  'Hashtag Strategy in 2026 — How Vidyt Picks Reach-Boosting Tags',
];

// Context appended to the topic before calling generateScript. Tells the LLM
// to demo the Vid YT tool, explain the creator benefit, and end with a CTA.
const VIDYT_CONTEXT_HI = `\n\nIMPORTANT: Vidyt (vidyt.com) ek AI-powered YouTube growth platform hai jo Indian aur global creators ke liye Kvl Business Solutions ne bnayi hai. Is video me: (1) Topic me mentioned Vidyt tool ka step-by-step demo dikhao, (2) Wo creator problem batao jo ye tool solve karta hai, (3) Real numbers/benefits batao (jaise CTR 11.8% tak, viral prediction accuracy, time saving, etc.), (4) End me clear CTA: "vidyt.com par free try karein" jaisa kuch. "Vidyt" ko script me 5-7 baar naturally mention karein.`;

const VIDYT_CONTEXT_EN = `\n\nIMPORTANT: Vidyt (vidyt.com) is an AI-powered YouTube growth platform built by Kvl Business Solutions for global creators. In this video: (1) demonstrate the Vidyt tool named in the topic step-by-step, (2) explain the creator problem it solves, (3) cite concrete benefits (e.g., CTR up to 11.8%, viral prediction accuracy, hours saved per week), (4) end with a clear CTA like "Try it free at vidyt.com." Mention "Vidyt" naturally 5-7 times throughout the script.`;

const OWNER_EMAIL = process.env.OWNER_DAILY_SCRIPTS_EMAIL || 'kamaralamjdu@gmail.com';

function pickTopicForToday(pool: string[]): string {
  // Day-of-year rotation so the same topic doesn't repeat for many weeks.
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return pool[dayOfYear % pool.length];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTs = Date.now();
  try {
    const hindiTopic = pickTopicForToday(HINDI_TOPICS);
    const englishTopic = pickTopicForToday(ENGLISH_TOPICS);

    // Generate both in parallel — saves ~30s on slower providers
    const [hindiResult, englishResult] = await Promise.all([
      generateScript({
        topic: hindiTopic + VIDYT_CONTEXT_HI,
        platform: 'YouTube',
        duration: '5 min',
        language: 'Hindi',
      }),
      generateScript({
        topic: englishTopic + VIDYT_CONTEXT_EN,
        platform: 'YouTube',
        duration: '5 min',
        language: 'English',
      }),
    ]);

    const sent = await sendDailyOwnerScriptsEmail(OWNER_EMAIL, {
      hindi: { topic: hindiTopic, ...hindiResult },
      english: { topic: englishTopic, ...englishResult },
    });

    return NextResponse.json({
      success: sent,
      sentTo: OWNER_EMAIL,
      durationMs: Date.now() - startTs,
      hindiTopic,
      englishTopic,
    });
  } catch (e: any) {
    console.error('[daily-owner-scripts] error:', e);
    return NextResponse.json(
      { error: e?.message || 'Generation failed', durationMs: Date.now() - startTs },
      { status: 500 },
    );
  }
}
