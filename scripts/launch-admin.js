const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Backend URL is read at container start (same value the previous dev server
// read from the environment) and injected into the static build at runtime, so
// a production build can target the right backend without a rebuild.
const BACKEND_URL = process.env.VITE_MEDUSA_BACKEND_URL || 'http://localhost:9000';

function launch() {
  console.log('🚀 Launching admin panel...\n');

  const distDir = path.join(__dirname, '..', 'dist');

  // A build is normally produced during the image build (`pnpm build`); build
  // here as a fallback if it's missing.
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('No production build found — running `vite build`...\n');
    execSync('vite build', { stdio: 'inherit', env: process.env });
  }

  // Inject runtime config into the static build.
  fs.writeFileSync(
    path.join(distDir, 'runtime-config.js'),
    `window.__RUNTIME_CONFIG__ = ${JSON.stringify({ backendUrl: BACKEND_URL })};\n`
  );
  console.log('✓ Runtime config written to dist/runtime-config.js\n');

  // Serve the production build (hashed static assets + SPA fallback). This
  // replaces the previous Vite dev server, which—when used to serve production
  // traffic—caused slow on-demand compiles and HMR-driven full-page reloads.
  // Passing --host/--port binds Railway's $PORT on 0.0.0.0 (the earlier raw
  // `vite preview` 502 was a port-binding issue).
  const port = process.env.PORT || '4173';
  console.log(`Serving production build via vite preview on port ${port}...\n`);
  try {
    execSync(`vite preview --host 0.0.0.0 --port ${port}`, {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (error) {
    console.error('Error starting preview server:', error.message);
    process.exit(1);
  }
}

launch();
