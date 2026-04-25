import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import {
  Rocket,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Youtube,
  BarChart3,
  LifeBuoy,
  BookOpen,
} from 'lucide-react';

export const metadata = {
  title: 'Help Center | Vid YT',
  description: 'Guides, tutorials, and troubleshooting for VidYT — getting started, billing, AI tools, analytics, integrations, and account security.',
  alternates: { canonical: 'https://www.vidyt.com/help' },
};

const topics = [
  {
    icon: Rocket,
    title: 'Getting Started',
    description: 'Set up your account, connect YouTube, and run your first analysis.',
    links: [
      { label: 'Create your account', href: '/signup' },
      { label: 'Connect your YouTube channel', href: '/dashboard/channels' },
      { label: 'Dashboard tour', href: '/dashboard' },
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Tools',
    description: 'Use title, hashtag, thumbnail, hook, and script generators.',
    links: [
      { label: 'Title optimizer', href: '/dashboard/youtube-seo' },
      { label: 'Thumbnail generator', href: '/thumbnail-generator' },
      { label: 'Hook generator', href: '/ai/hook-generator' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Read retention heatmaps, growth curves, and benchmarks.',
    links: [
      { label: 'Analytics overview', href: '/analytics' },
      { label: 'Retention heatmap', href: '/analytics' },
      { label: 'Growth predictions', href: '/analytics' },
    ],
  },
  {
    icon: Youtube,
    title: 'Integrations',
    description: 'YouTube, Instagram, Facebook, and TikTok connections.',
    links: [
      { label: 'YouTube API setup', href: '/dashboard/channels' },
      { label: 'Schedule uploads', href: '/dashboard/upload' },
      { label: 'Browser extension', href: '/help#extension' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Billing',
    description: 'Plans, invoices, currency, refunds, and cancellations.',
    links: [
      { label: 'Compare plans', href: '/pricing' },
      { label: 'Refund policy', href: '/refund-policy' },
      { label: 'Cancel subscription', href: '/dashboard/super' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Security & Privacy',
    description: '2FA, data export, and account deletion.',
    links: [
      { label: 'Enable 2FA', href: '/dashboard/super' },
      { label: 'Export my data', href: '/data-requests' },
      { label: 'Delete my account', href: '/data-requests' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />

      <main className="max-w-6xl mx-auto px-6 py-24 min-h-[80vh]">
        <div className="text-center mb-16 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Help <span className="text-[#FF0000]">Center</span>
          </h1>
          <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
            Guides, tutorials, and answers — pick a topic below or search the docs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {topics.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="bg-[#181818] border border-[#212121] rounded-2xl p-6 hover:border-[#FF0000]/30 transition-colors"
              >
                <div className="w-12 h-12 bg-[#FF0000]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#FF0000]" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t.title}</h2>
                <p className="text-[#AAAAAA] mb-4 text-sm">{t.description}</p>
                <ul className="space-y-2">
                  {t.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-white hover:text-[#FF0000] transition-colors inline-flex items-center gap-1"
                      >
                        → {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
            <BookOpen className="w-8 h-8 text-[#FF0000] mb-4" />
            <h2 className="text-2xl font-bold mb-2">Read the blog</h2>
            <p className="text-[#AAAAAA] mb-6">
              In-depth articles on SEO checklists, hook formulas, and thumbnail frameworks.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              Browse articles
            </Link>
          </div>
          <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
            <LifeBuoy className="w-8 h-8 text-[#FF0000] mb-4" />
            <h2 className="text-2xl font-bold mb-2">Still stuck?</h2>
            <p className="text-[#AAAAAA] mb-6">
              Our team answers within 24 hours on business days.
            </p>
            <a
              href="mailto:support@vidyt.com"
              className="inline-flex items-center gap-2 bg-[#212121] hover:bg-[#2a2a2a] text-white font-semibold px-5 py-3 rounded-xl transition-colors border border-[#2a2a2a]"
            >
              Contact support
            </a>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
