"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Youtube, Trash2, Plus, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface Channel {
    _id: string;
    channelId: string;
    channelTitle: string;
    channelThumbnail: string;
    createdAt: string;
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const res = await fetch('/api/youtube/channels', { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.channels) {
                setChannels(data.channels);
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        setIsConnecting(true);
        window.location.href = '/api/youtube/channels/connect';
    };

    const handleDisconnect = async (channelId: string) => {
        if (!confirm('Are you sure you want to disconnect this channel?')) return;
        
        try {
            const res = await fetch(`/api/youtube/channels/${channelId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                setChannels(channels.filter(c => c.channelId !== channelId));
            } else {
                alert(data.error || 'Failed to disconnect');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Failed to disconnect channel');
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Youtube className="text-red-500 w-8 h-8" /> 
                        Connected Channels
                    </h1>
                    <p className="text-gray-500 mt-2">Manage your YouTube channels for automated uploading.</p>
                </div>
                <button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Connect YouTube Channel
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                </div>
            ) : channels.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
                    <div className="bg-red-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Youtube className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Channels Connected</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven&apos;t connected any YouTube channels yet. Connect a channel to seamlessly upload videos.</p>
                    <button 
                        onClick={handleConnect}
                        className="bg-red-600 text-white px-6 py-3 border border-red-600 rounded-xl hover:bg-red-700 transition shadow-sm"
                    >
                        Connect Your First Channel
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {channels.map((channel) => (
                        <div key={channel._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-4 mb-6">
                                {channel.channelThumbnail ? (
                                    <NextImage src={channel.channelThumbnail} alt={channel.channelTitle} width={64} height={64} className="w-16 h-16 rounded-full border border-gray-100 dark:border-gray-700 object-cover" unoptimized />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <Youtube className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">{channel.channelTitle}</h3>
                                    <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400 px-2 py-1 rounded-md mt-1 inline-block">Connected</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                <span className="text-xs text-gray-400">ID: {channel.channelId.slice(0, 10)}...</span>
                                <button 
                                    onClick={() => handleDisconnect(channel.channelId)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition"
                                    title="Disconnect Channel"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
