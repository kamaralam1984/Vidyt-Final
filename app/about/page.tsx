import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

export const metadata = {
  title: 'About | Vid YT',
  description: 'Learn about Vid YT and our mission to provide AI-powered growth tools for YouTube creators. Operated by Kvl Business Solutions.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16 mt-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About <span className="text-[#FF0000]">Vid YT</span></h1>
          <div className="flex items-center justify-center gap-4 text-sm text-[#888888] mb-6">
            <span>Version: 1.0</span>
            <span>Last Updated: April 5, 2026</span>
          </div>
          <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
            The AI-powered growth platform built specifically for ambitious YouTube creators.
          </p>
        </div>

        <div className="space-y-16">
          <section className="bg-[#181818] border border-[#212121] rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">The Problem We Solve</h2>
            <p className="text-lg text-[#AAAAAA] leading-relaxed mb-6">
              Growing a YouTube channel has become incredibly complex. Creators spend hours making amazing videos, only to see them flatline because the title wasn&apos;t compelling, the thumbnail didn&apos;t stand out, or the timing was wrong. 
            </p>
            <p className="text-lg text-[#AAAAAA] leading-relaxed">
              We asked ourselves: <em className="text-white">What if creators could predict the performance of their videos before publishing?</em>
            </p>
          </section>

          <section className="bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF0000]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <h2 className="text-3xl font-bold mb-6 text-white relative z-10">Our Solution</h2>
            <p className="text-lg text-[#EAEAEA] leading-relaxed relative z-10">
              Vid YT is an AI-powered growth ecosystem that takes the guesswork out of video optimization. By analyzing millions of data points across YouTube, our algorithms help you optimize your titles, thumbnails, descriptions, and hashtags for maximum click-through rates and retention.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-[#FF0000]">Our Mission</h3>
              <p className="text-[#AAAAAA] leading-relaxed">
                To provide creators with predictable growth. We want to empower every creator, regardless of their size, with enterprise-grade analytics and AI tools to succeed on YouTube.
              </p>
            </section>
            
            <section className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-[#FF0000]">Our Vision</h3>
              <p className="text-[#AAAAAA] leading-relaxed">
                To become the ultimate AI-powered growth ecosystem for content creators worldwide, building tools that adapt dynamically to algorithm changes.
              </p>
            </section>
          </div>

          <section className="text-center py-12 border-t border-[#212121]">
            <h2 className="text-3xl font-bold mb-6">Built for Creators</h2>
            <p className="text-lg text-[#AAAAAA] max-w-3xl mx-auto mb-8">
              Every feature in Vid YT is designed with a data-driven approach, aimed at saving you time and increasing your views. Join a growing community of creators transforming their workflow.
            </p>
            
            <p className="text-[#888888] text-sm">
              Vid YT is proudly operated by <strong>Kvl Business Solutions</strong>, India.
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
