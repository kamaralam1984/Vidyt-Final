/**
 * DashboardSkeleton — shown while Dashboard.tsx loads (dynamic import).
 * Matches the real layout shape so there's no layout shift on hydration.
 */
export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#181818] rounded-2xl h-24 border border-[#212121]" />
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — wide */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#181818] rounded-2xl h-48 border border-[#212121]" />
          <div className="bg-[#181818] rounded-2xl h-32 border border-[#212121]" />
          <div className="bg-[#181818] rounded-2xl h-32 border border-[#212121]" />
        </div>

        {/* Right panel — sidebar */}
        <div className="space-y-4">
          <div className="bg-[#181818] rounded-2xl h-40 border border-[#212121]" />
          <div className="bg-[#181818] rounded-2xl h-40 border border-[#212121]" />
        </div>
      </div>
    </div>
  );
}
