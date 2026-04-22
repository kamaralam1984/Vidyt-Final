'use client';

import { useState, useEffect } from 'react';
import { LazyMotion, domAnimation, m as motion, AnimatePresence } from 'framer-motion';
import { Globe, X } from 'lucide-react';
import { useLocale, SUPPORTED_LOCALES, type LocaleState } from '@/context/LocaleContext';

const POPUP_DISMISSED_KEY = 'vidyt-country-popup-dismissed';

export default function CountrySelectPopup() {
  const { locale, setLocale } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
    const hasManualChoice = localStorage.getItem('viralboost-locale');
    if (dismissed || hasManualChoice) return;

    // Show popup after 1.5s if no country was auto-detected
    const timer = setTimeout(() => {
      const cookie = document.cookie.match(/detected-country=([^;]*)/);
      if (!cookie) setShow(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const selectCountry = (loc: LocaleState) => {
    setLocale(loc);
    localStorage.setItem(POPUP_DISMISSED_KEY, '1');
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem(POPUP_DISMISSED_KEY, '1');
    setShow(false);
  };

  return (
    <LazyMotion features={domAnimation} strict>
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#181818] border border-[#333] rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
          >
            <button onClick={dismiss} className="absolute top-4 right-4 text-[#666] hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#FF0000]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Select Your Country</h2>
                <p className="text-xs text-[#888]">Content will be shown in your language</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {SUPPORTED_LOCALES.filter(l => !l.countryCode.includes('-')).map((loc) => (
                <button
                  key={loc.countryCode}
                  onClick={() => selectCountry(loc)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-left transition hover:bg-[#FF0000]/10 border ${
                    locale.countryCode === loc.countryCode
                      ? 'border-[#FF0000]/50 bg-[#FF0000]/10'
                      : 'border-[#333] hover:border-[#FF0000]/30'
                  }`}
                >
                  <span className="text-xl">{loc.flag}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{loc.countryName}</p>
                    <p className="text-[10px] text-[#666]">{loc.language.toUpperCase()} · {loc.currencySymbol}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-[#555] mt-3 text-center">You can change this anytime from the flag icon in navbar</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
}
