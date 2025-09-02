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

export interface IStore {
  // Tenants
  createTenant(input: CreateTenantInput): Promise<Tenant>;
  getTenantBySlug(slug: string): Promise<Tenant | null>;
  updateTenantSettings(tenantId: string, settings: Partial<Tenant['settings']>): Promise<void>;

  // Leads
  createLead(input: CreateLeadInput): Promise<Lead>;
  listLeads(tenantId: string): Promise<Lead[]>;
  getLeadById(tenantId: string, leadId: string): Promise<Lead | null>;
  changeStatus(input: ChangeLeadStatusInput): Promise<void>;

  // Bookings
  createBooking(input: CreateBookingInput): Promise<Booking>;
  listBookings(tenantId: string): Promise<Booking[]>;

  // Payments
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  listPayments(tenantId: string): Promise<Payment[]>;
  markPaymentPaid(id: string): Promise<void>;
  updatePaymentProviderRef(paymentId: string, providerRef: string): Promise<void>;

  // Messages
  appendMessage(input: AppendMessageInput): Promise<Message>;
  listMessages(tenantId: string): Promise<Message[]>;

  // Logs
  appendLog(entry: AppendLogInput): Promise<ActionLog>;
  listLogs(tenantId: string): Promise<ActionLog[]>;

  // Outbox
  createOutboxItem(input: CreateOutboxItemInput): Promise<OutboxItem>;
  listOutboxItems(tenantId: string): Promise<OutboxItem[]>;
}
