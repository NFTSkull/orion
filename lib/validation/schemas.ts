import { z } from 'zod';

export const CreateLeadSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug del tenant es requerido'),
  name: z.string().optional(),
  phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Teléfono debe estar en formato E.164 (+52...)'),
  source: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

export const CreateBookingSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug del tenant es requerido'),
  leadId: z.string().optional(),
  startsAt: z.string().datetime('Fecha de inicio debe ser válida'),
  durationMin: z.number().int().min(15).max(60).refine(
    (val) => [15, 30, 45, 60].includes(val),
    'Duración debe ser 15, 30, 45 o 60 minutos'
  ),
});

export const CreatePaymentSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug del tenant es requerido'),
  leadId: z.string().optional(),
  amountCents: z.number().int().positive('Monto debe ser mayor a 0'),
  currency: z.string().default('MXN'),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
