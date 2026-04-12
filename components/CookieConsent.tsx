'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

function getStoredConsent(): string | null {
  try {
    return window.localStorage.getItem('cookieConsent');
  } catch {
    return null;
  }
}

function setStoredConsent(value: string): void {
  try {
    window.localStorage.setItem('cookieConsent', value);
  } catch {
    // If storage is blocked, do not crash UI.
  }
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = getStoredConsent();
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    setStoredConsent(JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      analytics: true,
      marketing: true,
      functional: true,
    }));
    setShowBanner(false);
  };

  const handleReject = () => {
    setStoredConsent(JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
      analytics: false,
      marketing: false,
      functional: true, // Functional cookies are always required
    }));
    setShowBanner(false);
  };

  const handleSavePreferences = (prefs: { analytics: boolean; marketing: boolean }) => {
    setStoredConsent(JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      functional: true,
    }));
    setShowBanner(false);
    setShowPreferences(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto bg-[#181818] border border-[#212121] rounded-2xl shadow-2xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[#FF0000]/20 rounded-lg flex-shrink-0">
                <Cookie className="w-6 h-6 text-[#FF0000]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-2">
                  We Use Cookies
                </h3>
                <p className="text-sm text-[#AAAAAA] leading-relaxed">
                  We use cookies and similar technologies to improve your experience, analyze how our site is used, and for marketing purposes. By clicking &quot;Accept,&quot; you consent to our use of cookies.
                </p>
                <p className="text-xs text-[#888] mt-2">
                  Learn more about our{' '}
                  <Link href="/privacy-policy" className="text-[#FF0000] hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
              <button
                onClick={handleReject}
                className="text-[#888] hover:text-white transition p-1 flex-shrink-0"
                aria-label="Close cookie banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handleReject}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 border border-[#333333] rounded-lg text-white hover:bg-[#212121] transition font-medium text-sm"
              >
                Reject All
              </motion.button>

              <motion.button
                onClick={() => setShowPreferences(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 border border-[#FF0000] text-[#FF0000] rounded-lg hover:bg-[#FF0000]/10 transition font-medium text-sm"
              >
                Preferences
              </motion.button>

              <motion.button
                onClick={handleAccept}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition font-semibold text-sm"
              >
                Accept All
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <CookiePreferences
          onSave={handleSavePreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </AnimatePresence>
  );
}

function CookiePreferences({
  onSave,
  onClose,
}: {
  onSave: (prefs: { analytics: boolean; marketing: boolean }) => void;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[51] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] border border-[#212121] rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Cookie Preferences</h3>

        {/* Functional (Always On) */}
        <div className="mb-6 pb-6 border-b border-[#333333]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white font-medium">Functional Cookies</label>
            <div className="w-10 h-6 bg-[#FF0000] rounded-full flex items-center justify-end pr-1">
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="text-xs text-[#888]">
            Essential for site functionality (always enabled)
          </p>
        </div>

        {/* Analytics */}
        <div className="mb-6 pb-6 border-b border-[#333333]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white font-medium">Analytics</label>
            <button
              onClick={() => setAnalytics(!analytics)}
              className={`w-10 h-6 rounded-full flex items-center transition ${
                analytics ? 'bg-[#FF0000] justify-end pr-1' : 'bg-[#333333] justify-start pl-1'
              }`}
            >
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </button>
          </div>
          <p className="text-xs text-[#888]">
            Help us improve by allowing us to analyze usage patterns
          </p>
        </div>

        {/* Marketing */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white font-medium">Marketing</label>
            <button
              onClick={() => setMarketing(!marketing)}
              className={`w-10 h-6 rounded-full flex items-center transition ${
                marketing ? 'bg-[#FF0000] justify-end pr-1' : 'bg-[#333333] justify-start pl-1'
              }`}
            >
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </button>
          </div>
          <p className="text-xs text-[#888]">
            Personalized ads and content recommendations
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-2.5 border border-[#333333] rounded-lg text-white hover:bg-[#212121] transition font-medium text-sm"
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={() => onSave({ analytics, marketing })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-2.5 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition font-semibold text-sm"
          >
            Save Preferences
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
