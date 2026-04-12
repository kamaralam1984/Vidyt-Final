const { spawn } = require('node:child_process');
const path = require('node:path');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(url, { timeoutMs = 60_000, intervalMs = 500 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // ignore
    }
    if (Date.now() - start > timeoutMs) return false;
    await sleep(intervalMs);
  }
}

async function startNextServer({ port, env }) {
  const projectRoot = path.resolve(__dirname, '../..');
  const nextBin = path.join(projectRoot, 'node_modules', '.bin', 'next');
  const child = spawn(nextBin, ['dev', '-p', String(port)], {
    cwd: projectRoot,
    env: { ...process.env, ...env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (d) => {
    const line = String(d).trim();
    if (line) console.log('[next:stdout]', line.slice(0, 200));
  });
  child.stderr.on('data', (d) => {
    const line = String(d).trim();
    if (line) console.error('[next:stderr]', line.slice(0, 200));
  });

  const ok = await waitFor(`http://localhost:${port}/api/public/currency-rates`);
  if (!ok) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
    throw new Error(`Next server did not become ready on port ${port}`);
  }

  return {
    baseUrl: `http://localhost:${port}`,
    stop: async () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
      // Give it a moment to exit cleanly.
      await sleep(500);
    },
  };
}

module.exports = { startNextServer };

