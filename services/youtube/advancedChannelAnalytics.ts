import axios from 'axios';
import { getApiConfig } from '@/lib/apiConfig';

export async function getAdvancedChannelAnalytics(urlOrHandle: string) {
    const config = await getApiConfig();
    const apiKey = config.youtubeDataApiKey;

    if (!apiKey) {
        throw new Error('YouTube Data API key is not configured.');
    }

    let channelId = '';
    let handle = urlOrHandle.replace('https://youtube.com/', '').replace('https://www.youtube.com/', '').replace('@', '');
    
    // Check if it is a video URL (shorts, watch?v=, or youtu.be)
    const videoIdMatch = urlOrHandle.match(/(?:v=|youtu\.be\/|shorts\/)([^#&?]*)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId && videoId.length === 11) {
        try {
            const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: { part: 'snippet', id: videoId, key: apiKey }
            });
            if (videoRes.data.items && videoRes.data.items.length > 0) {
                channelId = videoRes.data.items[0].snippet.channelId;
            }
        } catch (err) {
            console.error('Error resolving video to channelId:', err);
        }
    }

    if (!channelId && urlOrHandle.includes('channel/')) {
        channelId = urlOrHandle.split('channel/')[1].split('/')[0];
    }

    // 1. Resolve handle to channel ID and get basic channel info
    let channelParams: any = { part: 'snippet,statistics,brandingSettings', key: apiKey };
    if (channelId) {
        channelParams.id = channelId;
    } else {
        channelParams.forHandle = `@${handle}`;
    }

    let channelRes;
    try {
        channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', { params: channelParams });
        if (!channelRes.data.items || channelRes.data.items.length === 0) {
            // fallback, sometimes forHandle needs the search API
            const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: { part: 'snippet', q: `@${handle}`, type: 'channel', maxResults: 1, key: apiKey }
            });
            if (searchRes.data.items && searchRes.data.items.length > 0) {
                channelId = searchRes.data.items[0].id.channelId;
                channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', { 
                    params: { part: 'snippet,statistics,brandingSettings', id: channelId, key: apiKey } 
                });
            } else {
                throw new Error('Channel not found');
            }
        }
    } catch (err) {
        console.error('Error fetching channel data:', err);
        throw new Error('Failed to fetch channel data. Please check the URL or handle.');
    }

    const channelData = channelRes.data.items[0];
    channelId = channelData.id;
    const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads || 'UU' + channelId.substring(2);

    // 2. Fetch recent videos from the channel via search (since playlistItems takes more calls to get stats)
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', channelId, order: 'date', maxResults: 15, key: apiKey, type: 'video' }
    });

    const videoIds = searchRes.data.items.map((item: any) => item.id.videoId).join(',');
    
    // 3. Fetch video statistics
    let videos: any[] = [];
    if (videoIds) {
        const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: { part: 'statistics,snippet', id: videoIds, key: apiKey }
        });
        videos = statsRes.data.items || [];
    }

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    const recentVideos = videos.map(v => {
        const views = parseInt(v.statistics.viewCount || '0');
        const likes = parseInt(v.statistics.likeCount || '0');
        const comments = parseInt(v.statistics.commentCount || '0');
        
        totalViews += views;
        totalLikes += likes;
        totalComments += comments;

        const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
        const viralScore = Math.min(100, Math.round((engagementRate * 5) + (views / 1000)));

        return {
            id: v.id,
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
            views,
            likes,
            comments,
            engagementRate: parseFloat(engagementRate.toFixed(2)),
            viralScore
        };
    });

    const averageViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
    const averageEngagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    return {
        channelInfo: {
            id: channelData.id,
            title: channelData.snippet.title,
            customUrl: channelData.snippet.customUrl || handle,
            thumbnails: channelData.snippet.thumbnails,
            bannerUrl: channelData.brandingSettings?.image?.bannerExternalUrl,
            description: channelData.snippet.description,
            statistics: {
                subscriberCount: parseInt(channelData.statistics.subscriberCount || '0'),
                viewCount: parseInt(channelData.statistics.viewCount || '0'),
                videoCount: parseInt(channelData.statistics.videoCount || '0')
            }
        },
        recentVideos,
        videoPerformance: {
            averageViews,
            averageEngagementRate: parseFloat(averageEngagementRate.toFixed(2)),
            totalRecentViews: totalViews,
            growthVelocity: Math.round(averageViews / 7) || 0,
            consistencyScore: videos.length > 5 ? 85 : 40 
        },
        audit: {
            strengths: [
                totalViews > 10000 ? 'High recent viewership' : 'Consistent baseline views',
                averageEngagementRate > 4 ? 'Excellent community engagement' : 'Stable engagement'
            ],
            weaknesses: [
                videos.length < 5 ? 'Low upload frequency' : 'Requires more long-form content'
            ],
            opportunities: [
                'Optimize thumbnails for non-subscribers',
                'Leverage community tab more frequently'
            ]
        }
    };
}
