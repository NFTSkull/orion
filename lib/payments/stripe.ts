import { getStripe } from '@/lib/stripe';

export interface CheckoutSessionParams {
  amountCents: number;
  currency?: string;
  tenantSlug: string;
  leadId: string;
}

export function buildCheckoutSessionParams({
  amountCents,
  currency = 'MXN',
  tenantSlug,
  leadId
}: CheckoutSessionParams) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  return {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Servicio',
            description: `Pago para lead ${leadId}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment' as const,
    success_url: `${baseUrl}/payments/success?ps={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payments/cancel`,
    metadata: {
      tenantSlug,
      leadId,
    },
  };
}

export function makeIdempotencyKey(paymentId: string): string {
  return `orion:checkout:${paymentId}`;
}
