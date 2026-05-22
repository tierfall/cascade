import { describe, expect, it } from '@jest/globals';
import { getNodeHandler, NODE_TYPE_KEYS, nodeRegistry } from '../src/index.js';

describe('nodeRegistry', () => {
  it('exposes handlers for all four v0.1 node types', () => {
    expect(NODE_TYPE_KEYS).toEqual(['llm', 'conditional', 'transform', 'http']);
    NODE_TYPE_KEYS.forEach((k) => {
      expect(nodeRegistry[k]).toBeDefined();
      expect(typeof nodeRegistry[k].execute).toBe('function');
      expect(typeof nodeRegistry[k].validateConfig).toBe('function');
    });
  });

  it('getNodeHandler returns the registered handler', () => {
    expect(getNodeHandler('http')).toBe(nodeRegistry.http);
  });

  it('getNodeHandler throws on unknown type', () => {
    expect(() => getNodeHandler('nope' as 'http')).toThrow(/unknown node type/i);
  });
});
