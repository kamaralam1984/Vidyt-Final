'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Check, X, Edit2, Calendar } from 'lucide-react';
import axios from 'axios';

interface UserPlanData {
  id: string;
  email: string;
  name: string;
  subscription: string;
  subscriptionPlan?: {
    planId: string;
    planName: string;
    billingPeriod: string;
    price: number;
    status: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function UserPlanManager() {
  const [userEmail, setUserEmail] = useState('');
  const [userData, setUserData] = useState<UserPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingPeriod, setBillingPeriod] = useState('month');
  const [duration, setDuration] = useState(30);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [extendDuration, setExtendDuration] = useState(30);

  const plans = ['free', 'pro', 'enterprise', 'owner'];

  const handleSearch = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('/api/admin/user-plans', {
        params: { email: userEmail },
      });

      if (response.data.success) {
        setUserData(response.data.user);
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found');
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!userData) return;

    try {
      const response = await axios.post('/api/admin/user-plans', {
        email: userData.email,
        plan: selectedPlan,
        billingPeriod,
        duration,
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowPlanForm(false);
        handleSearch();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign plan');
    }
  };

  const handleExtendPlan = async () => {
    if (!userData) return;

    try {
      const response = await axios.patch('/api/admin/user-plans', {
        email: userData.email,
        action: 'extend',
        duration: extendDuration,
      });

      if (response.data.success) {
        setSuccess(`Plan extended by ${extendDuration} days`);
        setShowExtendForm(false);
        handleSearch();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extend plan');
    }
  };

  const handleCancelPlan = async () => {
    if (!userData || !confirm('Are you sure you want to cancel this plan?')) return;

    try {
      const response = await axios.patch('/api/admin/user-plans', {
        email: userData.email,
        action: 'cancel',
      });

      if (response.data.success) {
        setSuccess('Plan cancelled successfully');
        setShowPlanForm(false);
        handleSearch();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel plan');
    }
  };

  const handleResetPlan = async () => {
    if (!userData || !confirm('Reset user to free plan? This cannot be undone.')) return;

    try {
      const response = await axios.delete('/api/admin/user-plans', {
        params: { email: userData.email },
      });

      if (response.data.success) {
        setSuccess('User reset to free plan');
        setShowPlanForm(false);
        handleSearch();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset plan');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}

      <h2 className="text-2xl font-bold">User Plan Management</h2>

      {/* Search Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <label className="block text-sm font-medium mb-3">Find User by Email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="user@example.com"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Search size={20} />
            Search
          </button>
        </div>
      </div>

      {/* User Information */}
      {userData && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">User Information</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="font-semibold">{userData.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="font-semibold">{userData.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Current Plan</p>
                <p className="font-semibold text-red-400">
                  {userData.subscription.charAt(0).toUpperCase() + userData.subscription.slice(1)}
                </p>
              </div>
              {userData.subscriptionPlan && (
                <>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="font-semibold capitalize">{userData.subscriptionPlan.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="font-semibold">
                      {userData.subscriptionPlan.startDate
                        ? new Date(userData.subscriptionPlan.startDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">End Date</p>
                    <p className="font-semibold">
                      {userData.subscriptionPlan.endDate
                        ? new Date(userData.subscriptionPlan.endDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Plan Management Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowPlanForm(!showPlanForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Edit2 size={20} />
              {showPlanForm ? 'Cancel' : 'Change Plan'}
            </button>

            {userData.subscription !== 'free' && (
              <button
                onClick={() => setShowExtendForm(!showExtendForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <Calendar size={20} />
                {showExtendForm ? 'Cancel' : 'Extend Plan'}
              </button>
            )}
          </div>

          {/* Change Plan Form */}
          {showPlanForm && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Assign New Plan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Plan</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
                  >
                    {plans.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Billing Period</label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (days)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleAssignPlan}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Check size={20} />
                    Assign Plan
                  </button>
                  {userData.subscription !== 'free' && (
                    <button
                      onClick={handleCancelPlan}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
                    >
                      Cancel Current Plan
                    </button>
                  )}
                  <button
                    onClick={handleResetPlan}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                  >
                    Reset to Free
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Extend Plan Form */}
          {showExtendForm && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Extend Subscription</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Extend by (days)</label>
                  <input
                    type="number"
                    value={extendDuration}
                    onChange={(e) => setExtendDuration(Number(e.target.value))}
                    min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExtendPlan}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Check size={20} />
                    Extend
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!userData && userEmail && !loading && (
        <div className="text-center py-8 text-gray-400">
          Click search to find the user
        </div>
      )}
    </div>
  );
}
