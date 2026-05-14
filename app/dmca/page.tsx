import { Metadata } from 'next';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

export const metadata: Metadata = {
  title: 'DMCA & Copyright Policy',
  description:
    'How to file a DMCA takedown notice or counter-notice with Vid YT (Kvl Business Solutions).',
  alternates: { canonical: '/dmca' },
  robots: { index: true, follow: true },
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans">
      <MarketingNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-4xl font-bold mb-4">DMCA &amp; Copyright Policy</h1>
        <p className="text-[#888] mb-10">Last updated: 14 May 2026</p>

        <section className="space-y-4 text-[#CCCCCC] leading-relaxed">
          <p>
            <strong>Vid YT</strong>, operated by <strong>Kvl Business Solutions</strong>, respects the
            intellectual-property rights of others and expects users of the Service to do the same. We
            respond to clear and complete notices of alleged copyright infringement in accordance with
            the United States Digital Millennium Copyright Act (&ldquo;DMCA&rdquo;), the Indian Information
            Technology Act, 2000 read with the IT (Intermediary Guidelines and Digital Media Ethics
            Code) Rules, 2021, and analogous safe-harbour regimes in other jurisdictions.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">1. Filing a Takedown Notice</h2>
          <p className="text-[#CCCCCC] leading-relaxed mb-3">
            If you believe content accessible through Vid YT infringes a copyright you own or
            control, send a written notice to our designated agent that contains all of the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] leading-relaxed">
            <li>A physical or electronic signature of the copyright owner or an authorized agent.</li>
            <li>Identification of the copyrighted work claimed to be infringed.</li>
            <li>
              Identification of the material that is alleged to be infringing and the URL on
              vidyt.com or in our Service where it is located, with enough detail for us to locate it.
            </li>
            <li>Your full name, mailing address, telephone number, and email address.</li>
            <li>
              A statement that you have a good-faith belief that the disputed use is not authorized by
              the copyright owner, its agent, or the law.
            </li>
            <li>
              A statement, made under penalty of perjury, that the information in the notice is
              accurate and that you are the copyright owner or authorized to act on the owner&apos;s behalf.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">2. Designated Agent</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            Send the notice to our designated agent:
          </p>
          <div className="mt-3 p-4 rounded-lg bg-[#141414] border border-[#222] text-[#CCCCCC] leading-relaxed">
            <p><strong>Copyright Agent — Vid YT</strong></p>
            <p>Kvl Business Solutions</p>
            <p>
              Email:{' '}
              <a href="mailto:dmca@vidyt.com" className="text-[#FF0000] hover:underline">
                dmca@vidyt.com
              </a>
            </p>
            <p>
              Support:{' '}
              <Link href="/contact" className="text-[#FF0000] hover:underline">
                vidyt.com/contact
              </Link>
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">3. Counter-Notice</h2>
          <p className="text-[#CCCCCC] leading-relaxed mb-3">
            If your content was removed and you believe the removal was the result of mistake or
            misidentification, you may submit a counter-notice that includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] leading-relaxed">
            <li>Your physical or electronic signature.</li>
            <li>Identification of the material that was removed and its previous location.</li>
            <li>
              A statement under penalty of perjury that you have a good-faith belief the material was
              removed by mistake or misidentification.
            </li>
            <li>
              Your name, address, phone number, and consent to the jurisdiction of the appropriate
              federal court (or, if outside the U.S., the courts of New Delhi, India), and a
              statement that you will accept service of process from the original complainant.
            </li>
          </ul>
          <p className="text-[#CCCCCC] leading-relaxed mt-3">
            On receipt of a valid counter-notice we will forward it to the original complainant.
            Unless they file suit within ten business days we may restore the disputed material.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">4. Repeat-Infringer Policy</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            Accounts that are the subject of repeated, valid takedown notices will be suspended or
            terminated in accordance with our{' '}
            <Link href="/terms" className="text-[#FF0000] hover:underline">Terms of Service</Link>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">5. Bad-Faith Notices</h2>
          <p className="text-[#CCCCCC] leading-relaxed">
            Under 17 U.S.C. §512(f) and equivalent provisions in other jurisdictions, any person who
            knowingly materially misrepresents that content is infringing may be liable for damages,
            including costs and attorneys&apos; fees. Please consider these consequences before sending
            a notice.
          </p>
        </section>

        <section className="mt-10">
          <p className="text-[#888] text-sm">
            See also our{' '}
            <Link href="/terms" className="text-[#FF0000] hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="text-[#FF0000] hover:underline">Privacy Policy</Link>.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
