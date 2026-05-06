import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI YouTube Thumbnail Generator – High-CTR Designs Instantly | VidYT',
  description: 'Create scroll-stopping YouTube thumbnails with AI. Get text overlay ideas, layout suggestions, color schemes and a CTR score — no design skills needed.',
  keywords: ['ai thumbnail generator youtube', 'youtube thumbnail maker ai', 'free youtube thumbnail creator', 'high ctr thumbnail design', 'thumbnail generator online'],
  alternates: { canonical: 'https://www.vidyt.com/ai/thumbnail-generator' },
  openGraph: {
    title: 'AI YouTube Thumbnail Generator – VidYT',
    description: 'Design high-CTR YouTube thumbnails with AI recommendations. No Photoshop or design experience needed.',
    url: 'https://www.vidyt.com/ai/thumbnail-generator',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI YouTube Thumbnail Generator – VidYT',
    description: 'Create high-CTR YouTube thumbnails instantly with AI guidance.',
  },
};

export default function AIThumbnailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
