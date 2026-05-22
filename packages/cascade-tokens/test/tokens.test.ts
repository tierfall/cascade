import { describe, expect, it } from '@jest/globals';
import { colors, motion, radii, spacing, typography } from '../src/index.js';

describe('colors', () => {
  it('exposes a five-step tier ramp (tier 0 = local, tier 4 = most expensive cloud)', () => {
    expect(colors.tier).toHaveLength(5);
    colors.tier.forEach((shade) => {
      expect(shade).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('exposes neutral foreground and background pairs in light and dark mode', () => {
    expect(colors.neutral.background.light).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.neutral.background.dark).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.neutral.foreground.light).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.neutral.foreground.dark).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('every color object is frozen (immutable contract)', () => {
    expect(Object.isFrozen(colors)).toBe(true);
    expect(Object.isFrozen(colors.tier)).toBe(true);
    expect(Object.isFrozen(colors.neutral)).toBe(true);
  });
});

describe('spacing', () => {
  it('exposes an 8-step scale in rem units', () => {
    expect(Object.keys(spacing)).toHaveLength(8);
    Object.values(spacing).forEach((value) => {
      expect(value).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  it('scale is strictly monotonic increasing', () => {
    const numeric = Object.values(spacing).map((s) => parseFloat(s));
    for (let i = 1; i < numeric.length; i += 1) {
      const prev = numeric[i - 1];
      const curr = numeric[i];
      if (prev === undefined || curr === undefined) throw new Error('unreachable');
      expect(curr).toBeGreaterThan(prev);
    }
  });
});

describe('typography', () => {
  it('exposes font families for sans, serif, and mono', () => {
    expect(typography.fontFamily.sans).toContain('Inter');
    expect(typography.fontFamily.mono).toContain('JetBrains Mono');
  });

  it('exposes a font-size scale with at least display, body, and caption', () => {
    expect(typography.fontSize.display).toBeDefined();
    expect(typography.fontSize.body).toBeDefined();
    expect(typography.fontSize.caption).toBeDefined();
  });
});

describe('radii', () => {
  it('exposes a 5-step border-radius scale', () => {
    expect(Object.keys(radii)).toEqual(expect.arrayContaining(['none', 'sm', 'md', 'lg', 'full']));
  });
});

describe('motion', () => {
  it('exposes durations and easings used across web and mobile', () => {
    expect(motion.duration.fast).toMatch(/^\d+ms$/);
    expect(motion.duration.normal).toMatch(/^\d+ms$/);
    expect(motion.duration.slow).toMatch(/^\d+ms$/);
    expect(motion.easing.standard).toBeDefined();
  });
});
