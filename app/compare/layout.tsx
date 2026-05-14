import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VidYT vs Other Creator Tools – Best AI YouTube SEO Tool',
  description: 'See how VidYT compares to other YouTube growth and SEO tools. AI title generator, hashtag tool, thumbnail maker & growth tracker — all in one platform.',
  keywords: ['best youtube seo tool', 'youtube growth tool comparison', 'ai youtube tools compare', 'creator tools comparison'],
  alternates: { canonical: 'https://www.vidyt.com/compare' },
  openGraph: {
    title: 'VidYT vs Other Creator Tools – AI YouTube SEO Tool Comparison',
    description: 'Compare VidYT with other creator tools. One platform for all your YouTube growth needs.',
    url: 'https://www.vidyt.com/compare',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidYT vs Other Creator Tools – YouTube SEO Tool Comparison',
    description: 'How VidYT stacks up against other YouTube growth platforms.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
