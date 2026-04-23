"use client";

import React, { useState } from 'react';
import Link from 'next/link';

/* 
====================================================================================================
⚠️ NEXT.JS APP ROUTER CAUTION: 
In the App Router, you cannot export `metadata` from a file that uses `"use client"`. 
To use this in production:
1. Move the `metadata` export to your `layout.tsx` or a server-side `page.tsx`.
2. Keep this entire interactive code in a separate Client Component (e.g., `GamingTitleClient.tsx`).
====================================================================================================
*/

// export const metadata = {
//   title: "Best YouTube Title Generator for Gaming Videos | VidYT",
//   description: "Generate viral, high CTR gaming titles instantly. Use the ultimate YouTube Title Generator for Gaming Videos to hack the algorithm and boost your views.",
// };

export default function GamingTitleGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock title generation function for interactivity
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    
    // Simulate API Call
    setTimeout(() => {
      const generatedTitles = [
        `🔥 I Survived 100 Days in ${topic}... and THIS Happened!`,
        `The ONLY ${topic} Guide You'll Ever Need (Hindi)`,
        `${topic} Update: Best Class Setup & Secret Tricks!`,
        `We Broke ${topic} Custom Rooms (Funny Moments) 😂`,
        `${topic} Pro Gameplay - Insane Rush & Clutch! 😱`,
        `Top 5 ${topic} Tricks Every Player Must Try Today!`
      ];
      setResults(generatedTitles);
      setIsGenerating(false);
    }, 1200);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this YouTube Title Generator for Gaming Videos free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our tool is 100% free! For bulk suggestions and advanced gaming SEO, try our Pro plans."
        }
      },
      {
        "@type": "Question",
        "name": "Does a better title impact gaming video optimization?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! A click-worthy title boosts your CTR, triggering the YouTube algorithm to suggest your video to more gamers."
        }
      },
      {
        "@type": "Question",
        "name": "Can I generate titles in Hinglish?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We specialize in blending English with Hinglish elements to specifically target the massive Indian gaming community."
        }
      },
      {
        "@type": "Question",
        "name": "Will this tool improve my channel's YouTube growth?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. By automatically integrating viral LSI keywords natively, our YouTube Title Generator for Gaming Videos severely boosts your chance of ranking on search."
        }
      },
      {
        "@type": "Question",
        "name": "Who is this YouTube Title Generator for Gaming Videos made for?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "It is perfect for gaming streamers, eSports players, Let's Play creators, and tutorial makers looking to skyrocket their views."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* JSON-LD Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        
        {/* INTERNAL LINKING NAV */}
        <nav className="mb-8 flex flex-wrap gap-4 text-sm font-semibold text-blue-600" aria-label="Internal Navigation">
          <Link href="/tools" className="hover:text-blue-800 hover:underline transition">SEO Tools</Link>
          <span className="text-gray-300">|</span>
          <Link href="/pricing" className="hover:text-blue-800 hover:underline transition">Pricing</Link>
          <span className="text-gray-300">|</span>
          <Link href="/dashboard" className="hover:text-blue-800 hover:underline transition">Dashboard</Link>
          <span className="text-gray-300">|</span>
          <Link href="/blog" className="hover:text-blue-800 hover:underline transition">Growth Blog</Link>
        </nav>

        {/* HERO SECTION / UI TOOL */}
        <header className="mb-12 text-center">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-4 shadow-sm border border-blue-200">
            Trusted by 10,000+ creators 🔥
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-gray-900">
            Free <span className="text-red-600">YouTube Title Generator</span> for Gaming Videos
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Generate viral, high-CTR titles instantly. Stop guessing and let AI craft the perfect hook for your gameplay videos.
          </p>
        </header>

        {/* =========================================
            TOOL UI SECTION (INTERACTIVE)
        ========================================= */}
        <section className="tool-ui relative z-10 bg-white border border-gray-200 rounded-2xl p-6 md:p-10 mb-16 shadow-xl">
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 mb-2">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-grow p-4 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition text-lg" 
              placeholder="Enter game & topic (e.g., BGMI Rush Gameplay)" 
              required
            />
            <button 
              type="submit" 
              disabled={isGenerating || !topic.trim()}
              className="bg-red-600 disabled:bg-gray-400 text-white font-extrabold px-8 py-4 rounded-xl hover:bg-red-700 transition shadow-md flex justify-center items-center gap-2 whitespace-nowrap text-lg"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/ల్ల" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                  </svg>
                  Generating...
                </>
              ) : "Generate Titles 🚀"}
            </button>
          </form>
          
          {/* Output Results Window */}
          <div className={`mt-8 transition-opacity duration-500 ${results.length > 0 ? "opacity-100" : "opacity-0 hidden"}`}>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">✨ Viral Title Suggestions</h3>
            <div className="grid gap-3">
              {results.map((result, idx) => (
                <div key={idx} className="group flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition cursor-copy shadow-sm">
                  <span className="font-semibold text-gray-800 text-lg group-hover:text-blue-900">{result}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="opacity-0 group-hover:opacity-100 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">Pro tip: Click copy and test the title in our Video SEO analyzer.</p>
          </div>
        </section>

        {/* =========================================
            CONTENT SECTIONS
        ========================================= */}
        <article className="prose prose-lg mx-auto max-w-4xl prose-headings:text-gray-900 prose-p:text-gray-600 mb-16">
          
          <h2>The Ultimate YouTube Title Generator for Gaming Videos</h2>
          <p>
            Welcome to the ultimate <strong>YouTube Title Generator for Gaming Videos</strong>. In the hyper-competitive gaming niche, spending 10 hours editing a perfect video means nothing if your title doesn&apos;t capture attention. A low CTR (Click-Through Rate) instantly kills your reach. Our AI-driven <em>YouTube Title Generator for Gaming Videos</em> analyzes millions of successful clips to discover the exact psychological hooks and LSI keywords (like &quot;viral titles&quot;, &quot;gaming SEO&quot;, and &quot;YouTube growth&quot;) required to hack the algorithm.
          </p>
          <p>
            Chahe aap Minecraft ka hardcore survival khelo ya BGMI mein insane clutch dikhao, crafting an emotional, click-worthy hook is the only way to grow. Our tool mixes Hinglish engagement and proper English to craft titles perfectly weighted for maximum YouTube growth.
          </p>

          <h2>Key Features</h2>
          <ul>
            <li><strong>AI-Powered Titles:</strong> Generates hyper-clickable phrasing backed by current gaming trends.</li>
            <li><strong>SEO Optimized:</strong> Implants heavily searched gaming SEO terms naturally so YouTube knows exactly who to show your video to.</li>
            <li><strong>High CTR Focused:</strong> Focuses on curiosity, authority, or shock value to legally hook the viewer.</li>
            <li><strong>Niche-Based Suggestions:</strong> Adapts output specifically whether you input &quot;Roblox&quot;, &quot;Valorant&quot;, &quot;GTA 5&quot;, or &quot;Free Fire&quot;.</li>
          </ul>

          <h2>How It Works (3 Simple Steps)</h2>
          <ol>
            <li><strong>Input Your Context:</strong> Type in your specific game and video topic into the generator box above.</li>
            <li><strong>Generate:</strong> Our <em>YouTube Title Generator for Gaming Videos</em> processes massive datasets of viral titles in seconds.</li>
            <li><strong>Copy & Dominate:</strong> Pick the best variation, drop it into your YouTube Studio, and watch your channel scale!</li>
          </ol>

          <h2>Core Benefits</h2>
          <ul>
            <li><strong>More Views Instantly:</strong> Even a 2% CTR increase fundamentally snowballs your algorithmic reach.</li>
            <li><strong>Higher Search Ranking:</strong> Naturally outrank competitors for long-tail keywords.</li>
            <li><strong>Faster Channel Growth:</strong> Save hours agonizing over meta-data and push more time into creating actual gaming content.</li>
          </ul>

          <h2>Use Cases</h2>
          <ul>
            <li><strong>Aspiring YouTubers:</strong> Get early traction even with zero subscribers by optimizing for exact search intent.</li>
            <li><strong>Streamers & eSports Players:</strong> Turn raw, unedited stream VODs into highly clickable highlight reels.</li>
            <li><strong>Indian Creators:</strong> Seamlessly weave local Hinglish slang into English titles to secure the domestic algorithm.</li>
          </ul>

        </article>

        {/* =========================================
            FAQ SECTION
        ========================================= */}
        <section className="faq max-w-4xl mx-auto mb-20 bg-white p-8 md:p-12 border border-gray-100 rounded-2xl shadow-sm">
          <h2 className="text-3xl font-extrabold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-bold text-xl mb-2 text-gray-900">1. Is this YouTube Title Generator for Gaming Videos free?</h3>
              <p className="text-gray-600">Yes! Our essential title tool is completely free. We also offer advanced bulk generation and deep gaming SEO analytics via our <Link href="/pricing" className="text-blue-600 hover:underline">pricing page</Link>.</p>
            </div>
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-bold text-xl mb-2 text-gray-900">2. Does a title really impact gaming optimization?</h3>
              <p className="text-gray-600">Absolutely. The YouTube algorithm relies heavily on CTR and audience retention. If your title fails to hook viewers, your video won&apos;t get suggested alongside related viral gaming videos.</p>
            </div>
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-bold text-xl mb-2 text-gray-900">3. Will this tool boost my YouTube growth?</h3>
              <p className="text-gray-600">Yes. The <em>YouTube Title Generator for Gaming Videos</em> naturally embeds high-value LSI keywords (e.g., &quot;viral titles&quot;, &quot;best settings&quot;) that instantly signal relevance to the search engine.</p>
            </div>
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-bold text-xl mb-2 text-gray-900">4. Can I add local Hinglish slang?</h3>
              <p className="text-gray-600">Yes, the AI detects Hinglish context perfectly! Input queries like &quot;BGMI gameplay rush bhai&quot; to receive titles designed explicitly for the Indian market.</p>
            </div>
            <div className="pb-2">
              <h3 className="font-bold text-xl mb-2 text-gray-900">5. What else do I need for success?</h3>
              <p className="text-gray-600">A great title needs an amazing thumbnail! Use this tool in combination with our thumbnail analyzers in your <Link href="/dashboard" className="text-blue-600 hover:underline">main dashboard</Link>.</p>
            </div>
          </div>
        </section>

        {/* =========================================
            STRONG CTA SECTION (CONVERSION BLOCK)
        ========================================= */}
        <section className="cta text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Start generating viral YouTube titles now 🚀</h2>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Stop guessing what the YouTube algorithm wants. Build a massive audience, skyrocket your CTR, and dominate the gaming niche today.
            </p>
            <Link href="/dashboard" className="bg-red-600 text-white text-xl md:text-2xl font-extrabold px-12 py-5 rounded-full hover:bg-red-500 hover:scale-105 transition-all duration-300 inline-block shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              Try Pro Dashboard →
            </Link>
            <div className="mt-8 flex justify-center items-center gap-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">✅ No Credit Card Required</span>
              <span>•</span>
              <span className="flex items-center gap-1">✅ Trusted by 10,000+ creators</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
