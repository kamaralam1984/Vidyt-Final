import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { Mail, Clock, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Vid YT',
  description: 'Get in touch with the Vid YT support team. We generally respond within 24-48 hours. Operated by Kvl Business Solutions, India.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24 min-h-[80vh]">
        <div className="text-center mb-16 mt-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact <span className="text-[#FF0000]">Vid YT</span></h1>
          <div className="flex items-center justify-center gap-4 text-sm text-[#888888] mb-6">
            <span>Version: 1.0</span>
            <span>Last Updated: April 5, 2026</span>
          </div>
          <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
            We are here to help you grow. Reach out to our support team for any queries regarding your account, billing, or features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8 hover:border-[#FF0000]/30 transition-colors">
            <div className="w-12 h-12 bg-[#FF0000]/10 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-[#FF0000]" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Email Us</h2>
            <p className="text-[#AAAAAA] mb-4">
              The fastest way to reach us is through email. Send us your queries and our team will get back to you.
            </p>
            <a href="mailto:support@vidyt.com" className="text-lg font-semibold text-white hover:text-[#FF0000] transition-colors">
              support@vidyt.com
            </a>
          </div>

          <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8 hover:border-[#FF0000]/30 transition-colors">
            <div className="w-12 h-12 bg-[#FF0000]/10 rounded-xl flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-[#FF0000]" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Response Time</h2>
            <p className="text-[#AAAAAA] mb-4">
              We typically respond to all support emails within <strong>24–48 hours</strong> during business days.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-[#888888]">
              <ShieldCheck className="w-4 h-4 text-[#00C853]" />
              Trusted by growing YouTube creators
            </div>
          </div>
        </div>

        <div className="mt-16 bg-[#181818] border border-[#212121] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-4">Business & Legal Information</h3>
          <p className="text-[#AAAAAA]">
            Vid YT is a product operated and managed by <strong>Kvl Business Solutions</strong>, India.<br />
            All payments, invoices, and billing are processed under Kvl Business Solutions.
          </p>
        </div>

        <div className="mt-16 text-center">
          <a href="/login" className="inline-block px-8 py-4 bg-[#FF0000] text-white rounded-lg font-semibold hover:bg-[#CC0000] transition-colors mr-4">
            Start Free
          </a>
          <a href="mailto:support@vidyt.com" className="inline-block px-8 py-4 bg-[#212121] text-white rounded-lg font-semibold hover:bg-[#333333] transition-colors">
            Contact Support
          </a>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
