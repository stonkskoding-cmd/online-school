import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { auth, AuthRequest } from '../middleware/auth';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const loginSchema = z.object({
  body: z
    .object({
      password: z.string().min(6, 'Пароль не менее 6 символов'),
      email: z.string().optional(),
      username: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const email = data.email?.trim() ?? '';
      const username = data.username?.trim() ?? '';
      const hasEmail = email.length > 0;
      const hasUsername = username.length > 0;
      if (hasEmail === hasUsername) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите email или логин (одно из полей)',
          path: ['body'],
        });
        return;
      }
      if (hasEmail && !z.string().email().safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Некорректный email',
          path: ['email'],
        });
      }
    }),
});

const adminLoginSchema = z.object({
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      role: user.role === 'admin' ? 'admin' : 'user',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const body = req.body as { email?: string; username?: string; password: string };
    const password = body.password;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    // Сначала вход администратора по логину из .env — без обращения к БД
    if (username.length > 0) {
      if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
        res.status(503).json({ message: 'Admin login is not configured' });
        return;
      }

      const isAdminUser =
        username.toLowerCase() === 'dinastia_admin' ||
        (env.ADMIN_USERNAME.length > 0 && username === env.ADMIN_USERNAME);

      if (!isAdminUser || password !== env.ADMIN_PASSWORD) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, { expiresIn: '8h' });
      res.json({
        message: 'Admin login successful',
        token,
        role: 'admin',
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const role = user.role === 'admin' ? 'admin' : 'user';
    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      role,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logout successful' });
});

router.post('/admin-login', validate(adminLoginSchema), (req, res) => {
  const raw = req.body as { username: string; password: string };
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const { password } = raw;

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    res.status(503).json({ message: 'Admin login is not configured' });
    return;
  }

  const isAdminUser =
    username.toLowerCase() === 'dinastia_admin' ||
    (env.ADMIN_USERNAME.length > 0 && username === env.ADMIN_USERNAME);

  if (!isAdminUser || password !== env.ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ message: 'Admin login successful', token, role: 'admin' });
});

router.get('/me', auth, (req: AuthRequest, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
