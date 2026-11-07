import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleApiRoute } from './src/server/apiHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Pass API routes through our API handler
app.use(async (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    try {
      const handled = await handleApiRoute(req, res);
      if (handled) return;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`GKEDIT AI server listening on port ${port}`);
});
