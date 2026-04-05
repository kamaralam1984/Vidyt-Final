import IORedis from 'ioredis';

let redisClient: IORedis | null = null;

function buildRedisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;
  if (password) return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  return `redis://${host}:${port}`;
}

export function getRedisOptions() {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  return { host, port, password, maxRetriesPerRequest: null };
}

export function getRedis() {
  if (redisClient) return redisClient;
  const options = getRedisOptions();
  redisClient = new IORedis(options);
  return redisClient;
}

export async function disconnectRedis() {
  if (!redisClient) return;
  try {
    redisClient.disconnect();
  } catch {
    // ignore
  } finally {
    redisClient = null;
  }
}
