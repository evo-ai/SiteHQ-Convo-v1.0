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

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, req.session.adminId),
    });

    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

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