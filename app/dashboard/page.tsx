'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/DashboardLayout';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 text-[#717171] text-sm animate-pulse">
      Loading dashboard…
    </div>
  ),
  ssr: false,
});

const ChatAssistant = dynamic(() => import('@/components/ChatAssistant'), {
  ssr: false,
});

export default function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
      <ChatAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </DashboardLayout>
  );
}
