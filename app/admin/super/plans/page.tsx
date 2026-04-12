'use client';

import UnifiedControlPanel from '@/components/admin/UnifiedControlPanel';

export const dynamic = 'force-dynamic';

export default function ControlsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <UnifiedControlPanel />
    </div>
  );
}
