import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { deletePlantPhoto } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { PlantStatus } from '@prisma/client';

export const plantsRouter = Router();

/** Safely cast query/body/params values to string */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const str = (v: any): string => String(v ?? '');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strOrNull = (v: any): string | null => (v !== undefined && v !== '' ? String(v) : null);

// ─── Helper ────────────────────────────────────────────────────────────────
function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
}

// ─── GET /api/plants ────────────────────────────────────────────────────────
// Ambil semua tanaman (publik)
plantsRouter.get(
  '/',
  [
    query('type').optional().isString(),
    query('status').optional().isIn(Object.values(PlantStatus)),
    query('search').optional().isString(),
    query('lokasi_bedeng').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as string | undefined;
      const status = req.query.status as PlantStatus | undefined;
      const search = req.query.search as string | undefined;
      const lokasi_bedeng = req.query.lokasi_bedeng as string | undefined;

      const plants = await prisma.plant.findMany({
        where: {
          ...(type && { type: { equals: type, mode: 'insensitive' } }),
          ...(status && { status }),
          ...(lokasi_bedeng && {
            lokasi_bedeng: { equals: lokasi_bedeng, mode: 'insensitive' },
          }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { type: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: { species: true },
        orderBy: { created_at: 'desc' },
      });

      res.json({ success: true, data: plants, total: plants.length });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/plants/:id ────────────────────────────────────────────────────
// Detail satu tanaman (publik)
plantsRouter.get(
  '/:id',
  [param('id').notEmpty().withMessage('ID tanaman diperlukan')],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plant = await prisma.plant.findUnique({ 
        where: { id: str(req.params.id) },
        include: { species: true } 
      });

      if (!plant) {
        return next(createError('Tanaman tidak ditemukan.', 404));
      }

      res.json({ success: true, data: plant });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/plants ───────────────────────────────────────────────────────
// Tambah tanaman baru (admin only)
plantsRouter.post(
  '/',
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Nama tanaman wajib diisi').trim(),
    body('type').notEmpty().withMessage('Jenis tanaman wajib diisi').trim(),
    body('speciesId').optional().trim(),
    body('planting_date').notEmpty().isISO8601().withMessage('Tanggal tanam tidak valid'),
    body('estimated_harvest_date')
      .notEmpty()
      .isISO8601()
      .withMessage('Perkiraan panen tidak valid'),
    body('lokasi_bedeng').optional().trim(),
    body('photo_url').optional().isURL().withMessage('URL foto tidak valid'),
    body('description').optional().trim(),
    body('cara_tanam').optional().trim(),
    body('manfaat').optional().trim(),
    body('catatan_pengelola').optional().trim(),
    body('status')
      .optional()
      .isIn(Object.values(PlantStatus))
      .withMessage('Status tidak valid'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, string | undefined>;
      const {
        name, type, speciesId, lokasi_bedeng, planting_date,
        estimated_harvest_date, photo_url, description,
        cara_tanam, manfaat, catatan_pengelola, status,
      } = body;

      const plant = await prisma.plant.create({
        data: {
          name: name!,
          type: type!,
          speciesId: speciesId ?? null,
          lokasi_bedeng: lokasi_bedeng ?? null,
          planting_date: new Date(planting_date!),
          estimated_harvest_date: new Date(estimated_harvest_date!),
          photo_url: photo_url ?? null,
          description: description ?? null,
          cara_tanam: cara_tanam ?? null,
          manfaat: manfaat ?? null,
          catatan_pengelola: catatan_pengelola ?? null,
          status: (status as PlantStatus | undefined) ?? PlantStatus.TUMBUH,
        },
      });

      // Catat aktivitas
      await prisma.activityLog.create({
        data: {
          aksi: 'tambah_tanaman',
          target_id: plant.id,
          deskripsi: `Tanaman "${plant.name}" ditambahkan ke ${plant.lokasi_bedeng ?? 'kebun'}.`,
        },
      });

      res.status(201).json({
        success: true,
        message: `Tanaman "${plant.name}" berhasil ditambahkan.`,
        data: plant,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PUT /api/plants/:id ────────────────────────────────────────────────────
// Update tanaman (admin only)
plantsRouter.put(
  '/:id',
  requireAdmin,
  [
    param('id').notEmpty(),
    body('name').optional().notEmpty().trim(),
    body('type').optional().notEmpty().trim(),
    body('speciesId').optional().trim(),
    body('planting_date').optional().isISO8601(),
    body('estimated_harvest_date').optional().isISO8601(),
    body('lokasi_bedeng').optional().trim(),
    body('photo_url').optional().isURL(),
    body('status').optional().isIn(Object.values(PlantStatus)),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.plant.findUnique({ where: { id: str(req.params.id) } });
      if (!existing) return next(createError('Tanaman tidak ditemukan.', 404));

      const b = req.body as Record<string, string | undefined>;
      const {
        name, type, speciesId, lokasi_bedeng, planting_date,
        estimated_harvest_date, photo_url, description,
        cara_tanam, manfaat, catatan_pengelola, status,
      } = b;

      const plant = await prisma.plant.update({
        where: { id: str(req.params.id) },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(speciesId !== undefined && { speciesId: speciesId || null }),
          ...(lokasi_bedeng !== undefined && { lokasi_bedeng }),
          ...(planting_date && { planting_date: new Date(planting_date) }),
          ...(estimated_harvest_date && {
            estimated_harvest_date: new Date(estimated_harvest_date),
          }),
          ...(photo_url !== undefined && { photo_url }),
          ...(description !== undefined && { description }),
          ...(cara_tanam !== undefined && { cara_tanam }),
          ...(manfaat !== undefined && { manfaat }),
          ...(catatan_pengelola !== undefined && { catatan_pengelola }),
          ...(status && { status: status as PlantStatus }),
        },
      });

      await prisma.activityLog.create({
        data: {
          aksi: 'update_tanaman',
          target_id: plant.id,
          deskripsi: `Tanaman "${plant.name}" diperbarui.`,
        },
      });

      res.json({
        success: true,
        message: `Tanaman "${plant.name}" berhasil diperbarui.`,
        data: plant,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/plants/:id ─────────────────────────────────────────────────
// Hapus tanaman (admin only)
plantsRouter.delete(
  '/:id',
  requireAdmin,
  [param('id').notEmpty()],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.plant.findUnique({ where: { id: str(req.params.id) } });
      if (!existing) return next(createError('Tanaman tidak ditemukan.', 404));

      // Hapus foto dari Supabase Storage jika ada
      if (existing.photo_url) {
        await deletePlantPhoto(existing.photo_url);
      }

      await prisma.plant.delete({ where: { id: str(req.params.id) } });

      await prisma.activityLog.create({
        data: {
          aksi: 'hapus_tanaman',
          target_id: existing.id,
          deskripsi: `Tanaman "${existing.name}" dihapus.`,
        },
      });

      res.json({
        success: true,
        message: `Tanaman "${existing.name}" berhasil dihapus.`,
      });
    } catch (err) {
      next(err);
    }
  },
);
