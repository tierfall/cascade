import { WorkflowSchema, type Workflow } from '@tierfall/cascade-core';
import { emit, type EmitOptions } from './emit.js';

export function compile(workflow: Workflow, opts: EmitOptions = {}): string {
  const parsed = WorkflowSchema.parse(workflow);
  return emit(parsed, opts);
}
