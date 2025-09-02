import { describe, it, expect } from 'vitest';
import { getWeekStart, getWeekEnd, isDateInRange } from '@/lib/time';

describe('Time utilities', () => {
  describe('getWeekStart', () => {
    it('should return Monday for any date in the week', () => {
      const monday = new Date('2025-09-02'); // Monday
      const wednesday = new Date('2025-09-04'); // Wednesday
      const sunday = new Date('2025-09-01'); // Sunday

      expect(getWeekStart(monday).getDay()).toBe(1); // Monday = 1
      expect(getWeekStart(wednesday).getDay()).toBe(1);
      expect(getWeekStart(sunday).getDay()).toBe(1);
    });

    it('should return the same date for Monday', () => {
      const monday = new Date('2025-09-02'); // This is actually Monday
      const weekStart = getWeekStart(monday);
      expect(weekStart.toDateString()).toBe(monday.toDateString());
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday for any date in the week', () => {
      const monday = new Date('2025-09-02');
      const weekEnd = getWeekEnd(monday);
      expect(weekEnd.getDay()).toBe(0); // Sunday = 0
    });

    it('should be 6 days after week start', () => {
      const monday = new Date('2025-09-02');
      const weekStart = getWeekStart(monday);
      const weekEnd = getWeekEnd(monday);
      
      const diffTime = weekEnd.getTime() - weekStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6);
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const start = new Date('2025-09-02');
      const end = new Date('2025-09-08');
      const middle = new Date('2025-09-05');
      
      expect(isDateInRange(middle, start, end)).toBe(true);
    });

    it('should return true for date at range boundaries', () => {
      const start = new Date('2025-09-02');
      const end = new Date('2025-09-08');
      
      expect(isDateInRange(start, start, end)).toBe(true);
      expect(isDateInRange(end, start, end)).toBe(true);
    });

    it('should return false for date outside range', () => {
      const start = new Date('2025-09-02');
      const end = new Date('2025-09-08');
      const outside = new Date('2025-09-09');
      
      expect(isDateInRange(outside, start, end)).toBe(false);
    });
  });
});

describe('Metrics calculation (B1C)', () => {
  // Helper para crear datos de prueba
  const createTestData = (weekStart: Date, weekEnd: Date) => {
    const lead1 = { id: '1', createdAt: weekStart.toISOString() };
    const lead2 = { id: '2', createdAt: weekStart.toISOString() };
    const lead3 = { id: '3', createdAt: weekStart.toISOString() };
    
    const payment1 = { leadId: '1', status: 'paid', createdAt: weekStart.toISOString(), amountCents: 1000 };
    const payment2 = { leadId: '2', status: 'pending', createdAt: weekStart.toISOString(), amountCents: 2000 };
    const payment3 = { leadId: '4', status: 'paid', createdAt: weekStart.toISOString(), amountCents: 3000 }; // Lead no existe
    
    return { leads: [lead1, lead2, lead3], payments: [payment1, payment2, payment3] };
  };

  it('should return 0 conversion when no leads', () => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    const { leads, payments } = createTestData(weekStart, weekEnd);
    
    const leadsWeek = [];
    const conversionPct = leadsWeek.length > 0 
      ? Math.round((leadsWeek.length / leadsWeek.length) * 100) 
      : 0;
    
    expect(conversionPct).toBe(0);
  });

  it('should calculate conversion correctly for leads with paid payments this week', () => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    const { leads, payments } = createTestData(weekStart, weekEnd);
    
    const leadsWeek = leads.filter(lead => 
      isDateInRange(new Date(lead.createdAt), weekStart, weekEnd)
    );
    
    const paymentsWeek = payments.filter(payment => 
      isDateInRange(new Date(payment.createdAt), weekStart, weekEnd)
    );
    
    const leadsWithPaidPaymentsThisWeek = leadsWeek.filter(lead => {
      const leadPaymentsThisWeek = paymentsWeek.filter(p => 
        p.leadId === lead.id && p.status === 'paid'
      );
      return leadPaymentsThisWeek.length > 0;
    });
    
    const conversionPct = leadsWeek.length > 0 
      ? Math.round((leadsWithPaidPaymentsThisWeek.length / leadsWeek.length) * 100) 
      : 0;
    
    // Solo lead1 tiene un pago pagado esta semana
    expect(conversionPct).toBe(33); // 1 de 3 = 33%
  });

  it('should not count pending payments for conversion', () => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    const { leads, payments } = createTestData(weekStart, weekEnd);
    
    const leadsWeek = leads.filter(lead => 
      isDateInRange(new Date(lead.createdAt), weekStart, weekEnd)
    );
    
    const paymentsWeek = payments.filter(payment => 
      isDateInRange(new Date(payment.createdAt), weekStart, weekEnd)
    );
    
    // Solo contar pagos pagados
    const leadsWithPaidPaymentsThisWeek = leadsWeek.filter(lead => {
      const leadPaymentsThisWeek = paymentsWeek.filter(p => 
        p.leadId === lead.id && p.status === 'paid'
      );
      return leadPaymentsThisWeek.length > 0;
    });
    
    const conversionPct = leadsWeek.length > 0 
      ? Math.round((leadsWithPaidPaymentsThisWeek.length / leadsWeek.length) * 100) 
      : 0;
    
    // Solo lead1 tiene pago pagado, lead2 tiene pending
    expect(conversionPct).toBe(33); // 1 de 3 = 33%
  });

  it('should not count payments outside current week', () => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    
    // Crear datos con pagos fuera de la semana
    const leads = [
      { id: '1', createdAt: weekStart.toISOString() },
      { id: '2', createdAt: weekStart.toISOString() },
    ];
    
    const payments = [
      { leadId: '1', status: 'paid', createdAt: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() }, // Semana anterior
      { leadId: '2', status: 'paid', createdAt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString() }, // Semana siguiente
    ];
    
    const leadsWeek = leads.filter(lead => 
      isDateInRange(new Date(lead.createdAt), weekStart, weekEnd)
    );
    
    const paymentsWeek = payments.filter(payment => 
      isDateInRange(new Date(payment.createdAt), weekStart, weekEnd)
    );
    
    const leadsWithPaidPaymentsThisWeek = leadsWeek.filter(lead => {
      const leadPaymentsThisWeek = paymentsWeek.filter(p => 
        p.leadId === lead.id && p.status === 'paid'
      );
      return leadPaymentsThisWeek.length > 0;
    });
    
    const conversionPct = leadsWeek.length > 0 
      ? Math.round((leadsWithPaidPaymentsThisWeek.length / leadsWeek.length) * 100) 
      : 0;
    
    // Ningún pago está en la semana actual
    expect(conversionPct).toBe(0);
  });

  it('should not count bookings outside current week', () => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    
    const bookings = [
      { startsAt: weekStart.toISOString() }, // En la semana
      { startsAt: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() }, // Semana anterior
      { startsAt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString() }, // Semana siguiente
    ];
    
    const bookingsWeek = bookings.filter(booking => 
      isDateInRange(new Date(booking.startsAt), weekStart, weekEnd)
    );
    
    expect(bookingsWeek.length).toBe(1);
  });
});
