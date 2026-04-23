import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

export const metadata = {
  title: 'Cookie Policy | Vid YT',
  description: 'Cookie Policy for Vid YT, a product operated by Kvl Business Solutions.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#AAAAAA] font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12 border-b border-[#212121] pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Cookie Policy</h1>
          <div className="space-y-1 text-lg text-[#AAAAAA]">
            <p><strong>Version:</strong> 1.0</p>
            <p><strong>Last Updated:</strong> April 5, 2026</p>
            <p><strong>Effective From:</strong> April 5, 2026</p>
          </div>
        </div>

        <div className="space-y-10 prose prose-invert max-w-none">
          <section>
            <p>
              Vid YT (operated by <strong>Kvl Business Solutions</strong>) uses cookies and similar technologies to ensure you get the best experience on our platform, provide essential features like authentication, and analyze site traffic.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              <div className="bg-[#181818] p-6 rounded-xl border border-[#212121]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF0000] block"></span> 
                  Strictly Necessary (Functional) Cookies
                </h3>
                <p className="text-sm border-l-2 border-[#333333] pl-4">
                  These cookies are required for Vid YT to function properly. They securely manage user login sessions, API authentications, and basic preferences across page transitions. They cannot be turned off.
                </p>
              </div>

              <div className="bg-[#181818] p-6 rounded-xl border border-[#212121]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] block"></span> 
                  Analytics Cookies <span>(Optional)</span>
                </h3>
                <p className="text-sm border-l-2 border-[#333333] pl-4">
                  These cookies help us understand how users interact with our platform by anonymously collecting and reporting information. It helps us find out which tools are used most frequently to improve your experience.
                </p>
              </div>

              <div className="bg-[#181818] p-6 rounded-xl border border-[#212121]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#8b5cf6] block"></span> 
                  Marketing Cookies <span>(Optional)</span>
                </h3>
                <p className="text-sm border-l-2 border-[#333333] pl-4">
                  These cookies are used to track visitors across websites. The intention is to display operational ads or promotional campaigns that are relevant and engaging for the individual user. Our use of marketing cookies is highly restricted.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. The Consent Banner</h2>
            <p>
              Upon your first visit to Vid YT, a cookie consent banner is displayed. By selecting &quot;Accept All&quot;, you agree to the deployment and reading of all cookie categories. By selecting &quot;Decline&quot;, only strictly necessary functional cookies will be stored on your browser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Managing and Deleting Cookies</h2>
            <p>
              You can control and manage cookies through your browser settings. Removing or blocking cookies may impact your user experience and parts of our site may no longer be fully accessible.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Google Chrome:</strong> Settings {'>'} Privacy and security {'>'} Cookies and other site data</li>
              <li><strong>Mozilla Firefox:</strong> Options {'>'} Privacy & Security {'>'} Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Cookies and website data</li>
            </ul>
          </section>
          
          <p className="mt-12 text-[#888888]">
            For further privacy-related inquiries, contact <a href="mailto:support@vidyt.com" className="text-[#FF0000] hover:underline">support@vidyt.com</a>.
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
