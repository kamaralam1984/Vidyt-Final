import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy | Vid YT',
  description: 'Refund policy for Vid YT, operated by Kvl Business Solutions.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#AAAAAA] font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24 min-h-[80vh]">
        <div className="mb-12 border-b border-[#212121] pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Refund Policy</h1>
          <div className="space-y-1 text-lg text-[#AAAAAA]">
            <p><strong>Version:</strong> 1.0</p>
            <p><strong>Last Updated:</strong> April 5, 2026</p>
            <p><strong>Effective From:</strong> April 5, 2026</p>
          </div>
        </div>

        <div className="bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#FF0000]/20 flex justify-center items-center shrink-0">
              <AlertCircle className="w-6 h-6 text-[#FF0000]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">No Refunds Provided</h2>
          </div>
          
          <div className="space-y-6 text-lg">
            <p>
              Due to the nature of our digital SaaS platform and the immediate computational resources utilized by our AI engines upon upgrading, <strong>all payments made to Vid YT are final and non-refundable</strong>.
            </p>
            <p>
              By subscribing to a paid plan, you acknowledge and agree that <strong>no refunds</strong> will be issued under any condition, including but not limited to:
            </p>
            <ul className="list-disc pl-8 space-y-3 mt-4 mb-6 text-white text-base">
              <li>Lack of usage of the platform during your billing cycle.</li>
              <li>Dissatisfaction with the output provided by our AI algorithms.</li>
              <li>Change of mind after a subscription has been purchased or renewed.</li>
              <li>Forgetting to cancel the subscription prior to the renewal date.</li>
            </ul>
            <p>
              We strongly advise all users to review plan features, pricing, and limits carefully before making a purchase.
            </p>
            
            <h3 className="text-xl font-bold text-white mt-8 mb-4">Subscription Cancellations</h3>
            <p>
              You may cancel your subscription at any time via your billing dashboard. If you choose to cancel, your subscription will not renew, but <strong>you will retain full access to your paid features until the end of your current billing cycle</strong>.
            </p>
            <p className="mt-8 text-sm">
              All transactions and invoices are securely managed by <strong>Kvl Business Solutions</strong>. For technical support, please contact <a href="mailto:support@vidyt.com" className="text-[#FF0000] hover:underline">support@vidyt.com</a>.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
