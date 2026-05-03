import { env } from '../config/env';

interface YooKassaPayment {
  id: string;
  status: string;
  amount: { value: string; currency: 'RUB' };
  confirmation: { type: string; confirmation_url: string };
}

export const createPayment = async (amount: number, orderId: string): Promise<{ paymentId: string; confirmationUrl: string }> => {
  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
      'Idempotence-Key': orderId,
    },
    body: JSON.stringify({
      amount: {
        value: amount.toString(),
        currency: 'RUB',
      },
      capture: true,
      description: `Оплата заказа ${orderId}`,
      metadata: {
        order_id: orderId,
      },
      confirmation: {
        type: 'redirect',
        return_url: `${env.CLIENT_URL}/dashboard`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.description || 'Failed to create payment');
  }

  const data: YooKassaPayment = await response.json();
  return {
    paymentId: data.id,
    confirmationUrl: data.confirmation.confirmation_url,
  };
};

export const getPaymentStatus = async (paymentId: string): Promise<string> => {
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get payment status');
  }

  const data: YooKassaPayment = await response.json();
  return data.status;
};
