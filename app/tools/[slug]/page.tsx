'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Lightbulb, 
  Brain, 
  ClipboardList, 
  FileText, 
  Type, 
  Gauge, 
  Scissors, 
  Image as ImageIcon,
  Zap,
  TrendingUp,
  Target
} from 'lucide-react';
import { MARKETING_TOOLS } from '@/data/marketingTools';
import MarketingNavbar from '@/components/MarketingNavbar';
import { useUser } from '@/hooks/useUser';

const ICON_MAP: Record<string, any> = {
  Lightbulb,
  Brain,
  ClipboardList,
  FileText,
  Type,
  Gauge,
  Scissors,
  ImageIcon,
  Sparkles,
};

export default function ToolMarketingPage() {
  const params = useParams();
  const raw = params?.slug;
  const slug = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  const tool = slug ? MARKETING_TOOLS[slug] : undefined;
  const { authenticated, loading } = useUser();

  if (!tool) {
    return notFound();
  }

  const Icon = ICON_MAP[tool.iconName] || Sparkles;
  
  const tryLink = !loading && authenticated 
    ? tool.appUrl 
    : `/login?callbackUrl=${encodeURIComponent(tool.appUrl)}`;

  return (
    <div className="min-h-screen bg-[#050712] text-white selection:bg-red-500/30">
      <MarketingNavbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className={`absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br ${tool.gradient} opacity-20 blur-[100px] animate-pulse`} />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-red-500/10 blur-[80px]" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-fade-in">
            <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${tool.gradient}`} />
            <span className="text-xs font-medium text-white/70 tracking-wider uppercase">AI Power Feature</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
            {tool.heroHeadline}
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mb-10 max-w-2xl mx-auto font-light">
            {tool.heroSubheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={tryLink}
              className="group relative px-8 py-4 bg-red-600 rounded-full font-semibold text-lg overflow-hidden transition-all hover:bg-red-700 hover:shadow-2xl hover:shadow-red-500/40"
            >
              <div className="relative z-10 flex items-center gap-2">
                Try {tool.title} Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link 
              href="/pricing"
              className="px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md font-medium hover:bg-white/10 transition-colors"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Icon and How it Works */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <div className="relative group mb-12">
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-40 blur-3xl group-hover:opacity-60 transition-opacity`} />
                <div className="relative w-24 h-24 rounded-3xl bg-[#0F111A] border border-white/10 flex items-center justify-center shadow-2xl">
                  <Icon className="h-12 w-12 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-8">How it works</h3>
              <div className="space-y-8">
                {tool.howItWorks.map((step, i) => (
                  <div key={i} className="flex gap-4 relative group">
                    {i < tool.howItWorks.length - 1 && (
                      <div className="absolute left-[15px] top-[30px] w-0.5 h-[calc(100%+20px)] bg-white/5 group-hover:bg-red-500/20 transition-colors" />
                    )}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-[#0F111A] border border-white/10 flex items-center justify-center text-sm font-bold text-red-500 shadow-lg">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{step.step}</h4>
                      <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: SEO Article and CTA */}
          <div className="lg:col-span-7">
            <div className="prose prose-invert prose-p:text-white/70 prose-p:leading-relaxed prose-p:text-lg max-w-none">
              <div className="bg-[#0F111A]/50 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-inner">
                <h2 className="text-3xl font-bold mb-8 text-white">Dominate YouTube with {tool.title}</h2>
                {tool.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-6 whitespace-pre-wrap">
                    {paragraph.trim()}
                  </p>
                ))}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">Viral-tested frameworks</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">Real-time niche data</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">AI-powered optimization</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">24/7 Strategy Coaching</span>
                  </div>
                </div>
              </div>

              {/* Pitch Banner */}
              <div className="mt-12 bg-gradient-to-br from-red-600/20 to-red-900/40 border border-red-500/20 rounded-3xl p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-red-600/10 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full" />
                <div className="relative z-10">
                  <Zap className="h-10 w-10 text-red-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-2xl font-bold mb-4">Stop relying on luck. Start using Vid YT.</h3>
                  <p className="text-white/70 mb-8 max-w-lg mx-auto">
                    Take your content to the next level with full access to our complete AI toolkit. One subscription, unlimited potential.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
                  >
                    Get Unlimited Access
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Final Suggestion */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#03040B]">
        <div className="max-w-3xl mx-auto text-center">
          <TrendingUp className="h-12 w-12 text-white/20 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Why settle for average views?</h2>
          <p className="text-white/60 mb-10 leading-relaxed italic">
            &ldquo;Vid YT isn&apos;t just a set of tools; it&apos;s a complete growth engine. After using these strategies for 3 months, my retention jumped by 42% and CTR doubled. It&apos;s the only sub I&apos;ll never cancel.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20" />
            <div className="text-left">
              <div className="text-sm font-bold text-white">Alex Rivera</div>
              <div className="text-xs text-white/40">Tech & Lifestyle Creator · 450k+ Subs</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Optimized Meta Tags (conceptually, handled by Next.js layout but here for clarity) */}
      <title>{tool.seoTitle}</title>
      <meta name="description" content={tool.seoDescription} />
    </div>
  );
}
