import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { auth, admin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { PackageCategory, PackageMaterial } from '../models/types';

const router = Router();

const packageSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().min(3),
    price: z.number().positive(),
    category: z.custom<PackageCategory>((value) =>
      ['OGE-IST', 'EGE-IST', 'EGE-SOC'].includes(String(value))
    ),
    coverUrl: z.string().optional().nullable(),
    materials: z
      .array(
        z
          .object({
            type: z.enum(['video', 'text', 'image', 'file']),
            url: z.string().optional(),
            content: z.string().optional(),
            title: z.string().optional(),
            order: z.number().int().nonnegative().optional(),
          })
          .superRefine((m, ctx) => {
            const url = (m.url ?? '').trim();
            const content = (m.content ?? '').trim();
            if (m.type === 'text') {
              if (!content && !url) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Пустой текст', path: ['content'] });
              }
            } else if (!url && !content) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Нет URL', path: ['url'] });
            }
          }),
      )
      .optional(),
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = category ? { category: String(category) } : {};

    const packages = await prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ packages });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const pkg = await prisma.package.findUnique({ where: { slug } });
    
    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    res.json({ package: pkg });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug/content', auth, async (req: AuthRequest, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user!.id;

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId,
        status: 'paid',
        package: { slug },
      },
    });

    const pkg = await prisma.package.findUnique({ where: { slug } });
    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    const hasAccess = Boolean(purchase);

    if (!hasAccess) {
      res.status(403).json({ message: 'No access to this package. Please purchase it first.' });
      return;
    }

    res.json({ package: pkg });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, admin, validate(packageSchema), async (req, res, next) => {
  try {
    const { title, slug, description, price, category, materials, coverUrl } = req.body as {
      title: string;
      slug: string;
      description: string;
      price: number;
      category: string;
      materials?: unknown[];
      coverUrl?: string | null;
    };
    const mats = Array.isArray(materials) ? materials : [];
    const cover = typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null;

    const existingPackage = await prisma.package.findUnique({ where: { slug } });
    if (existingPackage) {
      res.status(400).json({ message: 'Package with this slug already exists' });
      return;
    }

    const pkg = await prisma.package.create({
      data: {
        title,
        slug,
        description,
        price,
        category,
        coverUrl: cover,
        materials: (mats.length ? mats : []) as unknown as object,
      },
    });

    res.status(201).json({
      message: 'Package created successfully',
      package: pkg,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, admin, validate(packageSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, description, price, category, materials, coverUrl } = req.body as {
      title: string;
      slug: string;
      description: string;
      price: number;
      category: string;
      materials?: unknown[];
      coverUrl?: string | null;
    };
    const mats = Array.isArray(materials) ? materials : [];
    const cover = typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null;

    const exists = await prisma.package.findUnique({ where: { id } });
    if (!exists) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        price,
        category,
        coverUrl: cover,
        materials: (mats.length ? mats : []) as unknown as object,
      },
    });

    res.json({
      message: 'Package updated successfully',
      package: pkg,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, admin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkg = await prisma.package.delete({ where: { id } }).catch(() => null);

    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
