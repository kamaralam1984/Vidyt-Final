'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalLimitHandler() {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);
  const [showNearLimitBanner, setShowNearLimitBanner] = useState(false);
  const [showFreeUpsell, setShowFreeUpsell] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Check if the plan is expired on mount
    const checkExpiry = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const [meRes, usageRes] = await Promise.all([
          axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/user/usage', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ]);

        const user = meRes.data?.user;
        if (user) {
           const subPlan = user.subscriptionPlan;
           if (subPlan?.status === 'expired') {
               setShowExpiredBanner(true);
           }
           if (user.subscription === 'free') {
               setShowFreeUpsell(true);
           }

           const va = usageRes?.data?.usage?.videoAnalysis;
           if (va && va.limit > 0 && va.limit < Number.MAX_SAFE_INTEGER) {
             const percent = (va.used / va.limit) * 100;
             if (percent >= 80 && percent < 100) {
               setShowNearLimitBanner(true);
             }
           }
        }
      } catch(e) {}
    }
    checkExpiry();

    // Attach Axios Interceptor globally
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const errData = error?.response?.data;
        if (error.response?.status === 403 && (errData?.error?.includes('limit') || errData?.message?.includes('limit'))) {
          setShowLimitModal(true);
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {showExpiredBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-14 left-0 right-0 z-[100] bg-yellow-500 text-black px-4 py-3 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Your plan expired. You are now on Free Plan.</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/pricing')}
                className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap"
               >
                Upgrade Plan
              </button>
              <button onClick={() => setShowExpiredBanner(false)}>
                <X className="w-5 h-5 opacity-70 hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNearLimitBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-14 left-0 right-0 z-[90] bg-[#FF9900] text-black px-4 py-3 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>You&apos;ve used over 80% of your plan limits!</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/pricing')}
                className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap"
               >
                Upgrade Now
              </button>
              <button onClick={() => setShowNearLimitBanner(false)}>
                <X className="w-5 h-5 opacity-70 hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFreeUpsell && (
          <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 50 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 50 }}
             className="fixed bottom-6 right-6 z-[80] bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl shadow-2xl max-w-[340px]"
          >
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-300 fill-current" />
                 <h3 className="font-bold text-lg">Unlock Pro Features</h3>
               </div>
               <button onClick={() => setShowFreeUpsell(false)} className="text-white/60 hover:text-white">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <p className="text-sm font-medium text-white/90 mb-4">
               Supercharge your social channels, access unlimited viral research, and AI Generation today.
            </p>
            <button
               onClick={() => router.push('/pricing')}
               className="w-full bg-white text-indigo-600 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
               Upgrade Plan 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181818] border border-[#212121] rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowLimitModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
               >
                 <X className="w-6 h-6" />
              </button>
              
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-[#FF0000]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white text-center mb-2">🚫 Limit reached</h2>
              <p className="text-[#AAAAAA] text-center mb-8">
                Upgrade your plan to continue accessing premium limits and analysis.
              </p>
              
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  router.push('/pricing');
                }}
                className="w-full bg-[#FF0000] text-white py-4 rounded-xl font-bold text-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                <Zap className="w-5 h-5 fill-current" />
                Upgrade your plan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
