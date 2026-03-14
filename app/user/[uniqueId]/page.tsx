'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  User, Mail, Building, Phone, Calendar, 
  Video, TrendingUp, BarChart3, LogOut,
  Loader2, AlertCircle
} from 'lucide-react';
import { getAuthHeaders, removeToken } from '@/utils/auth';

interface UserData {
  id: string;
  uniqueId: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  role: string;
  subscription: string;
  subscriptionPlan?: {
    planId: string;
    planName: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  createdAt: string;
}

export default function UserHomePage() {
  const params = useParams();
  const router = useRouter();
  const uniqueId = params.uniqueId as string;
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/user/${uniqueId}`, {
          headers: getAuthHeaders(),
        });
        
        if (response.data.success) {
          const user = response.data.user;
          if (user?.role === 'super-admin') {
            router.replace('/dashboard/super');
            return;
          }
          setUserData(user);
        } else {
          setError('User not found');
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.response?.data?.error || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (uniqueId) {
      fetchUserData();
    }
  }, [uniqueId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#181818] border border-[#212121] rounded-xl p-8 max-w-md w-full"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white text-center mb-2">Error</h2>
          <p className="text-[#AAAAAA] text-center">{error || 'User not found'}</p>
          <button
            onClick={() => router.push('/auth?mode=login')}
            className="mt-6 w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  const getRoleDisplay = () => {
    if (userData.subscriptionPlan?.planId === 'business' || userData.subscription === 'enterprise') {
      return { text: 'Admin', color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10' };
    } else if (userData.subscriptionPlan?.planId === 'starter' || userData.subscription === 'pro') {
      return { text: 'Manager', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    }
    return { text: 'User', color: 'text-[#AAAAAA]', bg: 'bg-[#212121]' };
  };

  const roleDisplay = getRoleDisplay();

  const handleLogout = () => {
    removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uniqueId');
    }
    router.push('/auth?mode=login');
  };

  const planEndText = (() => {
    const end = userData.subscriptionPlan?.endDate;
    if (end) {
      return `Plan ends on ${new Date(end).toLocaleDateString()}`;
    }
    if (userData.subscription === 'free') {
      return 'Free plan – no fixed end date';
    }
    return 'Plan end date not available';
  })();

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <div className="bg-[#181818] border-b border-[#212121]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {userData.name}</h1>
              <p className="text-[#AAAAAA] text-sm mt-1">Your Personal Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg ${roleDisplay.bg} ${roleDisplay.color} font-semibold`}>
                {roleDisplay.text}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#333333] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#AAAAAA]" />
              <div>
                <p className="text-xs text-[#AAAAAA]">Full Name</p>
                <p className="text-white font-medium">{userData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#AAAAAA]" />
              <div>
                <p className="text-xs text-[#AAAAAA]">Email</p>
                <p className="text-white font-medium">{userData.email}</p>
              </div>
            </div>
            {userData.companyName && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-[#AAAAAA]" />
                <div>
                  <p className="text-xs text-[#AAAAAA]">Company</p>
                  <p className="text-white font-medium">{userData.companyName}</p>
                </div>
              </div>
            )}
            {userData.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#AAAAAA]" />
                <div>
                  <p className="text-xs text-[#AAAAAA]">Phone</p>
                  <p className="text-white font-medium">{userData.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#AAAAAA]" />
              <div>
                <p className="text-xs text-[#AAAAAA]">Unique ID</p>
                <p className="text-white font-medium font-mono">{userData.uniqueId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#AAAAAA]" />
              <div>
                <p className="text-xs text-[#AAAAAA]">Member Since</p>
                <p className="text-white font-medium">
                  {new Date(userData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscription Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Subscription Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {userData.subscriptionPlan?.planName || userData.subscription.toUpperCase()}
              </p>
              <p className="text-[#AAAAAA] text-sm mt-1">
                Status:{' '}
                <span className="text-green-400">
                  {userData.subscriptionPlan?.status || 'Active'}
                </span>
              </p>
              <p className="text-[#AAAAAA] text-xs mt-1">
                {planEndText}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg ${roleDisplay.bg} ${roleDisplay.color} font-semibold`}>
              {roleDisplay.text} Access
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <button
            onClick={() => router.push('/viral-optimizer')}
            className="bg-[#181818] border border-[#212121] rounded-xl p-6 hover:border-[#FF0000] transition-colors text-left"
          >
            <Video className="w-8 h-8 text-[#FF0000] mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Viral Optimizer</h3>
            <p className="text-[#AAAAAA] text-sm">Analyze and optimize your videos</p>
          </button>

          <button
            onClick={() => router.push('/trending')}
            className="bg-[#181818] border border-[#212121] rounded-xl p-6 hover:border-[#FF0000] transition-colors text-left"
          >
            <TrendingUp className="w-8 h-8 text-[#FF0000] mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Trending Topics</h3>
            <p className="text-[#AAAAAA] text-sm">Discover what&apos;s trending</p>
          </button>

          <button
            onClick={() => router.push('/analytics')}
            className="bg-[#181818] border border-[#212121] rounded-xl p-6 hover:border-[#FF0000] transition-colors text-left"
          >
            <BarChart3 className="w-8 h-8 text-[#FF0000] mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Analytics</h3>
            <p className="text-[#AAAAAA] text-sm">View your performance metrics</p>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
