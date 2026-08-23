import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateDecayedScore } from '../src/services/preferenceService';
import 'fake-indexeddb/auto';

describe('preferenceService', () => {
  describe('calculateDecayedScore', () => {
    const now = new Date('2023-10-01T12:00:00Z');

    it('should return base score for current time', () => {
      const score = calculateDecayedScore('view', now.toISOString(), now);
      expect(score).toBe(1); // view = 1
    });

    it('should decay score over time', () => {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const score = calculateDecayedScore('like', oneDayAgo.toISOString(), now);
      // like = 3, DECAY_RATE = 0.95
      // 3 * (0.95 ^ 1) = 2.85
      expect(score).toBeCloseTo(2.85);
    });

    it('should return 0 for future dates', () => {
      const future = new Date(now.getTime() + 1000);
      const score = calculateDecayedScore('share', future.toISOString(), now);
      expect(score).toBe(0);
    });

    it('should return 0 for very old dates (30+ days)', () => {
      const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
      const score = calculateDecayedScore('click', thirtyOneDaysAgo.toISOString(), now);
      expect(score).toBe(0);
    });
    
    it('should handle invalid date strings', () => {
      const score = calculateDecayedScore('click', 'not-a-date', now);
      expect(score).toBe(0);
    });
  });
});
