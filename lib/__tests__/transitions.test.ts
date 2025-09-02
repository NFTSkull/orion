import { describe, it, expect } from 'vitest';
import { canTransition } from '@/lib/validation/lead';
import { LeadStatus } from '@/lib/validation/lead';

describe('Lead Status Transitions', () => {
  describe('canTransition', () => {
    // Estados terminales no pueden cambiar
    it('should not allow transitions from paid state', () => {
      expect(canTransition('paid', 'contacted')).toBe(false);
      expect(canTransition('paid', 'booked')).toBe(false);
      expect(canTransition('paid', 'lost')).toBe(false);
      expect(canTransition('paid', 'new')).toBe(false);
    });

    it('should not allow transitions from lost state', () => {
      expect(canTransition('lost', 'contacted')).toBe(false);
      expect(canTransition('lost', 'booked')).toBe(false);
      expect(canTransition('lost', 'paid')).toBe(false);
      expect(canTransition('lost', 'new')).toBe(false);
    });

    // No se puede volver a new
    it('should not allow transitions to new state', () => {
      expect(canTransition('contacted', 'new')).toBe(false);
      expect(canTransition('booked', 'new')).toBe(false);
      expect(canTransition('paid', 'new')).toBe(false);
      expect(canTransition('lost', 'new')).toBe(false);
    });

    // Transiciones válidas desde new
    it('should allow valid transitions from new state', () => {
      expect(canTransition('new', 'contacted')).toBe(true);
      expect(canTransition('new', 'lost')).toBe(true);
      expect(canTransition('new', 'booked')).toBe(false);
      expect(canTransition('new', 'paid')).toBe(false);
    });

    // Transiciones válidas desde contacted
    it('should allow valid transitions from contacted state', () => {
      expect(canTransition('contacted', 'booked')).toBe(true);
      expect(canTransition('contacted', 'lost')).toBe(true);
      expect(canTransition('contacted', 'new')).toBe(false);
      expect(canTransition('contacted', 'paid')).toBe(false);
    });

    // Transiciones válidas desde booked
    it('should allow valid transitions from booked state', () => {
      expect(canTransition('booked', 'paid')).toBe(true);
      expect(canTransition('booked', 'lost')).toBe(true);
      expect(canTransition('booked', 'new')).toBe(false);
      expect(canTransition('booked', 'contacted')).toBe(false);
    });

    // Casos edge
    it('should handle edge cases', () => {
      expect(canTransition('new', 'new')).toBe(false);
      expect(canTransition('contacted', 'contacted')).toBe(false);
      expect(canTransition('booked', 'booked')).toBe(false);
      expect(canTransition('paid', 'paid')).toBe(false);
      expect(canTransition('lost', 'lost')).toBe(false);
    });
  });
});
