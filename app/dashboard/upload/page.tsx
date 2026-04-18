"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Youtube, Upload, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon, FileVideo } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface Channel {
    _id: string;
    channelId: string;
    channelTitle: string;
    channelThumbnail: string;
}

export default function MultiUploadPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(true);
    
    // Form State
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [privacyStatus, setPrivacyStatus] = useState('public');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [channelUrlPasted, setChannelUrlPasted] = useState('');

    // UI State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [urlError, setUrlError] = useState('');
    const [uploadSuccessUrl, setUploadSuccessUrl] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
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
                if (data.channels.length > 0) {
                    setSelectedChannelId(data.channels[0].channelId);
                }
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        } finally {
            setIsLoadingChannels(false);
        }
    };

    const extractChannelIdFromUrl = (url: string) => {
        // Handle various YouTube URL formats
        const match = url.match(/(?:youtube\.com\/(?:channel\/|c\/|user\/|@))([a-zA-Z0-9_-]+)/i);
        return match ? match[1] : null;
    };

    const handleUrlPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setChannelUrlPasted(url);
        setUrlError('');

        if (!url) return;

        const extractedId = extractChannelIdFromUrl(url);
        if (extractedId) {
            // Check if this ID or handle matches any connected channel
            // Note: handles (starting with @) might not perfectly match the channelId (which usually starts with UC)
            // Ideally, the DB should also store the handle. This is a basic check.
            const connectedChannel = channels.find(c => c.channelId === extractedId || c.channelTitle.toLowerCase() === extractedId.toLowerCase());
            
            if (connectedChannel) {
                setSelectedChannelId(connectedChannel.channelId);
                setUrlError('');
            } else {
                setUrlError('Please connect this channel first.');
                setSelectedChannelId('');
            }
        } else {
            setUrlError('Invalid YouTube channel URL.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadError('');
        setUploadSuccessUrl('');
        
        if (!selectedChannelId) {
            setUploadError('Please select a connected channel or connect one first.');
            return;
        }

        if (!videoFile) {
            setUploadError('Please select a video file to upload.');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('channelId', selectedChannelId);
        formData.append('video', videoFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tags', tags);
        formData.append('privacyStatus', privacyStatus);

        try {
            const res = await fetch('/api/youtube/upload-multi', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsAuth) {
                    setUploadError('Channel authorization expired. Please reconnect the channel.');
                } else {
                    setUploadError(data.error || 'Failed to upload video');
                }
                return;
            }

            setUploadSuccessUrl(data.videoUrl);
            setTitle('');
            setDescription('');
            setTags('');
            setVideoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error: any) {
            console.error('Upload Error:', error);
            setUploadError('Network error or server unavailable.');
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoadingChannels) {
        return (
            <div className="flex justify-center items-center py-40 min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen">
            <div className="mb-10 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-red-600 w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Video to Channel</h1>
                <p className="text-gray-500 mt-2">Publish directly to any of your connected YouTube Channels.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                {uploadSuccessUrl && (
                    <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                        <div>
                            <h3 className="text-green-800 dark:text-green-300 font-medium">Video Uploaded Successfully!</h3>
                            <p className="text-green-700 dark:text-green-400 mt-1">
                                View your video here: <a href={uploadSuccessUrl} target="_blank" rel="noreferrer" className="underline font-medium hover:text-green-900">{uploadSuccessUrl}</a>
                            </p>
                        </div>
                    </div>
                )}

                {uploadError && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="text-red-800 dark:text-red-300 font-medium">Upload Failed</h3>
                            <p className="text-red-600 dark:text-red-400 mt-1">{uploadError}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Channel Selection */}
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Youtube className="w-5 h-5 text-red-500" />
                            Target Channel
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Connected Channel</label>
                                {channels.length > 0 ? (
                                    <select 
                                        value={selectedChannelId}
                                        onChange={(e) => {
                                            setSelectedChannelId(e.target.value);
                                            setUrlError('');
                                            setChannelUrlPasted('');
                                        }}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 px-4 py-2.5"
                                    >
                                        {channels.map(c => (
                                            <option key={c._id} value={c.channelId}>{c.channelTitle}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="w-full border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
                                        <span>No channels connected</span>
                                        <button 
                                            type="button" 
                                            onClick={() => router.push('/dashboard/channels')}
                                            className="font-semibold underline"
                                        >
                                            Connect One
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* URL Paste override as per requirements */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <LinkIcon className="w-4 h-4" /> Or Paste Channel URL
                                </label>
                                <input 
                                    type="text" 
                                    value={channelUrlPasted}
                                    onChange={handleUrlPaste}
                                    placeholder="https://youtube.com/channel/..."
                                    className={`w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 px-4 py-2.5 ${urlError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                />
                                {urlError && <p className="text-red-500 text-xs mt-1">{urlError}</p>}
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video File</label>
                        <label className={`flex justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl appearance-none cursor-pointer hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 focus:outline-none ${videoFile ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}`}>
                            <span className="flex items-center space-x-2">
                                <FileVideo className={`w-8 h-8 ${videoFile ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className={`font-medium ${videoFile ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {videoFile ? videoFile.name : 'Drop video here or click to browse'}
                                </span>
                            </span>
                            <input type="file" name="file_upload" className="hidden" accept="video/*" ref={fileInputRef} onChange={(e) => e.target.files && setVideoFile(e.target.files[0])} />
                        </label>
                    </div>

                    {/* Video Metadata */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Title</label>
                            <input 
                                type="text" 
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 px-4 py-3"
                                placeholder="Enter an engaging title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea 
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 px-4 py-3 resize-none"
                                placeholder="Tell viewers about your video..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 px-4 py-3"
                                    placeholder="gaming, viral, tutorial"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                                <select 
                                    value={privacyStatus}
                                    onChange={(e) => setPrivacyStatus(e.target.value)}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 px-4 py-3"
                                >
                                    <option value="public">Public</option>
                                    <option value="unlisted">Unlisted</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={isUploading || !!urlError || !selectedChannelId}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Uploading to YouTube...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6" />
                                    Publish Video
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
