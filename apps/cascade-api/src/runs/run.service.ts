import { Injectable } from '@nestjs/common';
import { topologicalSort, type Workflow as WorkflowDefinition } from '@tierfall/cascade-core';
import { getNodeHandler } from '@tierfall/cascade-nodes';
import { Prisma } from '../../prisma/generated/client/index.js';
import { LimitExceededError, RunLimitsService } from '../limits/run-limits.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkflowNotFoundError } from '../workflows/workflow.errors.js';
import { RunNotFoundError } from './run.errors.js';

export interface RunSummary {
  id: string;
  workflowId: string;
  status: 'queued' | 'running' | 'success' | 'error';
  startedAt: Date | null;
  finishedAt: Date | null;
  costUsd: number | null;
  createdAt: Date;
}

export interface RunDetail extends RunSummary {
  inputPayload: unknown;
  nodeExecutions: NodeExecutionRecord[];
}

export interface NodeExecutionRecord {
  id: string;
  nodeId: string;
  status: 'queued' | 'running' | 'success' | 'error';
  tier: number | null;
  inputJson: unknown;
  outputJson: unknown;
  errorJson: unknown;
  startedAt: Date | null;
  finishedAt: Date | null;
  costUsd: number | null;
}

@Injectable()
export class RunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limits: RunLimitsService,
  ) {}

  async triggerSync(
    workflowId: string,
    input: Record<string, unknown> | undefined,
  ): Promise<RunDetail> {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (workflow === null) {
      throw new WorkflowNotFoundError(workflowId);
    }
    const definition = workflow.definition as unknown as WorkflowDefinition;
    const order = topologicalSort({ nodes: definition.nodes, edges: definition.edges });
    const nodesById = new Map(definition.nodes.map((n) => [n.id, n]));

    const run = await this.prisma.run.create({
      data: {
        workflowId,
        status: 'running',
        inputPayload: input === undefined ? Prisma.JsonNull : (input as Prisma.InputJsonValue),
        startedAt: new Date(),
      },
    });

    const inputMap: Record<string, unknown> = { ...(input ?? {}) };
    const startedAt = Date.now();
    let runStatus: 'success' | 'error' = 'success';
    let runError: { message: string; limit?: string } | null = null;
    let nodesExecuted = 0;

    for (const nodeId of order) {
      this.limits.checkNodeCount(nodesExecuted);
      this.limits.checkDuration(Date.now() - startedAt);
      const node = nodesById.get(nodeId);
      if (node === undefined) continue;
      const nodeExec = await this.prisma.nodeExecution.create({
        data: {
          runId: run.id,
          nodeId,
          status: 'running',
          inputJson: inputMap as Prisma.InputJsonValue,
          startedAt: new Date(),
        },
      });
      try {
        const handler = getNodeHandler(node.type);
        const validated = handler.validateConfig(node.config);
        if (!validated.success) {
          throw new Error(`invalid node config: ${validated.error.message}`);
        }
        const result = await handler.execute(validated.data, {
          runId: run.id,
          nodeId,
          input: inputMap,
        });
        const output = 'output' in result ? result.output : result;
        await this.prisma.nodeExecution.update({
          where: { id: nodeExec.id },
          data: {
            status: 'success',
            outputJson: output as Prisma.InputJsonValue,
            finishedAt: new Date(),
          },
        });
        if (result.kind === 'success' && output !== null && typeof output === 'object') {
          Object.assign(inputMap, output as Record<string, unknown>);
        }
        nodesExecuted += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.prisma.nodeExecution.update({
          where: { id: nodeExec.id },
          data: {
            status: 'error',
            errorJson: { message },
            finishedAt: new Date(),
          },
        });
        if (err instanceof LimitExceededError) {
          runStatus = 'error';
          runError = { message, limit: err.limit };
        } else {
          runStatus = 'error';
          runError = { message };
        }
        break;
      }
    }

    await this.prisma.run.update({
      where: { id: run.id },
      data: {
        status: runStatus,
        finishedAt: new Date(),
      },
    });

    return this.findOne(run.id, runError);
  }

  async findOne(id: string, fallbackError: unknown = null): Promise<RunDetail> {
    const row = await this.prisma.run.findUnique({
      where: { id },
      include: { nodeExecutions: { orderBy: { startedAt: 'asc' } } },
    });
    if (row === null) {
      throw new RunNotFoundError(id);
    }
    return {
      id: row.id,
      workflowId: row.workflowId,
      status: row.status as RunSummary['status'],
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      costUsd: row.costUsd === null ? null : Number(row.costUsd),
      createdAt: row.createdAt,
      inputPayload: fallbackError ?? row.inputPayload,
      nodeExecutions: row.nodeExecutions.map((n) => ({
        id: n.id,
        nodeId: n.nodeId,
        status: n.status as NodeExecutionRecord['status'],
        tier: n.tier,
        inputJson: n.inputJson,
        outputJson: n.outputJson,
        errorJson: n.errorJson,
        startedAt: n.startedAt,
        finishedAt: n.finishedAt,
        costUsd: n.costUsd === null ? null : Number(n.costUsd),
      })),
    };
  }

  async findAll(query: {
    workflowId?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: RunSummary[]; total: number }> {
    const where = query.workflowId !== undefined ? { workflowId: query.workflowId } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.run.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.run.count({ where }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        workflowId: r.workflowId,
        status: r.status as RunSummary['status'],
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        costUsd: r.costUsd === null ? null : Number(r.costUsd),
        createdAt: r.createdAt,
      })),
      total,
    };
  }
}
