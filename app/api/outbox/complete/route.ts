import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';
import { z } from 'zod';

const CompleteRequestSchema = z.object({
  leaseId: z.string().uuid(),
  results: z.array(z.object({
    id: z.string().uuid(),
    ok: z.boolean(),
    error: z.string().optional()
  }))
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
    const validatedData = CompleteRequestSchema.parse(body);

    const supabase = getServiceClient();

    // Procesar cada resultado
    for (const result of validatedData.results) {
      // Obtener item actual
      const { data: item, error: fetchError } = await supabase
        .from('outbox')
        .select('*')
        .eq('id', result.id)
        .eq('lease_id', validatedData.leaseId)
        .single();

      if (fetchError || !item) {
        console.error(`Item ${result.id} not found or not leased by ${validatedData.leaseId}`);
        continue;
      }

      const itemData = item as any;
      const newAttempt = itemData.attempt + 1;
      let newStatus = itemData.status;
      let lastError = null;

      if (result.ok) {
        // Éxito
        newStatus = 'sent';
        lastError = null;
      } else {
        // Falla
        lastError = result.error || 'Unknown error';
        if (newAttempt >= 5) {
          newStatus = 'failed';
        } else {
          newStatus = 'pending';
        }
      }

      // Actualizar item
      const updateData = {
        status: newStatus,
        attempt: newAttempt,
        last_error: lastError,
        lease_id: null,
        lease_until: null
      };
      // @ts-ignore - Supabase types issue
      const { error: updateError } = await supabase
        .from('outbox')
        // @ts-ignore - Supabase types issue
        .update(updateData)
        .eq('id', result.id);

      if (updateError) {
        console.error(`Error updating item ${result.id}:`, updateError);
        continue;
      }

      // Log action
      const action = result.ok ? 'outbox_sent' : 'outbox_failed';
      await supabase
        .from('action_log')
        .insert({
          tenant_id: itemData.tenant_id,
          actor: 'system:cron',
          action,
          ref_type: 'outbox',
          ref_id: result.id,
          details: {
            leaseId: validatedData.leaseId,
            attempt: newAttempt,
            error: result.error,
            target: itemData.target
          }
        } as any);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in complete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
