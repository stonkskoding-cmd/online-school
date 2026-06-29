import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { prisma } from '../lib/prisma';
import { emitNewMessage } from '../socket';
import upload from '../middleware/upload';
import { env } from '../config/env';
import { handleMulterError } from '../middleware/uploadRespond';
import { invalidatePackagesCache } from '../lib/memoryCache';

const router = Router();

const COUNTABLE_PURCHASE_STATUSES = ['paid', 'pending'] as const;

type PackageWithSales = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  coverUrl: string | null;
  materials: unknown;
  createdAt: Date;
  updatedAt: Date;
  salesCount: number;
  revenue: number;
};

async function loadPackagesWithSalesStats(): Promise<{
  packages: PackageWithSales[];
  stats: {
    totalSales: number;
    totalRevenue: number;
    totalPackages: number;
    topPackage: { id: string; title: string; salesCount: number } | null;
  };
}> {
  const rows = await prisma.package.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          purchases: {
            where: { status: { in: [...COUNTABLE_PURCHASE_STATUSES] } },
          },
        },
      },
    },
  });

  const packages: PackageWithSales[] = rows.map(({ _count, ...pkg }) => {
    const salesCount = _count.purchases;
    return {
      ...pkg,
      salesCount,
      revenue: pkg.price * salesCount,
    };
  });

  const totalSales = packages.reduce((sum, pkg) => sum + pkg.salesCount, 0);
  const totalRevenue = packages.reduce((sum, pkg) => sum + pkg.revenue, 0);
  const topRow =
    packages.length === 0
      ? null
      : packages.reduce((best, pkg) => (pkg.salesCount > best.salesCount ? pkg : best));

  return {
    packages,
    stats: {
      totalSales,
      totalRevenue,
      totalPackages: packages.length,
      topPackage:
        topRow && topRow.salesCount > 0
          ? { id: topRow.id, title: topRow.title, salesCount: topRow.salesCount }
          : null,
    },
  };
}

/** Материалы: text — content; image|video|file — url. order — coerce (из localStorage может быть строка). */
const materialSchema = z
  .object({
    type: z.enum(['video', 'text', 'image', 'file']),
    url: z.string().optional(),
    content: z.string().optional(),
    title: z.string().optional(),
    order: z.coerce.number().int().nonnegative(),
  })
  .superRefine((m, ctx) => {
    const url = (m.url ?? '').trim();
    const content = (m.content ?? '').trim();
    if (m.type === 'text') {
      if (!content && !url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для текста укажите содержимое',
          path: ['content'],
        });
      }
    } else if (!url && !content) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Укажите URL или загрузите файл',
        path: ['url'],
      });
    }
  });

const adminCreatePackageSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    price: z.coerce.number().int().positive(),
    category: z.enum(['OGE-IST', 'EGE-IST', 'EGE-SOC']),
    coverUrl: z.string().optional().nullable(),
    materials: z.array(materialSchema).optional(),
  }),
});

const adminUpdatePackageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().min(3),
    price: z.coerce.number().int().positive(),
    category: z.enum(['OGE-IST', 'EGE-IST', 'EGE-SOC']),
    coverUrl: z.string().optional().nullable(),
    materials: z.array(materialSchema).optional(),
  }),
});

const adminDeletePackageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

function materialsToJson(raw: unknown[]): object[] {
  if (!Array.isArray(raw)) return [];
  return (raw as z.infer<typeof materialSchema>[]).map((m, i) => {
    const title = (m.title ?? '').trim() || `Материал ${i + 1}`;
    if (m.type === 'text') {
      const content = (m.content ?? '').trim() || (m.url ?? '').trim();
      return { type: 'text' as const, title, content, order: i };
    }
    const url = (m.url ?? '').trim() || (m.content ?? '').trim();
    return { type: m.type, title, url, order: i };
  });
}

const adminChatUserIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

const adminPostChatMessageSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    content: z.string().min(1),
  }),
});

const adminDeleteMessageSchema = z.object({
  params: z.object({
    messageId: z.coerce.number().int().positive(),
  }),
});

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return base || 'package';
}

async function uniqueSlugFromTitle(title: string): Promise<string> {
  let base = slugify(title);
  let candidate = base;
  let n = 0;
  while (await prisma.package.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

router.get('/stats', async (_req, res, next) => {
  try {
    const [userCount, purchaseCount] = await Promise.all([
      prisma.user.count(),
      prisma.purchase.count(),
    ]);
    res.json({ users: userCount, purchases: purchaseCount });
  } catch (error) {
    next(error);
  }
});

router.get('/packages/stats', async (_req, res) => {
  try {
    console.log('[admin] GET /packages/stats');
    const { stats, packages } = await loadPackagesWithSalesStats();
    res.json({
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue,
      totalPackages: stats.totalPackages,
      topPackage: stats.topPackage,
      packagesWithStats: packages.map(({ id, title, price, salesCount, revenue }) => ({
        id,
        title,
        price,
        salesCount,
        revenue,
      })),
    });
  } catch (error) {
    console.error('[admin] GET /packages/stats failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message });
  }
});

router.get('/packages', async (_req, res) => {
  try {
    console.log('[admin] GET /packages');
    const { packages, stats } = await loadPackagesWithSalesStats();
    console.log('[admin] GET /packages ok, count:', packages.length);
    res.json({ packages, stats });
  } catch (error) {
    console.error('[admin] GET /packages failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message });
  }
});

function normalizePackageBody(req: Request): void {
  const body = req.body as Record<string, unknown>;
  if (typeof body.materials === 'string') {
    try {
      body.materials = JSON.parse(body.materials);
    } catch {
      body.materials = [];
    }
  }
  if (req.file && !body.coverUrl) {
    const base = (env.BACKEND_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '');
    body.coverUrl = `${base}/uploads/${(req.file as Express.Multer.File).filename}`;
  }
}

router.post(
  '/packages',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('cover')(req, res, (err) => {
      if (err) {
        handleMulterError(err, req, res, next);
        return;
      }
      normalizePackageBody(req);
      next();
    });
  },
  validate(adminCreatePackageSchema),
  async (req, res) => {
  try {
    console.log('[admin] Creating package:', req.body);
    console.log('[admin] Cover file:', req.file?.filename ?? 'none');
    const { title, description, price, category, coverUrl } = req.body as {
      title: string;
      description: string;
      price: number;
      category: string;
      coverUrl?: string | null;
    };
    const raw = req.body as { materials?: unknown[] };
    const materialsRaw = Array.isArray(raw.materials) ? raw.materials : [];
    const materialsJson = materialsToJson(materialsRaw);
    const slug = await uniqueSlugFromTitle(title);
    const cover = typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null;
    console.log('[admin] POST /packages payload', {
      title,
      price,
      category,
      materialsCount: materialsJson.length,
      hasCover: Boolean(cover),
    });

    const pkg = await prisma.package.create({
      data: {
        title,
        slug,
        description,
        price,
        category,
        coverUrl: cover,
        materials: materialsJson.length > 0 ? materialsJson : [],
      },
    });

    console.log('[admin] Package created id:', pkg.id, 'coverUrl:', pkg.coverUrl ?? null);
    invalidatePackagesCache();
    res.status(201).json({ message: 'Package created', package: pkg });
  } catch (error) {
    console.error('[admin] POST /packages', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, message, details: String(error) });
  }
});

router.put('/packages/:id', validate(adminUpdatePackageSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, price, category, coverUrl } = req.body as {
      title: string;
      slug: string;
      description: string;
      price: number;
      category: string;
      coverUrl?: string | null;
    };
    const raw = req.body as { materials?: unknown[] };
    const materialsRaw = Array.isArray(raw.materials) ? raw.materials : [];
    const materialsJson = materialsToJson(materialsRaw);
    const cover = typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null;
    console.log('[admin] PUT /packages/:id payload', {
      id,
      title,
      slug,
      price,
      category,
      materialsCount: materialsJson.length,
      hasCover: Boolean(cover),
    });

    const exists = await prisma.package.findUnique({ where: { id } });
    if (!exists) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    const slugTaken = await prisma.package.findFirst({
      where: { slug, NOT: { id } },
    });
    if (slugTaken) {
      res.status(400).json({ message: 'Slug already in use' });
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
        materials: materialsJson.length > 0 ? materialsJson : [],
      },
    });

    invalidatePackagesCache();
    res.json({ message: 'Package updated', package: pkg });
  } catch (error) {
    console.error('[admin] PUT /packages/:id', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message });
  }
});

router.delete('/packages/:id', validate(adminDeletePackageSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkg = await prisma.package.delete({ where: { id } }).catch(() => null);

    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    invalidatePackagesCache();
    res.json({ message: 'Package deleted' });
  } catch (error) {
    next(error);
  }
});

/** Список диалогов: пользователи с сообщениями + превью + непрочитанные (сообщения пользователя без isRead) */
router.get('/chats', async (_req, res) => {
  try {
    console.log('[admin] GET /chats');
    const grouped = await prisma.message.groupBy({
      by: ['senderId'],
      _count: { _all: true },
    });

    const chats = await Promise.all(
      grouped.map(async (row) => {
        const [user, lastMessage, unreadCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: row.senderId },
            select: { id: true, email: true },
          }),
          prisma.message.findFirst({
            where: { senderId: row.senderId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.message.count({
            where: { senderId: row.senderId, isAdmin: false, isRead: false },
          }),
        ]);

        const email = user?.email ?? '';
        const name = email.includes('@') ? email.split('@')[0] : email;

        return {
          userId: row.senderId,
          email,
          name,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                isAdmin: lastMessage.isAdmin,
              }
            : null,
          unreadCount,
          messageCount: row._count._all,
        };
      }),
    );

    chats.sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0).getTime() -
        new Date(a.lastMessage?.createdAt ?? 0).getTime(),
    );

    const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    console.log('[admin] GET /chats ok, count:', chats.length);
    res.json({ chats, totalUnread });
  } catch (error) {
    console.error('[admin] GET /chats failed', error);
    const err = error as { code?: string; message?: string };
    if (err.code === 'P2021') {
      res.status(503).json({ message: 'Таблица messages не найдена. Запустите prisma migrate deploy.' });
      return;
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message, error: err.message });
  }
});

/** Переписка с пользователем; помечает входящие от пользователя как прочитанные */
router.get('/chats/:userId', validate(adminChatUserIdSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.message.updateMany({
      where: { senderId: userId, isAdmin: false, isRead: false },
      data: { isRead: true },
    });

    res.json({
      user: { id: user.id, email: user.email },
      messages: messages.map((m) => ({
        id: m.id,
        userId: m.senderId,
        senderId: m.senderId,
        content: m.content,
        isAdmin: m.isAdmin,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/message', validate(adminPostChatMessageSchema), async (req, res) => {
  try {
    const { userId, content } = req.body as { userId: string; content: string };
    console.log('[admin] POST /message', { userId, contentLen: content.length });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        content: String(content).trim(),
        isAdmin: true,
        isRead: false,
      },
    });

    emitNewMessage(userId, message);

    console.log('[admin] POST /message ok, id:', message.id);
    res.status(201).json({ message });
  } catch (error) {
    console.error('[admin] POST /message failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message });
  }
});

router.delete('/chats/:userId/clear', validate(adminChatUserIdSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await prisma.message.deleteMany({ where: { senderId: userId } });
    console.log('[admin] DELETE /chats/:userId/clear', userId, result.count);
    res.json({ message: 'History cleared', deletedCount: result.count });
  } catch (error) {
    next(error);
  }
});

router.delete('/chats/:userId', validate(adminChatUserIdSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await prisma.message.deleteMany({ where: { senderId: userId } });
    res.json({ message: 'Conversation deleted', deletedCount: result.count });
  } catch (error) {
    next(error);
  }
});

router.delete('/message/:messageId', validate(adminDeleteMessageSchema), async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const id = Number(messageId);
    const deleted = await prisma.message.delete({ where: { id } }).catch(() => null);
    if (!deleted) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }
    res.json({ message: 'Message deleted', id });
  } catch (error) {
    next(error);
  }
});

export default router;
