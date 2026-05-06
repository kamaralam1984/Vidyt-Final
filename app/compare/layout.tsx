import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VidYT vs Competitors – Best AI YouTube SEO Tool Comparison',
  description: 'See how VidYT compares to TubeBuddy, VidIQ, Morningfame & others. AI title generator, hashtag tool, thumbnail maker & growth tracker — all in one platform.',
  keywords: ['vidyt vs tubebuddy', 'vidyt vs vidiq', 'best youtube seo tool', 'youtube growth tool comparison', 'ai youtube tools compare'],
  alternates: { canonical: 'https://www.vidyt.com/compare' },
  openGraph: {
    title: 'VidYT vs Competitors – AI YouTube SEO Tool Comparison',
    description: 'Compare VidYT with TubeBuddy, VidIQ and others. One platform for all your YouTube growth needs.',
    url: 'https://www.vidyt.com/compare',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidYT vs Competitors – YouTube SEO Tool Comparison',
    description: 'How VidYT stacks up against TubeBuddy, VidIQ & more.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
