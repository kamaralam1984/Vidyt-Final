'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

const NAVBAR_HEIGHT = 56;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        topOffset={NAVBAR_HEIGHT}
      />
      <main
        className="flex-1 overflow-y-auto transition-all duration-300 min-h-screen"
        style={{
          paddingTop: NAVBAR_HEIGHT,
          marginLeft: sidebarOpen ? 256 : 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
