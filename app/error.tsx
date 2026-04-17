'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#0F0F0F]">
      <div className="w-16 h-16 rounded-2xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-[#FF0000]" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-[#AAAAAA] text-sm mb-8 max-w-sm">
        An unexpected error occurred. Our team has been notified. Please try again or return to the homepage.
      </p>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre className="text-xs text-[#FF6B6B] bg-[#181818] border border-[#212121] rounded-xl p-4 mb-6 max-w-lg overflow-auto text-left">
          {error.message}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white rounded-xl text-sm font-semibold hover:bg-[#CC0000] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#181818] border border-[#212121] text-[#AAAAAA] rounded-xl text-sm font-semibold hover:text-white hover:bg-[#212121] transition"
        >
          <Home className="w-4 h-4" />
          Homepage
        </Link>
      </div>
    </div>
  );
}
