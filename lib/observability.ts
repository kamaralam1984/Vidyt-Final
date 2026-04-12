import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'viralboost-ai' },
});

export function logError(event: string, error: unknown, context?: Record<string, any>) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error({ event, message, context }, message);
}

export function logInfo(event: string, context?: Record<string, any>) {
  logger.info({ event, context });
}
