import { IStore } from './IStore';
import { MemoryStore } from './memoryStore';
import { SupabaseStore } from './supabaseStore';

export function getStore(): IStore {
  const storeType = process.env.ORION_STORE || 'memory';
  
  if (storeType === 'supabase') {
    return new SupabaseStore();
  } else {
    return new MemoryStore();
  }
}
