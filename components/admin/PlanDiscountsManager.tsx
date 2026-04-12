'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, ChevronDown, X, Check } from 'lucide-react';
import axios from 'axios';

interface Discount {
  id: string;
  planId: string;
  label: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
}

export default function PlanDiscountsManager() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    planId: 'pro',
    label: '',
    percentage: 20,
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const plans = ['free', 'pro', 'enterprise', 'owner'];

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/plan-discounts');
      if (response.data.success) {
        setDiscounts(response.data.discounts || []);
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.planId || formData.percentage <= 0 || formData.percentage > 100) {
        setError('Invalid form data');
        return;
      }

      if (new Date(formData.endsAt) <= new Date(formData.startsAt)) {
        setError('End date must be after start date');
        return;
      }

      let response;
      if (editingId) {
        response = await axios.patch('/api/admin/plan-discounts', {
          id: editingId,
          ...formData,
        });
      } else {
        response = await axios.post('/api/admin/plan-discounts', formData);
      }

      if (response.data.success) {
        setSuccess(editingId ? 'Discount updated successfully' : 'Discount created successfully');
        fetchDiscounts();
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save discount');
    }
  };

  const handleEdit = (discount: Discount) => {
    setFormData({
      planId: discount.planId,
      label: discount.label,
      percentage: discount.percentage,
      startsAt: discount.startsAt.split('T')[0],
      endsAt: discount.endsAt.split('T')[0],
    });
    setEditingId(discount.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;

    try {
      const response = await axios.delete('/api/admin/plan-discounts', {
        params: { id },
      });

      if (response.data.success) {
        setSuccess('Discount deleted successfully');
        fetchDiscounts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete discount');
    }
  };

  const resetForm = () => {
    setFormData({
      planId: 'pro',
      label: '',
      percentage: 20,
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading discounts...</div>;
  }

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

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Plan Discounts</h2>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Discount'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Discount' : 'Create New Discount'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  {plans.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Early Bird, Black Friday"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Check size={20} />
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {discounts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No active discounts</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">Plan</th>
                  <th className="px-6 py-3 text-left">Discount</th>
                  <th className="px-6 py-3 text-left">Label</th>
                  <th className="px-6 py-3 text-left">Start Date</th>
                  <th className="px-6 py-3 text-left">End Date</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="px-6 py-3 font-semibold">
                      {discount.planId.charAt(0).toUpperCase() + discount.planId.slice(1)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm font-semibold">
                        {discount.percentage}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-3">{discount.label || '-'}</td>
                    <td className="px-6 py-3">{new Date(discount.startsAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{new Date(discount.endsAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
