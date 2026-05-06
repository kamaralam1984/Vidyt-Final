import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Viral Score Optimizer – Check Your Video Before Upload | VidYT',
  description: 'Score your YouTube video title, description and hashtags before publishing. Get an AI-powered viral score with instant recommendations to maximize your reach.',
  keywords: ['youtube viral optimizer', 'video viral score checker', 'youtube title optimizer', 'video seo optimizer', 'improve youtube reach', 'youtube video score'],
  alternates: { canonical: 'https://www.vidyt.com/viral-optimizer' },
  openGraph: {
    title: 'YouTube Viral Score Optimizer – VidYT',
    description: "Check your video's viral potential before you upload. Get an AI score and specific fix recommendations.",
    url: 'https://www.vidyt.com/viral-optimizer',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Viral Score Optimizer – VidYT',
    description: "Know your video's viral potential before you publish. AI-powered scoring.",
  },
};

export default function ViralOptimizerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
