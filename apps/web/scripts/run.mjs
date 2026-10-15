// Runs a TypeScript script that imports the site's own modules. Node cannot load extensionless
// TypeScript imports by itself, so Vite (already a dependency) loads the script instead.
// Usage: node scripts/run.mjs scripts/build-corpus.ts [arguments]
import { createServer } from 'vite';

const [entry, ...args] = process.argv.slice(2);
if (!entry) {
  console.error('Usage: node scripts/run.mjs <script.ts> [arguments]');
  process.exit(1);
}

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, ws: false },
  optimizeDeps: { noDiscovery: true },
});
try {
  const mod = await server.ssrLoadModule(entry);
  await mod.main(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await server.close();
}
