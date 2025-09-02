import { NextRequest, NextResponse } from 'next/server';
import { CreateBookingSchema } from '@/lib/validation/schemas';
import { getStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateBookingSchema.parse(body);
    
    const store = getStore();
    const booking = await store.createBooking(validatedData);
    
    // Log la creación del booking
    await store.appendLog({
      tenantId: booking.tenantId,
      actor: 'user:dev',
      action: 'create_booking',
      refId: booking.id,
      details: { payload: validatedData },
    });

    return NextResponse.json(booking);
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
