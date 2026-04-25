'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import {
  Sparkles, Brain, Lightbulb, FileText, Type, Scissors, Image as ImageIcon,
  TrendingUp, Search, Hash, Zap, ArrowRight, Play, Star, Users, BarChart3, Wand2
} from 'lucide-react';

// ─── Featured Tools Data ──────────────────────────────────────────────────────
const FEATURED_TOOLS = [
  {
    slug: 'script-writer',
    icon: FileText,
    gradient: 'from-violet-600 to-purple-700',
    glowColor: 'rgba(139,92,246,0.35)',
    badge: 'AI Studio',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    title: 'AI Script Writer',
    tagline: 'Turn any topic into a viral-ready script',
    bullets: [
      'Generates full scripts with hooks, sections & CTAs in seconds',
      'Built-in SEO optimization for maximum discoverability',
      'Trusted by 10,000+ creators across 50+ niches',
    ],
  },
  {
    slug: 'daily-ideas',
    icon: Lightbulb,
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245,158,11,0.35)',
    badge: 'AI Studio',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'Daily Video Ideas',
    tagline: 'Never run out of content again',
    bullets: [
      'AI analyzes real-time YouTube trends for your exact niche',
      'Every idea comes with a viral score & best posting time',
      'Fresh ideas every day — never miss a trending moment',
    ],
  },
  {
    slug: 'keyword-research',
    icon: Search,
    gradient: 'from-sky-500 to-blue-700',
    glowColor: 'rgba(14,165,233,0.35)',
    badge: 'SEO',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    title: 'Keyword Research',
    tagline: 'Find high-volume keywords before competitors',
    bullets: [
      'Real search-volume data with competition analysis',
      'AI-powered keyword intelligence with viral score',
      'Uncovers hidden long-tail gems worth ranking for',
    ],
  },
  {
    slug: 'title-generator',
    icon: Type,
    gradient: 'from-rose-500 to-red-700',
    glowColor: 'rgba(244,63,94,0.35)',
    badge: 'SEO',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: 'Title & CTR Optimizer',
    tagline: 'Boost click-through rate to 11.8%+',
    bullets: [
      'AI scores every title and predicts its CTR before you publish',
      'A/B title variants & power-word suggestions built in',
      'Algorithm-tuned headlines that dominate search results',
    ],
  },
  {
    slug: 'thumbnail-maker',
    icon: ImageIcon,
    gradient: 'from-emerald-500 to-teal-700',
    glowColor: 'rgba(16,185,129,0.35)',
    badge: 'AI Studio',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'AI Thumbnail Generator',
    tagline: 'Film-poster quality thumbnails in seconds',
    bullets: [
      '8 art styles — Cinematic, MrBeast, Anime, Neon & more',
      'Upload your photo; AI adds 3D VFX text & backgrounds',
      'Optimized contrast & faces for maximum click attraction',
    ],
  },
  {
    slug: 'ai-shorts',
    icon: Scissors,
    gradient: 'from-fuchsia-600 to-pink-700',
    glowColor: 'rgba(192,38,211,0.35)',
    badge: 'AI Studio',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    title: 'AI Shorts Creator',
    tagline: 'Auto-clip viral moments from long videos',
    bullets: [
      'AI detects key moments, hooks & highlights automatically',
      'Auto-adds text overlay, captions & trending music',
      'Exports in 9:16 Shorts format — ready to upload instantly',
    ],
  },
  {
    slug: 'youtube-title-generator',
    icon: Wand2,
    gradient: 'from-indigo-500 to-blue-700',
    glowColor: 'rgba(99,102,241,0.35)',
    badge: 'General',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    title: 'Title Generator',
    tagline: 'Viral titles for any topic, any niche',
    bullets: [
      'Instantly generate 10+ high-CTR title options per topic',
      'Powered by trending data from millions of videos',
      'Zero guesswork — click-worthy headlines every time',
    ],
  },
  {
    slug: 'youtube-description-generator',
    icon: FileText,
    gradient: 'from-cyan-500 to-blue-600',
    glowColor: 'rgba(6,182,212,0.35)',
    badge: 'General',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    title: 'Description Generator',
    tagline: 'SEO-packed descriptions in one click',
    bullets: [
      'Auto-includes timestamps, keywords & social links',
      'Structured for YouTube algorithm & Google indexing',
      'Saves 30+ minutes of manual writing per upload',
    ],
  },
  {
    slug: 'youtube-hashtag-generator',
    icon: Hash,
    gradient: 'from-lime-500 to-green-700',
    glowColor: 'rgba(132,204,22,0.35)',
    badge: 'General',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    title: 'Hashtag Generator',
    tagline: 'Trending hashtags that push you to discovery',
    bullets: [
      'Pulls real-time trending tags for your niche category',
      'Mix of viral, medium & niche hashtags for best reach',
      'One click to copy — paste directly into YouTube Studio',
    ],
  },
];

// ─── Stats Banner ─────────────────────────────────────────────────────────────
const STATS = [
  { icon: Users, value: '10,000+', label: 'Creators' },
  { icon: Play, value: '500M+', label: 'Views Generated' },
  { icon: Star, value: '4.9 / 5', label: 'Creator Rating' },
  { icon: BarChart3, value: '11.8%', label: 'Avg CTR Boost' },
];

// ─── Floating particle component ─────────────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 4,
        height: 4,
        background: 'rgba(239,68,68,0.6)',
        ...style,
      }}
    />
  );
}

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, index }: { tool: (typeof FEATURED_TOOLS)[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const Icon = tool.icon;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      className="group relative"
      style={{
        perspective: '1000px',
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div
        className="relative rounded-2xl border border-white/[0.07] bg-[#0d0d14] overflow-hidden transition-all duration-300"
        style={{
          transform: hovered
            ? `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) translateY(-6px)`
            : 'rotateY(0deg) rotateX(0deg) translateY(0)',
          boxShadow: hovered
            ? `0 24px 60px ${tool.glowColor}, 0 0 0 1px rgba(255,255,255,0.08)`
            : '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Glow top line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${tool.gradient} opacity-80`}
        />

        {/* Animated background blur */}
        <div
          className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${tool.gradient} blur-3xl transition-opacity duration-500`}
          style={{ opacity: hovered ? 0.12 : 0.04 }}
        />

        <div className="relative p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-3 py-1 ${tool.badgeColor}`}
            >
              {tool.badge}
            </span>
          </div>

          {/* Title & tagline */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{tool.title}</h3>
            <p className="text-sm text-white/50 leading-snug">{tool.tagline}</p>
          </div>

          {/* Bullets */}
          <ul className="space-y-2">
            {tool.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                <Zap className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href={`/tools/${tool.slug}`}
            className={`mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${tool.gradient} text-white text-sm font-bold transition-all duration-200 hover:opacity-90 hover:scale-[1.02]`}
          >
            Try Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ToolsPage() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Random stable particles (generated once)
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      top: `${10 + (i * 5.2) % 80}%`,
      left: `${5 + (i * 6.1) % 88}%`,
      animDuration: `${3 + (i % 4)}s`,
      animDelay: `${(i * 0.4) % 3}s`,
    }))
  );

  return (
    <div className="min-h-screen bg-[#050712] text-white overflow-x-hidden">
      <MarketingNavbar />

      {/* ── Cursor glow ─────────────────────────────────────────────────────── */}
      {mounted && (
        <div
          className="fixed pointer-events-none z-0 rounded-full transition-all duration-200"
          style={{
            width: 600,
            height: 600,
            top: mousePos.y - 300,
            left: mousePos.x - 300,
            background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
          }}
        />
      )}

      <main className="relative z-10">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
          {/* Animated grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.8) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* Floating particles */}
          {mounted &&
            particles.current.map((p) => (
              <Particle
                key={p.id}
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `float ${p.animDuration} ease-in-out ${p.animDelay} infinite alternate`,
                }}
              />
            ))}

          {/* Big red glow behind title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div
            className="relative inline-block bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-8"
            style={{ animation: 'fadeUp 0.6s ease both' }}
          >
            🔥 FREE AI TOOLS FOR YOUTUBE CREATORS
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.05]"
            style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}
          >
            <span className="text-white">All </span>
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              AI Tools
            </span>
            <br />
            <span className="text-white/80 text-4xl md:text-5xl lg:text-6xl font-light">
              to Dominate YouTube
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}
          >
            9 powerful tools — from AI script writing to thumbnail generation — built to help every
            creator grow faster, rank higher, and go viral.
          </p>

          <div
            className="flex flex-wrap justify-center gap-4"
            style={{ animation: 'fadeUp 0.6s ease 0.3s both' }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
            >
              🏠 Go to Homepage
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105"
            >
              <BarChart3 className="w-5 h-5" /> Open Dashboard
            </Link>
          </div>
        </section>

        {/* ── STATS BANNER ─────────────────────────────────────────────────── */}
        <section
          className="mx-auto max-w-5xl px-4 mb-20"
          style={{ animation: 'fadeUp 0.6s ease 0.4s both' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl py-6 px-4 hover:bg-white/[0.06] transition-colors"
                >
                  <Icon className="w-6 h-6 text-red-400" />
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── TOOLS GRID ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-32">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Every Tool You Need to{' '}
              <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                Grow Your Channel
              </span>
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">
              Click any tool below — all free to start, no credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_TOOLS.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
        <section className="px-4 pb-24">
          <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a0b0b] to-[#0d0d14] border border-red-500/20 p-12 md:p-16 text-center">
            {/* Glow blobs */}
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-red-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-orange-600/15 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-bold tracking-widest mb-6">
                <Sparkles className="w-3.5 h-3.5" /> START FOR FREE TODAY
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                Ready to blow up on YouTube?
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto">
                Join 10,000+ creators already using VidYT to generate views, grow subscribers, and
                monetize faster.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(239,68,68,0.45)]"
                >
                  🏠 Back to Homepage <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-black font-bold px-10 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:bg-white/90"
                >
                  Launch Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Global animations ─────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.6; }
          to   { transform: translateY(-12px) scale(1.3); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
