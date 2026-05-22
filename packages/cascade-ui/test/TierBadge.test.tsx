import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../src/TierBadge.js';

describe('TierBadge', () => {
  it('renders the tier number', () => {
    render(<TierBadge tier={2} />);
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
  });

  it('uses the tier color from cascade-tokens', () => {
    const { container } = render(<TierBadge tier={3} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.backgroundColor).toMatch(/^rgb/);
  });

  it('throws on out-of-range tier', () => {
    expect(() => render(<TierBadge tier={5 as 0} />)).toThrow();
  });

  it('throws on negative tier', () => {
    expect(() => render(<TierBadge tier={-1 as 0} />)).toThrow();
  });
});
