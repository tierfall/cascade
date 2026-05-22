import { describe, expect, it } from '@jest/globals';
import fc from 'fast-check';
import { hasCycle, reachableFrom, topologicalSort } from '../src/graph.js';

describe('hasCycle', () => {
  it('returns false on an empty graph', () => {
    expect(hasCycle({ nodes: [], edges: [] })).toBe(false);
  });

  it('returns false on a linear chain', () => {
    expect(
      hasCycle({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
        ],
      }),
    ).toBe(false);
  });

  it('detects a direct self-loop', () => {
    expect(hasCycle({ nodes: [{ id: 'a' }], edges: [{ from: 'a', to: 'a' }] })).toBe(true);
  });

  it('detects a back-edge cycle of length 3', () => {
    expect(
      hasCycle({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
          { from: 'c', to: 'a' },
        ],
      }),
    ).toBe(true);
  });

  it('property: a randomly-generated tree never has a cycle', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (n) => {
        const nodes = Array.from({ length: n }, (_, i) => ({ id: `n${String(i)}` }));
        const edges = Array.from({ length: n - 1 }, (_, i) => ({
          from: `n${String(i)}`,
          to: `n${String(i + 1)}`,
        }));
        return !hasCycle({ nodes, edges });
      }),
    );
  });
});

describe('topologicalSort', () => {
  it('returns nodes in dependency order', () => {
    const sorted = topologicalSort({
      nodes: [{ id: 'c' }, { id: 'a' }, { id: 'b' }],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    });
    expect(sorted).toEqual(['a', 'b', 'c']);
  });

  it('throws on a cyclic graph', () => {
    expect(() =>
      topologicalSort({
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
      }),
    ).toThrow(/cycle/i);
  });
});

describe('reachableFrom', () => {
  it('returns just the start node when no outgoing edges', () => {
    expect(reachableFrom({ nodes: [{ id: 'a' }], edges: [] }, 'a')).toEqual(new Set(['a']));
  });

  it('walks the full forward closure', () => {
    expect(
      reachableFrom(
        {
          nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
          edges: [
            { from: 'a', to: 'b' },
            { from: 'b', to: 'c' },
            { from: 'a', to: 'd' },
          ],
        },
        'a',
      ),
    ).toEqual(new Set(['a', 'b', 'c', 'd']));
  });

  it('returns empty set when start node is not in the graph', () => {
    expect(reachableFrom({ nodes: [], edges: [] }, 'missing')).toEqual(new Set());
  });

  it('does not revisit nodes reached by multiple paths', () => {
    expect(
      reachableFrom(
        {
          nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
          edges: [
            { from: 'a', to: 'b' },
            { from: 'a', to: 'c' },
            { from: 'b', to: 'd' },
            { from: 'c', to: 'd' },
          ],
        },
        'a',
      ),
    ).toEqual(new Set(['a', 'b', 'c', 'd']));
  });
});

describe('hasCycle (revisit branch)', () => {
  it('handles a DAG with a node reachable from multiple roots', () => {
    expect(
      hasCycle({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [
          { from: 'a', to: 'c' },
          { from: 'b', to: 'c' },
        ],
      }),
    ).toBe(false);
  });
});
