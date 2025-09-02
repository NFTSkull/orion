// /lib/supabaseTypes.ts
export type Json =
  | string | number | boolean | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string; name: string; slug: string; industry: string | null;
          phone_e164: string | null; settings: Json | null; created_at: string | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['tenants']['Row'],'id'|'created_at'>> & { name: string; slug: string; };
        Update: Partial<Omit<Database['public']['Tables']['tenants']['Row'],'id'>>;
      };
      profiles: {
        Row: {
          id: string; tenant_id: string; full_name: string | null;
          phone_e164: string | null; role: string; created_at: string | null;
        };
        Insert: { id: string; tenant_id: string; full_name?: string | null; phone_e164?: string | null; role?: string; };
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'],'id'>>;
      };
      leads: {
        Row: {
          id: string; tenant_id: string; name: string | null; phone_e164: string;
          source: string | null; status: string; meta: Json | null; last_status_change: string | null; lost_reason: string | null; created_at: string | null;
        };
        Insert: { tenant_id: string; phone_e164: string; name?: string | null; source?: string | null; status?: string; meta?: Json | null; last_status_change?: string | null; lost_reason?: string | null; };
        Update: Partial<Omit<Database['public']['Tables']['leads']['Row'],'id'|'tenant_id'>>;
      };
      bookings: {
        Row: {
          id: string; tenant_id: string; lead_id: string | null; starts_at: string; ends_at: string;
          status: string; created_at: string | null;
        };
        Insert: { tenant_id: string; starts_at: string; ends_at: string; lead_id?: string | null; status?: string; };
        Update: Partial<Omit<Database['public']['Tables']['bookings']['Row'],'id'|'tenant_id'>>;
      };
      payments: {
        Row: {
          id: string; tenant_id: string; lead_id: string | null; provider: string;
          amount_cents: number; currency: string; status: string; provider_ref: string | null; created_at: string | null;
        };
        Insert: { tenant_id: string; provider: string; amount_cents: number; currency?: string; status?: string; lead_id?: string | null; provider_ref?: string | null; };
        Update: Partial<Omit<Database['public']['Tables']['payments']['Row'],'id'|'tenant_id'>>;
      };
      messages: {
        Row: {
          id: string; tenant_id: string; lead_id: string | null; direction: string;
          channel: string; body: string; payload: Json | null; created_at: string | null;
        };
        Insert: { tenant_id: string; direction: string; body: string; channel?: string; lead_id?: string | null; payload?: Json | null; };
        Update: Partial<Omit<Database['public']['Tables']['messages']['Row'],'id'|'tenant_id'>>;
      };
      action_log: {
        Row: {
          id: string; tenant_id: string; actor: string; action: string; ref_type: string | null; ref_id: string | null; details: Json | null; created_at: string | null;
        };
        Insert: { tenant_id: string; actor: string; action: string; ref_type?: string | null; ref_id?: string | null; details?: Json | null; };
        Update: Partial<Omit<Database['public']['Tables']['action_log']['Row'],'id'|'tenant_id'>>;
      };
      outbox: {
        Row: {
          id: string; tenant_id: string; target: string; payload: Json; status: string; attempt: number; last_error: string | null; created_at: string | null;
        };
        Insert: { tenant_id: string; target: string; payload: Json; status?: string; attempt?: number; last_error?: string | null; };
        Update: Partial<Omit<Database['public']['Tables']['outbox']['Row'],'id'|'tenant_id'>>;
      };
    };
    Functions: {
      current_tenant_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
