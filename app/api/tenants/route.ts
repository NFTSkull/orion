import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/store';

const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  slug: z.string().min(1, 'Slug es requerido').regex(/^[a-z0-9-]+$/, 'Slug debe contener solo letras minúsculas, números y guiones'),
  industry: z.string().optional(),
  phoneE164: z.string().optional(),
  settings: z.object({
    openingHours: z.string().optional(),
    slotMinutes: z.number().optional(),
    templatePack: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateTenantSchema.parse(body);
    
    const store = getStore();
    const tenant = await store.createTenant(validatedData);
    
    // Si hay settings, actualizarlos
    if (validatedData.settings) {
      await store.updateTenantSettings(tenant.id, validatedData.settings);
    }
    
    // Log la creación del tenant
    await store.appendLog({
      tenantId: tenant.id,
      actor: 'user:dev',
      action: 'create_tenant',
      details: { tenantSlug: tenant.slug, settings: validatedData.settings },
    });

    return NextResponse.json(tenant);
  } catch (error) {
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
