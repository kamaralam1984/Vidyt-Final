import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

export const metadata = {
  title: 'Privacy Policy | Vid YT',
  description: 'Privacy Policy for Vid YT, a product operated by Kvl Business Solutions.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#AAAAAA] font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12 border-b border-[#212121] pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
          <div className="space-y-1 text-lg text-[#AAAAAA]">
            <p><strong>Version:</strong> 1.0</p>
            <p><strong>Last Updated:</strong> April 5, 2026</p>
            <p><strong>Effective From:</strong> April 5, 2026</p>
          </div>
        </div>

        <div className="space-y-10 prose prose-invert max-w-none">
          <section>
            <p className="text-lg font-medium text-white mb-6">
              Vid YT (operated by <strong>Kvl Business Solutions</strong>) acts as the data controller for the information you share with us.
            </p>
            <p>
              We highly respect your privacy and are committed to protecting it through our compliance with this policy. This policy details how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Data Collection</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Personal Data:</strong> Email address, first name, and last name during registration.</li>
              <li><strong>Usage Data:</strong> Information on how you interact with the platform, page visits, features utilized, and analytics requested.</li>
              <li><strong>YouTube Data:</strong> By connecting your channel via Google OAuth, you allow us access to read your YouTube statistics and perform analysis on public or unlisted videos as permitted by the YouTube API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Data Usage</h2>
            <p>Vid YT uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>To provide, maintain, and monitor the usage of the Service.</li>
              <li>To run AI-driven analysis, performance mapping, and algorithmic recommendations.</li>
              <li>To contact you via email regarding updates, support, and billing notifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Third-Party Services</h2>
            <p>To operate our SaaS ecosystem securely and efficiently, we employ third-party tools. Your data may be processed by:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>YouTube API Services:</strong> Vid YT uses YouTube API Services. By using our application, you agree to be bound by the YouTube Terms of Service and Google Privacy Policy.</li>
              <li><strong>Payment Gateways (Razorpay / Stripe):</strong> Process payments securely on behalf of Kvl Business Solutions. We do not store your raw credit card information.</li>
              <li><strong>AI Partners (OpenAI / Gemini):</strong> Process text and image inputs locally for generating titles, assessing viral scores, and identifying hooks.</li>
              <li><strong>Google Cloud:</strong> Hosts our application servers and databases securely.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cookie Usage</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. For more details, please review our <a href="/cookie-policy" className="text-[#FF0000] hover:underline">Cookie Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Deletion & Export</h2>
            <p>
              You have the right to request deletion of your account and personal data from our servers. You can initiate an account deletion from your security settings. Alternatively, you can contact <a href="mailto:support@vidyt.com" className="text-[#FF0000] hover:underline">support@vidyt.com</a> to request a complete wipe of your data or an export of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Security Measures</h2>
            <p>
              We implement reasonable security measures (including secure SSL transmission, hashed passwords, and restricted database access) to protect your personal information. However, no method of transmission over the internet or method of electronic storage is 100% secure.
            </p>
          </section>

          <section className="bg-[#181818] rounded-xl p-6 mt-12 border border-[#212121]">
            <h2 className="text-xl font-bold text-white mb-2">Contact Information</h2>
            <p>
              If you have any questions regarding this Privacy Policy, please contact us:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> <a href="mailto:support@vidyt.com" className="text-[#FF0000] hover:underline">support@vidyt.com</a><br/>
              <strong>Legal Entity:</strong> Kvl Business Solutions, India
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
