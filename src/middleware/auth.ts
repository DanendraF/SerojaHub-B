import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

/**
 * Middleware autentikasi admin menggunakan Basic Auth dicocokkan dengan tabel users di database.
 * 
 * Frontend mengirim header: Authorization: Basic base64(username:password)
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token Basic Auth diperlukan.',
    });
    return;
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      res.status(401).json({
        success: false,
        message: 'Format kredensial tidak valid.',
      });
      return;
    }

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Username tidak ditemukan.',
      });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Password salah.',
      });
      return;
    }

    // Pasang info user ke request object (opsional)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    next();
  } catch {
    res.status(400).json({ success: false, message: 'Format autentikasi tidak valid.' });
  }
}
