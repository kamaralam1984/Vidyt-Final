import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { Metadata } from 'next';
import DownloadClient from './DownloadClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Download App | Vid YT',
  description: 'Download the VidYT Android app and grow your YouTube channel with AI-powered tools on the go.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans">
      <MarketingNavbar />
      <DownloadClient />
      <MarketingFooter />
    </div>
  );
}
