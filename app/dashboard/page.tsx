'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Dashboard from '@/components/Dashboard';
import DashboardLayout from '@/components/DashboardLayout';
import ChatAssistant from '@/components/ChatAssistant';

export default function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <AuthGuard>
      <DashboardLayout>
        <Dashboard />
        <ChatAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </DashboardLayout>
    </AuthGuard>
  );
}
