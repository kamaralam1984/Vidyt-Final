import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending YouTube Topics & Keywords – VidYT',
  description: 'Discover what\'s trending on YouTube right now. Find viral topics, hot keywords and niche ideas to grow your channel faster with VidYT\'s trend tracker.',
  keywords: ['trending youtube topics', 'youtube trending keywords', 'viral video ideas', 'youtube trending now', 'youtube niche ideas 2026'],
  alternates: { canonical: 'https://www.vidyt.com/trending' },
  openGraph: {
    title: 'Trending YouTube Topics & Keywords – VidYT',
    description: 'Find viral YouTube topics and trending keywords to grow your channel faster.',
    url: 'https://www.vidyt.com/trending',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending YouTube Topics – VidYT',
    description: 'Discover what\'s trending on YouTube right now.',
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
