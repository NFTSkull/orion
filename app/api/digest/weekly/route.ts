import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';
import { renderWeeklyDigest } from '@/lib/templates';
import { getWeekStart, getWeekEnd } from '@/lib/time';

interface Tenant {
  id: string;
  name: string;
}

interface Payment {
  amount_cents: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenantSlug');

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenantSlug is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Obtener tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenantData = tenant as Tenant;

    // Calcular semana actual
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const weekRange = `${weekStart.toLocaleDateString('es-MX')} - ${weekEnd.toLocaleDateString('es-MX')}`;

    // Obtener métricas de la semana
    const [leadsResult, bookingsResult, paymentsResult] = await Promise.all([
      // Leads de esta semana
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantData.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
      
      // Bookings de esta semana
      supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantData.id)
        .gte('starts_at', weekStart.toISOString())
        .lte('starts_at', weekEnd.toISOString()),
      
      // Pagos pagados de esta semana
      supabase
        .from('payments')
        .select('amount_cents', { count: 'exact' })
        .eq('tenant_id', tenantData.id)
        .eq('status', 'paid')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
    ]);

    const leadsWeek = leadsResult.count || 0;
    const bookingsWeek = bookingsResult.count || 0;
    const paidAmountWeekMXN = ((paymentsResult.data as Payment[]) || []).reduce((sum, p) => sum + p.amount_cents, 0);

    // Calcular conversión
    let conversionPct = 0;
    if (leadsWeek > 0) {
      // Leads con pagos pagados en esta semana
      const { count: leadsWithPayments } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantData.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .in('id', supabase
          .from('payments')
          .select('lead_id')
          .eq('tenant_id', tenantData.id)
          .eq('status', 'paid')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
        );
      
      conversionPct = Math.round((leadsWithPayments || 0) / leadsWeek * 100);
    }

    // Renderizar mensaje
    const message = renderWeeklyDigest({
      businessName: tenantData.name,
      weekRange,
      leads: leadsWeek,
      bookings: bookingsWeek,
      paidMXN: paidAmountWeekMXN,
      conversionPct
    });

    return NextResponse.json({
      businessName: tenantData.name,
      weekRange,
      leadsWeek,
      bookingsWeek,
      paidAmountWeekMXN,
      conversionPct,
      message
    });

  } catch (error: unknown) {
    console.error('Error in weekly digest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
