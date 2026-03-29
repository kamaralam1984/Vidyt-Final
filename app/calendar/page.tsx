'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, X, Clock, Loader2, AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduledAt: string;
  status: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface CalendarData {
  events: ScheduledPost[];
  totalScheduled: number;
  totalPosted: number;
  upcomingPosts: ScheduledPost[];
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    platform: 'youtube' as 'youtube' | 'facebook' | 'instagram' | 'tiktok',
    scheduledAt: '',
    description: '',
    hashtags: '',
    videoUrl: '',
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  useEffect(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    void loadCalendar(monthStart, monthEnd);
  }, [year, month]);

  const loadCalendar = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await axios.get('/api/schedule/calendar', {
        headers: getAuthHeaders(),
        params,
      });

      if (response.data?.calendar) {
        const cal = response.data.calendar;
        setCalendarData({
          events: cal.events || [],
          totalScheduled: cal.totalScheduled || 0,
          totalPosted: cal.totalPosted || 0,
          upcomingPosts: cal.upcomingPosts || [],
        });
        setPosts(cal.events || []);
      } else {
        setPosts(response.data.posts || []);
        setCalendarData(null);
      }
    } catch (error: any) {
      console.error('Calendar load error:', error);
      setError(error?.response?.data?.error || 'Failed to load calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      await axios.post('/api/schedule/post', {
        title: formData.title,
        platform: formData.platform,
        scheduledAt: formData.scheduledAt,
        description: formData.description,
        videoUrl: formData.videoUrl.trim() || undefined,
        hashtags: formData.hashtags.split(',').map(t => t.trim()).filter(Boolean),
      }, {
        headers: getAuthHeaders(),
      });

      setShowScheduleForm(false);
      setSelectedDay(null);
      setFormData({
        title: '',
        platform: 'youtube',
        scheduledAt: '',
        description: '',
        hashtags: '',
        videoUrl: '',
      });
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      await loadCalendar(monthStart, monthEnd);
    } catch (error: any) {
      console.error('Schedule error:', error);
      setError(error?.response?.data?.error || 'Failed to schedule post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return;

    try {
      setError(null);
      await axios.delete('/api/schedule/post', {
        headers: getAuthHeaders(),
        params: { postId },
      });
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      await loadCalendar(monthStart, monthEnd);
    } catch (error: any) {
      console.error('Cancel error:', error);
      setError(error?.response?.data?.error || 'Failed to cancel post.');
    }
  };

  const getPostsForDate = (day: number) => {
    const date = new Date(year, month, day);
    return posts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const selectedDayPosts = selectedDay ? getPostsForDate(selectedDay) : [];

  const openScheduleForDay = (day?: number) => {
    let scheduledAt = '';
    if (day) {
      const dt = new Date(year, month, day, 10, 0, 0);
      const offset = dt.getTimezoneOffset() * 60000;
      scheduledAt = new Date(dt.getTime() - offset).toISOString().slice(0, 16);
      setSelectedDay(day);
    }
    setFormData((prev) => ({ ...prev, scheduledAt }));
    setShowScheduleForm(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <CalendarIcon className="w-8 h-8 text-[#FF0000]" /> Content Calendar
              </h1>
              <p className="text-[#AAAAAA]">
                Schedule and manage your content posts
              </p>
            </div>
            <motion.button
              onClick={() => openScheduleForDay()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Schedule Post
            </motion.button>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#888]">Scheduled</p>
              <p className="text-2xl font-bold text-white mt-1">{calendarData?.totalScheduled ?? posts.filter((p) => p.status === 'scheduled').length}</p>
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#888]">Posted</p>
              <p className="text-2xl font-bold text-white mt-1">{calendarData?.totalPosted ?? posts.filter((p) => p.status === 'posted').length}</p>
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#888]">This Month Total</p>
              <p className="text-2xl font-bold text-white mt-1">{posts.length}</p>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {monthNames[month]} {year}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="px-4 py-2 rounded-lg bg-[#212121] text-[#DDD] hover:bg-[#2A2A2A]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-[#CC0000]"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="px-4 py-2 rounded-lg bg-[#212121] text-[#DDD] hover:bg-[#2A2A2A]"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-[#777] py-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = getPostsForDate(day);
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-24 p-2 border border-[#212121] rounded-lg cursor-pointer transition-all ${
                      selectedDay === day ? 'ring-1 ring-[#FF0000]/60' : ''
                    } ${
                      isToday ? 'bg-[#212121] border-[#FF0000]' : ''
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#FF0000]' : 'text-white'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <div
                          key={post.id}
                          className={`text-xs p-1 rounded truncate ${
                            post.status === 'scheduled' ? 'bg-[#212121] text-[#00FF00]' :
                            post.status === 'posted' ? 'bg-[#212121] text-[#FF0000]' :
                            'bg-[#212121] text-[#AAAAAA]'
                          }`}
                          title={post.title}
                        >
                          {post.platform}: {post.title.substring(0, 15)}...
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-xs text-[#AAAAAA]">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDay !== null && (
            <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {monthNames[month]} {selectedDay}, {year}
                </h2>
                <button
                  onClick={() => openScheduleForDay(selectedDay)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-[#CC0000]"
                >
                  <Plus className="w-4 h-4" />
                  Schedule on this day
                </button>
              </div>
              {selectedDayPosts.length === 0 ? (
                <p className="text-[#AAAAAA] text-sm">No posts on this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayPosts
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((post) => (
                      <div key={post.id} className="p-3 bg-[#121212] border border-[#222] rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white font-medium">{post.title}</p>
                          <p className="text-xs text-[#999] mt-1">
                            <span className="capitalize">{post.platform}</span> · {new Date(post.scheduledAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {post.status === 'scheduled' && (
                          <button onClick={() => handleCancel(post.id)} className="text-sm text-red-400 hover:text-red-300">
                            Cancel
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Scheduled Posts List */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Upcoming Scheduled Posts
            </h2>
            <div className="space-y-4">
              {posts.filter(p => p.status === 'scheduled').length === 0 ? (
                <p className="text-[#AAAAAA] text-center py-8">
                  No scheduled posts. Click &quot;Schedule Post&quot; to add one.
                </p>
              ) : (
                posts
                  .filter(p => p.status === 'scheduled')
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map(post => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 bg-[#212121] rounded-lg border border-[#2A2A2A]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#212121] rounded-lg flex items-center justify-center border border-[#2A2A2A]">
                          <Clock className="w-6 h-6 text-[#FF0000]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{post.title}</p>
                          <div className="flex gap-4 mt-1 text-sm text-[#AAAAAA]">
                            <span className="capitalize">{post.platform}</span>
                            <span>{new Date(post.scheduledAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(post.id)}
                        className="px-4 py-2 text-[#FF0000] hover:bg-[#212121] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Schedule Form Modal */}
          {showScheduleForm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#181818] border border-[#212121] rounded-xl shadow-xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Schedule Post</h2>
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="p-2 hover:bg-[#212121] rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSchedule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Platform
                    </label>
                    <select
                      required
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Hashtags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.hashtags}
                      onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                      placeholder="viral, trending, fyp"
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
                    >
                      {submitting ? 'Scheduling...' : 'Schedule'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="px-6 py-3 bg-[#212121] text-[#AAAAAA] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
