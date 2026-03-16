'use client';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Privacy Policy
        </h1>
        <p className="text-[#AAAAAA] mb-4">
          This is a high‑level privacy summary. You can refine the detailed legal language later with your
          counsel — for now this page provides a basic structure and SEO‑friendly copy so a dedicated privacy
          URL exists for Google and your users.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          1. Data we collect
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          We may collect basic account information (email, name), usage data (which tools were used and how
          often) and, optionally, identifiers from connected platforms (such as YouTube channel IDs).
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          2. How we use your data
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          We primarily use data to give you better recommendations, analytics and to improve our AI models.
          We do not publicly share your content unless you explicitly give us permission.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          3. Third-party services
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          For payments, hosting and analytics we may use trusted third‑party providers that follow
          industry‑standard security practices.
        </p>
      </div>
    </main>
  );
}

