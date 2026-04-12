import mongoose from 'mongoose';

// Next dev server can load `.env.local` and overwrite `NODE_ENV`, which would
// break our test database routing. Prefer the explicit test DB when the
// test harness flags are enabled.
const shouldUseTestDb =
  process.env.MONGODB_URI_TEST &&
  (process.env.NODE_ENV === 'test' ||
    process.env.AI_TEST_MODE === 'true' ||
    process.env.ENABLE_TEST_AUTH_HEADER === 'true');

const MONGODB_URI = shouldUseTestDb
  ? process.env.MONGODB_URI_TEST
  : process.env.NODE_ENV === 'test'
    ? process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/viralboost_test'
    : process.env.MONGODB_URI || 'mongodb://localhost:27017/viralboost';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Make the value type-safe for TS: the guard above guarantees this is a non-empty string.
const MONGODB_URI_SAFE: string = MONGODB_URI as string;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // If we already have an active connection, reuse it.
  // If it was previously closed, `cached.conn`/`cached.promise` may still be set;
  // reset cache so we reconnect.
  if (cached.conn) {
    if (mongoose.connection?.readyState === 1) return cached.conn;
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      /** Atlas / slow networks: default 10s often fails with TLS handshake timeouts */
      serverSelectionTimeoutMS: 30_000,
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 30_000,
      /** Prefer IPv4 when IPv6 routes are broken (common on some LANs) */
      family: 4 as const,
      maxPoolSize: 10,
    };

    cached.promise = (async () => {
      // Transient startup/connect issues can happen in CI/dev.
      // Retry a few times to avoid failing the first request.
      const attempts = 3;
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          const conn = await mongoose.connect(MONGODB_URI_SAFE, opts);
          console.log('MongoDB connected successfully');
          return conn;
        } catch (error) {
          console.error('MongoDB connection error:', error);
          cached.promise = null; // allow next attempt / next call to recreate
          if (attempt >= attempts - 1) throw error;
          const delay = 200 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      throw new Error('MongoDB connection retry loop exited unexpectedly');
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to connect to MongoDB:', e);
    throw new Error('Database connection failed. Please ensure MongoDB is running.');
  }

  return cached.conn;
}

export default connectDB;
