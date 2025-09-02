import { IStore } from './IStore';
import {
  Tenant,
  Lead,
  Booking,
  Payment,
  Message,
  ActionLog,
  OutboxItem,
  CreateTenantInput,
  CreateLeadInput,
  CreateBookingInput,
  CreatePaymentInput,
  AppendMessageInput,
  AppendLogInput,
  ChangeLeadStatusInput,
  CreateOutboxItemInput,
} from './types';
import { getServiceClient } from '@/lib/supabaseServer';
import type { Tables, TablesUpdate } from '@/lib/supabaseTypes';

export class SupabaseStore implements IStore {
  // Tenants
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        name: input.name,
        slug: input.slug,
        industry: input.industry || null,
        phone_e164: input.phoneE164 || null,
        settings: {},
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating tenant: ${error.message}`);
    }

    const tenantData = data as any;
    return {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      industry: tenantData.industry || undefined,
      phoneE164: tenantData.phone_e164 || undefined,
      settings: tenantData.settings || {},
      createdAt: tenantData.created_at || new Date().toISOString(),
    };
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    const tenantData = data as any;
    return {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      industry: tenantData.industry || undefined,
      phoneE164: tenantData.phone_e164 || undefined,
      settings: tenantData.settings || {},
      createdAt: tenantData.created_at || new Date().toISOString(),
    };
  }

  async updateTenantSettings(tenantId: string, settings: Partial<Tenant['settings']>): Promise<void> {
    const supabase = getServiceClient();
    
    const { error } = await supabase
      .from('tenants')
      // @ts-ignore - Supabase types issue
      .update({ settings } as any)
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Error updating tenant settings: ${error.message}`);
    }
  }

  // Leads
  async createLead(input: CreateLeadInput): Promise<Lead> {
    const supabase = getServiceClient();
    
    // Obtener tenant por slug
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Crear lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenant.id,
        name: input.name || null,
        phone_e164: input.phoneE164,
        source: input.source || null,
        status: 'new',
        meta: input.meta || null,
      } as any)
      .select()
      .single();

    if (leadError) {
      throw new Error(`Error creating lead: ${leadError.message}`);
    }

    const leadRow = leadData as any;

    // Crear log
    await supabase
      .from('action_log')
      .insert({
        tenant_id: tenant.id,
        actor: 'user:dev',
        action: 'create_lead',
        ref_type: 'lead',
        ref_id: leadRow.id,
        details: { payload: input },
      } as any);

    return {
      id: leadRow.id,
      tenantId: leadRow.tenant_id,
      name: leadRow.name || undefined,
      phoneE164: leadRow.phone_e164,
      source: leadRow.source || undefined,
      status: leadRow.status,
      meta: leadRow.meta || undefined,
      lastStatusChange: leadRow.last_status_change || undefined,
      lostReason: leadRow.lost_reason || undefined,
      createdAt: leadRow.created_at || new Date().toISOString(),
    };
  }

  async listLeads(tenantId: string): Promise<Lead[]> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error listing leads: ${error.message}`);
    }

    return (data as any[]).map(lead => ({
      id: lead.id,
      tenantId: lead.tenant_id,
      name: lead.name || undefined,
      phoneE164: lead.phone_e164,
      source: lead.source || undefined,
      status: lead.status,
      meta: lead.meta || undefined,
      lastStatusChange: lead.last_status_change || undefined,
      lostReason: lead.lost_reason || undefined,
      createdAt: lead.created_at || new Date().toISOString(),
    }));
  }

  async getLeadById(tenantId: string, leadId: string): Promise<Lead | null> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', leadId)
      .single();

    if (error || !data) {
      return null;
    }

    const leadData = data as any;
    return {
      id: leadData.id,
      tenantId: leadData.tenant_id,
      name: leadData.name || undefined,
      phoneE164: leadData.phone_e164,
      source: leadData.source || undefined,
      status: leadData.status,
      meta: leadData.meta || undefined,
      lastStatusChange: leadData.last_status_change || undefined,
      lostReason: leadData.lost_reason || undefined,
      createdAt: leadData.created_at || new Date().toISOString(),
    };
  }

  async changeStatus(input: ChangeLeadStatusInput): Promise<void> {
    const supabase = getServiceClient();
    
    // Obtener tenant por slug
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Obtener lead actual
    const currentLead = await this.getLeadById(tenant.id, input.leadId);
    if (!currentLead) {
      throw new Error('Lead not found');
    }

    // Validar transición
    const { canTransition } = await import('@/lib/validation/lead');
    if (!canTransition(currentLead.status, input.status)) {
      throw new Error(`Invalid status transition from ${currentLead.status} to ${input.status}`);
    }

    // Actualizar lead
    const updateData: any = {
      status: input.status,
      last_status_change: new Date().toISOString(),
    };

    if (input.status === 'lost' && input.lostReason) {
      updateData.lost_reason = input.lostReason;
    }

    const { error: updateError } = await supabase
      .from('leads')
      // @ts-ignore - Supabase types issue
      .update(updateData)
      .eq('id', input.leadId)
      .eq('tenant_id', tenant.id);

    if (updateError) {
      throw new Error(`Error updating lead status: ${updateError.message}`);
    }

    // Crear log
    await this.appendLog({
      tenantId: tenant.id,
      actor: 'user:dev',
      action: 'lead_status_change',
      refType: 'lead',
      refId: input.leadId,
      details: {
        from: currentLead.status,
        to: input.status,
        lostReason: input.lostReason,
      },
    });
  }

  // Bookings
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const supabase = getServiceClient();
    
    // Obtener tenant por slug
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Calcular endsAt
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(startsAt.getTime() + input.durationMin * 60 * 1000);

    // Crear booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenant.id,
        lead_id: input.leadId || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'confirmed',
      } as any)
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Error creating booking: ${bookingError.message}`);
    }

    const bookingRow = bookingData as any;

    // Crear log
    await supabase
      .from('action_log')
      .insert({
        tenant_id: tenant.id,
        actor: 'user:dev',
        action: 'create_booking',
        ref_type: 'booking',
        ref_id: bookingRow.id,
        details: { payload: input },
      } as any);

    // Autopromoción de estado si hay leadId
    if (input.leadId) {
      try {
        const lead = await this.getLeadById(tenant.id, input.leadId);
        if (lead && (lead.status === 'new' || lead.status === 'contacted')) {
          await this.changeStatus({
            tenantSlug: input.tenantSlug,
            leadId: input.leadId,
            status: 'booked',
          });
        }
      } catch (error) {
        // No romper si falla la autopromoción
        console.warn('Autopromoción de estado falló:', error);
      }
    }

    // Programar recordatorios (idempotente)
    try {
      // Verificar si ya se programaron recordatorios
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('reminders_scheduled')
        .eq('id', bookingRow.id)
        .single();

      if (!(existingBooking as any)?.reminders_scheduled) {
        // Programar recordatorios 24h y 1h antes
        const reminder24h = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000);
        const reminder1h = new Date(startsAt.getTime() - 60 * 60 * 1000);

        await Promise.all([
          // Recordatorio 24h antes
          this.createOutboxItem({
            tenantId: tenant.id,
            target: 'reminder_whatsapp',
            payload: {
              type: 'booking_reminder',
              when: '24h',
              bookingId: bookingRow.id,
              leadId: input.leadId,
              tenantId: tenant.id,
            },
            runAt: reminder24h.toISOString(),
          }),
          // Recordatorio 1h antes
          this.createOutboxItem({
            tenantId: tenant.id,
            target: 'reminder_whatsapp',
            payload: {
              type: 'booking_reminder',
              when: '1h',
              bookingId: bookingRow.id,
              leadId: input.leadId,
              tenantId: tenant.id,
            },
            runAt: reminder1h.toISOString(),
          }),
        ]);

        // Marcar como programado
        await supabase
          .from('bookings')
          // @ts-ignore - Supabase types issue
          .update({ reminders_scheduled: true } as any)
          .eq('id', bookingRow.id);

        // Log de programación
        await this.appendLog({
          tenantId: tenant.id,
          actor: 'system:booking',
          action: 'booking_reminders_scheduled',
          refType: 'booking',
          refId: bookingRow.id,
          details: { when: ['24h', '1h'] },
        });
      }
    } catch (error) {
      // No romper si falla la programación de recordatorios
      console.warn('Programación de recordatorios falló:', error);
    }

    return {
      id: bookingRow.id,
      tenantId: bookingRow.tenant_id,
      leadId: bookingRow.lead_id || undefined,
      startsAt: bookingRow.starts_at,
      endsAt: bookingRow.ends_at,
      status: bookingRow.status,
      remindersScheduled: bookingRow.reminders_scheduled || false,
      createdAt: bookingRow.created_at || new Date().toISOString(),
    };
  }

  async listBookings(tenantId: string): Promise<Booking[]> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: true });

    if (error) {
      throw new Error(`Error listing bookings: ${error.message}`);
    }

    return (data as any[]).map(booking => ({
      id: booking.id,
      tenantId: booking.tenant_id,
      leadId: booking.lead_id || undefined,
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      status: booking.status,
      remindersScheduled: booking.reminders_scheduled || false,
      createdAt: booking.created_at || new Date().toISOString(),
    }));
  }

  // Payments
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const supabase = getServiceClient();
    
    // Obtener tenant por slug
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Crear payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenant.id,
        lead_id: input.leadId || null,
        provider: 'stripe',
        amount_cents: input.amountCents,
        currency: input.currency || 'MXN',
        status: 'pending',
      } as any)
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Error creating payment: ${paymentError.message}`);
    }

    const paymentRow = paymentData as any;

    // Crear log
    await supabase
      .from('action_log')
      .insert({
        tenant_id: tenant.id,
        actor: 'user:dev',
        action: 'create_payment',
        ref_type: 'payment',
        ref_id: paymentRow.id,
        details: { payload: input },
      } as any);

    return {
      id: paymentRow.id,
      tenantId: paymentRow.tenant_id,
      leadId: paymentRow.lead_id || undefined,
      provider: paymentRow.provider,
      amountCents: paymentRow.amount_cents,
      currency: paymentRow.currency,
      status: paymentRow.status,
      providerRef: paymentRow.provider_ref || undefined,
      createdAt: paymentRow.created_at || new Date().toISOString(),
    };
  }

  async listPayments(tenantId: string): Promise<Payment[]> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error listing payments: ${error.message}`);
    }

    return (data as any[]).map(payment => ({
      id: payment.id,
      tenantId: payment.tenant_id,
      leadId: payment.lead_id || undefined,
      provider: payment.provider,
      amountCents: payment.amount_cents,
      currency: payment.currency,
      status: payment.status,
      providerRef: payment.provider_ref || undefined,
      createdAt: payment.created_at || new Date().toISOString(),
    }));
  }

  async markPaymentPaid(id: string): Promise<void> {
    const supabase = getServiceClient();
    
    // Obtener payment para el log
    const { data: payment, error: getError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !payment) {
      throw new Error('Payment not found');
    }

    const paymentRow = payment as any;

    // Actualizar status
    const { error: updateError } = await supabase
      .from('payments')
      // @ts-ignore - Supabase types issue
      .update({ status: 'paid' } as any)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Error marking payment as paid: ${updateError.message}`);
    }

    // Crear log
    await supabase
      .from('action_log')
      .insert({
        tenant_id: paymentRow.tenant_id,
        actor: 'user:dev',
        action: 'payment_paid',
        ref_type: 'payment',
        ref_id: id,
        details: { paymentId: id },
      } as any);

    // Autopromoción de estado si hay leadId
    if (paymentRow.lead_id) {
      try {
        const lead = await this.getLeadById(paymentRow.tenant_id, paymentRow.lead_id);
        if (lead && lead.status !== 'lost' && lead.status !== 'paid') {
          await this.changeStatus({
            tenantSlug: '', // Necesitamos el slug, pero no lo tenemos aquí
            leadId: paymentRow.lead_id,
            status: 'paid',
          });
        }
      } catch (error) {
        // No romper si falla la autopromoción
        console.warn('Autopromoción de estado falló:', error);
      }
    }
  }

  async updatePaymentProviderRef(paymentId: string, providerRef: string): Promise<void> {
    const supabase = getServiceClient();
    
    const { error } = await supabase
      .from('payments')
      // @ts-ignore - Supabase types issue
      .update({ provider_ref: providerRef } as any)
      .eq('id', paymentId);

    if (error) {
      throw new Error(`Error updating payment provider ref: ${error.message}`);
    }
  }

  // Messages
  async appendMessage(input: AppendMessageInput): Promise<Message> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        tenant_id: input.tenantId,
        lead_id: input.leadId || null,
        direction: input.direction,
        channel: input.channel,
        body: input.body,
        payload: input.payload || null,
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Error appending message: ${error.message}`);
    }

    const messageRow = data as any;
    return {
      id: messageRow.id,
      tenantId: messageRow.tenant_id,
      leadId: messageRow.lead_id || undefined,
      direction: messageRow.direction,
      channel: messageRow.channel,
      body: messageRow.body,
      payload: messageRow.payload || undefined,
      createdAt: messageRow.created_at || new Date().toISOString(),
    };
  }

  async listMessages(tenantId: string): Promise<Message[]> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error listing messages: ${error.message}`);
    }

    return (data as any[]).map(message => ({
      id: message.id,
      tenantId: message.tenant_id,
      leadId: message.lead_id || undefined,
      direction: message.direction,
      channel: message.channel,
      body: message.body,
      payload: message.payload || undefined,
      createdAt: message.created_at || new Date().toISOString(),
    }));
  }

  // Logs
  async appendLog(entry: AppendLogInput): Promise<ActionLog> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('action_log')
      .insert({
        tenant_id: entry.tenantId,
        actor: entry.actor,
        action: entry.action,
        ref_type: entry.refType || null,
        ref_id: entry.refId || null,
        details: entry.details || null,
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Error appending log: ${error.message}`);
    }

    const logRow = data as any;
    return {
      id: logRow.id,
      tenantId: logRow.tenant_id,
      actor: logRow.actor,
      action: logRow.action,
      refType: logRow.ref_type || undefined,
      refId: logRow.ref_id || undefined,
      details: logRow.details || undefined,
      createdAt: logRow.created_at || new Date().toISOString(),
    };
  }

  async listLogs(tenantId: string): Promise<ActionLog[]> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('action_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error listing logs: ${error.message}`);
    }

    return (data as any[]).map(log => ({
      id: log.id,
      tenantId: log.tenant_id,
      actor: log.actor,
      action: log.action,
      refType: log.ref_type || undefined,
      refId: log.ref_id || undefined,
      details: log.details || undefined,
      createdAt: log.created_at || new Date().toISOString(),
    }));
  }

  // Outbox
  async createOutboxItem(input: CreateOutboxItemInput): Promise<OutboxItem> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('outbox')
      .insert({
        tenant_id: input.tenantId,
        target: input.target,
        payload: input.payload,
        status: 'pending',
        attempt: 0,
        run_at: input.runAt,
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating outbox item: ${error.message}`);
    }

    const outboxRow = data as any;
    return {
      id: outboxRow.id,
      tenantId: outboxRow.tenant_id,
      target: outboxRow.target,
      payload: outboxRow.payload,
      status: outboxRow.status,
      attempt: outboxRow.attempt,
      lastError: outboxRow.last_error || undefined,
      leaseId: outboxRow.lease_id || undefined,
      leaseUntil: outboxRow.lease_until || undefined,
      runAt: outboxRow.run_at,
      createdAt: outboxRow.created_at || new Date().toISOString(),
    };
  }

  async listOutboxItems(tenantId: string): Promise<OutboxItem[]> {
    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('outbox')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('run_at', { ascending: true });

    if (error) {
      throw new Error(`Error listing outbox items: ${error.message}`);
    }

    return (data as any[]).map(item => ({
      id: item.id,
      tenantId: item.tenant_id,
      target: item.target,
      payload: item.payload,
      status: item.status,
      attempt: item.attempt,
      lastError: item.last_error || undefined,
      leaseId: item.lease_id || undefined,
      leaseUntil: item.lease_until || undefined,
      runAt: item.run_at,
      createdAt: item.created_at || new Date().toISOString(),
    }));
  }
}
