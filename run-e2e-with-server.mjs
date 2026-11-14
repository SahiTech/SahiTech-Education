import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkServer(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 500) {
        return true;
      }
    } catch {
      // server starting up
    }
    await wait(400);
  }
  return false;
}

async function main() {
  const PORT = 3000;
  const BASE_URL = `http://localhost:${PORT}`;

  console.log(`[E2E Runner] Spawning Next.js production server on port ${PORT}...`);
  const server = spawn('cmd.exe', ['/c', 'pnpm', '--filter', 'web', 'start', '-p', String(PORT)], {
    cwd: __dirname,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (d) => {
    const s = d.toString();
    if (s.includes('Ready') || s.includes('Local:')) {
      console.log(`[Next.js Server]: ${s.trim()}`);
    }
  });

  server.stderr.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.error(`[Next.js Stderr]: ${s}`);
  });

  let hasExited = false;
  server.on('exit', (code) => {
    hasExited = true;
  });

  try {
    console.log('[E2E Runner] Waiting for Next.js server readiness on ' + BASE_URL + '...');
    const isReady = await checkServer(`${BASE_URL}/`, 15000);
    if (!isReady) {
      throw new Error('Next.js server failed to respond within 15 seconds.');
    }
    console.log('[E2E Runner] Next.js is READY. Executing E2E test flows...\n');

    // Run test-e2e assertions
    const { runE2E } = await import('./test-e2e.mjs');
    if (typeof runE2E === 'function') {
      await runE2E();
    }
  } catch (err) {
    console.error('[E2E Runner Error]:', err.message);
    process.exitCode = 1;
  } finally {
    console.log('\n[E2E Runner] Terminating Next.js server tree...');
    if (!hasExited) {
      spawn('taskkill', ['/pid', String(server.pid), '/T', '/F']);
    }
    await wait(1000);
    console.log('[E2E Runner] Cleanup complete.');
  }
}

main();
