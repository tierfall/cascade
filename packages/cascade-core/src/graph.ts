import { CycleDetectedError } from './errors.js';

interface MinimalNode {
  id: string;
}
interface MinimalEdge {
  from: string;
  to: string;
}
export interface Graph {
  nodes: readonly MinimalNode[];
  edges: readonly MinimalEdge[];
}

function adjacency(graph: Graph): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  graph.nodes.forEach((n) => adj.set(n.id, []));
  graph.edges.forEach((e) => {
    const list = adj.get(e.from);
    if (list) list.push(e.to);
  });
  return adj;
}

export function hasCycle(graph: Graph): boolean {
  const adj = adjacency(graph);
  const visited = new Set<string>();
  const stack = new Set<string>();
  const dfs = (id: string): boolean => {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    const out = adj.get(id);
    if (out) {
      for (const next of out) {
        if (dfs(next)) return true;
      }
    }
    stack.delete(id);
    return false;
  };
  for (const node of graph.nodes) {
    if (dfs(node.id)) return true;
  }
  return false;
}

export function topologicalSort(graph: Graph): string[] {
  if (hasCycle(graph)) {
    throw new CycleDetectedError([]);
  }
  const adj = adjacency(graph);
  const indeg = new Map<string, number>();
  graph.nodes.forEach((n) => indeg.set(n.id, 0));
  graph.edges.forEach((e) => {
    const current = indeg.get(e.to);
    if (current !== undefined) {
      indeg.set(e.to, current + 1);
    }
  });

  const queue: string[] = [];
  indeg.forEach((d, id) => {
    if (d === 0) queue.push(id);
  });
  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    /* istanbul ignore if -- @preserve: queue.length > 0 guarantees shift returns a value; defensive narrowing only */
    if (id === undefined) continue;
    sorted.push(id);
    const out = adj.get(id);
    if (out) {
      out.forEach((next) => {
        const currentDeg = indeg.get(next);
        if (currentDeg !== undefined) {
          const newDeg = currentDeg - 1;
          indeg.set(next, newDeg);
          if (newDeg === 0) queue.push(next);
        }
      });
    }
  }
  return sorted;
}

export function reachableFrom(graph: Graph, start: string): Set<string> {
  const adj = adjacency(graph);
  const visited = new Set<string>();
  if (!adj.has(start)) return visited;
  const stack: string[] = [start];
  while (stack.length > 0) {
    const id = stack.pop();
    /* istanbul ignore if -- @preserve: stack.length > 0 guarantees pop returns a value; defensive narrowing only */
    if (id === undefined) continue;
    if (visited.has(id)) continue;
    visited.add(id);
    const out = adj.get(id);
    if (out) {
      out.forEach((next) => stack.push(next));
    }
  }
  return visited;
}
