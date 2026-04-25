'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FAQItem = { q: string; a: string };
type FAQGroup = { category: string; items: FAQItem[] };

export default function FAQAccordion({ groups }: { groups: FAQGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.category}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#FF0000] mb-4">
            {group.category}
          </h2>
          <div className="space-y-3">
            {group.items.map((item, idx) => {
              const key = `${group.category}-${idx}`;
              const isOpen = open === key;
              return (
                <div
                  key={key}
                  className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden hover:border-[#FF0000]/30 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="w-full flex justify-between items-center gap-4 text-left px-6 py-5"
                  >
                    <span className="text-lg font-semibold text-white">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-[#AAAAAA] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-[#CCCCCC] leading-relaxed">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
