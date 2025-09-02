import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/store';
import { getStripe } from '@/lib/stripe';
import { buildCheckoutSessionParams, makeIdempotencyKey } from '@/lib/payments/stripe';

const CreateStripeCheckoutSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug del tenant es requerido'),
  leadId: z.string().uuid('ID del lead debe ser un UUID válido'),
  amountCents: z.number().int().positive('Monto debe ser mayor a 0'),
  currency: z.enum(['MXN', 'USD']).default('MXN'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateStripeCheckoutSchema.parse(body);
    
    const store = getStore();
    
    // Obtener tenant por slug
    const tenant = await store.getTenantBySlug(validatedData.tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }
    
    // Crear registro de pago en BD
    const payment = await store.createPayment({
      tenantSlug: validatedData.tenantSlug,
      leadId: validatedData.leadId,
      amountCents: validatedData.amountCents,
      currency: validatedData.currency,
    });
    
    // Crear checkout session en Stripe
    const stripe = getStripe();
    const sessionParams = buildCheckoutSessionParams({
      amountCents: validatedData.amountCents,
      currency: validatedData.currency,
      tenantSlug: validatedData.tenantSlug,
      leadId: validatedData.leadId,
    });
    
                            const session = await stripe.checkout.sessions.create(sessionParams as any, {
              headers: {
                'Idempotency-Key': makeIdempotencyKey(payment.id),
              },
            } as any);
    
    // Actualizar payment con session ID
    await store.updatePaymentProviderRef(payment.id, session.id);
    
    // Registrar en action_log
    await store.appendLog({
      tenantId: tenant.id,
      actor: 'user:dev',
      action: 'stripe_checkout_created',
      refType: 'payment',
      refId: payment.id,
      details: { sessionId: session.id },
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating Stripe checkout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
