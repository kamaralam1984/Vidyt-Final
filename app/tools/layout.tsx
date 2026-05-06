import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free YouTube SEO Tools for Creators – Title, Script, Hashtags & More | VidYT',
  description: 'Browse all free and pro VidYT tools built for YouTube creators. Title generator, AI script writer, hashtag tool, thumbnail maker, viral score checker and growth tracker.',
  keywords: ['free youtube seo tools', 'youtube creator tools', 'youtube title generator free', 'youtube growth tools', 'best tools for youtube creators', 'ai tools for youtube'],
  alternates: { canonical: 'https://www.vidyt.com/tools' },
  openGraph: {
    title: 'Free YouTube SEO Tools for Creators – VidYT',
    description: 'All the AI tools a YouTube creator needs — titles, scripts, hashtags, thumbnails and growth tracking. Start free.',
    url: 'https://www.vidyt.com/tools',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free YouTube SEO Tools for Creators – VidYT',
    description: 'Title generator, AI scripts, hashtags, thumbnail maker — all free to start on VidYT.',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
