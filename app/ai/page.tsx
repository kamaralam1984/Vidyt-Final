'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { FileText, Image, Zap, Film, TrendingUp, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

const tools = [
  { icon: FileText, label: 'Script Generator', href: '/ai/script-generator', desc: 'Viral hooks, full script, titles, hashtags, CTA' },
  { icon: Zap, label: 'AI Coach', href: '/ai/script-generator?mode=coach', desc: 'Channel growth coaching scripts and actionable tips' },
  { icon: Image, label: 'Thumbnail Generator', href: '/ai/thumbnail-generator', desc: 'Thumbnail text, layout, colors, CTR score' },
  { icon: Zap, label: 'Hook Generator', href: '/ai/hook-generator', desc: '10 viral hooks with psychology types' },
  { icon: Film, label: 'Shorts Creator', href: '/ai/shorts-creator', desc: 'Cut long video into 5 shorts with captions' },
  { icon: TrendingUp, label: 'YouTube Growth', href: '/tools/youtube-growth', desc: 'Channel analytics and AI insights' },
];

export default function AIStudioPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    axios.get('/api/features/ai-studio', { headers: getAuthHeaders() })
      .then((r) => setAllowed(!!r.data?.allowed))
      .catch(() => setAllowed(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">AI Studio</h1>
          <p className="text-[#AAAAAA] mb-8">Choose an AI tool to get started.</p>
          {allowed === null ? (
            <div className="flex items-center gap-2 text-[#AAAAAA]">
              <Loader2 className="w-5 h-5 animate-spin" /> Checking access...
            </div>
          ) : !allowed ? (
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 text-center">
              <p className="text-[#AAAAAA]">AI Studio access is not enabled for your role. Contact your admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <Link key={t.href} href={t.href} className="block bg-[#181818] border border-[#212121] rounded-xl p-6 hover:border-[#FF0000]/50 transition-colors">
                    <Icon className="w-8 h-8 text-[#FF0000] mb-3" />
                    <h2 className="text-lg font-semibold text-white mb-1">{t.label}</h2>
                    <p className="text-sm text-[#AAAAAA]">{t.desc}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
