import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans – VidYT AI YouTube SEO Tools | Free & Pro',
  description: 'Choose the right VidYT plan. Get AI-powered YouTube SEO tools — title generator, thumbnail maker, hashtag tool, growth tracker & more. Start free, upgrade anytime.',
  keywords: ['vidyt pricing', 'youtube seo tool pricing', 'ai youtube tools free', 'vidyt pro plan', 'youtube growth tool price'],
  alternates: { canonical: 'https://www.vidyt.com/pricing' },
  openGraph: {
    title: 'VidYT Pricing – AI YouTube SEO Tools',
    description: 'Free and Pro plans for AI-powered YouTube SEO. Generate viral titles, thumbnails, hashtags & scripts.',
    url: 'https://www.vidyt.com/pricing',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidYT Pricing – AI YouTube SEO Tools',
    description: 'Free and Pro plans for AI-powered YouTube growth.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
