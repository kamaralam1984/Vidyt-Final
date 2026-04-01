'use client';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Contact Vid YT
        </h1>
        <p className="text-lg text-[#AAAAAA] mb-6">
          For any business, partnership or support questions, send us an email. We typically respond within
          24–48 hours.
        </p>

        <div className="bg-[#181818] border border-[#262626] rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            Support & Partnerships
          </h2>
          <p className="text-[#CCCCCC] mb-2">
            Email:{' '}
            <a
              href="mailto:support@vidyt.ai"
              className="text-[#FF6B6B] hover:text-[#FF0000]"
            >
              support@vidyt.ai
            </a>
          </p>
          <p className="text-xs text-[#777777]">
            (Using the same support email across the homepage and documentation helps build consistent brand
            trust signals for search and users.)
          </p>
        </div>
      </div>
    </main>
  );
}

