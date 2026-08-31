import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { plantsRouter } from './routes/plants';
import { kebunRouter } from './routes/kebun';
import { uploadRouter } from './routes/upload';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requireAdmin } from './middleware/auth';
import { prisma } from './lib/prisma';

// ─── App Setup ───────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT ?? 5000;

// ─── Middleware Global ────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: '🌿 Seroja Backend berjalan dengan baik.',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth Verify ──────────────────────────────────────────────────────────────
app.get('/api/auth/verify', requireAdmin, (req: any, res) => {
  res.json({
    success: true,
    message: 'Autentikasi berhasil',
    user: req.user,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/plants', plantsRouter);
app.use('/api/kebun', kebunRouter);
app.use('/api/upload', uploadRouter);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
async function main() {
  try {
    // Test koneksi database
    await prisma.$connect();
    console.log('✅ Terhubung ke database Supabase');

    app.listen(PORT, () => {
      console.log(`\n🌿 Seroja Backend berjalan di http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV ?? 'development'}`);
      console.log(`   API Health  : http://localhost:${PORT}/api/health`);
      console.log(`   Plants API  : http://localhost:${PORT}/api/plants`);
      console.log(`   Kebun API   : http://localhost:${PORT}/api/kebun`);
      console.log(`   Upload API  : http://localhost:${PORT}/api/upload/photo\n`);
    });
  } catch (err) {
    console.error('❌ Gagal terhubung ke database:', err);
    process.exit(1);
  }
}

main().then(() => {
  // ─── Keep-Alive: Ping diri sendiri ──────────────────────────────────────────
  // Mencegah server tidur di hosting free tier (Render, Railway, dll.)
  // Ping setiap 14 menit (840_000 ms)
  if (process.env.NODE_ENV === 'production' && process.env.SELF_URL) {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 menit

    setInterval(async () => {
      try {
        const res = await fetch(`${process.env.SELF_URL}/api/health`);
        const data = (await res.json()) as any;
        console.log(`[keep-alive] ping OK — ${data.timestamp}`);
      } catch (err) {
        console.warn('[keep-alive] ping gagal:', err);
      }
    }, PING_INTERVAL);

    // ─── Keep-Alive: Query ringan ke Supabase ─────────────────────────────────
    // Mencegah Supabase pause setelah 1 minggu tidak aktif
    const DB_PING_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam

    setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('[db keep-alive] Supabase tetap aktif');
      } catch (err) {
        console.warn('[db keep-alive] query gagal:', err);
      }
    }, DB_PING_INTERVAL);

    console.log('🔁 Keep-alive aktif (ping setiap 14 menit, DB ping setiap 6 jam)');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹ Menutup server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
