import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { prisma } from '../lib/prisma';

export { adminUploadMulter, adminUploadRespond } from '../utils/cloudinary';

const router = Router();

/** Материалы: text — content; image|video|file — url (или legacy content как ссылка) */
const materialSchema = z
  .object({
    type: z.enum(['video', 'text', 'image', 'file']),
    url: z.string().optional(),
    content: z.string().optional(),
    title: z.string().optional(),
    order: z.number().int().nonnegative(),
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
    title: z.string().min(3),
    description: z.string().min(3),
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

router.get('/packages', async (_req, res, next) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ packages });
  } catch (error) {
    next(error);
  }
});

router.post('/packages', validate(adminCreatePackageSchema), async (req, res, next) => {
  try {
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

    const pkg = await prisma.package.create({
      data: {
        title,
        slug,
        description,
        price,
        category,
        coverUrl: cover,
        materials: materialsJson.length ? materialsJson : [],
      },
    });

    res.status(201).json({ message: 'Package created', package: pkg });
  } catch (error) {
    next(error);
  }
});

router.put('/packages/:id', validate(adminUpdatePackageSchema), async (req, res, next) => {
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
        materials: materialsJson.length ? materialsJson : [],
      },
    });

    res.json({ message: 'Package updated', package: pkg });
  } catch (error) {
    next(error);
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

    res.json({ message: 'Package deleted' });
  } catch (error) {
    next(error);
  }
});

/** Список диалогов: пользователи с сообщениями + превью + непрочитанные (сообщения пользователя без isRead) */
router.get('/chats', async (_req, res, next) => {
  try {
    const grouped = await prisma.message.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });

    const chats = await Promise.all(
      grouped.map(async (row) => {
        const [user, lastMessage, unreadCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: row.userId },
            select: { id: true, email: true },
          }),
          prisma.message.findFirst({
            where: { userId: row.userId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.message.count({
            where: { userId: row.userId, isAdmin: false, isRead: false },
          }),
        ]);

        const email = user?.email ?? '';
        const name = email.includes('@') ? email.split('@')[0] : email;

        return {
          userId: row.userId,
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
    res.json({ chats, totalUnread });
  } catch (error) {
    next(error);
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
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { email: true } } },
    });

    await prisma.message.updateMany({
      where: { userId, isAdmin: false, isRead: false },
      data: { isRead: true },
    });

    res.json({
      user: { id: user.id, email: user.email },
      messages: messages.map((m) => ({
        id: m.id,
        userId: m.userId,
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

router.post('/message', validate(adminPostChatMessageSchema), async (req, res, next) => {
  try {
    const { userId, content } = req.body as { userId: string; content: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        userId,
        content: String(content).trim(),
        isAdmin: true,
        isRead: true,
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

router.delete('/chats/:userId', validate(adminChatUserIdSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await prisma.message.deleteMany({ where: { userId } });
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
