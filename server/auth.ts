import { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { admins } from '@db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

declare module 'express-session' {
  interface SessionData {
    adminId: number;
  }
}

declare module 'express' {
  interface Request {
    admin?: { id: number; email: string };
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ message: 'Unauthorized', redirect: '/admin/login' });
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, req.session.adminId),
    });

    if (!admin) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Unauthorized', redirect: '/admin/login' });
    }

    req.admin = { id: admin.id, email: admin.email };
    next();
  } catch (error) {
    next(error);
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
