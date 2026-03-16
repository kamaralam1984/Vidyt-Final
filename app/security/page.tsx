'use client';

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Security at ViralBoost AI
        </h1>
        <p className="text-[#AAAAAA] mb-4">
          Protecting creators&apos; data is a core part of how we design the product. This page outlines
          high‑level security practices that you can later expand based on your actual infrastructure.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          Data protection
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          Wherever possible, sensitive data is protected in transit (HTTPS) and at rest. We store only the
          minimum amount of information required to run the service.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-3">
          Account & access
        </h2>
        <p className="text-[#CCCCCC] mb-2">
          Accounts are secured using passwords and/or OAuth providers (depending on implementation). Access
          control is strictly role‑based so admin and regular user actions stay clearly separated.
        </p>
      </div>
    </main>
  );
}

