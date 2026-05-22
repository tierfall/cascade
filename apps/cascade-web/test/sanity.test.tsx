import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '@tierfall/cascade-ui';

describe('TierBadge integration smoke test', () => {
  it('renders inside cascade-web with tokens applied', () => {
    render(<TierBadge tier={2} />);
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
  });
});
