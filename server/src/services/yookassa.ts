import { randomUUID } from 'crypto';
import { env } from '../config/env';

interface YooKassaPayment {
  id: string;
  status: string;
  amount: { value: string; currency: 'RUB' };
  confirmation: { type: string; confirmation_url: string };
  metadata?: { order_id?: string };
}

/** Настроена ли ЮKassa (заданы ли ключи в окружении). */
export function isYooKassaConfigured(): boolean {
  return Boolean(env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY);
}

function authHeader(): string {
  // .trim() — на случай лишнего пробела/переноса при вставке ключа в Render
  const shopId = (env.YOOKASSA_SHOP_ID || '').trim();
  const secret = (env.YOOKASSA_SECRET_KEY || '').trim();
  return `Basic ${Buffer.from(`${shopId}:${secret}`).toString('base64')}`;
}

export const createPayment = async (
  amount: number,
  orderId: string,
): Promise<{ paymentId: string; confirmationUrl: string }> => {
  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
      // Уникальный ключ на каждую попытку — защищает от двойного списания при ретраях
      'Idempotence-Key': randomUUID(),
    },
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2), // ЮKassa ждёт строку вида "1999.00"
        currency: 'RUB',
      },
      capture: true,
      description: `Оплата заказа ${orderId}`,
      metadata: {
        order_id: orderId,
      },
      confirmation: {
        type: 'redirect',
        return_url: `${env.FRONTEND_URL}/dashboard`,
      },
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { description?: string };
    throw new Error(error.description || 'Failed to create payment');
  }

  const data = (await response.json()) as YooKassaPayment;
  return {
    paymentId: data.id,
    confirmationUrl: data.confirmation.confirmation_url,
  };
};

/** Полные данные платежа (статус + order_id из metadata) — для проверки в webhook. */
export const getPayment = async (
  paymentId: string,
): Promise<{ status: string; orderId?: string }> => {
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });

  if (!response.ok) {
    throw new Error('Failed to get payment');
  }

  const data = (await response.json()) as YooKassaPayment;
  return { status: data.status, orderId: data.metadata?.order_id };
};

export const getPaymentStatus = async (paymentId: string): Promise<string> => {
  const { status } = await getPayment(paymentId);
  return status;
};
