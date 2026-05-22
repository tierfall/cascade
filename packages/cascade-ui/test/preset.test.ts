import { describe, expect, it } from '@jest/globals';
import preset from '../tailwind-preset.js';

describe('tailwind-preset', () => {
  it('exposes colors derived from cascade-tokens', () => {
    expect(preset.theme?.extend?.colors).toBeDefined();
    const colors = preset.theme?.extend?.colors as Record<string, unknown>;
    expect(colors['tier-0']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors['tier-4']).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('exposes spacing derived from cascade-tokens', () => {
    const spacing = preset.theme?.extend?.spacing as Record<string, string>;
    expect(spacing['cascade-4']).toMatch(/^\d+(\.\d+)?rem$/);
  });

  it('exposes font-families derived from cascade-tokens', () => {
    const fontFamily = preset.theme?.extend?.fontFamily as Record<string, unknown>;
    expect(fontFamily['sans']).toContain('Inter');
  });

  it('enables darkMode class strategy', () => {
    expect(preset.darkMode).toBe('class');
  });
});
