import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Dev only: POST a JPEG data URL to /__snapshot?name=foo to save snapshots/foo.jpg (for visual comparisons). */
function snapshots(): Plugin {
  return {
    name: 'snapshots',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__snapshot', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const url = new URL(req.url ?? '', 'http://x');
        const name = (url.searchParams.get('name') ?? 'shot').replace(/[^a-z0-9_-]/gi, '');
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const b64 = body.replace(/^data:image\/\w+;base64,/, '');
          fs.mkdirSync('snapshots', { recursive: true });
          fs.writeFileSync(path.join('snapshots', `${name}.jpg`), Buffer.from(b64, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

// on Vercel, the site's address defaults to its production domain (VITE_SITE_URL wins when set)
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = process.env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : '');

export default defineConfig({
  base: './',
  define: siteUrl ? { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) } : {},
  server: { port: 5173 },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  plugins: [snapshots()],
});
