export const dynamic = 'force-dynamic';
export const revalidate = 0;

import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

export const metadata = {
  title: 'Terms of Service | Vid YT',
  description: 'Terms of Service for Vid YT, a product operated by Kvl Business Solutions.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#AAAAAA] font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12 border-b border-[#212121] pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Terms of Service</h1>
          <div className="space-y-1 text-lg text-[#AAAAAA]">
            <p><strong>Version:</strong> 1.0</p>
            <p><strong>Last Updated:</strong> April 5, 2026</p>
            <p><strong>Effective From:</strong> April 5, 2026</p>
          </div>
        </div>

        <div className="space-y-12 prose prose-invert max-w-none">
          <section>
            <p className="text-lg text-white font-medium mb-6">
              Vid YT is a product operated and managed by <strong>Kvl Business Solutions</strong>.
            </p>
            <p>
              By accessing or using the Vid YT platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Use of Service</h2>
            <p>
              Vid YT provides AI-powered tools for YouTube creators to analyze performance, predict trends, and optimize content.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Allowed Use:</strong> You may use the service for analyzing, optimizing, and growing your legitimate YouTube channels.</li>
              <li><strong>Prohibited Use:</strong> You may not use the service for spam, harassment, illegal activities, reverse engineering our algorithms, or abusing the API infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Accounts</h2>
            <p>
              When you create an account with us, you guarantee that the information you provide is accurate and complete. You are completely responsible for maintaining the security of your account and password. Kvl Business Solutions cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Subscriptions & Billing</h2>
            <p>
              Certain aspects of the Service are provided on an automatically renewing subscription basis.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Subscriptions are billed in advance on a recurring monthly or yearly basis.</li>
              <li>You can cancel your subscription at any time from the billing dashboard.</li>
              <li>If you cancel, you will maintain access to your paid features until the end of the current billing cycle.</li>
              <li>All payments are securely processed and invoiced under <strong>Kvl Business Solutions</strong>.</li>
            </ul>
          </section>

          <section className="bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">4. No Refund Policy</h2>
            <p>
              <strong>All payments made to Vid YT are final and non-refundable.</strong> We do not offer partial refunds or prorated refunds for canceled subscriptions. Please review the features of your selected plan carefully before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. GST & Taxes</h2>
            <p>
              Vid YT provides digital SaaS services from India.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Goods and Services Tax (GST) is applied at 18% as per Indian law.</li>
              <li><strong>All prices listed on our platform are inclusive of applicable GST</strong> unless explicitly stated otherwise.</li>
              <li>Invoices for all transactions will be issued under <strong>Kvl Business Solutions</strong> with applicable GST details and breakdowns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Account Suspension</h2>
            <p>
              We reserve the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time. Accounts heavily violating the YouTube terms of service or abusing our fair-use limits may be suspended without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
            <p>
              Users retain full ownership of the content they connect to or process via Vid YT (videos, scripts, channels). Vid YT is a data processor executing algorithms on your behalf.
            </p>
            <p className="mt-4">
              However, the Vid YT platform, its original content, features, analytics models, and functionality are and will remain the exclusive property of Kvl Business Solutions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimer</h2>
            <p>
              While our AI tools simulate potential growth effectively, <strong>Vid YT makes no guarantee of views, subscriber growth, or channel performance</strong>. The YouTube algorithm is subject to external factors outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Kvl Business Solutions, its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
            </p>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
