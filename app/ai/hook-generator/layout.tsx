import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI YouTube Hook Generator – Write Viral Opening Lines | VidYT',
  description: 'Generate 10 scroll-stopping hooks for your YouTube video in seconds. Choose curiosity, shock, emotional or educational styles — AI writes them for your niche.',
  keywords: ['youtube hook generator', 'viral youtube hooks', 'ai hook writer', 'youtube intro hook ideas', 'first line for youtube video', 'scroll stopping hooks'],
  alternates: { canonical: 'https://www.vidyt.com/ai/hook-generator' },
  openGraph: {
    title: 'AI YouTube Hook Generator – VidYT',
    description: 'Write 10 viral hooks for your next YouTube video. Powered by AI, built for your niche and platform.',
    url: 'https://www.vidyt.com/ai/hook-generator',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI YouTube Hook Generator – VidYT',
    description: 'Generate scroll-stopping hooks for YouTube with AI. Stop viewers from swiping away.',
  },
};

export default function HookGeneratorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
