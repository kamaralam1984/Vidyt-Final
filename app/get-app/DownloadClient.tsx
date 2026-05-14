'use client';

import Link from 'next/link';

// Direct APK distribution removed — app is being prepared for Google Play Store launch.

const FEATURES = [
  { icon: '🎯', title: 'AI Title Generator', desc: 'Viral YouTube titles seconds me' },
  { icon: '🏷️', title: 'Hashtag Generator', desc: 'Best trending hashtags instantly' },
  { icon: '📝', title: 'Script Writer', desc: 'AI se complete video scripts' },
  { icon: '🖼️', title: 'Thumbnail Ideas', desc: 'Click-worthy thumbnail concepts' },
  { icon: '📊', title: 'Analytics', desc: 'Channel growth track karo' },
  { icon: '📅', title: 'Content Calendar', desc: 'Posts schedule karo easily' },
];

export default function DownloadClient() {
  const handleNotify = () => {
    window.location.href = '/register';
  };

  return (
    <main className="pt-24 pb-16 px-4">

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center mt-10 mb-16">
        <div className="inline-flex items-center gap-2 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-full px-4 py-1.5 text-sm text-[#FF0000] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse" />
          Coming Soon to Google Play Store
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
          <span className="text-[#FF0000]">Vid YT</span> App<br />
          <span className="text-[#888]">Coming Soon</span>
        </h1>

        <p className="text-[#888] text-lg mb-10 max-w-xl mx-auto">
          Hamari Android app jald hi Google Play Store pe launch ho rahi hai. Tab tak web app pe sab features use karo — same AI tools, same growth.
        </p>

        {/* Notify / Use Web Button */}
        <button
          onClick={handleNotify}
          className="inline-flex items-center gap-3 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-[#FF0000]/20 hover:scale-105 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Notify Me on Launch
        </button>

        <div className="mt-6">
          <Link href="/" className="text-sm text-[#888] hover:text-white underline underline-offset-4">
            Use VidYT on the web instead →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          App Me Kya Milega?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white font-medium text-sm">{f.title}</p>
                <p className="text-[#666] text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#FF0000]/10 to-transparent border border-[#FF0000]/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">Launch Hote Hi Notify Kare?</h2>
          <p className="text-[#666] mb-6 text-sm">Free signup karo — Play Store pe app aate hi sabse pehle aapko milega.</p>
          <button
            onClick={handleNotify}
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Notify Me — Free Signup
          </button>
        </div>
      </section>
    </main>
  );
}
