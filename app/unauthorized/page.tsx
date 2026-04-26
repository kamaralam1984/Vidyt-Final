'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldOff,
  RefreshCw,
  Home,
  LogIn,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Cookie,
  Settings,
  Info,
} from 'lucide-react';

export default function UnauthorizedPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [returnUrl, setReturnUrl] = useState('');

  useEffect(() => {
    // Capture the page the user came from so we can redirect back after login
    const ref = document.referrer;
    if (ref && !ref.includes('/login') && !ref.includes('/auth') && !ref.includes('/unauthorized')) {
      setReturnUrl(ref);
    }
  }, []);

  const loginHref = returnUrl
    ? `/login?next=${encodeURIComponent(returnUrl)}`
    : '/login';

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">

        {/* Icon + Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <ShieldOff className="w-10 h-10 text-red-400" />
          </div>
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            401 Unauthorized
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            You&apos;re Not Logged In
          </h1>
          <p className="text-[#AAAAAA]">
            We couldn&apos;t verify your identity. Your session may have expired or you are not logged in.
          </p>
        </motion.div>

        {/* What Happened */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#181818] border border-[#212121] rounded-2xl p-6 mb-4"
        >
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            What Happened?
          </h2>
          <p className="text-[#AAAAAA] text-sm mb-3">
            Our system tried to verify your session using{' '}
            <code className="bg-[#212121] text-red-300 px-1.5 py-0.5 rounded text-xs">/api/auth/me</code>{' '}
            and{' '}
            <code className="bg-[#212121] text-red-300 px-1.5 py-0.5 rounded text-xs">/api/auth/refresh</code>,
            but both returned <strong className="text-white">401 Unauthorized</strong>.
          </p>
          <ul className="space-y-1.5 text-sm text-[#AAAAAA]">
            {[
              'Your login session is missing',
              'Your access token has expired',
              'Your authentication cookies are not being sent correctly',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Fix Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-[#181818] border border-[#212121] rounded-2xl p-6 mb-4"
        >
          <h2 className="text-white font-semibold mb-4">How to Fix This</h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] text-sm font-bold flex items-center justify-center">
                1
              </div>
              <div>
                <p className="text-white font-medium mb-1 flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#AAAAAA]" />
                  Login Again
                </p>
                <p className="text-[#AAAAAA] text-sm">
                  Click the button below to securely log in and restore your session.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#212121] border border-[#333333] text-[#AAAAAA] text-sm font-bold flex items-center justify-center">
                2
              </div>
              <div>
                <p className="text-white font-medium mb-1 flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-[#AAAAAA]" />
                  Clear Browser Cookies
                </p>
                <p className="text-[#AAAAAA] text-sm">
                  Open browser settings → Clear cookies for this site → Refresh the page.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#212121] border border-[#333333] text-[#AAAAAA] text-sm font-bold flex items-center justify-center">
                3
              </div>
              <div>
                <p className="text-white font-medium mb-1 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#AAAAAA]" />
                  Check Browser Settings
                </p>
                <p className="text-[#AAAAAA] text-sm">
                  Make sure cookies are enabled and you&apos;re not using a strict privacy or ad-blocking
                  extension that blocks authentication.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <Link
            href={loginHref}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold rounded-xl transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Login Now
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[#181818] hover:bg-[#212121] border border-[#333333] text-white font-semibold rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
        </motion.div>

        {/* Debug Info (collapsible) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setShowDebug((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-left text-[#AAAAAA] hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4" />
              Developer Debug Info
            </span>
            {showDebug ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDebug && (
            <div className="border-t border-[#212121] p-4">
              <div className="font-mono text-xs space-y-2">
                <div className="flex gap-3">
                  <span className="text-[#AAAAAA] w-32 flex-shrink-0">Status Code</span>
                  <span className="text-red-400 font-semibold">401 Unauthorized</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#AAAAAA] w-32 flex-shrink-0">Endpoints</span>
                  <span className="text-white">/api/auth/me, /api/auth/refresh</span>
                </div>
                <div className="pt-2 border-t border-[#212121]">
                  <p className="text-[#AAAAAA] mb-2">Possible Causes:</p>
                  <ul className="space-y-1 text-[#888888]">
                    {[
                      'Missing Authorization header',
                      'JWT token expired',
                      'Refresh token invalid or revoked',
                      'credentials: include missing in fetch call',
                      'Cookie misconfiguration (SameSite / Secure flags)',
                    ].map((cause) => (
                      <li key={cause} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">→</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#555555] mt-6">
          Protected resource &mdash; Please authenticate to continue.{' '}
          <Link href="/support" className="hover:text-[#AAAAAA] underline underline-offset-2">
            Contact support
          </Link>{' '}
          if this issue persists.
        </p>

      </div>
    </div>
  );
}
