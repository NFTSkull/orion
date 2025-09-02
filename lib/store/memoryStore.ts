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

export class MemoryStore implements IStore {
  private tenants = new Map<string, Tenant>();
  private leads = new Map<string, Lead>();
  private bookings = new Map<string, Booking>();
  private payments = new Map<string, Payment>();
  private messages = new Map<string, Message>();
  private logs = new Map<string, ActionLog>();
  private outbox = new Map<string, OutboxItem>();

  // Tenants
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      industry: input.industry,
      phoneE164: input.phoneE164,
      settings: {},
      createdAt: new Date().toISOString(),
    };

    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.slug === slug) {
        return tenant;
      }
    }
    return null;
  }

  async updateTenantSettings(tenantId: string, settings: Partial<Tenant['settings']>): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.settings = { ...tenant.settings, ...settings };
    this.tenants.set(tenantId, tenant);
  }

  // Leads
  async createLead(input: CreateLeadInput): Promise<Lead> {
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const lead: Lead = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      name: input.name,
      phoneE164: input.phoneE164,
      source: input.source,
      status: 'new',
      meta: input.meta,
      lastStatusChange: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.leads.set(lead.id, lead);
    return lead;
  }

  async listLeads(tenantId: string): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter(lead => lead.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLeadById(tenantId: string, leadId: string): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    if (lead && lead.tenantId === tenantId) {
      return lead;
    }
    return null;
  }

  async changeStatus(input: ChangeLeadStatusInput): Promise<void> {
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const lead = await this.getLeadById(tenant.id, input.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Validar transición
    const { canTransition } = await import('@/lib/validation/lead');
    if (!canTransition(lead.status, input.status)) {
      throw new Error(`Invalid status transition from ${lead.status} to ${input.status}`);
    }

    // Actualizar lead
    lead.status = input.status;
    lead.lastStatusChange = new Date().toISOString();
    if (input.status === 'lost' && input.lostReason) {
      lead.lostReason = input.lostReason;
    }

    this.leads.set(lead.id, lead);
  }

  // Bookings
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(startsAt.getTime() + input.durationMin * 60 * 1000);

        const booking: Booking = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      leadId: input.leadId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'confirmed',
      remindersScheduled: false,
      createdAt: new Date().toISOString(),
    };

    this.bookings.set(booking.id, booking);

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
      if (!booking.remindersScheduled) {
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
              bookingId: booking.id,
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
              bookingId: booking.id,
              leadId: input.leadId,
              tenantId: tenant.id,
            },
            runAt: reminder1h.toISOString(),
          }),
        ]);

        // Marcar como programado
        booking.remindersScheduled = true;
        this.bookings.set(booking.id, booking);

        // Log de programación
        await this.appendLog({
          tenantId: tenant.id,
          actor: 'system:booking',
          action: 'booking_reminders_scheduled',
          refType: 'booking',
          refId: booking.id,
          details: { when: ['24h', '1h'] },
        });
      }
    } catch (error) {
      // No romper si falla la programación de recordatorios
      console.warn('Programación de recordatorios falló:', error);
    }

    return booking;
  }

  async listBookings(tenantId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.tenantId === tenantId)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  // Payments
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const tenant = await this.getTenantBySlug(input.tenantSlug);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      leadId: input.leadId,
      provider: 'stripe',
      amountCents: input.amountCents,
      currency: input.currency || 'MXN',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.payments.set(payment.id, payment);
    return payment;
  }

  async listPayments(tenantId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markPaymentPaid(id: string): Promise<void> {
    const payment = this.payments.get(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = 'paid';
    this.payments.set(id, payment);

    // Autopromoción de estado si hay leadId
    if (payment.leadId) {
      try {
        const lead = await this.getLeadById(payment.tenantId, payment.leadId);
        if (lead && lead.status !== 'lost' && lead.status !== 'paid') {
          // Necesitamos el slug del tenant para changeStatus
          const tenant = Array.from(this.tenants.values()).find(t => t.id === payment.tenantId);
          if (tenant) {
            await this.changeStatus({
              tenantSlug: tenant.slug,
              leadId: payment.leadId,
              status: 'paid',
            });
          }
        }
      } catch (error) {
        // No romper si falla la autopromoción
        console.warn('Autopromoción de estado falló:', error);
      }
    }
  }

  async updatePaymentProviderRef(paymentId: string, providerRef: string): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.providerRef = providerRef;
    this.payments.set(paymentId, payment);
  }

  // Messages
  async appendMessage(input: AppendMessageInput): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      leadId: input.leadId,
      direction: input.direction,
      channel: input.channel,
      body: input.body,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };

    this.messages.set(message.id, message);
    return message;
  }

  async listMessages(tenantId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Logs
  async appendLog(entry: AppendLogInput): Promise<ActionLog> {
    const log: ActionLog = {
      id: crypto.randomUUID(),
      tenantId: entry.tenantId,
      actor: entry.actor,
      action: entry.action,
      refType: entry.refType,
      refId: entry.refId,
      details: entry.details,
      createdAt: new Date().toISOString(),
    };

    this.logs.set(log.id, log);
    return log;
  }

  async listLogs(tenantId: string): Promise<ActionLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Outbox
  async createOutboxItem(input: CreateOutboxItemInput): Promise<OutboxItem> {
    const outboxItem: OutboxItem = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      target: input.target,
      payload: input.payload,
      status: 'pending',
      attempt: 0,
      runAt: input.runAt,
      createdAt: new Date().toISOString(),
    };

    this.outbox.set(outboxItem.id, outboxItem);
    return outboxItem;
  }

  async listOutboxItems(tenantId: string): Promise<OutboxItem[]> {
    return Array.from(this.outbox.values())
      .filter(item => item.tenantId === tenantId)
      .sort((a, b) => new Date(a.runAt).getTime() - new Date(b.runAt).getTime());
  }
}
