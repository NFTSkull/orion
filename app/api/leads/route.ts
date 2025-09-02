import { NextRequest, NextResponse } from 'next/server';
import { CreateLeadSchema } from '@/lib/validation/schemas';
import { getStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateLeadSchema.parse(body);
    
    const store = getStore();
    const lead = await store.createLead(validatedData);
    
    // Log la creación del lead
    await store.appendLog({
      tenantId: lead.tenantId,
      actor: 'user:dev',
      action: 'create_lead',
      refId: lead.id,
      details: { payload: validatedData },
    });

    return NextResponse.json(lead);
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
