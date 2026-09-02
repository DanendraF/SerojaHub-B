import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';

export const speciesRouter = Router();

// Helper
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined);

// ─── GET /api/species ─────────────────────────────────
// Daftar semua jenis tanaman + jumlah bedeng aktif
speciesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const species = await prisma.plantSpecies.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { plants: true } },
      },
    });
    res.json({ success: true, data: species });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/species/:id ─────────────────────────────
// Detail satu jenis + semua bedeng tanaman tersebut
speciesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const species = await prisma.plantSpecies.findUnique({
      where: { id: req.params.id },
      include: {
        plants: {
          orderBy: { planting_date: 'desc' },
        },
      },
    });
    if (!species) {
      res.status(404).json({ success: false, message: 'Jenis tanaman tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: species });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/species ────────────────────────────────
speciesRouter.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, description, manfaat, cara_tanam, photo_url } = req.body;
    if (!name || !category) {
      res.status(400).json({ success: false, message: 'name dan category wajib diisi' });
      return;
    }
    const species = await prisma.plantSpecies.create({
      data: {
        name: str(name)!,
        category: str(category)!,
        description: str(description),
        manfaat: str(manfaat),
        cara_tanam: str(cara_tanam),
        photo_url: str(photo_url),
      },
    });
    res.status(201).json({ success: true, data: species });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/species/:id ─────────────────────────────
speciesRouter.put('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, description, manfaat, cara_tanam, photo_url } = req.body;
    const species = await prisma.plantSpecies.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: str(name) }),
        ...(category && { category: str(category) }),
        description: str(description) ?? null,
        manfaat: str(manfaat) ?? null,
        cara_tanam: str(cara_tanam) ?? null,
        photo_url: str(photo_url) ?? null,
      },
    });
    res.json({ success: true, data: species });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/species/:id ──────────────────────────
speciesRouter.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lepaskan relasi plant terlebih dahulu
    await prisma.plant.updateMany({
      where: { speciesId: req.params.id },
      data: { speciesId: null },
    });
    await prisma.plantSpecies.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Jenis tanaman berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});