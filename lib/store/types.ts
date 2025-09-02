// Tipos del store para ORION
import { LeadStatus } from '@/lib/validation/lead';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  phoneE164?: string;
  settings?: {
    openingHours?: string;
    slotMinutes?: number;
    templatePack?: string;
  };
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  name?: string;
  phoneE164: string;
  source?: string;
  status: LeadStatus;
  meta?: Record<string, unknown>;
  lastStatusChange?: string;
  lostReason?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  leadId?: string;
  startsAt: string;
  endsAt: string;
  status: string;
  remindersScheduled?: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  leadId?: string;
  provider: string;
  amountCents: number;
  currency: string;
  status: string;
  providerRef?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  tenantId: string;
  leadId?: string;
  direction: string;
  channel: string;
  body: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface ActionLog {
  id: string;
  tenantId: string;
  actor: string;
  action: string;
  refType?: string;
  refId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// Input types para creación
export interface CreateTenantInput {
  name: string;
  slug: string;
  industry?: string;
  phoneE164?: string;
}

export interface CreateLeadInput {
  tenantSlug: string;
  name?: string;
  phoneE164: string;
  source?: string;
  meta?: Record<string, unknown>;
}

export interface CreateBookingInput {
  tenantSlug: string;
  leadId?: string;
  startsAt: string;
  durationMin: number;
}

export interface CreatePaymentInput {
  tenantSlug: string;
  leadId?: string;
  amountCents: number;
  currency?: string;
}

export interface ChangeLeadStatusInput {
  tenantSlug: string;
  leadId: string;
  status: LeadStatus;
  lostReason?: string;
}

export interface AppendMessageInput {
  tenantId: string;
  leadId?: string;
  direction: string;
  channel: string;
  body: string;
  payload?: Record<string, unknown>;
}

export interface AppendLogInput {
  tenantId: string;
  actor: string;
  action: string;
  refType?: string;
  refId?: string;
  details?: Record<string, unknown>;
}

export interface OutboxItem {
  id: string;
  tenantId: string;
  target: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempt: number;
  lastError?: string;
  leaseId?: string;
  leaseUntil?: string;
  runAt: string;
  createdAt: string;
}

export interface CreateOutboxItemInput {
  tenantId: string;
  target: string;
  payload: Record<string, unknown>;
  runAt: string;
}
