import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { Lock, Shield, Eye, Server, Key, FileCheck, AlertTriangle, Mail } from 'lucide-react';

export const metadata = {
  title: 'Security | Vid YT',
  description: 'How VidYT protects your data — encryption, access controls, compliance, responsible disclosure, and our security Hall of Fame.',
  alternates: { canonical: 'https://www.vidyt.com/security' },
};

const pillars = [
  {
    icon: Lock,
    title: 'Encryption Everywhere',
    description:
      'TLS 1.3 for all traffic. AES-256 encryption at rest for database backups. Secrets stored in a hardened vault, never in code.',
  },
  {
    icon: Shield,
    title: 'Least-Privilege Access',
    description:
      'Role-based access control (RBAC) with five distinct roles. Admin actions are logged, time-limited, and require re-authentication.',
  },
  {
    icon: Eye,
    title: 'Continuous Monitoring',
    description:
      'Sentry error tracking, Cloudflare WAF, automated intrusion detection, and 24/7 uptime monitoring with on-call rotation.',
  },
  {
    icon: Server,
    title: 'Hardened Infrastructure',
    description:
      'Private VPCs, firewall-whitelisted database access, immutable deploys via PM2, daily encrypted backups retained for 30 days.',
  },
  {
    icon: Key,
    title: 'Strong Authentication',
    description:
      'Bcrypt password hashing, short-lived JWTs with rotating refresh tokens, optional TOTP 2FA, and brute-force lockouts.',
  },
  {
    icon: FileCheck,
    title: 'Privacy by Design',
    description:
      'GDPR-ready data export and deletion, minimal data collection, and clear retention policies. Third-party sub-processors are audited annually.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#AAAAAA] font-sans selection:bg-[#FF0000]/30 selection:text-white">
      <MarketingNavbar />

      <main className="max-w-5xl mx-auto px-6 py-24 min-h-[80vh]">
        <div className="mb-16 text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-full px-4 py-1.5 text-xs font-semibold text-[#FF0000] mb-6">
            <Shield className="w-3.5 h-3.5" /> Trust &amp; Security
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Security at <span className="text-[#FF0000]">Vid YT</span>
          </h1>
          <p className="text-xl text-[#AAAAAA] max-w-3xl mx-auto">
            We protect the work creators trust us with. Here&apos;s how.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-[#181818] border border-[#212121] rounded-2xl p-6 hover:border-[#FF0000]/30 transition-colors"
              >
                <div className="w-12 h-12 bg-[#FF0000]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#FF0000]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{p.title}</h2>
                <p className="text-[#AAAAAA] leading-relaxed text-sm">{p.description}</p>
              </div>
            );
          })}
        </div>

        <section className="bg-gradient-to-br from-[#181818] to-[#111] border border-[#212121] rounded-2xl p-8 md:p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-[#FF0000]/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#FF0000]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Responsible Disclosure</h2>
              <p className="text-[#AAAAAA]">
                Found a vulnerability? Please report it to{' '}
                <a href="mailto:security@vidyt.com" className="text-[#FF0000] hover:underline">
                  security@vidyt.com
                </a>{' '}
                before any public disclosure. We acknowledge within 48 hours and patch
                critical issues within 14 days.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-[#0F0F0F] rounded-xl p-4 border border-[#212121]">
              <div className="text-[#888] uppercase text-xs tracking-wider mb-1">Acknowledge</div>
              <div className="text-white font-semibold">48 hours</div>
            </div>
            <div className="bg-[#0F0F0F] rounded-xl p-4 border border-[#212121]">
              <div className="text-[#888] uppercase text-xs tracking-wider mb-1">Critical Fix</div>
              <div className="text-white font-semibold">14 days</div>
            </div>
            <div className="bg-[#0F0F0F] rounded-xl p-4 border border-[#212121]">
              <div className="text-[#888] uppercase text-xs tracking-wider mb-1">Disclosure</div>
              <div className="text-white font-semibold">Coordinated</div>
            </div>
          </div>
          <div className="mt-6 text-sm text-[#888]">
            Our full policy: <a className="underline" href="/.well-known/security.txt">/.well-known/security.txt</a>
          </div>
        </section>

        <section id="hall-of-fame" className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-3">Hall of Fame</h2>
          <p className="text-[#AAAAAA] mb-6">
            Researchers who have helped make VidYT safer. Thank you.
          </p>
          <p className="text-[#666] italic text-sm">
            Be the first. Submit a valid report to{' '}
            <a href="mailto:security@vidyt.com" className="text-[#FF0000] hover:underline inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> security@vidyt.com
            </a>
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
