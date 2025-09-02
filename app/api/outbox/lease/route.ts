import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';
import { z } from 'zod';

const LeaseRequestSchema = z.object({
  max: z.number().int().positive().default(10)
});

export async function POST(request: NextRequest) {
  try {
    // Validar token
    const cronToken = request.headers.get('x-cron-token');
    if (cronToken !== process.env.CRON_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validar body
    const body = await request.json();
    const validatedData = LeaseRequestSchema.parse(body);

    const supabase = getServiceClient();
    const now = new Date().toISOString();
    const leaseId = crypto.randomUUID();
    const leaseUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutos

    // Seleccionar items disponibles
    const { data: items, error: selectError } = await supabase
      .from('outbox')
      .select('id, tenant_id, target, payload')
      .eq('status', 'pending')
      .lte('run_at', now)
      .or(`lease_until.is.null,lease_until.lt.${now}`)
      .limit(validatedData.max);

    if (selectError) {
      console.error('Error selecting outbox items:', selectError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        leaseId,
        items: []
      });
    }

    // Actualizar items con lease
    const itemsData = items as any[];
    const itemIds = itemsData.map(item => item.id);
    const updateData = {
      lease_id: leaseId,
      lease_until: leaseUntil,
      status: 'processing'
    };
    // @ts-ignore - Supabase types issue
    const { error: updateError } = await supabase
      .from('outbox')
      // @ts-ignore - Supabase types issue
      .update(updateData)
      .in('id', itemIds);

    if (updateError) {
      console.error('Error updating outbox items:', updateError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Formatear respuesta
    const formattedItems = itemsData.map(item => ({
      id: item.id,
      tenantId: item.tenant_id,
      target: item.target,
      payload: item.payload
    }));

    return NextResponse.json({
      leaseId,
      items: formattedItems
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in lease endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
