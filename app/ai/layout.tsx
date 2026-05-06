import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tools for YouTube Creators – Scripts, Hooks, Thumbnails & More | VidYT',
  description: 'Access all VidYT AI tools in one place. Generate scripts, viral hooks, thumbnails, Shorts clips and channel intelligence reports with a single click.',
  keywords: ['ai youtube tools', 'youtube script generator ai', 'ai hook generator', 'youtube thumbnail ai', 'youtube shorts creator ai', 'creator ai toolkit'],
  alternates: { canonical: 'https://www.vidyt.com/ai' },
  openGraph: {
    title: 'AI Tools for YouTube Creators – VidYT',
    description: 'Generate scripts, hooks, thumbnails and Shorts with AI. Everything a creator needs to grow on YouTube, in one place.',
    url: 'https://www.vidyt.com/ai',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tools for YouTube Creators – VidYT',
    description: 'Scripts, hooks, thumbnails and Shorts — all powered by AI. Built for creators.',
  },
};

export default function AILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
