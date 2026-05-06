import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI YouTube Script Generator – Full Video Scripts in Minutes | VidYT',
  description: 'Write complete YouTube video scripts with AI. Get viral hooks, structured body content, titles, hashtags and a strong CTA — all optimized for watch time.',
  keywords: ['youtube script generator', 'ai video script writer', 'youtube video script ai', 'content script creator', 'youtube script template free', 'ai youtube writer'],
  alternates: { canonical: 'https://www.vidyt.com/ai/script-generator' },
  openGraph: {
    title: 'AI YouTube Script Generator – VidYT',
    description: 'Full AI-written YouTube scripts with hooks, body content and CTA. Go from idea to ready-to-film in minutes.',
    url: 'https://www.vidyt.com/ai/script-generator',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI YouTube Script Generator – VidYT',
    description: 'AI writes your complete YouTube script — hook, content and CTA in minutes.',
  },
};

export default function ScriptGeneratorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
