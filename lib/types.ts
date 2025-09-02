// Tipos compartidos para la aplicación ORION

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  phone_e164?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name?: string;
  phone_e164?: string;
  role: string;
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  name?: string;
  phone_e164: string;
  source?: string;
  status: string;
  meta?: Record<string, unknown>;
  created_at: string;
}

export interface Booking {
  id: string;
  tenant_id: string;
  lead_id?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  lead_id?: string;
  provider: string;
  amount_cents: number;
  currency: string;
  status: string;
  provider_ref?: string;
  created_at: string;
}

export interface Message {
  id: string;
  tenant_id: string;
  lead_id?: string;
  direction: string;
  channel: string;
  body: string;
  payload?: Record<string, unknown>;
  created_at: string;
}
