import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free YouTube Hashtag Generator – Get Viral Tags Instantly | VidYT',
  description: 'Generate the best YouTube hashtags for your videos in seconds. Boost discoverability, reach more viewers and grow your channel with AI-powered hashtag suggestions.',
  keywords: ['youtube hashtag generator', 'free hashtag generator', 'best youtube hashtags', 'youtube tags generator', 'viral hashtags youtube'],
  alternates: { canonical: 'https://www.vidyt.com/hashtags' },
  openGraph: {
    title: 'Free YouTube Hashtag Generator – VidYT',
    description: 'Generate viral YouTube hashtags instantly. Boost your video\'s reach and grow your channel.',
    url: 'https://www.vidyt.com/hashtags',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free YouTube Hashtag Generator – VidYT',
    description: 'Get viral YouTube hashtags instantly with AI.',
  },
};

export default function HashtagsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
