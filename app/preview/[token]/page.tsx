'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Check, X, MessageSquare, Loader2, AlertCircle, PlayCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function PreviewPage() {
  const { token } = useParams();
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await axios.get(`/api/previews/${token}`);
        setPreview(response.data.preview);
        setStatus(response.data.preview.status);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [token]);

  const handleAction = async (newStatus: string) => {
    setSubmitting(true);
    try {
      await axios.patch(`/api/previews/${token}`, {
        status: newStatus,
        feedback: feedback
      });
      setStatus(newStatus);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FF0000] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 text-center">
        <div>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-[#AAAAAA]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-12 text-center"
        >
          <div className="inline-block px-3 py-1 bg-[#181818] border border-[#333333] rounded-full text-xs font-bold text-[#FF0000] mb-4 uppercase tracking-widest">
            {preview.platform} Content Preview
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{preview.title}</h1>
          <p className="text-[#AAAAAA] text-lg max-w-2xl mx-auto">
            Review your upcoming content and provide feedback or approval.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Content View */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="aspect-video bg-[#181818] border border-[#333333] rounded-2xl overflow-hidden relative group">
              {preview.thumbnailUrl ? (
                <img 
                  src={preview.thumbnailUrl} 
                  alt="Preview Thumbnail" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#333333]">
                  <PlayCircle className="w-24 h-24" />
                </div>
              )}
              {preview.videoUrl && (
                <a 
                  href={preview.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition"
                >
                  <div className="px-6 py-3 bg-white text-black rounded-lg font-bold flex items-center gap-2">
                     <ExternalLink className="w-4 h-4" />
                     View Source Video
                  </div>
                </a>
              )}
            </div>

            <div className="bg-[#181818] border border-[#333333] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#666] uppercase mb-4 tracking-wider">Description</h3>
              <p className="text-[#AAAAAA] whitespace-pre-wrap leading-relaxed">
                {preview.description || 'No description provided.'}
              </p>
            </div>
          </motion.div>

          {/* Action Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#181818] border border-[#333333] rounded-2xl p-8 sticky top-8">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Content Status</h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                  status === 'approved' ? 'bg-green-500/10 text-green-500' :
                  status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {status === 'approved' && <Check className="w-5 h-5" />}
                  {status === 'rejected' && <X className="w-5 h-5" />}
                  {status === 'pending_approval' && <Loader2 className="w-5 h-5 animate-spin" />}
                  {status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {status !== 'approved' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-[#666] uppercase mb-3 tracking-wider">
                      Feedback / Requested Changes
                    </label>
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add any comments or requested changes here..."
                      className="w-full h-32 px-4 py-3 bg-[#0F0F0F] border border-[#333333] rounded-xl text-white placeholder-[#444] focus:ring-2 focus:ring-[#FF0000] outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleAction('approved')}
                      disabled={submitting}
                      className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
                      Approve and Publish
                    </button>
                    <button
                      onClick={() => handleAction('rejected')}
                      disabled={submitting}
                      className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-6 h-6" />}
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleAction('commented')}
                      disabled={submitting}
                      className="w-full py-4 bg-[#333333] hover:bg-[#444444] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <MessageSquare className="w-6 h-6" />
                      Add Comment Only
                    </button>
                  </div>
                </>
              )}

              {status === 'approved' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                   <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                   <h4 className="text-xl font-bold text-white mb-2">Approved!</h4>
                   <p className="text-green-300">
                     Thank you for your approval. Our team will proceed with publishing this content.
                   </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
