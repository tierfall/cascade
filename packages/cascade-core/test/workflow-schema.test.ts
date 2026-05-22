import { describe, expect, it } from '@jest/globals';
import fc from 'fast-check';
import { WorkflowSchema, type Workflow } from '../src/workflow-schema.js';

describe('WorkflowSchema', () => {
  it('parses a minimal valid workflow', () => {
    const input: Workflow = {
      schemaVersion: '1.0.0',
      id: 'wf_demo',
      name: 'Demo',
      nodes: [{ id: 'start', type: 'http', config: { url: 'https://example.com' } }],
      edges: [],
      triggers: [],
    };
    const result = WorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects a workflow with no nodes', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_empty',
      name: 'Empty',
      nodes: [],
      edges: [],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an edge that references an unknown node', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_orphan',
      name: 'Orphan edge',
      nodes: [{ id: 'a', type: 'http', config: {} }],
      edges: [{ from: 'a', to: 'b' }],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown node type', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_bad',
      name: 'Bad type',
      nodes: [{ id: 'x', type: 'no-such-type', config: {} }],
      edges: [],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an edge whose `from` references an unknown node', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_orphan_from',
      name: 'Orphan from',
      nodes: [{ id: 'a', type: 'http', config: {} }],
      edges: [{ from: 'ghost', to: 'a' }],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('property: rejects any workflow whose id is not a non-empty string', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant(undefined), fc.integer(), fc.boolean()),
        (badId) => {
          const result = WorkflowSchema.safeParse({
            schemaVersion: '1.0.0',
            id: badId,
            name: 'x',
            nodes: [{ id: 'n', type: 'http', config: {} }],
            edges: [],
            triggers: [],
          });
          return !result.success;
        },
      ),
    );
  });
});
