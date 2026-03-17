/**
 * Viral prediction neural network using TensorFlow.js (Node).
 * Architecture: 10 inputs -> Dense(64, ReLU) -> Dropout(0.2) -> Dense(128, ReLU) -> Dropout(0.3) -> Dense(64, ReLU) -> Dropout(0.2) -> Dense(1, Sigmoid)
 */

import * as tf from '@tensorflow/tfjs';
import path from 'path';
import fs from 'fs/promises';
import { normalizeFeatures, type ViralFeatures } from './featureUtils';

// Ensure we are using the CPU backend in a Node environment without tfjs-node
if (typeof window === 'undefined') {
  tf.setBackend('cpu');
}

const MODEL_DIR = path.join(process.cwd(), 'data', 'viral_models');
const DEFAULT_VERSION = 'model_v1';

export interface TrainingResult {
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  epochsRun: number;
  samplesUsed: number;
}

export interface TrainingSample {
  features: ViralFeatures;
  isViral: boolean;
}

function buildModel(): tf.Sequential {
  const model = tf.sequential();
  model.add(tf.layers.dense({
    inputShape: [10],
    units: 64,
    activation: 'relu',
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

export function prepareTensors(samples: TrainingSample[]) {
  const xs = samples.map(s => normalizeFeatures(s.features));
  const ys = samples.map(s => (s.isViral ? 1 : 0));
  const xTensor = tf.tensor2d(xs);
  const yTensor = tf.tensor2d(ys, [ys.length, 1]);
  return { xTensor, yTensor };
}

function computeMetrics(
  yTrue: number[],
  yPred: number[],
  threshold = 0.5
): { accuracy: number; precision: number; recall: number; f1Score: number } {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const pred = yPred[i] >= threshold ? 1 : 0;
    const trueVal = yTrue[i];
    if (trueVal === 1 && pred === 1) tp++;
    else if (trueVal === 0 && pred === 1) fp++;
    else if (trueVal === 0 && pred === 0) tn++;
    else fn++;
  }
  const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { accuracy, precision, recall, f1Score };
}

/**
 * Custom IOHandler for Node.js filesystem without @tensorflow/tfjs-node
 */
function getFileSystemHandler(savePath: string): tf.io.IOHandler {
  return {
    save: async (modelArtifacts) => {
      await fs.mkdir(savePath, { recursive: true });
      const weightsPath = path.join(savePath, 'weights.bin');
      const modelJsonPath = path.join(savePath, 'model.json');

      const modelJson: any = {
        modelTopology: modelArtifacts.modelTopology,
        format: modelArtifacts.format,
        generatedBy: modelArtifacts.generatedBy,
        convertedBy: modelArtifacts.convertedBy,
        weightsManifest: [{
          paths: ['./weights.bin'],
          weights: modelArtifacts.weightSpecs,
        }],
      };

      if (modelArtifacts.userDefinedMetadata) {
        modelJson.userDefinedMetadata = modelArtifacts.userDefinedMetadata;
      }

      await fs.writeFile(modelJsonPath, JSON.stringify(modelJson));
      if (modelArtifacts.weightData) {
        const data = modelArtifacts.weightData instanceof ArrayBuffer
          ? Buffer.from(modelArtifacts.weightData)
          : Buffer.concat(modelArtifacts.weightData.map(ab => Buffer.from(ab)));
        await fs.writeFile(weightsPath, data);
      }

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          modelTopologyBytes: JSON.stringify(modelArtifacts.modelTopology).length,
          weightSpecsBytes: JSON.stringify(modelArtifacts.weightSpecs).length,
          weightDataBytes: modelArtifacts.weightData
            ? (modelArtifacts.weightData instanceof ArrayBuffer
              ? modelArtifacts.weightData.byteLength
              : modelArtifacts.weightData.reduce((acc, ab) => acc + ab.byteLength, 0))
            : 0,
        },
      };
    },
    load: async () => {
      const modelJsonPath = path.join(savePath, 'model.json');
      const weightsPath = path.join(savePath, 'weights.bin');

      const modelJson = JSON.parse(await fs.readFile(modelJsonPath, 'utf8'));
      const modelArtifacts: tf.io.ModelArtifacts = {
        modelTopology: modelJson.modelTopology,
        format: modelJson.format,
        generatedBy: modelJson.generatedBy,
        convertedBy: modelJson.convertedBy,
        userDefinedMetadata: modelJson.userDefinedMetadata,
      };

      if (modelJson.weightsManifest) {
        const weightSpecs = modelJson.weightsManifest[0].weights;
        const weightData = await fs.readFile(weightsPath);
        modelArtifacts.weightSpecs = weightSpecs;
        modelArtifacts.weightData = weightData.buffer;
      }

      return modelArtifacts;
    }
  };
}

export async function trainModel(
  samples: TrainingSample[],
  options: { epochs?: number; batchSize?: number; validationSplit?: number; version?: string } = {}
): Promise<TrainingResult> {
  const epochs = options.epochs ?? 50;
  const batchSize = options.batchSize ?? 32;
  const validationSplit = options.validationSplit ?? 0.2;
  const version = options.version ?? DEFAULT_VERSION;

  if (samples.length < 50) {
    throw new Error('At least 50 samples required for training');
  }

  await fs.mkdir(MODEL_DIR, { recursive: true });

  const { xTensor, yTensor } = prepareTensors(samples);

  const model = buildModel();

  const splitIdx = Math.floor(samples.length * (1 - validationSplit));
  const xTrain = xTensor.slice(0, splitIdx);
  const yTrain = yTensor.slice(0, splitIdx);
  const xVal = xTensor.slice(splitIdx, samples.length - splitIdx);
  const yVal = yTensor.slice(splitIdx, samples.length - splitIdx);

  const history = await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationData: [xVal, yVal],
  });

  const valPred = model.predict(xVal) as tf.Tensor;
  const valPredArr = (await valPred.data()) as Float32Array;
  const valTrueArr = (await yVal.data()) as Float32Array;
  const valTrue = Array.from(valTrueArr);
  const valPredList = Array.from(valPredArr);
  const metrics = computeMetrics(valTrue, valPredList);

  tf.dispose([xTensor, yTensor, xTrain, yTrain, xVal, yVal, valPred]);

  const hist = history.history as Record<string, number[]>;
  const lastEpoch = hist.loss?.length ?? epochs;
  const lastLoss = hist.loss?.[lastEpoch - 1] ?? 0;
  const lastValLoss = (hist.val_loss ?? hist.valLoss)?.[lastEpoch - 1] ?? 0;
  const lastAcc = (hist.acc ?? hist.accuracy)?.[lastEpoch - 1] ?? metrics.accuracy;
  const lastValAcc = (hist.val_acc ?? hist.valAccuracy)?.[lastEpoch - 1] ?? metrics.accuracy;

  const savePath = path.join(MODEL_DIR, version);
  await model.save(getFileSystemHandler(savePath));
  model.dispose();

  return {
    version,
    accuracy: Number(lastAcc),
    precision: metrics.precision,
    recall: metrics.recall,
    f1Score: metrics.f1Score,
    loss: Number(lastLoss),
    valAccuracy: Number(lastValAcc),
    valLoss: Number(lastValLoss),
    epochsRun: lastEpoch,
    samplesUsed: samples.length,
  };
}

export async function loadModel(version: string = DEFAULT_VERSION): Promise<tf.LayersModel | null> {
  const savePath = path.join(MODEL_DIR, version);
  try {
    await fs.access(savePath);
    const model = await tf.loadLayersModel(getFileSystemHandler(savePath));
    return model;
  } catch {
    return null;
  }
}

export async function predictViralProbability(
  model: tf.LayersModel,
  features: ViralFeatures
): Promise<number> {
  const normalized = normalizeFeatures(features);
  const input = tf.tensor2d([normalized]);
  const pred = model.predict(input) as tf.Tensor;
  const value = (await pred.data())[0];
  tf.dispose([input, pred]);
  return Math.min(100, Math.max(0, value * 100));
}

export function getModelDir(): string {
  return MODEL_DIR;
}

export async function listSavedVersions(): Promise<string[]> {
  try {
    await fs.mkdir(MODEL_DIR, { recursive: true });
    const entries = await fs.readdir(MODEL_DIR, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && e.name.startsWith('model_')).map(e => e.name).sort();
  } catch {
    return [];
  }
}
