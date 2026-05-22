import preset from '@tierfall/cascade-ui/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [preset],
  content: ['./app/**/*.{ts,tsx}', '../../packages/cascade-ui/src/**/*.{ts,tsx}'],
};

export default config;
