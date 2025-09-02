import { NextRequest, NextResponse } from 'next/server';
import { CreatePaymentSchema } from '@/lib/validation/schemas';
import { getStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreatePaymentSchema.parse(body);
    
    const store = getStore();
    const payment = await store.createPayment(validatedData);
    
    // Log la creación del payment
    await store.appendLog({
      tenantId: payment.tenantId,
      actor: 'user:dev',
      action: 'create_payment',
      refId: payment.id,
      details: { payload: validatedData },
    });

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof Error && error.message === 'Tenant not found') {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
