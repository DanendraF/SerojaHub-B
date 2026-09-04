import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadPlantPhoto } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export const uploadRouter = Router();

// Konfigurasi multer - simpan di memory (tidak ke disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'));
    } else {
      cb(null, true);
    }
  },
});

// ─── POST /api/upload/photo ──────────────────────────────────────────────────
// Upload foto tanaman ke Supabase Storage (admin only)
uploadRouter.post(
  '/photo',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(createError('File foto tidak ditemukan. Sertakan field "photo".', 400));
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const filename = `plants/${uuidv4()}${ext}`;

      const publicUrl = await uploadPlantPhoto(req.file.buffer, filename, req.file.mimetype);

      res.status(201).json({
        success: true,
        message: 'Foto berhasil diupload.',
        url: publicUrl,
        data: { url: publicUrl, filename },
      });
    } catch (err) {
      next(err);
    }
  },
);
