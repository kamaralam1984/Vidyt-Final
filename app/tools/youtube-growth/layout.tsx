import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Growth Tracker – Channel Analytics & Subscriber Stats | VidYT',
  description: 'Track your YouTube channel growth, subscriber count, watch time, views and engagement rate. Get AI-powered insights to grow your channel faster with VidYT.',
  keywords: ['youtube growth tracker', 'youtube channel analytics', 'subscriber count tracker', 'youtube stats tool', 'youtube channel growth'],
  alternates: { canonical: 'https://www.vidyt.com/tools/youtube-growth' },
  openGraph: {
    title: 'YouTube Growth Tracker – Channel Analytics | VidYT',
    description: 'Track subscriber growth, views, watch time and engagement. Get AI insights to grow your YouTube channel.',
    url: 'https://www.vidyt.com/tools/youtube-growth',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Growth Tracker – VidYT',
    description: 'Track your YouTube channel analytics and get AI-powered growth insights.',
  },
};

export default function YoutubeGrowthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
