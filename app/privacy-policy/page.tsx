'use client';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Privacy Policy
        </h1>
        <p className="text-[#AAAAAA] mb-8 text-sm">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">1. Data We Collect</h2>
          <p className="text-[#CCCCCC] mb-4">
            We may collect basic account information (email, name), usage data (which tools were used and how often) and, optionally, identifiers from connected platforms (such as YouTube channel IDs). This includes:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li>Account credentials (email, encrypted password)</li>
            <li>Profile information (name, company, phone)</li>
            <li>Connected platform tokens (YouTube OAuth)</li>
            <li>Usage analytics and engagement metrics</li>
            <li>Video analysis data and predictions</li>
            <li>Subscription and payment information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">2. How We Use Your Data</h2>
          <p className="text-[#CCCCCC] mb-4">
            We primarily use data to:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li>Provide personalized video analysis and AI recommendations</li>
            <li>Generate analytics and performance insights</li>
            <li>Improve our AI models and platform features</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send service updates and important notifications</li>
            <li>Comply with legal and security obligations</li>
          </ul>
          <p className="text-[#CCCCCC]">
            We do not publicly share your content unless you explicitly give us permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">3. Third-Party Services</h2>
          <p className="text-[#CCCCCC] mb-4">
            For payments, hosting, analytics, and platform integrations, we may use trusted third-party providers:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li><strong>YouTube API:</strong> For channel management and video analytics</li>
            <li><strong>Razorpay & Stripe:</strong> For secure payment processing</li>
            <li><strong>Email Services:</strong> For notifications and verification</li>
            <li><strong>Google Cloud:</strong> For hosting and data processing</li>
            <li><strong>AI APIs:</strong> OpenAI and Google Gemini for analysis (anonymized data)</li>
          </ul>
          <p className="text-[#CCCCCC]">
            All partners follow industry-standard security practices under strict data processing agreements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">4. Cookie Policy</h2>
          <p className="text-[#CCCCCC] mb-4">
            We use cookies to enhance your experience:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li><strong>Functional Cookies:</strong> Essential for login, authentication, and site operation</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how you use Vid YT (optional)</li>
            <li><strong>Marketing Cookies:</strong> Used for personalized content and campaigns (optional)</li>
          </ul>
          <p className="text-[#CCCCCC] mb-4">
            When you first visit, we show a consent banner. Functional cookies are always enabled (required for the site to work), but you can accept or reject analytics and marketing cookies.
          </p>
          <div className="bg-[#181818] border border-[#333333] rounded-lg p-4 text-[#AAAAAA] text-sm">
            <p className="mb-2"><strong>Manage Your Cookie Preferences:</strong></p>
            <p>You can change your cookie preferences at any time by looking for the cookie consent banner at the bottom of the page, or by clearing your browser cookies and refreshing.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">5. How to Delete Your Account & Data Rights</h2>
          <p className="text-[#CCCCCC] mb-4">
            You have the right to request deletion of your account and all associated data at any time:
          </p>

          <h3 className="text-xl font-semibold text-white mb-3 mt-4">Deletion Process:</h3>
          <ol className="list-decimal list-inside text-[#CCCCCC] space-y-2 mb-6">
            <li><strong>Go to Settings → Delete My Account</strong></li>
            <li><strong>Review the warning</strong> and confirm the deletion request</li>
            <li><strong>Enter the verification code</strong> sent to your registered email (2-factor verification)</li>
            <li><strong>Your account is immediately anonymized</strong> and marked for deletion</li>
            <li>All your personal data is removed within 24 hours</li>
          </ol>

          <p className="text-[#CCCCCC] mb-4">
            <strong>Alternatively, you can email us:</strong>
          </p>
          <div className="bg-[#181818] border border-[#333333] rounded-lg p-4 mb-6">
            <p className="text-[#AAAAAA]">
              <strong>Email:</strong> <a href="mailto:support@vidyt.com" className="text-[#FF0000] hover:underline">support@vidyt.com</a>
            </p>
            <p className="text-[#AAAAAA] text-sm mt-1">Subject: "Data Deletion Request"</p>
            <p className="text-[#888] text-sm mt-2">Include your account email and we'll process your request within 7 business days.</p>
          </div>

          <p className="text-[#CCCCCC] mb-4">
            <strong>What happens when you delete:</strong>
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li>✓ All videos, analytics, and settings are permanently removed</li>
            <li>✓ Your email and name are anonymized (replaced with unique IDs)</li>
            <li>✓ YouTube OAuth tokens are revoked and disconnected</li>
            <li>✓ API keys and webhooks are deleted</li>
            <li>✓ Subscription data is anonymized per GDPR requirements</li>
            <li>✓ All personal identifiable information is removed from live databases</li>
          </ul>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">
              ⚠️ <strong>Important:</strong> This action is <strong>permanent and cannot be undone</strong>. Deleted data cannot be recovered. You can re-register with the same email after 30 days.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">6. Data Export (GDPR Compliance)</h2>
          <p className="text-[#CCCCCC] mb-4">
            You have the right to download a copy of all your data in a portable format:
          </p>
          <ol className="list-decimal list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li>Go to <strong>Settings → Download My Data</strong></li>
            <li>Choose format: <strong>JSON</strong> (full data) or <strong>CSV</strong> (videos only)</li>
            <li>Click <strong>Export</strong> and download your data file</li>
          </ol>
          <p className="text-[#CCCCCC] mb-4">
            Your data export includes:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li>Account profile (name, email, subscription level, preferences)</li>
            <li>All video analysis results and viral predictions</li>
            <li>Engagement metrics and analytics data</li>
            <li>Connected channels and platform information</li>
            <li>API keys and webhook configurations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">7. Data Retention Policy</h2>
          <p className="text-[#CCCCCC] mb-4">
            We retain your data as follows:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li><strong>Active Accounts:</strong> Data kept as long as your account is active</li>
            <li><strong>Deleted Accounts:</strong> Personal data anonymized within 24 hours. Logs and aggregated analytics may be retained for 12 months for legal and security purposes</li>
            <li><strong>Video Analysis Data:</strong> Kept for 24 months in backups for recovery purposes, then permanently deleted</li>
            <li><strong>OAuth Tokens:</strong> Revoked immediately and deleted upon account deletion</li>
            <li><strong>Payment Records:</strong> Retained for 7 years per legal/tax requirements (anonymized)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">8. Security & Encryption</h2>
          <p className="text-[#CCCCCC]">
            We use industry-standard encryption (TLS 1.3), secure password hashing, and OAuth 2.0 for platform integrations. However, no system is 100% secure. If you suspect unauthorized access, please change your password immediately and contact support.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">9. Your Rights</h2>
          <p className="text-[#CCCCCC] mb-4">
            Under privacy laws (GDPR, India&apos;s proposed DPA), you have the right to:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Object to processing of your data</li>
            <li>Export your data in standard formats</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">10. YouTube API &amp; Third-Party Compliance</h2>
          <p className="text-[#CCCCCC] mb-4">
            As a YouTube API consumer, we comply with all Google API policies:
          </p>
          <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 mb-4">
            <li><strong>Token Security:</strong> YouTube tokens are encrypted and stored securely. Tokens are revoked immediately upon account deletion.</li>
            <li><strong>Data Minimization:</strong> We only request the minimum scopes needed for video analysis.</li>
            <li><strong>User Transparency:</strong> Users can manage connected accounts anytime in Settings.</li>
            <li><strong>No Token Sharing:</strong> We never share YouTube tokens with third parties.</li>
            <li><strong>Compliance:</strong> Regular audits ensure compliance with Google's developer policies.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">11. International Data Transfers</h2>
          <p className="text-[#CCCCCC]">
            Your data may be processed and stored in India and other countries. By using Vid YT, you consent to the transfer and processing of your information in accordance with this privacy policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">12. Contact Us &amp; Privacy Requests</h2>
          <p className="text-[#CCCCCC] mb-4">
            For privacy concerns, data access requests, deletion inquiries, or to exercise your rights:
          </p>

          <div className="bg-[#181818] border border-[#333333] rounded-lg p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Vid YT Privacy Team</h3>
              <p className="text-[#AAAAAA] mb-1">
                <strong>Email:</strong> <a href="mailto:support@vidyt.com" className="text-[#FF0000] hover:underline">support@vidyt.com</a>
              </p>
              <p className="text-[#AAAAAA] mb-1">
                <strong>Subject Line:</strong> "Data Request" or "Privacy Inquiry"
              </p>
              <p className="text-[#888] text-sm">
                <strong>Response Time:</strong> Within 7 business days
              </p>
            </div>

            <div className="border-t border-[#333333] pt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Dashboard Options</h3>
              <ul className="text-[#AAAAAA] space-y-1 text-sm">
                <li>✓ <strong>Delete My Account:</strong> Settings → Delete My Account</li>
                <li>✓ <strong>Download My Data:</strong> Settings → Download My Data</li>
                <li>✓ <strong>Manage Cookies:</strong> Cookie banner (at bottom of page)</li>
                <li>✓ <strong>Disconnect Apps:</strong> Settings → Connected Accounts</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>💡 Tip:</strong> Most privacy requests can be completed instantly through your dashboard. If you need assistance, our support team is available 24/7.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-6 mb-3">13. Policy Updates</h2>
          <p className="text-[#CCCCCC]">
            We may update this policy occasionally. Significant changes will be announced via email or a prominent notice on the site. Continued use of Vid YT after updates means you accept the new policy.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-[#333333] text-[#888]">
          <p className="text-sm">
            This privacy policy is provided to comply with applicable regulations. Please review our <a href="/auth" className="text-[#FF0000] hover:underline">Terms of Use</a> for complete terms and conditions.
          </p>
        </div>
      </div>
    </main>
  );
}

