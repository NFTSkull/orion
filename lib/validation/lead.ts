import { z } from 'zod';

// Estados de lead
export const LeadStatus = z.enum(['new', 'contacted', 'booked', 'paid', 'lost']);
export type LeadStatus = z.infer<typeof LeadStatus>;

// Esquema para cambiar estado
export const ChangeLeadStatusSchema = z.object({
  tenantSlug: z.string().min(2),
  leadId: z.string().uuid(),
  status: LeadStatus,
  lostReason: z.string().min(2).max(200).optional()
});

// Validación de transiciones de estado
export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  // Reglas de transición:
  // new -> contacted|lost
  // contacted -> booked|lost
  // booked -> paid|lost
  // paid y lost son terminales
  
  if (from === 'paid' || from === 'lost') {
    return false; // Estados terminales
  }
  
  if (to === 'new') {
    return false; // No se puede volver a new
  }
  
  switch (from) {
    case 'new':
      return to === 'contacted' || to === 'lost';
    case 'contacted':
      return to === 'booked' || to === 'lost';
    case 'booked':
      return to === 'paid' || to === 'lost';
    default:
      return false;
  }
}
