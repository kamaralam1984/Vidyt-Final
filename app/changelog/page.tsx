import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — Vidyt',
  description: 'Recent product updates, features, and fixes.',
};

type Release = {
  version: string;
  date: string;
  tag?: 'feature' | 'security' | 'fix' | 'improvement';
  items: string[];
};

const RELEASES: Release[] = [
  {
    version: '1.6.0',
    date: '2026-04-22',
    tag: 'feature',
    items: [
      'Two-factor authentication (TOTP) with backup codes and a /dashboard/security page.',
      'Cloudflare Turnstile on login and signup forms.',
      'Multi-step onboarding wizard for new accounts.',
      'Dockerfile + docker-compose for reproducible deploys.',
      'Dependabot enabled for npm, GitHub Actions, and Docker updates.',
    ],
  },
  {
    version: '1.5.1',
    date: '2026-04-10',
    tag: 'security',
    items: [
      'Restored CSP directives, tightened CORS rules.',
      'Fixed Google OAuth redirect flow and auth header handling.',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-03-28',
    tag: 'improvement',
    items: [
      'API rate limiting completed on public endpoints.',
      'Cloudflare CDN + WAF integration hardened.',
    ],
  },
];

const TAG_STYLES: Record<NonNullable<Release['tag']>, string> = {
  feature: 'bg-[#FF0000]/20 text-[#FF6B6B] border-[#FF0000]/40',
  security: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  fix: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  improvement: 'bg-green-500/20 text-green-300 border-green-500/40',
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-[#AAAAAA] hover:text-white">&larr; Home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Changelog</h1>
        <p className="text-[#AAAAAA] mb-10">What&apos;s new in Vidyt. The latest release is at the top.</p>

        <ol className="space-y-8">
          {RELEASES.map((r) => (
            <li key={r.version} className="bg-[#181818] border border-[#212121] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-2xl font-semibold">v{r.version}</h2>
                <time className="text-sm text-[#AAAAAA]" dateTime={r.date}>{r.date}</time>
                {r.tag && (
                  <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded border ${TAG_STYLES[r.tag]}`}>
                    {r.tag}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {r.items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-[#CCCCCC]">
                    <span aria-hidden className="text-[#FF0000]">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
