// ============================================
// Shorts Generator Worker Example
// Creates viral shorts from long-form videos
// ============================================

const axios = require('axios');

class ShortsGenerator {
    constructor(backendUrl, aiServiceUrl) {
        this.backendUrl = backendUrl;
        this.aiServiceUrl = aiServiceUrl;
    }

    async generateShorts(jobData) {
        const { videoId, mode = 'auto', startTime, endTime, aspectRatio = '9:16' } = jobData;

        console.log(`✂️  Generating shorts for video: ${videoId}`);
        console.log(`   Mode: ${mode}, Aspect Ratio: ${aspectRatio}`);

        try {
            let clipData;

            if (mode === 'auto') {
                // AI-powered automatic shorts generation
                clipData = await this.generateAutoShorts(videoId, aspectRatio);
            } else if (mode === 'manual') {
                // Manual clip with user-defined timestamps
                clipData = await this.generateManualClip(videoId, startTime, endTime, aspectRatio);
            }

            // Add captions
            const captionedClip = await this.addCaptions(clipData);

            // Add hashtags
            const withHashtags = await this.generateHashtags(captionedClip);

            // Export in target format
            const finalClip = await this.exportClip(withHashtags, aspectRatio);

            // Store metadata
            await this.storeClipMetadata(videoId, finalClip);

            return {
                success: true,
                shortsId: finalClip.id,
                videoId,
                duration: finalClip.duration,
                aspectRatio,
                downloadUrl: finalClip.downloadUrl,
                captions: finalClip.captions,
                hashtags: finalClip.hashtags,
                createdAt: new Date(),
            };

        } catch (error) {
            console.error(`❌ Shorts generation error: ${error.message}`);
            throw error;
        }
    }

    async generateAutoShorts(videoId, aspectRatio) {
        console.log('🤖 Running AI-powered viral moment detection...');

        // Call AI service to detect viral moments
        try {
            const response = await axios.post(
                `${this.aiServiceUrl}/detect-viral-moments`,
                { videoId }
            );

            const viralMoments = response.data.moments;

            // Use the highest-scoring moment
            const topMoment = viralMoments[0];

            return {
                id: `shorts_${Date.now()}`,
                videoId,
                startTime: topMoment.startTime,
                endTime: topMoment.endTime,
                duration: topMoment.duration,
                viralScore: topMoment.score,
                aspectRatio,
            };
        } catch (error) {
            console.log('⚠️  AI service unavailable, using fallback...');
            // Fallback: use first 30 seconds
            return {
                id: `shorts_${Date.now()}`,
                videoId,
                startTime: 0,
                endTime: 30,
                duration: 30,
                viralScore: 75,
                aspectRatio,
            };
        }
    }

    async generateManualClip(videoId, startTime, endTime, aspectRatio) {
        console.log(`🎬 Extracting clip: ${startTime}s - ${endTime}s`);

        return {
            id: `shorts_${Date.now()}`,
            videoId,
            startTime,
            endTime,
            duration: endTime - startTime,
            aspectRatio,
        };
    }

    async addCaptions(clipData) {
        console.log('💬 Generating captions...');

        // Simulate caption generation
        const captions = [
            { time: 0, text: 'Watch this!' },
            { time: 2, text: 'Amazing moment' },
            { time: 5, text: 'You won\'t believe this' },
        ];

        return {
            ...clipData,
            captions,
            captionStyle: 'modern',
            captionColor: '#FFFFFF',
        };
    }

    async generateHashtags(clipData) {
        console.log('🔖 Generating hashtags...');

        const hashtags = [
            '#viral',
            '#trending',
            '#youtubeShorts',
            '#content',
            '#viralBoost',
        ];

        return {
            ...clipData,
            hashtags,
        };
    }

    async exportClip(clipData, aspectRatio) {
        console.log(`📤 Exporting in ${aspectRatio} format...`);

        // Add padding/resize logic based on aspect ratio
        let paddingConfig = {
            color: '#000000', // Black bars
            width: 0,
            height: 0,
        };

        if (aspectRatio === '9:16') {
            // Portrait mode - add left/right padding
            paddingConfig = { color: '#000000', width: 100, height: 0 };
        } else if (aspectRatio === '16:9') {
            // Landscape mode - add top/bottom padding
            paddingConfig = { color: '#000000', width: 0, height: 100 };
        }

        return {
            ...clipData,
            downloadUrl: `https://cdn.example.com/shorts/${clipData.id}.mp4`,
            padding: paddingConfig,
            fileSize: '45MB',
            quality: '1080p',
        };
    }

    async storeClipMetadata(videoId, clipData) {
        console.log('💾 Storing clip metadata...');

        try {
            await axios.post(
                `${this.backendUrl}/api/shorts/${clipData.id}`,
                {
                    videoId,
                    metadata: clipData,
                }
            );
        } catch (error) {
            console.error('Failed to store metadata:', error.message);
        }
    }
}

module.exports = ShortsGenerator;
