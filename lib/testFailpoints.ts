const failedOnce = new Set<string>();

function enabled() {
  return process.env.NODE_ENV === 'test' && process.env.TEST_FAILPOINT && process.env.TEST_FAILPOINT !== '';
}

/**
 * Inject a one-time failure in tests.
 * Set TEST_FAILPOINT="payment_db_write" to fail once at that stage.
 */
export function maybeFailpoint(key: string): void {
  if (!enabled()) return;
  if (String(process.env.TEST_FAILPOINT) !== key) return;
  if (failedOnce.has(key)) return;
  failedOnce.add(key);
  throw new Error(`Injected test failure: ${key}`);
}

export function resetFailpoints() {
  failedOnce.clear();
}

