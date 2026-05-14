import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { Metadata } from 'next';
import DownloadClient from './DownloadClient';

export const metadata: Metadata = {
  title: 'VidYT App — Coming Soon to Google Play Store',
  description: 'Our Android app is coming soon to Google Play. Use the full VidYT AI toolkit on the web today.',
  robots: { index: false, follow: false },
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
