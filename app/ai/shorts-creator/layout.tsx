import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI YouTube Shorts Creator – Turn Long Videos into Viral Shorts | VidYT',
  description: 'Automatically cut your long YouTube video into 5 viral Shorts with captions and timestamps. Save hours of editing with AI-powered Shorts repurposing.',
  keywords: ['youtube shorts creator ai', 'repurpose video to shorts', 'ai shorts generator', 'long video to youtube shorts', 'auto shorts creator', 'shorts clip cutter'],
  alternates: { canonical: 'https://www.vidyt.com/ai/shorts-creator' },
  openGraph: {
    title: 'AI YouTube Shorts Creator – VidYT',
    description: 'Turn long videos into 5 viral YouTube Shorts automatically. Captions, timestamps and hooks included.',
    url: 'https://www.vidyt.com/ai/shorts-creator',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI YouTube Shorts Creator – VidYT',
    description: 'Repurpose long videos into YouTube Shorts in minutes with AI.',
  },
};

export default function ShortsCreatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
