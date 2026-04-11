'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import DashboardLayout from '@/components/DashboardLayout';
import ChatAssistant from '@/components/ChatAssistant';

export default function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <DashboardLayout>
      <Dashboard />
      <ChatAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </DashboardLayout>
  );
}
