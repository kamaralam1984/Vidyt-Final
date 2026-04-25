'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const APK_URL = '/vidyt-app.apk';
const APK_VERSION = '1.0.0';
const APK_SIZE = '3.6 MB';

const STEPS = [
  {
    num: '01',
    title: 'APK Download Karo',
    desc: 'Neeche "Download APK" button dabao. File automatically download ho jayegi.',
  },
  {
    num: '02',
    title: 'Unknown Sources Allow Karo',
    desc: 'Settings → Security → "Install unknown apps" ya "Unknown sources" ON karo.',
  },
  {
    num: '03',
    title: 'Install Karo',
    desc: 'Downloaded APK file tap karo → Install → Done! App ready hai.',
  },
];

const FEATURES = [
  { icon: '🎯', title: 'AI Title Generator', desc: 'Viral YouTube titles seconds me' },
  { icon: '🏷️', title: 'Hashtag Generator', desc: 'Best trending hashtags instantly' },
  { icon: '📝', title: 'Script Writer', desc: 'AI se complete video scripts' },
  { icon: '🖼️', title: 'Thumbnail Ideas', desc: 'Click-worthy thumbnail concepts' },
  { icon: '📊', title: 'Analytics', desc: 'Channel growth track karo' },
  { icon: '📅', title: 'Content Calendar', desc: 'Posts schedule karo easily' },
];

export default function DownloadClient() {
  const [downloading, setDownloading] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = APK_URL;
    a.download = 'VidYT.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <main className="pt-24 pb-16 px-4">

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center mt-10 mb-16">
        <div className="inline-flex items-center gap-2 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-full px-4 py-1.5 text-sm text-[#FF0000] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse" />
          Android App Available
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
          <span className="text-[#FF0000]">Vid YT</span> App<br />
          <span className="text-[#888]">Download Karo</span>
        </h1>

        <p className="text-[#888] text-lg mb-10 max-w-xl mx-auto">
          AI-powered YouTube growth tools ab aapke phone me. Kabhi bhi, kahin bhi use karo.
        </p>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-3 bg-[#FF0000] hover:bg-[#cc0000] disabled:bg-[#cc0000] text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-[#FF0000]/20 hover:scale-105 active:scale-95 disabled:scale-100"
        >
          {downloading ? (
            <>
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download APK — Free
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-6 mt-5 text-sm text-[#555]">
          <span>v{APK_VERSION}</span>
          <span>•</span>
          <span>{APK_SIZE}</span>
          <span>•</span>
          <span>Android 6.0+</span>
          <span>•</span>
          <span>Free</span>
        </div>

        {/* Non-Android Warning */}
        {!isAndroid && (
          <p className="mt-4 text-xs text-[#666] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 inline-block">
            Ye APK sirf Android phones ke liye hai. Apne Android phone ke browser me yahi link kholo.
          </p>
        )}
      </section>

      {/* QR Code hint */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="flex-shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <svg className="w-12 h-12 text-[#FF0000]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">Phone pe seedha kholna chahte ho?</h3>
            <p className="text-[#666] text-sm mb-3">Apne Android phone ke browser me ye URL type karo:</p>
            <code className="bg-[#0F0F0F] border border-[#333] text-[#FF0000] px-4 py-2 rounded-lg text-sm font-mono">
              vidyt.com/download
            </code>
          </div>
        </div>
      </section>

      {/* Install Steps */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Install Kaise Kare? <span className="text-[#FF0000]">3 Steps</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-[#141414] border border-[#222] hover:border-[#FF0000]/30 rounded-2xl p-6 transition-colors">
              <div className="text-4xl font-black text-[#FF0000]/20 mb-3">{step.num}</div>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
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
          <h2 className="text-2xl font-bold mb-3">Ready ho? Download Karo!</h2>
          <p className="text-[#666] mb-6 text-sm">Free hai. Koi registration nahi. Seedha install karo.</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {downloading ? 'Downloading...' : 'Download APK'}
          </button>
        </div>
      </section>
    </main>
  );
}
