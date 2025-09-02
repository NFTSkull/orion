import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { ChangeLeadStatusSchema } from '@/lib/validation/lead';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ChangeLeadStatusSchema.parse(body);
    
    const store = getStore();
    await store.changeStatus(validatedData);
    
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 422 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Invalid status transition')) {
      return NextResponse.json(
        { error: 'Transición de estado no permitida' },
        { status: 422 }
      );
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
