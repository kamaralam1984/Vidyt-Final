import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Channel Intelligence – AI-Powered Channel Analysis | VidYT',
  description: 'Get deep AI insights into any YouTube channel. Analyze growth patterns, top-performing content types, niche keywords and competitor strategy in one report.',
  keywords: ['youtube channel analysis tool', 'channel intelligence ai', 'youtube competitor analysis', 'channel growth insights', 'youtube analytics ai', 'channel audit tool'],
  alternates: { canonical: 'https://www.vidyt.com/ai/channel-intelligence' },
  openGraph: {
    title: 'YouTube Channel Intelligence – VidYT',
    description: 'AI-powered YouTube channel analysis. Discover what works, what does not and how to grow faster.',
    url: 'https://www.vidyt.com/ai/channel-intelligence',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Channel Intelligence – VidYT',
    description: 'Deep AI analysis of any YouTube channel. Competitor intel made simple.',
  },
};

export default function ChannelIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
