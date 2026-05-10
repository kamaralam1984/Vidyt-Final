import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

const LAST_UPDATED = '2026-05-10';
const LAST_UPDATED_HUMAN = 'May 10, 2026';
const EFFECTIVE_FROM = 'April 5, 2026';
const VERSION = '1.1';

export const metadata: Metadata = {
  title: 'Terms of Service | Vid YT — Acceptable Use, Billing, Refunds & Liability',
  description:
    'Read the Vid YT Terms of Service: account rules, subscription billing, GST, refund policy, YouTube API compliance, AI disclaimers, governing law, and limitation of liability for Indian and international users.',
  keywords: [
    'Vid YT terms of service',
    'vidyt.com terms',
    'YouTube growth platform terms',
    'AI viral prediction terms',
    'subscription billing policy',
    'no refund policy',
    'GST SaaS India',
  ],
  alternates: { canonical: 'https://www.vidyt.com/terms' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    url: 'https://www.vidyt.com/terms',
    siteName: 'Vid YT',
    title: 'Terms of Service | Vid YT',
    description:
      'The rules that govern your use of Vid YT — account responsibilities, subscriptions, GST, refund policy, YouTube API compliance, AI disclaimer, governing law, and liability limits.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Vid YT',
    description:
      'Vid YT Terms of Service — billing, refunds, acceptable use, YouTube API compliance, governing law, and liability.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service | Vid YT',
  url: 'https://www.vidyt.com/terms',
  description:
    'Vid YT Terms of Service — account rules, subscription billing, GST, refund policy, YouTube API compliance, AI disclaimers, governing law and liability.',
  inLanguage: 'en',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Vid YT',
    url: 'https://www.vidyt.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Kvl Business Solutions',
    url: 'https://www.vidyt.com',
    email: 'support@vidyt.com',
  },
  dateModified: LAST_UPDATED,
  mainEntity: {
    '@type': 'Article',
    headline: 'Vid YT Terms of Service',
    datePublished: '2026-04-05',
    dateModified: LAST_UPDATED,
    author: {
      '@type': 'Organization',
      name: 'Kvl Business Solutions',
    },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.vidyt.com' },
      { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: 'https://www.vidyt.com/terms' },
    ],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#AAAAAA] font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNavbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <nav aria-label="Breadcrumb" className="text-xs text-[#888] mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#CCC]">Terms of Service</span>
        </nav>

        <header className="mb-12 border-b border-[#212121] pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Terms of Service</h1>
          <div className="space-y-1 text-sm text-[#AAAAAA]">
            <p><strong>Version:</strong> {VERSION}</p>
            <p><strong>Last Updated:</strong> <time dateTime={LAST_UPDATED}>{LAST_UPDATED_HUMAN}</time></p>
            <p><strong>Effective From:</strong> {EFFECTIVE_FROM}</p>
          </div>
        </header>

        <article className="space-y-12 prose prose-invert max-w-none prose-headings:text-white prose-a:text-red-400">
          <section>
            <p className="text-lg text-white font-medium mb-6">
              Vid YT is a YouTube growth, AI viral prediction, and video analytics platform operated and managed by{' '}
              <strong>Kvl Business Solutions</strong> (the &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
            </p>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) form a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;)
              and the Company governing your access to and use of the Vid YT website, dashboard, mobile experience, APIs, AI tools, scheduled
              publishing utilities, support automation, SEO research utilities, and any related services (collectively, the &ldquo;Service&rdquo;).
              By creating an account, signing in, or otherwise using the Service, you confirm that you have read, understood, and agree to be
              bound by these Terms and our <Link href="/privacy-policy">Privacy Policy</Link>. If you do not agree, please stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Eligibility</h2>
            <p>
              You must be at least 13 years old (or 16 years old if you are a resident of the European Economic Area) to register for an
              account. If you are using the Service on behalf of an organisation, you represent and warrant that you have the authority to
              bind that organisation to these Terms and that the organisation accepts these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p>
              Vid YT provides AI-powered tools designed to help YouTube creators, agencies, and businesses analyse channel performance,
              predict viral potential, optimise titles, thumbnails, and SEO metadata, schedule and publish videos, automate community
              support, and gather competitive intelligence. The Service may evolve over time as we add, modify, or remove features. We
              reserve the right to make such changes without prior notice, except where the law requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration &amp; Security</h2>
            <p>
              When you create an account you agree to provide accurate, current, and complete information and to keep that information
              up to date. You are solely responsible for safeguarding your password, enabling two-factor authentication where available,
              and for any activity that occurs under your account. You must notify us immediately at{' '}
              <a href="mailto:support@vidyt.com">support@vidyt.com</a> if you suspect unauthorised access. The Company will not be liable for any loss or damage
              arising from your failure to comply with this security obligation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use &amp; Prohibited Activities</h2>
            <p>You agree to use the Service in compliance with all applicable laws and these Terms. You shall not:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Use the Service to send spam, harass any person, infringe intellectual-property rights, or distribute unlawful content.</li>
              <li>Reverse-engineer, decompile, scrape, or attempt to derive source code or training data from our AI models or backend infrastructure.</li>
              <li>Abuse, overload, or attempt to disrupt our APIs, queues, or rate-limited endpoints.</li>
              <li>Resell, sublicense, or expose the Service to third parties without an explicit written agreement with the Company.</li>
              <li>Use the Service to artificially inflate views, subscribers, or engagement on YouTube in violation of the YouTube Terms of Service.</li>
              <li>Submit false, misleading, or impersonating information in your account profile or support requests.</li>
            </ul>
            <p className="mt-4">
              Violations may result in temporary suspension, permanent termination, and where appropriate, civil or criminal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Subscriptions, Billing &amp; Auto-Renewal</h2>
            <p>Certain features of the Service are made available on an automatically renewing subscription basis.</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Subscriptions are billed in advance on a recurring monthly or yearly basis using the payment method you select at checkout.</li>
              <li>By subscribing, you authorise us (and our payment processors — Razorpay, Stripe, or PayPal) to charge the applicable fees plus taxes to your selected payment method until you cancel.</li>
              <li>You can cancel your subscription at any time from the billing dashboard. Cancellation stops future renewals but does not refund the current period.</li>
              <li>If you cancel, you will continue to have access to your paid features until the end of the current billing cycle.</li>
              <li>All payments are securely processed and invoiced under <strong>Kvl Business Solutions</strong>.</li>
              <li>If a payment fails, we may retry the charge and may suspend your access until the outstanding balance is settled.</li>
            </ul>
          </section>

          <section className="bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">6. No Refund Policy</h2>
            <p>
              <strong>All payments made to Vid YT are final and non-refundable.</strong> We do not offer partial, prorated, or goodwill refunds
              for cancelled subscriptions, unused months, accidental purchases, or change of mind. Please review the features included in
              your selected plan and use the free tier or trial (if available) before purchasing. Refunds will be considered only where
              required by mandatory consumer-protection law applicable to your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. GST &amp; Taxes</h2>
            <p>Vid YT provides digital SaaS services from India.</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Goods and Services Tax (GST) is applied at 18% as required by Indian law.</li>
              <li><strong>All prices listed on our platform are inclusive of applicable GST</strong> unless explicitly stated otherwise.</li>
              <li>Invoices for all transactions are issued under <strong>Kvl Business Solutions</strong> with applicable GST details and HSN/SAC breakdowns.</li>
              <li>Users outside India are responsible for any local taxes, duties, or levies applicable to the purchase.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Account Suspension &amp; Termination</h2>
            <p>
              We reserve the right to suspend, restrict, or terminate your account and refuse any current or future use of the Service for
              any reason, including but not limited to violations of these Terms, abuse of fair-use limits, repeated chargebacks, or
              breaches of the YouTube Terms of Service. Where reasonable, we will provide notice and an opportunity to remedy the issue;
              however, in cases of severe or repeated violations we may act without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Intellectual Property Rights</h2>
            <p>
              You retain full ownership of the content you connect to or process via Vid YT, including videos, scripts, channel data, and
              analytics inputs. By using the Service, you grant the Company a limited, non-exclusive, royalty-free licence to host, copy,
              process, transmit, display, and analyse that content solely to operate and improve the Service for you.
            </p>
            <p className="mt-4">
              The Vid YT platform itself — including its source code, original content, AI and machine-learning models, training datasets,
              analytics features, branding, logos, and overall functionality — is and shall remain the exclusive property of Kvl Business
              Solutions. Nothing in these Terms transfers ownership of our intellectual property to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Services &amp; YouTube API Compliance</h2>
            <p>
              Vid YT integrates with third-party services, including YouTube API Services, Google authentication, and various payment and
              analytics providers. By using these features you agree to be bound by the respective third-party terms, including the{' '}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>{' '}
              and the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>. You may
              revoke our access to your Google data at any time through{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google&apos;s Security Settings</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. AI &amp; Algorithmic Output Disclaimer</h2>
            <p>
              Our AI tools simulate potential growth, predict viral scores, and recommend optimisations based on historical patterns and
              modelling. <strong>Vid YT makes no guarantee of views, watch time, subscriber growth, revenue, or channel performance.</strong>
              {' '}The YouTube algorithm, audience preferences, and content trends are subject to external factors outside our control.
              You acknowledge that any decisions you make based on AI-generated output are made at your own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Service Availability &amp; Modifications</h2>
            <p>
              We strive to keep the Service available 24/7, but we do not guarantee uninterrupted access. Scheduled maintenance, software
              upgrades, third-party API outages, or events outside our reasonable control may cause downtime. We may also modify, suspend,
              or discontinue features at any time, with or without notice. Where a feature is permanently retired and you have prepaid for
              it, we will, at our option, provide a comparable replacement or a service credit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Disclaimer &amp; &ldquo;AS IS&rdquo; Basis</h2>
            <p>
              The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, express or
              implied, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, or
              continuous operation. We do not warrant that the Service will meet your specific requirements, be free from errors, or be
              compatible with every device, browser, or third-party tool you use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">14. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Kvl Business Solutions, its directors, employees, contractors, and partners
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation
              loss of profits, revenue, data, goodwill, or other intangible losses, resulting from (a) your access to or use of (or inability
              to access or use) the Service; (b) any conduct or content of any third party on the Service; or (c) unauthorised access, use,
              or alteration of your transmissions or content. Our aggregate liability for any claim arising out of or relating to these Terms
              or the Service shall not exceed the amount you paid us during the three (3) months preceding the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">15. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Kvl Business Solutions and its officers, directors, employees, and agents
              from any claim, demand, loss, liability, or expense (including reasonable legal fees) arising from your use of the Service,
              your violation of these Terms, or your violation of any third-party right, including any intellectual-property right or
              privacy right.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">16. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India. Subject to any mandatory consumer-protection
              rights, the courts located in the jurisdiction of Kvl Business Solutions&apos; registered office shall have exclusive
              jurisdiction over any dispute arising out of or in connection with these Terms or the Service. Before filing a claim, you
              agree to attempt to resolve the dispute informally by contacting{' '}
              <a href="mailto:support@vidyt.com">support@vidyt.com</a> and allowing 30 days for a good-faith resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">17. Force Majeure</h2>
            <p>
              We will not be liable for any failure or delay in performing our obligations under these Terms caused by events beyond our
              reasonable control, including acts of God, natural disasters, war, terrorism, riots, civil unrest, government action,
              pandemics, internet or third-party service outages, cyber-attacks, or labour disputes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">18. Changes to These Terms</h2>
            <p>
              We may revise these Terms from time to time to reflect changes in our Service, business, or legal requirements. Material
              changes will be communicated via email or in-app notification at least 30 days before they take effect. Your continued use of
              the Service after the changes become effective constitutes your acceptance of the revised Terms. The &ldquo;Last Updated&rdquo;
              date at the top of this page indicates when revisions were made.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">19. Severability &amp; Entire Agreement</h2>
            <p>
              If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall remain in
              full force and effect. These Terms, together with our <Link href="/privacy-policy">Privacy Policy</Link> and any additional
              policies referenced herein, constitute the entire agreement between you and the Company concerning the Service and supersede
              all prior or contemporaneous agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">20. Contact</h2>
            <p>
              Questions about these Terms? Reach our team at:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:support@vidyt.com">support@vidyt.com</a></li>
              <li><strong>Operator:</strong> Kvl Business Solutions (Vid YT)</li>
              <li><strong>Country:</strong> India</li>
            </ul>
            <p className="mt-3">
              You may also review our <Link href="/privacy-policy">Privacy Policy</Link> for details on how we handle your personal data.
            </p>
          </section>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
