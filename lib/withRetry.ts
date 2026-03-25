function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type WithRetryOptions = {
  retries?: number; // total retries after first attempt
  delayMs?: number; // base delay
  retryOnError?: (err: unknown) => boolean;
  context?: Record<string, any>;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {}
): Promise<T> {
  const retries = typeof options.retries === 'number' ? options.retries : 2;
  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : 200;
  const retryOnError = options.retryOnError || (() => true);

  let attempt = 0;
  // attempt 0 = first try, attempt = retries => last throw
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const canRetry = attempt < retries && retryOnError(err);
      console.error('[withRetry] attempt failed', {
        attempt,
        retries,
        context: options.context,
        err: err instanceof Error ? err.message : err,
      });

      if (!canRetry) throw err;
      await sleep(delayMs * Math.pow(2, attempt));
      attempt += 1;
    }
  }
}

