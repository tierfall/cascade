import { describe, expect, it } from '@jest/globals';
import type { Workflow } from '@tierfall/cascade-core';
import { emit } from '../src/index.js';

const workflow: Workflow = {
  schemaVersion: '1.0.0',
  id: 'wf_emit_test',
  name: 'Emit Test',
  nodes: [{ id: 'n1', type: 'http', config: { url: 'https://example.com' } }],
  edges: [],
  triggers: [{ kind: 'manual' }],
};

describe('emit', () => {
  it('includes the workflow id in the output', () => {
    const src = emit(workflow);
    expect(src).toContain('wf_emit_test');
  });

  it('includes the workflow name in a comment', () => {
    const src = emit(workflow);
    expect(src).toContain('Emit Test');
  });

  it('imports CascadeClient from @tierfall/cascade-sdk', () => {
    const src = emit(workflow);
    expect(src).toContain("from '@tierfall/cascade-sdk'");
    expect(src).toContain('CascadeClient');
  });

  it('uses env fallback when no apiBaseUrl given', () => {
    const src = emit(workflow);
    expect(src).toContain('process.env.CASCADE_API_URL');
    expect(src).toContain("'http://localhost:3000'");
  });

  it('uses the provided apiBaseUrl when given', () => {
    const src = emit(workflow, { apiBaseUrl: 'https://custom.example.com' });
    expect(src).toContain('"https://custom.example.com"');
    expect(src).not.toContain('process.env.CASCADE_API_URL');
  });

  it('exports a default async main function', () => {
    const src = emit(workflow);
    expect(src).toMatch(/export\s+default\s+async\s+function\s+main/);
  });

  it('calls triggerWorkflow with the workflow id', () => {
    const src = emit(workflow);
    expect(src).toContain('triggerWorkflow');
    expect(src).toContain('workflow.id');
  });

  it('includes the DO NOT EDIT header comment', () => {
    const src = emit(workflow);
    expect(src).toContain('DO NOT EDIT BY HAND');
  });

  it('serializes the full workflow as a const', () => {
    const src = emit(workflow);
    expect(src).toContain('as const');
    expect(src).toContain('schemaVersion');
  });
});
