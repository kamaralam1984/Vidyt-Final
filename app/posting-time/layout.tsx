import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Time to Post on YouTube in 2026 – AI Upload Scheduler | VidYT',
  description: 'Find the best day and time to post on YouTube, Instagram or Facebook. AI-powered heatmap shows when your audience is most active so your videos get maximum views.',
  keywords: ['best time to post on youtube', 'youtube upload schedule', 'when to post youtube video', 'best upload time youtube 2026', 'youtube posting time optimizer'],
  alternates: { canonical: 'https://www.vidyt.com/posting-time' },
  openGraph: {
    title: 'Best Time to Post on YouTube – VidYT',
    description: 'Find the optimal upload time for YouTube, Instagram and Facebook. AI and real engagement data combined.',
    url: 'https://www.vidyt.com/posting-time',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Time to Post on YouTube – VidYT',
    description: 'AI-powered tool to find the best upload time for your YouTube channel.',
  },
};

export default function PostingTimeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
