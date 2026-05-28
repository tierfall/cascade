import { Injectable } from '@nestjs/common';
import type { Workflow as WorkflowDefinition } from '@tierfall/cascade-core';
import { Prisma } from '../../prisma/generated/client/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RunService } from '../runs/run.service.js';
import { WebhookNotFoundError } from './webhook.errors.js';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runService: RunService,
  ) {}

  async trigger(path: string, body: unknown): Promise<{ runId: string; workflowId: string }> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // Postgres jsonb path query: find any workflow whose definition.triggers
    // contains an element with kind='webhook' AND path matching either form.
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id FROM "Workflow"
        WHERE definition @> ${{ triggers: [{ kind: 'webhook', path: normalizedPath }] }}::jsonb
           OR definition @> ${{ triggers: [{ kind: 'webhook', path }] }}::jsonb
        LIMIT 1
      `,
    );
    const row = rows[0];
    if (row === undefined) {
      throw new WebhookNotFoundError(path);
    }
    const workflow = await this.prisma.workflow.findUniqueOrThrow({ where: { id: row.id } });
    const definition = workflow.definition as unknown as WorkflowDefinition;

    // Re-verify the trigger exists in the definition we just loaded (defensive
    // against any race between the query and the load).
    const matches = definition.triggers.some(
      (t) => t.kind === 'webhook' && (t.path === path || t.path === normalizedPath),
    );
    if (!matches) {
      throw new WebhookNotFoundError(path);
    }

    const input =
      body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : { body };
    const run = await this.runService.triggerSync(workflow.id, input);
    return { runId: run.id, workflowId: workflow.id };
  }
}
