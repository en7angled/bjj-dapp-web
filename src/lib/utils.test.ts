import { describe, it, expect } from 'vitest';
import { beltColors, beltOrder, getBeltLevel, formatDate, formatDateShort, truncateAddress, getBeltDisplayName } from './utils';

describe('utils', () => {
  it('maps all belts to colors', () => {
    for (const belt of beltOrder) {
      expect(beltColors).toHaveProperty(belt);
      expect(typeof beltColors[belt]).toBe('string');
      expect(beltColors[belt].length).toBeGreaterThan(0);
    }
  });

  it('returns increasing levels per beltOrder', () => {
    const levels = beltOrder.map(getBeltLevel);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1]);
    }
  });

  it('formats dates safely', () => {
    const iso = '2024-01-15T00:00:00Z';
    expect(formatDate(iso)).toContain('2024');
    expect(formatDateShort(iso)).toContain('2024');
    // Fallback on bad input
    const bad = 'not-a-date';
    expect(formatDate(bad)).toBe(bad);
    expect(formatDateShort(bad)).toBe(bad);
  });

  it('truncates addresses correctly', () => {
    const addr = 'abcdef0123456789abcdef0123456789';
    expect(truncateAddress(addr, 4)).toBe('abcd...6789');
    const short = 'abcd';
    expect(truncateAddress(short, 4)).toBe(short);
  });

  it('displays belt names nicely', () => {
    expect(getBeltDisplayName('Black2' as any)).toBe('Black 2');
    expect(getBeltDisplayName('RedAndBlack' as any)).toBe('Red & Black');
    expect(getBeltDisplayName('Blue' as any)).toBe('Blue');
  });
});


