import type { Metadata } from 'next';
import ThumbnailGenerator from '@/components/thumbnail-generator';

export const metadata: Metadata = {
  title: 'Free AI YouTube Thumbnail Generator – Create High-CTR Thumbnails | VidYT',
  description: 'Design professional YouTube thumbnails with AI. Add text overlays, choose backgrounds and score your CTR — no design skills needed. Used by 10,000+ creators.',
  keywords: ['youtube thumbnail generator', 'free thumbnail maker online', 'ai thumbnail creator', 'youtube thumbnail design tool', 'high ctr youtube thumbnail'],
  alternates: { canonical: 'https://www.vidyt.com/thumbnail-generator' },
  openGraph: {
    title: 'Free AI YouTube Thumbnail Generator – VidYT',
    description: 'Create high-CTR YouTube thumbnails with AI. Professional results without any design experience.',
    url: 'https://www.vidyt.com/thumbnail-generator',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI YouTube Thumbnail Generator – VidYT',
    description: 'Design scroll-stopping YouTube thumbnails with AI. Free to start.',
  },
};

export default function ThumbnailGeneratorPage() {
  return <ThumbnailGenerator />;
}
