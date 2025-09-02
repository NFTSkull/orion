import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';
import { renderReminderMessage } from '@/lib/templates';
import { formatDate } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'missing id' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Buscar item en outbox
    const { data: outboxItem, error: outboxError } = await supabase
      .from('outbox')
      .select('*')
      .eq('id', id)
      .single();

    if (outboxError || !outboxItem) {
      return NextResponse.json(
        { error: 'not found' },
        { status: 404 }
      );
    }

    const outboxData = outboxItem as any;
    const payload = outboxData.payload as any;
    const { bookingId, leadId, tenantId, when, type } = payload;

    // Cargar datos necesarios
    const [tenantResult, leadResult, bookingResult] = await Promise.all([
      // Tenant
      supabase
        .from('tenants')
        .select('name, settings')
        .eq('id', tenantId)
        .single(),
      
      // Lead (si existe)
      leadId ? supabase
        .from('leads')
        .select('name, phone_e164')
        .eq('id', leadId)
        .single() : Promise.resolve({ data: null, error: null }),
      
      // Booking (si existe)
      bookingId ? supabase
        .from('bookings')
        .select('starts_at')
        .eq('id', bookingId)
        .single() : Promise.resolve({ data: null, error: null })
    ]);

    if (tenantResult.error || !tenantResult.data) {
      return NextResponse.json(
        { error: 'tenant not found' },
        { status: 404 }
      );
    }

    const tenant = (tenantResult as any).data as any;
    const lead = (leadResult as any).data as any;
    const booking = (bookingResult as any).data as any;

    // Construir respuesta
    const to = lead?.phone_e164 || null;
    
    let text = '';
    if (type === 'booking_reminder' && booking) {
      const datetimeLocal = formatDate(booking.starts_at);
      text = renderReminderMessage({
        businessName: tenant.name,
        leadName: lead?.name || null,
        datetimeLocal,
        address: null // TODO: agregar address cuando esté disponible
      });
    } else {
      text = 'Mensaje no configurado para este tipo';
    }

    return NextResponse.json({
      to,
      text,
      target: outboxData.target,
      payload: outboxData.payload
    });

  } catch (error: any) {
    console.error('Error rendering outbox item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
