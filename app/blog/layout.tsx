import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Creator Blog – Growth Tips, SEO Guides & Shorts Strategies | VidYT',
  description: 'Read actionable YouTube growth guides from VidYT. Covers SEO strategy, Shorts formulas, thumbnail frameworks and creator workflows that actually drive views.',
  keywords: ['youtube creator blog', 'youtube seo guide 2026', 'youtube growth tips', 'youtube shorts strategy', 'thumbnail tips for creators', 'video seo articles'],
  alternates: { canonical: 'https://www.vidyt.com/blog' },
  openGraph: {
    title: 'YouTube Creator Blog – VidYT',
    description: 'SEO guides, Shorts formulas and thumbnail tips for YouTube creators. Written from real creator experience.',
    url: 'https://www.vidyt.com/blog',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Creator Blog – VidYT',
    description: 'Actionable YouTube growth tips, SEO guides and creator strategies that actually work.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
