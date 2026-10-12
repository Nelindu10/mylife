import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './app.ts';
import { connectDB } from './lib/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await connectDB();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nelli-Life dev server listening on http://0.0.0.0:${PORT}`);
  });
}

startDevServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
