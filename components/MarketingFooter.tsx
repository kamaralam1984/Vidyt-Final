import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function MarketingFooter() {
  return (
    <footer className="bg-[#0F0F0F] border-t border-[#212121] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#FF0000]" />
              <span className="text-xl font-bold text-white">
                <span className="text-[#FF0000]">Vid</span> YT
              </span>
            </div>
            <p className="text-[#AAAAAA] text-sm mb-4">
              AI-powered platform for viral content optimization. Built for creators.
            </p>
            <p className="text-[#AAAAAA] text-sm">
              Operated by <strong>Kvl Business Solutions</strong>, India.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-[#AAAAAA] text-sm">
              <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-[#AAAAAA] text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-[#AAAAAA] text-sm">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#212121] pt-8 text-center text-[#AAAAAA] text-sm flex flex-col gap-2">
          <p>© {new Date().getFullYear()} Vid YT — A product of Kvl Business Solutions</p>
        </div>
      </div>
    </footer>
  );
}
