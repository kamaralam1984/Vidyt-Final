'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardSkeleton from '@/components/DashboardSkeleton';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});

const ChatAssistant = dynamic(() => import('@/components/ChatAssistant'), {
  ssr: false,
});

export default function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <DashboardLayout>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
      <ChatAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </DashboardLayout>
  );
}
