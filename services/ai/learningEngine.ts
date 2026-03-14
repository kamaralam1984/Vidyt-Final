/**
 * AI Learning Engine with TensorFlow
 * Trains models on viral dataset and improves predictions over time
 */

// Use browser version of TensorFlow.js (compatible with Next.js)
// Note: @tensorflow/tfjs-node has native dependencies that don't work in Next.js
let tf: any;
try {
  // Use browser version (works in both browser and Node.js via Next.js)
  tf = require('@tensorflow/tfjs-core');
  // Also load converter if needed
  if (typeof window === 'undefined') {
    // Server-side: use core only
    console.log('Using TensorFlow.js Core (server-side)');
  }
} catch (error) {
  console.warn('TensorFlow.js not available, using fallback predictions:', error);
  tf = null;
}
import ViralDataset from '@/models/ViralDataset';
import connectDB from '@/lib/mongodb';

export interface ModelMetrics {
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSamples: number;
  validationSamples: number;
}

export interface TrainingResult {
  success: boolean;
  metrics: ModelMetrics;
  modelVersion: string;
  trainingTime: number;
  improvements: {
    accuracy: number;
    loss: number;
  };
}

let viralModel: any = null;
let modelVersion = '1.0.0';
let lastTrainingDate: Date | null = null;

/**
 * Initialize or load the viral prediction model
 */
export async function initializeModel(): Promise<void> {
  if (!tf) {
    console.warn('TensorFlow.js not available, skipping model initialization');
    return;
  }

  try {
    // Try to load existing model
    // In production, load from file system or cloud storage
    console.log('Initializing AI Learning Engine...');
    
    // Create model architecture
    viralModel = createModelArchitecture();
    
    console.log('✅ AI Learning Engine initialized');
  } catch (error) {
    console.error('Failed to initialize model:', error);
    // Create new model if loading fails
    if (tf) {
      viralModel = createModelArchitecture();
    }
  }
}

/**
 * Create neural network model architecture
 */
function createModelArchitecture(): any {
  if (!tf) {
    throw new Error('TensorFlow.js not available');
  }

  const model = tf.sequential({
    layers: [
      // Input layer - 7 features
      tf.layers.dense({
        inputShape: [7],
        units: 64,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      // Hidden layers
      tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
      }),
      tf.layers.dropout({ rate: 0.3 }),
      
      tf.layers.dense({
        units: 64,
        activation: 'relu',
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      // Output layer - viral probability (0-100)
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }),
    ],
  });

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['accuracy', 'precision', 'recall'],
  });

  return model;
}

/**
 * Extract features from video data
 */
function extractFeatures(video: any): number[] {
  return [
    normalize(video.hookScore || 50, 0, 100),
    normalize(video.thumbnailScore || 50, 0, 100),
    normalize(video.titleScore || 50, 0, 100),
    normalize(video.trendingScore || 50, 0, 100),
    normalize(video.duration || 60, 0, 600), // Max 10 minutes
    normalize(video.engagementRate || 0, 0, 100),
    normalize(video.growthVelocity || 0, 0, 10000), // Views per hour
  ];
}

/**
 * Normalize value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Prepare training data from viral dataset
 */
async function prepareTrainingData(): Promise<{
  features: number[][];
  labels: number[];
}> {
  await connectDB();

  // Get viral and non-viral videos
  const viralVideos = await ViralDataset.find({ isViral: true })
    .limit(1000)
    .sort({ collectedAt: -1 });
  
  const nonViralVideos = await ViralDataset.find({ isViral: false })
    .limit(1000)
    .sort({ collectedAt: -1 });

  const features: number[][] = [];
  const labels: number[] = [];

  // Process viral videos
  viralVideos.forEach(video => {
    features.push(extractFeatures(video));
    labels.push(1.0); // Viral = 1.0
  });

  // Process non-viral videos
  nonViralVideos.forEach(video => {
    features.push(extractFeatures(video));
    labels.push(0.0); // Non-viral = 0.0
  });

  return { features, labels };
}

/**
 * Train the viral prediction model
 */
export async function trainModel(): Promise<TrainingResult> {
  const startTime = Date.now();
  
  try {
    if (!viralModel) {
      await initializeModel();
    }

    if (!viralModel) {
      throw new Error('Model not initialized');
    }

    console.log('📊 Preparing training data...');
    const { features, labels } = await prepareTrainingData();

    if (features.length < 100) {
      throw new Error('Insufficient training data. Need at least 100 samples.');
    }

    console.log(`📈 Training on ${features.length} samples...`);

    if (!tf) {
      throw new Error('TensorFlow.js not available');
    }

    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Split data (80% train, 20% validation)
    const splitIndex = Math.floor(features.length * 0.8);
    const trainXs = xs.slice([0, 0], [splitIndex, features[0].length]);
    const trainYs = ys.slice([0, 0], [splitIndex, 1]);
    const valXs = xs.slice([splitIndex, 0], [features.length - splitIndex, features[0].length]);
    const valYs = ys.slice([splitIndex, 0], [labels.length - splitIndex, 1]);

    // Train model
    const history = await viralModel.fit(trainXs, trainYs, {
      epochs: 50,
      batchSize: 32,
      validationData: [valXs, valYs],
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch: number, logs?: any) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
          }
        },
      },
    });

    // Calculate metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
    const finalAcc = history.history.acc[history.history.acc.length - 1] as number;
    const valLoss = history.history.val_loss[history.history.val_loss.length - 1] as number;
    const valAcc = history.history.val_acc[history.history.val_acc.length - 1] as number;

    // Calculate precision, recall, F1
    const predictions = viralModel.predict(valXs) as any;
    const predValues = await predictions.data();
    const trueValues = await valYs.data();
    
    let tp = 0, fp = 0, fn = 0;
    for (let i = 0; i < predValues.length; i++) {
      const pred = predValues[i] > 0.5 ? 1 : 0;
      const trueVal = trueValues[i];
      if (pred === 1 && trueVal === 1) tp++;
      else if (pred === 1 && trueVal === 0) fp++;
      else if (pred === 0 && trueVal === 1) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    // Cleanup tensors
    xs.dispose();
    ys.dispose();
    trainXs.dispose();
    trainYs.dispose();
    valXs.dispose();
    valYs.dispose();
    predictions.dispose();

    const trainingTime = Date.now() - startTime;
    modelVersion = incrementVersion(modelVersion);
    lastTrainingDate = new Date();

    const metrics: ModelMetrics = {
      accuracy: valAcc,
      loss: valLoss,
      precision,
      recall,
      f1Score,
      trainingSamples: splitIndex,
      validationSamples: features.length - splitIndex,
    };

    console.log('✅ Model training complete!');
    console.log(`📊 Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`📉 Loss: ${metrics.loss.toFixed(4)}`);
    console.log(`🎯 F1 Score: ${metrics.f1Score.toFixed(4)}`);

    return {
      success: true,
      metrics,
      modelVersion,
      trainingTime,
      improvements: {
        accuracy: metrics.accuracy,
        loss: metrics.loss,
      },
    };
  } catch (error: any) {
    console.error('Training error:', error);
    return {
      success: false,
      metrics: {
        accuracy: 0,
        loss: 1,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingSamples: 0,
        validationSamples: 0,
      },
      modelVersion,
      trainingTime: Date.now() - startTime,
      improvements: {
        accuracy: 0,
        loss: 0,
      },
    };
  }
}

/**
 * Predict viral probability using trained model
 */
export async function predictWithModel(features: number[]): Promise<number> {
  if (!tf) {
    return predictFallback(features);
  }

  try {
    if (!viralModel) {
      await initializeModel();
    }

    if (!viralModel || !tf) {
      // Fallback to rule-based prediction
      return predictFallback(features);
    }

    const input = tf.tensor2d([features]);
    const prediction = viralModel.predict(input) as any;
    const value = await prediction.data();
    
    input.dispose();
    prediction.dispose();

    // Convert to percentage (0-100)
    return Math.round(value[0] * 100);
  } catch (error) {
    console.error('Prediction error:', error);
    return predictFallback(features);
  }
}

/**
 * Fallback prediction when model is not available
 */
function predictFallback(features: number[]): number {
  // Simple weighted average
  const weights = [0.25, 0.25, 0.20, 0.15, 0.05, 0.05, 0.05];
  let score = 0;
  for (let i = 0; i < features.length && i < weights.length; i++) {
    score += features[i] * weights[i] * 100;
  }
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Get model information
 */
export function getModelInfo(): {
  version: string;
  lastTrainingDate: Date | null;
  isLoaded: boolean;
} {
  return {
    version: modelVersion,
    lastTrainingDate,
    isLoaded: viralModel !== null,
  };
}

/**
 * Increment version number
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');
  const minor = parseInt(parts[2] || '0') + 1;
  return `${parts[0]}.${parts[1]}.${minor}`;
}

/**
 * Save model to file system
 */
export async function saveModel(path: string): Promise<void> {
  if (!viralModel) {
    throw new Error('No model to save');
  }
  await viralModel.save(`file://${path}`);
}

/**
 * Load model from file system
 */
export async function loadModel(path: string): Promise<void> {
  try {
    viralModel = await tf.loadLayersModel(`file://${path}/model.json`);
    console.log('✅ Model loaded successfully');
  } catch (error) {
    console.error('Failed to load model:', error);
    throw error;
  }
}
