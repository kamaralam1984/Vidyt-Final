'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion } from 'framer-motion';

export default function UsageBar() {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        if (res.data?.user) {
          const u = res.data.user;
          const userUsed = u.usageStats?.analysesThisMonth || 0;
          const userLimit = u.computedLimits?.analyses || 5; 
          
          setUsed(userUsed);
          setLimit(userLimit);
        }
      } catch (err) {
         // silently fail if auth is bouncing
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) return null;
  if (limit >= Number.MAX_SAFE_INTEGER) return null; // Unlimited plan owner, hide bar

  const percent = Math.min((used / limit) * 100, 100);
  
  // Decide track color based on tier
  let barColor = 'bg-[#00E5FF]'; // standard cyan
  if (percent >= 100) barColor = 'bg-[#FF0000]'; // standard red danger
  else if (percent >= 80) barColor = 'bg-yellow-400';

  return (
    <div className="px-3 py-4 mt-2 mb-2 border-t border-b border-[#212121]">
      <div className="flex justify-between items-center mb-2">
         <span className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Analyses Usage</span>
         <span className="text-xs font-mono text-white">{used} / {limit}</span>
      </div>
      <div className="w-full h-2 bg-[#212121] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${barColor}`}
        />
      </div>
      {percent >= 80 && percent < 100 && (
         <p className="text-[10px] text-yellow-500 mt-2 font-medium">Almost out of limits!</p>
      )}
      {percent >= 100 && (
         <p className="text-[10px] text-[#FF0000] mt-2 font-medium">Limit reached. Upgrade required.</p>
      )}
    </div>
  );
}
