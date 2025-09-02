import { describe, it, expect } from 'vitest';
import { CreateLeadSchema, CreateBookingSchema, CreatePaymentSchema } from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('CreateLeadSchema', () => {
    it('should accept valid lead data', () => {
      const validData = {
        tenantSlug: 'test-tenant',
        name: 'Juan Pérez',
        phoneE164: '+5215512345678',
        source: 'website',
        meta: { campaign: 'summer2024' }
      };

      const result = CreateLeadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        tenantSlug: 'test-tenant',
        name: 'Juan Pérez',
        phoneE164: '5512345678', // Missing +52
        source: 'website'
      };

      const result = CreateLeadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('E.164');
      }
    });

    it('should reject empty tenantSlug', () => {
      const invalidData = {
        tenantSlug: '',
        name: 'Juan Pérez',
        phoneE164: '+5215512345678'
      };

      const result = CreateLeadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const minimalData = {
        tenantSlug: 'test-tenant',
        phoneE164: '+5215512345678'
      };

      const result = CreateLeadSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateBookingSchema', () => {
    it('should accept valid booking data', () => {
      const validData = {
        tenantSlug: 'test-tenant',
        leadId: 'lead-123',
        startsAt: '2024-01-15T10:00:00Z',
        durationMin: 30
      };

      const result = CreateBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid duration', () => {
      const invalidData = {
        tenantSlug: 'test-tenant',
        startsAt: '2024-01-15T10:00:00Z',
        durationMin: 20 // Not in allowed values
      };

      const result = CreateBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid durations', () => {
      const validDurations = [15, 30, 45, 60];
      
      validDurations.forEach(duration => {
        const data = {
          tenantSlug: 'test-tenant',
          startsAt: '2024-01-15T10:00:00Z',
          durationMin: duration
        };

        const result = CreateBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid datetime', () => {
      const invalidData = {
        tenantSlug: 'test-tenant',
        startsAt: 'invalid-date',
        durationMin: 30
      };

      const result = CreateBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreatePaymentSchema', () => {
    it('should accept valid payment data', () => {
      const validData = {
        tenantSlug: 'test-tenant',
        leadId: 'lead-123',
        amountCents: 150000, // $1,500 MXN
        currency: 'MXN'
      };

      const result = CreatePaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        tenantSlug: 'test-tenant',
        amountCents: -1000
      };

      const result = CreatePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        tenantSlug: 'test-tenant',
        amountCents: 0
      };

      const result = CreatePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should use MXN as default currency', () => {
      const data = {
        tenantSlug: 'test-tenant',
        amountCents: 100000
      };

      const result = CreatePaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('MXN');
      }
    });

    it('should accept non-integer amount', () => {
      const invalidData = {
        tenantSlug: 'test-tenant',
        amountCents: 100.5
      };

      const result = CreatePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
