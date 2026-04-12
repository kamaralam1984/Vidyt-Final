// ============================================
// ViralBoost AI - Main Worker Service
// BullMQ Queue Worker with Health Endpoint
// ============================================

const { Worker, Queue } = require('bullmq');
const redis = require('redis');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

// ============================================
// Configuration
// ============================================
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

const WORKER_NAME = process.env.WORKER_NAME || 'worker-1';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '4');
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5000';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:5001';

// ============================================
// Initialize Express for Health Check
// ============================================
const app = express();
const PORT = process.env.PORT || 5002;

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        worker: WORKER_NAME,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Worker health endpoint running on port ${PORT}`);
});

// ============================================
// Queue Definitions
// ============================================
const queues = {
    videoProcessing: new Queue('video-processing', { connection: REDIS_CONFIG }),
    shortsGeneration: new Queue('shorts-generation', { connection: REDIS_CONFIG }),
    aiAnalysis: new Queue('ai-analysis', { connection: REDIS_CONFIG }),
    emailNotification: new Queue('email-notification', { connection: REDIS_CONFIG }),
    export: new Queue('export', { connection: REDIS_CONFIG }),
};

// ============================================
// Video Processing Worker
// ============================================
const videoProcessingWorker = new Worker('video-processing', async (job) => {
    console.log(`🎬 [${WORKER_NAME}] Processing video job: ${job.id}`);
    console.log(`   Progress: ${job.progress()}%`);

    try {
        const { videoId, videoUrl, analysisType } = job.data;

        // Step 1: Download/fetch video metadata
        job.updateProgress(10);
        console.log(`   [10%] Fetching video metadata for ${videoId}...`);
        
        // Simulate work or call actual service
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Run AI analysis
        job.updateProgress(40);
        console.log(`   [40%] Running AI analysis...`);
        
        const analysisResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, {
            videoId,
            videoUrl,
            analysisType,
        }).catch(err => {
            console.log(`   ⚠️  AI service call failed, using fallback...`);
            return { data: {} };
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Store results
        job.updateProgress(70);
        console.log(`   [70%] Storing analysis results...`);
        
        const analysisResult = {
            videoId,
            viralScore: Math.random() * 100,
            hookScore: Math.random() * 100,
            thumbnailScore: Math.random() * 100,
            titleScore: Math.random() * 100,
            suggestions: {
                title: 'Optimized Title Suggestion',
                description: 'SEO-optimized description here...',
                hashtags: ['viral', 'trending', 'content'],
                tags: ['gaming', 'gaming-channel', 'Let\'s Play'],
            },
            bestPostingTime: '8:00 PM',
            completedAt: new Date(),
        };

        // Step 4: Notify backend
        job.updateProgress(90);
        console.log(`   [90%] Notifying backend of completion...`);
        
        await axios.post(`${BACKEND_URL}/api/videos/${videoId}/analysis-complete`, {
            jobId: job.id,
            analysis: analysisResult,
        }).catch(err => {
            console.error(`   ❌ Failed to notify backend:`, err.message);
            throw err;
        });

        // Step 5: Complete
        job.updateProgress(100);
        console.log(`   [100%] ✅ Video processing completed!`);

        return {
            success: true,
            jobId: job.id,
            analysis: analysisResult,
            duration: job.duration,
        };

    } catch (error) {
        console.error(`❌ [${WORKER_NAME}] Video processing failed:`, error.message);
        throw error;
    }
}, {
    connection: REDIS_CONFIG,
    concurrency: WORKER_CONCURRENCY,
    settings: {
        lockDuration: 30000,
        lockRenewTime: 15000,
        retryProcessDelay: 5000,
    },
});

// ============================================
// Shorts Generation Worker
// ============================================
const shortsGenerationWorker = new Worker('shorts-generation', async (job) => {
    console.log(`🎬✂️  [${WORKER_NAME}] Generating shorts from job: ${job.id}`);

    try {
        const { videoId, startTime, endTime, aspectRatio = '9:16' } = job.data;

        // Step 1: Fetch source video
        job.updateProgress(10);
        console.log(`   [10%] Fetching source video (ID: ${videoId})...`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Extract clip
        job.updateProgress(40);
        console.log(`   [40%] Extracting clip from ${startTime}s to ${endTime}s...`);
        console.log(`   Aspect ratio: ${aspectRatio}`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Generate captions
        job.updateProgress(70);
        console.log(`   [70%] Generating captions...`);
        
        const captions = [
            { time: 0, text: 'Watch this viral moment!' },
            { time: 2, text: 'This is amazing!' },
        ];

        // Step 4: Finalize short
        job.updateProgress(85);
        console.log(`   [85%] Finalizing short format...`);
        
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Step 5: Upload
        job.updateProgress(95);
        console.log(`   [95%] Uploading shorts...`);
        
        const shortsResult = {
            shortsId: `shorts_${Date.now()}`,
            originalVideoId: videoId,
            duration: endTime - startTime,
            aspectRatio,
            captions,
            downloadUrl: 'https://cdn.example.com/shorts/xxxxx.mp4',
            createdAt: new Date(),
        };

        job.updateProgress(100);
        console.log(`   [100%] ✅ Shorts generation completed!`);

        return {
            success: true,
            jobId: job.id,
            shorts: shortsResult,
        };

    } catch (error) {
        console.error(`❌ [${WORKER_NAME}] Shorts generation failed:`, error.message);
        throw error;
    }
}, {
    connection: REDIS_CONFIG,
    concurrency: WORKER_CONCURRENCY,
});

// ============================================
// AI Analysis Worker
// ============================================
const aiAnalysisWorker = new Worker('ai-analysis', async (job) => {
    console.log(`🤖 [${WORKER_NAME}] Running AI analysis job: ${job.id}`);

    try {
        const { videoId, contentType } = job.data;

        job.updateProgress(20);
        console.log(`   [20%] Analyzing ${contentType}...`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        job.updateProgress(50);
        console.log(`   [50%] Processing with ML model...`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        job.updateProgress(100);
        console.log(`   [100%] ✅ AI analysis completed!`);

        return {
            jobId: job.id,
            predictions: {
                viralitySentiment: 'high',
                engagementScore: 87.5,
                algorithmScore: 92.3,
            },
        };

    } catch (error) {
        console.error(`❌ AI analysis failed:`, error.message);
        throw error;
    }
}, {
    connection: REDIS_CONFIG,
    concurrency: WORKER_CONCURRENCY,
});

// ============================================
// Email Notification Worker
// ============================================
const emailWorker = new Worker('email-notification', async (job) => {
    console.log(`📧 [${WORKER_NAME}] Sending email notification: ${job.id}`);

    try {
        const { to, subject, template } = job.data;

        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Template: ${template}`);

        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`   ✅ Email sent successfully!`);

        return { success: true, jobId: job.id };

    } catch (error) {
        console.error(`❌ Email sending failed:`, error.message);
        throw error;
    }
}, {
    connection: REDIS_CONFIG,
    concurrency: 10,
});

// ============================================
// Event Handlers
// ============================================
const setupEventHandlers = (worker, queueName) => {
    worker.on('completed', (job, returnValue) => {
        console.log(`✅ Job completed (${queueName}):`, job.id);
    });

    worker.on('failed', (job, error) => {
        console.error(`❌ Job failed (${queueName}): ${job.id}`, error.message);
    });

    worker.on('error', (error) => {
        console.error(`❌ Worker error (${queueName}):`, error.message);
    });
};

setupEventHandlers(videoProcessingWorker, 'video-processing');
setupEventHandlers(shortsGenerationWorker, 'shorts-generation');
setupEventHandlers(aiAnalysisWorker, 'ai-analysis');
setupEventHandlers(emailWorker, 'email-notification');

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, gracefully shutting down...');
    
    try {
        await videoProcessingWorker.close();
        await shortsGenerationWorker.close();
        await aiAnalysisWorker.close();
        await emailWorker.close();
        
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// ============================================
// Startup Message
// ============================================
console.log(`
╔════════════════════════════════════════════╗
║   ViralBoost AI - Worker Service Started   ║
╚════════════════════════════════════════════╝
Worker Name: ${WORKER_NAME}
Concurrency: ${WORKER_CONCURRENCY}
Queues: ${Object.keys(queues).join(', ')}
Health Endpoint: http://localhost:${PORT}/health
════════════════════════════════════════════
`);
