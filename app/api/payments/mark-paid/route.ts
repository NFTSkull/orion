import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/store';

const MarkPaymentPaidSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug del tenant es requerido'),
  paymentId: z.string().min(1, 'ID del pago es requerido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = MarkPaymentPaidSchema.parse(body);
    
    const store = getStore();
    
    // Obtener el tenant para obtener el tenantId
    const tenant = await store.getTenantBySlug(validatedData.tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }
    
    await store.markPaymentPaid(validatedData.paymentId);
    
    // Log el pago marcado como pagado
    await store.appendLog({
      tenantId: tenant.id,
      actor: 'user:dev',
      action: 'payment_paid',
      refId: validatedData.paymentId,
      details: { paymentId: validatedData.paymentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Payment not found') {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
