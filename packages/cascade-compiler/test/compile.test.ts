import { describe, expect, it } from '@jest/globals';
import { compile } from '../src/index.js';

const minimalWorkflow = {
  schemaVersion: '1.0.0' as const,
  id: 'wf_demo',
  name: 'Demo',
  nodes: [{ id: 'start', type: 'http' as const, config: { url: 'https://example.com' } }],
  edges: [],
  triggers: [{ kind: 'manual' as const }],
};

describe('compile', () => {
  it('emits TypeScript source containing the workflow id', () => {
    const src = compile(minimalWorkflow);
    expect(src).toContain('wf_demo');
    expect(src).toContain('@tierfall/cascade-sdk');
  });

  it('throws on a workflow that fails schema validation', () => {
    const bad = { ...minimalWorkflow, nodes: [] };
    expect(() => compile(bad as unknown as Parameters<typeof compile>[0])).toThrow();
  });

  it('emitted source has a default-exported main() function', () => {
    const src = compile(minimalWorkflow);
    expect(src).toMatch(/export\s+default\s+async\s+function\s+main/);
  });

  it('respects custom apiBaseUrl', () => {
    const src = compile(minimalWorkflow, { apiBaseUrl: 'https://api.cascade.dev' });
    expect(src).toContain('https://api.cascade.dev');
  });

  it('falls back to env-driven baseUrl when option absent', () => {
    const src = compile(minimalWorkflow);
    expect(src).toContain('process.env.CASCADE_API_URL');
  });
});
