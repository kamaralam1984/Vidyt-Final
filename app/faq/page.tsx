import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import Script from 'next/script';
import FAQAccordion from './FAQAccordion';

export const metadata = {
  title: 'VidYT FAQ – Pricing, AI Features, Billing & Platform Questions Answered',
  description: 'Find answers to common VidYT questions. Covers pricing plans, AI tool features, YouTube SEO, billing, refund policy, account security and supported platforms.',
  keywords: ['vidyt faq', 'vidyt pricing questions', 'youtube seo tool faq', 'vidyt how it works', 'vidyt refund policy', 'vidyt ai features'],
  alternates: { canonical: 'https://www.vidyt.com/faq' },
  openGraph: {
    title: 'VidYT FAQ – Your Questions Answered',
    description: 'Everything you need to know about VidYT — pricing, AI tools, billing and YouTube SEO features.',
    url: 'https://www.vidyt.com/faq',
    siteName: 'VidYT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidYT FAQ – Pricing, Features & Platform Questions',
    description: 'Quick answers to the most common VidYT questions from creators.',
  },
};

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is VidYT?',
        a: 'VidYT is an AI-powered content-growth platform for creators on YouTube, Instagram, Facebook, and TikTok. It helps you optimize titles, hashtags, thumbnails, hooks, and scripts, predict viral potential, and track analytics — all in one dashboard.',
      },
      {
        q: 'Is there a free plan?',
        a: 'Yes. The Free plan gives you access to core SEO and trend tools with monthly usage limits. You can upgrade to Starter, Pro, or Enterprise any time for higher limits and advanced AI features.',
      },
      {
        q: 'Do I need a YouTube channel to use VidYT?',
        a: 'A channel is not required to start. Many of our tools — keyword research, hashtag generators, title optimizer, thumbnail analyzer — work without connecting a channel. Connect your YouTube account later to unlock analytics and auto-upload.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: 'We accept UPI, credit/debit cards, and net banking via Razorpay for Indian customers, and international cards for users outside India. Pricing auto-adjusts to your local currency.',
      },
      {
        q: 'Can I switch plans or cancel any time?',
        a: 'Yes. Upgrades take effect immediately. You can cancel from your billing portal; access continues until the end of the current billing cycle.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'All payments are non-refundable once processed because AI compute is consumed immediately. Please review our Refund Policy page for full details and cancellation rules.',
      },
      {
        q: 'Is there an annual discount?',
        a: 'Yes — annual plans save roughly 20% compared to monthly billing. Toggle between monthly and yearly on the pricing page.',
      },
    ],
  },
  {
    category: 'AI & Features',
    items: [
      {
        q: 'Which AI models power VidYT?',
        a: 'We use a mix of OpenAI, a proprietary fine-tuned ranking model for viral prediction, and TensorFlow.js for on-device thumbnail scoring. Routing is automatic — the best model is picked per task.',
      },
      {
        q: 'Are my generated ideas private?',
        a: 'Yes. Your prompts and outputs are scoped to your account. We never train shared models on your private content.',
      },
      {
        q: 'Does VidYT upload videos directly to YouTube?',
        a: 'Yes — after connecting your YouTube account, you can upload, schedule, and auto-apply AI-optimized titles, descriptions, hashtags, and thumbnails from inside the dashboard.',
      },
    ],
  },
  {
    category: 'Security & Data',
    items: [
      {
        q: 'Is two-factor authentication available?',
        a: 'Yes. You can enroll an authenticator app (TOTP) from your account settings. We strongly recommend it for all paid accounts.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Data is stored in encrypted MongoDB clusters with daily backups. We follow a least-privilege access model and log all admin actions.',
      },
      {
        q: 'How do I export or delete my data?',
        a: 'From Settings → Privacy you can request a full JSON export of your data or initiate account deletion. Deletion is confirmed via email OTP and completed within 30 days as required by GDPR.',
      },
    ],
  },
  {
    category: 'Support',
    items: [
      {
        q: 'How do I get help?',
        a: 'Email support@vidyt.com or open a ticket from the support page. Pro and Enterprise users get priority response SLAs.',
      },
      {
        q: 'Do you have a status page?',
        a: 'Yes — live system status and incident history are available at /status.',
      },
    ],
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.flatMap((group) =>
    group.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <MarketingNavbar />

      <main className="max-w-4xl mx-auto px-6 py-24 min-h-[80vh]">
        <div className="text-center mb-16 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-[#FF0000]">Questions</span>
          </h1>
          <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
            Everything you need to know about VidYT — features, billing, security, and support.
          </p>
        </div>

        <FAQAccordion groups={faqs} />

        <div className="mt-16 bg-[#181818] border border-[#212121] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="text-[#AAAAAA] mb-6">
            We usually reply within 24 hours on business days.
          </p>
          <a
            href="mailto:support@vidyt.com"
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Email Support
          </a>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
