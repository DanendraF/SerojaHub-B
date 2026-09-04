import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export const kebunRouter = Router();

// ─── GET /api/kebun ─────────────────────────────────────────────────────────
// Ambil profil kebun (publik)
kebunRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.gardenProfile.findFirst({
      orderBy: { updated_at: 'desc' },
    });

    if (!profile) {
      return res.json({ success: true, data: null });
    }

    // Statistik tambahan
    const totalTanaman = await prisma.plant.count();
    const siapPanen = await prisma.plant.count({ where: { status: 'SIAP_PANEN' } });
    const tumbuh = await prisma.plant.count({ where: { status: 'TUMBUH' } });

    res.json({
      success: true,
      data: {
        ...profile,
        stats: {
          total_tanaman: totalTanaman,
          siap_panen: siapPanen,
          sedang_tumbuh: tumbuh,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/kebun ──────────────────────────────────────────────────────────
// Update profil kebun (admin only)
kebunRouter.put(
  '/',
  requireAdmin,
  [
    body('nama').notEmpty().withMessage('Nama kebun wajib diisi').trim(),
    body('deskripsi').optional().trim(),
    body('lokasi').optional().trim(),
    body('luas_area').optional().trim(),
    body('visi').optional().trim(),
    body('misi').optional().trim(),
    body('foto_url').optional().isURL().withMessage('URL foto tidak valid'),
    body('founded_at').optional().isISO8601(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { nama, deskripsi, lokasi, luas_area, visi, misi, foto_url, founded_at } =
        req.body;

      // Upsert - update jika sudah ada, buat baru jika belum
      const existing = await prisma.gardenProfile.findFirst();

      const upsertData = {
        nama,
        deskripsi: (deskripsi as string | undefined) ?? null,
        lokasi: (lokasi as string | undefined) ?? null,
        luas_area: (luas_area as string | undefined) ?? null,
        visi: (visi as string | undefined) ?? null,
        misi: (misi as string | undefined) ?? null,
        foto_url: (foto_url as string | undefined) ?? null,
        founded_at: founded_at ? new Date(founded_at as string) : null,
      };

      const profile =
        existing !== null
          ? await prisma.gardenProfile.update({
              where: { id: existing.id },
              data: upsertData,
            })
          : await prisma.gardenProfile.create({ data: upsertData });

      res.json({
        success: true,
        message: 'Profil kebun berhasil diperbarui.',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/kebun/aktivitas ────────────────────────────────────────────────
// Log aktivitas terbaru (publik, 20 terbaru)
kebunRouter.get('/aktivitas', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});
