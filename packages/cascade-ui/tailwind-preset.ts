import { colors, motion, radii, spacing, typography } from '@tierfall/cascade-tokens';
import type { Config } from 'tailwindcss';

const tierColors = colors.tier.reduce<Record<string, string>>((acc, hex, idx) => {
  acc[`tier-${idx.toString()}`] = hex;
  return acc;
}, {});

const spacingScale = Object.entries(spacing).reduce<Record<string, string>>((acc, [k, v]) => {
  acc[`cascade-${k}`] = v;
  return acc;
}, {});

const preset: Config = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...tierColors,
        background: {
          light: colors.neutral.background.light,
          dark: colors.neutral.background.dark,
        },
        foreground: colors.neutral.foreground.light,
        'neutral-border': colors.neutral.border.light,
        'neutral-muted': colors.neutral.muted.light,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        danger: colors.semantic.danger,
        info: colors.semantic.info,
      },
      spacing: spacingScale,
      fontFamily: {
        sans: typography.fontFamily.sans,
        serif: typography.fontFamily.serif,
        mono: typography.fontFamily.mono,
      },
      fontSize: {
        caption: typography.fontSize.caption,
        body: typography.fontSize.body,
        h3: typography.fontSize.h3,
        h2: typography.fontSize.h2,
        h1: typography.fontSize.h1,
        display: typography.fontSize.display,
      },
      borderRadius: radii,
      transitionDuration: {
        fast: motion.duration.fast,
        normal: motion.duration.normal,
        slow: motion.duration.slow,
      },
      transitionTimingFunction: motion.easing,
    },
  },
  plugins: [],
};

export default preset;
