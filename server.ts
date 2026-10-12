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

  // In production or in serverless environments (Vercel), NEVER load Vite or bundlers.
  const isServerlessOrProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');

  if (!isServerlessOrProd) {
    // Dynamic import with variable prevents Vercel static bundlers from tracing Vite or Rolldown
    const vitePkg = 'vite';
    const { createServer } = await import(/* @vite-ignore */ vitePkg);
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve pre-built static files from dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Only bind port when running standalone (not inside a serverless function)
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Nelli-Life server listening on http://0.0.0.0:${PORT}`);
    });
  }
}

// Start standalone dev server only when not running on Vercel
if (!process.env.VERCEL) {
  startDevServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}

export default app;
