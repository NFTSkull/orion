import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabaseTypes'

export function getServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getServiceClient() solo en server')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}
