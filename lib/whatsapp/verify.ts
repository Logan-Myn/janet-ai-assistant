import crypto from 'crypto';
import { config } from '@/config';

export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.whatsapp.appSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

export function verifyWebhookToken(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
    return challenge;
  }
  return null;
}
