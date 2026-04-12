import { google } from 'googleapis';
import connectDB from './mongodb';
import Channel from '../models/Channel';
import Video from '../models/Video';
import User from '../models/User';
import { getMainYoutubeOAuthRedirectUri } from '../services/youtubeUpload';

/**
 * Syncs channel statistics (subs, views, videos) for a specific channel.
 */
export async function syncChannelStats(channelId: string) {
    await connectDB();
    const channel = await Channel.findOne({ channelId });
    if (!channel) throw new Error('Channel not found');

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET,
        getMainYoutubeOAuthRedirectUri()
    );

    auth.setCredentials({
        access_token: channel.accessToken,
        refresh_token: channel.refreshToken,
    });

    const youtube = google.youtube({ version: 'v3', auth });

    const res = await youtube.channels.list({
        id: [channelId],
        part: ['statistics', 'snippet']
    });

    if (res.data.items && res.data.items.length > 0) {
        const item = res.data.items[0];
        await Channel.updateOne({ channelId }, {
            subscribers: parseInt(item.statistics?.subscriberCount || '0'),
            totalViews: parseInt(item.statistics?.viewCount || '0'),
            videoCount: parseInt(item.statistics?.videoCount || '0'),
            channelTitle: item.snippet?.title || channel.channelTitle,
            channelThumbnail: item.snippet?.thumbnails?.default?.url || channel.channelThumbnail,
            lastSyncedAt: new Date()
        });
        return item.statistics;
    }
    return null;
}

/**
 * Imports the latest videos from a YouTube channel.
 */
export async function importRecentVideos(channelId: string, maxResults: number = 10) {
    await connectDB();
    const channel = await Channel.findOne({ channelId });
    if (!channel) throw new Error('Channel not found');

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET,
        getMainYoutubeOAuthRedirectUri()
    );

    auth.setCredentials({
        access_token: channel.accessToken,
        refresh_token: channel.refreshToken,
    });

    const youtube = google.youtube({ version: 'v3', auth });

    const res = await youtube.search.list({
        channelId: channelId,
        part: ['snippet'],
        order: 'date',
        type: ['video'],
        maxResults: maxResults
    });

    if (res.data.items) {
        for (const item of res.data.items) {
            const videoId = item.id?.videoId;
            if (!videoId) continue;

            const existing = await Video.findOne({ youtubeId: videoId });
            if (!existing) {
                await Video.create({
                    userId: channel.userId,
                    title: item.snippet?.title || 'Untitled',
                    description: item.snippet?.description || '',
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
                    platform: 'youtube',
                    youtubeId: videoId,
                    duration: 0, // Search API doesn't give duration, requires separate call
                    uploadedAt: new Date(item.snippet?.publishedAt || Date.now())
                });
            }
        }
    }
}
