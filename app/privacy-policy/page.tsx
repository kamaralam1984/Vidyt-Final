import type { Metadata } from 'next';
import Link from 'next/link';

const LAST_UPDATED = '2026-05-10';
const LAST_UPDATED_HUMAN = 'May 10, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy | Vid YT — How We Collect, Use & Protect Your Data',
  description:
    'Read the Vid YT Privacy Policy: what data we collect from YouTube creators, how we use it, third-party sharing, GDPR & DPDP rights, cookies, retention, and security practices.',
  keywords: [
    'Vid YT privacy policy',
    'vidyt.com privacy',
    'YouTube analytics privacy',
    'data protection policy',
    'GDPR compliance',
    'DPDP Act compliance',
    'YouTube API privacy',
  ],
  alternates: { canonical: 'https://www.vidyt.com/privacy-policy' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    url: 'https://www.vidyt.com/privacy-policy',
    siteName: 'Vid YT',
    title: 'Privacy Policy | Vid YT',
    description:
      'How Vid YT collects, uses, stores and safeguards personal data of YouTube creators and businesses. Covers GDPR, CCPA, DPDP Act, YouTube API usage, cookies, and your data rights.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Vid YT',
    description:
      'Vid YT Privacy Policy — data collection, usage, sharing, security, retention, and your rights under GDPR, CCPA and the Indian DPDP Act.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy | Vid YT',
  url: 'https://www.vidyt.com/privacy-policy',
  description:
    'How Vid YT collects, uses, and protects personal data of users, including YouTube API data, cookies, third-party sharing, and your privacy rights.',
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
    headline: 'Vid YT Privacy Policy',
    datePublished: '2024-01-01',
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
      { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://www.vidyt.com/privacy-policy' },
    ],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-4xl mx-auto prose prose-invert prose-headings:text-white prose-a:text-red-400">
        <header className="mb-10">
          <nav aria-label="Breadcrumb" className="text-xs text-[#888] mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#CCC]">Privacy Policy</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-sm text-[#888]">Last updated: <time dateTime={LAST_UPDATED}>{LAST_UPDATED_HUMAN}</time></p>
        </header>

        <section className="space-y-4 text-[#CCCCCC] leading-relaxed">
          <p>
            Welcome to <strong>Vid YT</strong> (&ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a YouTube
            growth, AI viral prediction, and video analytics platform operated by <strong>Kvl Business Solutions</strong> (the &ldquo;Company&rdquo;).
            We are committed to protecting the privacy and security of every YouTube creator, marketer, agency, and business that uses
            <Link href="/" className="ml-1">vidyt.com</Link>. This Privacy Policy explains in plain language what personal information we collect, how we use it,
            who we share it with, how long we keep it, and the rights you have over your data.
          </p>
          <p>
            By accessing or using Vid YT — including the AI viral score engine, channel analytics dashboard, scheduled posting, support
            automation, SEO research, and any related tools — you agree to the practices described in this Privacy Policy. If you do not
            agree, please do not use the Service. This policy is governed by Indian law, including the Information Technology Act, 2000
            and the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;), and also incorporates protections offered under the
            European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA) for users in those regions.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-[#CCCCCC] leading-relaxed mb-3">
            We collect several categories of information to deliver, secure, and improve the Vid YT platform:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] leading-relaxed">
            <li><strong>Account &amp; Profile Information.</strong> Your full name, email address, country, hashed password, profile photo, and your YouTube channel ID once you connect a channel. If you enable two-factor authentication, we store hashed backup codes.</li>
            <li><strong>YouTube Data via Google OAuth.</strong> When you connect a YouTube channel we use Google OAuth 2.0 to access only the scopes you permit — typically channel statistics, video metadata, and read-only analytics. We never receive or store your Google password.</li>
            <li><strong>Usage &amp; Telemetry.</strong> Pages viewed, features used, time spent, button interactions, errors, and aggregated session metrics, used to debug issues and improve the product experience.</li>
            <li><strong>Device &amp; Technical Data.</strong> IP address (often truncated), browser type and version, operating system, device identifiers, referring URL, and approximate geographic location derived from IP.</li>
            <li><strong>Payment Information.</strong> When you subscribe to a paid plan, billing details are collected directly by our payment processors (Razorpay, Stripe, or PayPal). We never store your full card number — only a token, last four digits, and transaction status.</li>
            <li><strong>Communications.</strong> Messages you send through support tickets, the contact form, email, or community channels, including attachments, retained for service quality and dispute resolution.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-[#CCCCCC] leading-relaxed mb-3">We use the data described above to:</p>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] leading-relaxed">
            <li>Create and authenticate your account, secure logins, and detect suspicious activity such as credential stuffing or session hijacking.</li>
            <li>Deliver core platform features including video analysis, AI viral score predictions, scheduled publishing, content recommendations, and SEO research.</li>
            <li>Personalize the dashboard, alerts, and recommendations based on your channel niche and stated goals.</li>
            <li>Communicate with you about transactional matters — billing receipts, security alerts, password resets, and feature updates that affect your account.</li>
            <li>Send marketing emails about new features, tutorials, and promotions <em>only when you have opted in</em>; you can unsubscribe instantly via the link included in every marketing email.</li>
            <li>Operate analytics, error monitoring, and product research, mostly on aggregated and pseudonymous data.</li>
            <li>Comply with legal obligations, respond to lawful requests, enforce our <Link href="/terms">Terms of Service</Link>, and prevent fraud or abuse.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">3. YouTube API Services Disclosure</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            Vid YT uses <strong>YouTube API Services</strong> to fetch channel data, public video metadata, search results, and analytics on
            behalf of users who connect their accounts. By using these features, you agree to be bound by the
            {' '}<a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>{' '}
            and acknowledge the
            {' '}<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
            You may revoke our access to your Google data at any time through Google&apos;s Security Settings at
            {' '}<a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">4. Cookies &amp; Similar Technologies</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            We use first-party cookies and a limited set of third-party cookies for authentication, session management, preference storage,
            and product analytics. You can control or block cookies through your browser settings; however, disabling essential cookies may
            break the login flow and other core functions. We do not use cross-site tracking cookies for advertising and we do not sell
            cookie-derived data to third parties.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">5. Sharing &amp; Third-Party Service Providers</h2>
          <p className="text-[#CCCCCC] leading-relaxed mb-3">
            We <strong>do not sell or rent</strong> your personal data. We share information only with vetted vendors who help us run the Service:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] leading-relaxed">
            <li><strong>Cloud infrastructure</strong> (Hostinger VPS, MongoDB Atlas) for hosting and database storage.</li>
            <li><strong>Email delivery</strong> providers for transactional notifications and opt-in marketing emails.</li>
            <li><strong>Payment processors</strong> (Razorpay, Stripe, PayPal) for processing subscriptions and one-time payments.</li>
            <li><strong>Analytics and error monitoring</strong> tools to understand usage patterns and detect bugs.</li>
            <li><strong>Government or law-enforcement agencies</strong> when required by valid legal process such as a court order or summons.</li>
          </ul>
          <p className="text-[#CCCCCC] leading-relaxed mt-3">
            Each vendor is bound by a Data Processing Agreement requiring them to handle your information according to industry-standard
            security measures and applicable data-protection laws.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">6. Data Retention</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            We retain account information for as long as your account is active and for a reasonable period afterwards to comply with tax,
            accounting, and legal obligations — typically up to seven years for financial records. Aggregated, anonymized analytics may be
            retained indefinitely. You may request deletion of your account and associated personal data at any time by writing to
            {' '}<a href="mailto:support@vidyt.com">support@vidyt.com</a> from the email address registered with your account.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
          <p className="text-[#CCCCCC] leading-relaxed mb-3">
            Depending on where you live, you have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] leading-relaxed">
            <li><strong>Access</strong> the personal data we hold about you and receive a copy.</li>
            <li><strong>Correct</strong> inaccurate or incomplete data in your account.</li>
            <li><strong>Delete</strong> your account and personal data (the &ldquo;right to be forgotten&rdquo;).</li>
            <li><strong>Restrict or object</strong> to certain processing activities such as marketing communications or profiling.</li>
            <li><strong>Port</strong> your data to another service in a machine-readable format.</li>
            <li><strong>Withdraw consent</strong> at any time for processing that is based on consent.</li>
            <li><strong>Lodge a complaint</strong> with a supervisory authority such as the Data Protection Board of India or your local EU data protection authority.</li>
          </ul>
          <p className="text-[#CCCCCC] leading-relaxed mt-3">
            To exercise any of these rights, email <a href="mailto:support@vidyt.com">support@vidyt.com</a> from the email address registered
            with your Vid YT account. We will respond within 30 days, or sooner where the law requires.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">8. Data Security</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            We implement reasonable, industry-standard safeguards to protect your information, including TLS 1.3 encryption in transit,
            AES-256 encryption for sensitive fields at rest, bcrypt-hashed passwords with high work factors, strict role-based access
            control on production databases, mandatory two-factor authentication for administrators, regular security audits, and
            continuous monitoring of suspicious activity. Despite these measures, no system is perfectly secure; if you suspect unauthorized
            access to your account, please contact us immediately so we can investigate and lock the account if necessary.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">9. International Data Transfers</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            Your data may be processed in India and other countries where our service providers operate. Where we transfer personal data
            out of the European Economic Area or the United Kingdom, we rely on Standard Contractual Clauses or other approved transfer
            mechanisms to provide an adequate level of protection.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">10. Children&apos;s Privacy</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            Vid YT is not intended for users under 13 years of age (or 16 in the European Union). We do not knowingly collect personal data
            from children. If you believe a child has provided us personal information, please contact us so we can delete the account and
            associated data promptly.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">11. Changes to This Policy</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for
            other operational reasons. Material changes will be communicated via email or an in-app notification at least 30 days before
            they take effect. The &ldquo;Last updated&rdquo; date at the top of this page indicates when revisions were made; we encourage
            you to review this page periodically.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">12. Contact &amp; Grievance Officer</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            For questions, requests, or complaints about this Privacy Policy or our data practices, please contact:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-1 text-[#CCCCCC] leading-relaxed">
            <li><strong>Email:</strong> <a href="mailto:support@vidyt.com">support@vidyt.com</a></li>
            <li><strong>Operator:</strong> Kvl Business Solutions (Vid YT)</li>
            <li><strong>Country:</strong> India</li>
          </ul>
          <p className="text-[#CCCCCC] leading-relaxed mt-3">
            For more information, you may also review our <Link href="/terms">Terms of Service</Link> and <Link href="/contact">Contact</Link> page.
          </p>
        </section>
      </article>
    </main>
  );
}
