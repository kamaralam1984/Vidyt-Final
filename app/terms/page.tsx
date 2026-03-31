'use client';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Terms of Service
        </h1>
        <p className="text-[#AAAAAA] mb-4">
          These terms are a simplified version that you can expand later with a full legal review. The main
          purpose is to make it clear to both Google and users that Vid YT is a serious product with
          real policies in place.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          1. Use of the service
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          You may use Vid YT to analyze, optimize and grow your channels and content. You may not misuse
          our tools (for spam, abuse, TOS violations, or any illegal activity).
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          2. Subscriptions & billing
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          Paid plans are billed on a recurring basis. You can cancel at any time; after cancellation, access
          continues until the end of your current billing period.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          3. Content ownership
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          You remain the full owner of your content and channels. Vid YT only processes your data
          temporarily for analysis and recommendations.
        </p>
      </div>
    </main>
  );
}

