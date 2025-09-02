import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getWeekStart, getWeekEnd, isDateInRange } from '@/lib/time';
import { Lead, Booking, Payment } from '@/lib/store/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenantSlug');
    
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenantSlug es requerido' },
        { status: 400 }
      );
    }
    
    const store = getStore();
    const tenant = await store.getTenantBySlug(tenantSlug);
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener datos del tenant
    const [leads, bookings, payments] = await Promise.all([
      store.listLeads(tenant.id),
      store.listBookings(tenant.id),
      store.listPayments(tenant.id),
    ]);
    
    // Calcular rango de la semana actual
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    
    // Filtrar datos de la semana
    const leadsWeek = leads.filter((lead: Lead) => 
      isDateInRange(new Date(lead.createdAt), weekStart, weekEnd)
    );
    
    const bookingsWeek = bookings.filter((booking: Booking) => 
      isDateInRange(new Date(booking.startsAt), weekStart, weekEnd)
    );
    
    const paymentsWeek = payments.filter((payment: Payment) => 
      isDateInRange(new Date(payment.createdAt), weekStart, weekEnd)
    );
    
    // Calcular métricas estrictas
    const paidAmountWeekMXN = paymentsWeek
      .filter((p: Payment) => p.status === 'paid' && p.currency === 'MXN')
      .reduce((sum: number, p: Payment) => sum + p.amountCents, 0);
    
    // Conversión estricta: leads creados esta semana que tienen ≥1 payment 'paid' con created_at DENTRO DE ESTA SEMANA
    const leadsWithPaidPaymentsThisWeek = leadsWeek.filter((lead: Lead) => {
      const leadPaymentsThisWeek = paymentsWeek.filter((p: Payment) => 
        p.leadId === lead.id && p.status === 'paid'
      );
      return leadPaymentsThisWeek.length > 0;
    });
    
    const conversionPct = leadsWeek.length > 0 
      ? Math.round((leadsWithPaidPaymentsThisWeek.length / leadsWeek.length) * 100) 
      : 0;
    
    // Obtener datos para las tablas (TOP 10)
    const latestBookings = bookings
      .sort((a: Booking, b: Booking) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      .slice(0, 10);
    
    const latestPayments = payments
      .sort((a: Payment, b: Payment) => {
        // Pagos pagados primero, luego pendientes
        if (a.status === 'paid' && b.status !== 'paid') return -1;
        if (a.status !== 'paid' && b.status === 'paid') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 10);
    
    return NextResponse.json({
      leadsWeek: leadsWeek.length,
      bookingsWeek: bookingsWeek.length,
      paidAmountWeekMXN,
      conversionPct,
      latestBookings,
      latestPayments,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
