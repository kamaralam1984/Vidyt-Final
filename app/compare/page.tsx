'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceYearly?: number;
  features: string[];
  popular?: boolean;
  description?: string;
}

type Row = { label: string; values: (boolean | string)[] };

function buildRows(plans: Plan[]): Row[] {
  // Union of every feature string across plans → each becomes a row.
  const all = new Set<string>();
  plans.forEach((p) => p.features?.forEach((f) => all.add(f)));
  return Array.from(all).map((f) => ({
    label: f,
    values: plans.map((p) => !!p.features?.includes(f)),
  }));
}

export default function ComparePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<'month' | 'year'>('month');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/subscriptions/plans?withDiscounts=1', { cache: 'no-store' });
        const d = await r.json();
        setPlans(d.plans || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = buildRows(plans);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-sm text-[#AAAAAA] hover:text-white">&larr; Home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Compare plans</h1>
        <p className="text-[#AAAAAA] mb-8">Side-by-side breakdown of every Vidyt tier.</p>

        <div className="inline-flex items-center gap-2 bg-[#181818] border border-[#212121] rounded-lg p-1 mb-8">
          {(['month', 'year'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-4 py-1.5 text-sm rounded-md ${billing === b ? 'bg-[#FF0000]' : 'text-[#AAAAAA] hover:text-white'}`}
            >
              {b === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#AAAAAA]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
          </div>
        ) : plans.length === 0 ? (
          <p className="text-[#AAAAAA]">No plans configured.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#212121]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#181818]">
                  <th className="text-left p-4 font-medium text-[#AAAAAA]">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="p-4 min-w-[160px]">
                      <div className="text-lg font-semibold">{p.name}</div>
                      <div className="text-sm text-[#AAAAAA]">
                        ${(billing === 'year' ? (p.priceYearly ?? p.price * 10) : p.price).toFixed(2)}/{billing}
                      </div>
                      <Link
                        href={`/auth?mode=signup&plan=${p.id}&billing=${billing}`}
                        className={`inline-block mt-2 px-3 py-1 rounded text-sm ${p.popular ? 'bg-[#FF0000] hover:bg-[#CC0000]' : 'bg-[#212121] hover:bg-[#2a2a2a]'}`}
                      >
                        Choose
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-[#0F0F0F]' : 'bg-[#141414]'}>
                    <td className="p-3 text-sm text-[#CCCCCC]">{row.label}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="p-3 text-center">
                        {v === true ? (
                          <Check className="w-4 h-4 text-green-400 mx-auto" />
                        ) : v === false ? (
                          <Minus className="w-4 h-4 text-[#555] mx-auto" />
                        ) : (
                          <span className="text-sm">{String(v)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
