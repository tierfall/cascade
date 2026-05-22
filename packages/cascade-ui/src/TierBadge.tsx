import { colors } from '@tierfall/cascade-tokens';
import React, { type CSSProperties } from 'react';
import { cn } from './utils.js';

export interface TierBadgeProps {
  tier: 0 | 1 | 2 | 3 | 4;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps): React.ReactElement {
  if (tier < 0 || tier > 4 || !Number.isInteger(tier)) {
    throw new RangeError(`TierBadge: tier must be 0..4, got ${String(tier)}`);
  }
  const tierColor = colors.tier[tier] as string;
  const style: CSSProperties = { backgroundColor: tierColor };
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white',
        className,
      )}
    >
      Tier {tier}
    </span>
  );
}
