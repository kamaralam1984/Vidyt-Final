/**
 * Circuit Breaker Pattern
 * Auto-disables failing APIs and auto-recovers when they become healthy again.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime: number;
  state: CircuitState;
  totalCalls: number;
  totalFailures: number;
}

const circuits = new Map<string, CircuitStats>();

const FAILURE_THRESHOLD = 3;       // failures before opening
const SUCCESS_THRESHOLD = 2;       // successes needed to close from HALF_OPEN
const RESET_TIMEOUT_MS = 60_000;   // 1 minute before trying HALF_OPEN

function getCircuit(name: string): CircuitStats {
  if (!circuits.has(name)) {
    circuits.set(name, {
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      totalCalls: 0,
      totalFailures: 0,
    });
  }
  return circuits.get(name)!;
}

export function isCircuitOpen(name: string): boolean {
  const circuit = getCircuit(name);
  if (circuit.state === 'CLOSED') return false;
  if (circuit.state === 'OPEN') {
    // Check if we should try HALF_OPEN
    if (Date.now() - circuit.lastFailureTime > RESET_TIMEOUT_MS) {
      circuit.state = 'HALF_OPEN';
      circuit.failures = 0;
      circuit.successes = 0;
      return false; // Allow one test request
    }
    return true; // Still open
  }
  return false; // HALF_OPEN: allow test request
}

export function recordSuccess(name: string): void {
  const circuit = getCircuit(name);
  circuit.totalCalls++;
  if (circuit.state === 'HALF_OPEN') {
    circuit.successes++;
    if (circuit.successes >= SUCCESS_THRESHOLD) {
      circuit.state = 'CLOSED';
      circuit.failures = 0;
      circuit.successes = 0;
      console.log(`[CircuitBreaker] ${name} RECOVERED → CLOSED`);
    }
  } else {
    circuit.failures = 0; // Reset failures on success
  }
}

export function recordFailure(name: string): void {
  const circuit = getCircuit(name);
  circuit.failures++;
  circuit.totalFailures++;
  circuit.totalCalls++;
  circuit.lastFailureTime = Date.now();
  if (circuit.state === 'CLOSED' && circuit.failures >= FAILURE_THRESHOLD) {
    circuit.state = 'OPEN';
    console.warn(`[CircuitBreaker] ${name} TRIPPED → OPEN (${circuit.failures} failures)`);
  } else if (circuit.state === 'HALF_OPEN') {
    circuit.state = 'OPEN'; // Failed during test → back to OPEN
    console.warn(`[CircuitBreaker] ${name} FAILED test → back to OPEN`);
  }
}

export function getCircuitHealth(name: string): CircuitStats & { name: string } {
  return { name, ...getCircuit(name) };
}

export function getAllCircuitHealth(): Array<CircuitStats & { name: string }> {
  return Array.from(circuits.entries()).map(([name, stats]) => ({ name, ...stats }));
}

export function resetCircuit(name: string): void {
  const circuit = getCircuit(name);
  circuit.state = 'CLOSED';
  circuit.failures = 0;
  circuit.successes = 0;
  circuit.lastFailureTime = 0;
  console.log(`[CircuitBreaker] ${name} manually RESET`);
}

export function forceOpenCircuit(name: string): void {
  const circuit = getCircuit(name);
  circuit.state = 'OPEN';
  circuit.lastFailureTime = Date.now();
  console.log(`[CircuitBreaker] ${name} manually OPENED`);
}
