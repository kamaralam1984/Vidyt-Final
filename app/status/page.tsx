'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

type Check = { name: string; url: string; description: string };

const CHECKS: Check[] = [
  { name: 'API', url: '/api/subscriptions/plans?withDiscounts=0', description: 'Public plans API' },
  { name: 'Database', url: '/api/health/db', description: 'MongoDB connectivity' },
  { name: 'Auth', url: '/api/auth/me', description: 'Token verification endpoint' },
];

type Result = { ok: boolean; status: number; ms: number };

function Badge({ r }: { r: Result | null }) {
  if (!r) return <span className="text-[#AAAAAA] text-sm">checking…</span>;
  // 401 on /auth/me counts as "up" — the server responded.
  const isUp = r.ok || (r.status >= 200 && r.status < 500);
  if (isUp) {
    return (
      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
        <CheckCircle2 className="w-4 h-4" /> Operational
      </span>
    );
  }
  if (r.status >= 500) {
    return (
      <span className="inline-flex items-center gap-1 text-red-400 text-sm">
        <XCircle className="w-4 h-4" /> Down
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-yellow-400 text-sm">
      <AlertTriangle className="w-4 h-4" /> Degraded
    </span>
  );
}

export default function StatusPage() {
  const [results, setResults] = useState<Record<string, Result | null>>({});

  const run = async () => {
    setResults(Object.fromEntries(CHECKS.map((c) => [c.name, null])));
    await Promise.all(
      CHECKS.map(async (c) => {
        const started = performance.now();
        try {
          const r = await fetch(c.url, { cache: 'no-store' });
          const ms = Math.round(performance.now() - started);
          setResults((prev) => ({ ...prev, [c.name]: { ok: r.ok, status: r.status, ms } }));
        } catch {
          const ms = Math.round(performance.now() - started);
          setResults((prev) => ({ ...prev, [c.name]: { ok: false, status: 0, ms } }));
        }
      }),
    );
  };

  useEffect(() => {
    void run();
    const id = setInterval(() => void run(), 30_000);
    return () => clearInterval(id);
  }, []);

  const allUp = CHECKS.every((c) => {
    const r = results[c.name];
    return r && (r.ok || (r.status >= 200 && r.status < 500));
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-[#AAAAAA] hover:text-white">&larr; Home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">System Status</h1>
        <p className="text-[#AAAAAA] mb-8">Live health of Vidyt&apos;s public services. Refreshes every 30s.</p>

        <div className={`p-5 rounded-xl border mb-6 ${allUp ? 'bg-green-500/10 border-green-500/40' : 'bg-yellow-500/10 border-yellow-500/40'}`}>
          <p className="font-semibold flex items-center gap-2">
            {allUp ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-yellow-400" />}
            {allUp ? 'All systems operational' : 'Some services are degraded'}
          </p>
        </div>

        <div className="bg-[#181818] border border-[#212121] rounded-xl divide-y divide-[#212121]">
          {CHECKS.map((c) => {
            const r = results[c.name];
            return (
              <div key={c.name} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-[#AAAAAA]">{c.description}</p>
                </div>
                <div className="text-right">
                  <Badge r={r} />
                  {r && <p className="text-xs text-[#AAAAAA] mt-1">{r.ms} ms · HTTP {r.status || '—'}</p>}
                  {!r && <Loader2 className="w-4 h-4 animate-spin text-[#AAAAAA] ml-auto mt-1" />}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#555] mt-6">
          Incidents and historical uptime are tracked internally — contact support for an SLA report.
        </p>
      </div>
    </div>
  );
}
