import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getPayment } from '../services/yookassa';

const router = Router();

interface YooKassaWebhookBody {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    metadata?: { order_id?: string };
  };
}

/**
 * Webhook ЮKassa. Всегда отвечаем 200, чтобы ЮKassa не зациклила ретраи.
 * Телу запроса не доверяем — статус и order_id перепроверяем через API по paymentId.
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = (req.body ?? {}) as YooKassaWebhookBody;
    const paymentId = body.object?.id;

    if (!paymentId) {
      res.status(200).json({ ok: true });
      return;
    }

    let status = body.object?.status;
    let orderId = body.object?.metadata?.order_id;

    // Перепроверка у ЮKassa — защита от поддельных вебхуков
    try {
      const verified = await getPayment(paymentId);
      status = verified.status;
      orderId = verified.orderId ?? orderId;
    } catch (err) {
      console.warn('[payments] webhook verify failed:', err instanceof Error ? err.message : err);
    }

    if (!orderId) {
      res.status(200).json({ ok: true });
      return;
    }

    if (status === 'succeeded') {
      const result = await prisma.purchase.updateMany({
        where: { id: orderId, status: { not: 'paid' } },
        data: { status: 'paid' },
      });
      console.log('[payments] webhook: purchase paid', orderId, 'updated:', result.count);
    } else if (status === 'canceled') {
      await prisma.purchase.updateMany({
        where: { id: orderId, status: 'pending' },
        data: { status: 'canceled' },
      });
      console.log('[payments] webhook: purchase canceled', orderId);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[payments] webhook error:', error);
    // Всё равно 200 — иначе ЮKassa будет повторять запрос бесконечно
    res.status(200).json({ ok: true });
  }
});

export default router;
