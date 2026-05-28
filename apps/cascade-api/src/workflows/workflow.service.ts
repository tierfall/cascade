import { Injectable } from '@nestjs/common';
import type { Workflow as WorkflowDefinition } from '@tierfall/cascade-core';
import { Prisma } from '../../prisma/generated/client/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateWorkflowBody, ListQuery, UpdateWorkflowBody } from './dto.js';
import { WorkflowAlreadyExistsError, WorkflowNotFoundError } from './workflow.errors.js';

export interface WorkflowSummary {
  id: string;
  name: string;
  schemaVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDetail extends WorkflowSummary {
  definition: WorkflowDefinition;
}

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateWorkflowBody): Promise<WorkflowDetail> {
    try {
      const row = await this.prisma.workflow.create({
        data: {
          id: body.id,
          name: body.name,
          schemaVersion: body.schemaVersion,
          definition: body as unknown as Prisma.InputJsonValue,
        },
      });
      return this.toDetail(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new WorkflowAlreadyExistsError(body.id);
      }
      throw err;
    }
  }

  async findAll(query: ListQuery): Promise<{ items: WorkflowSummary[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.workflow.findMany({
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: {
          id: true,
          name: true,
          schemaVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.workflow.count(),
    ]);
    return { items: rows, total };
  }

  async findOne(id: string): Promise<WorkflowDetail> {
    const row = await this.prisma.workflow.findUnique({ where: { id } });
    if (row === null) {
      throw new WorkflowNotFoundError(id);
    }
    return this.toDetail(row);
  }

  async update(id: string, body: UpdateWorkflowBody): Promise<WorkflowDetail> {
    try {
      const data: Prisma.WorkflowUpdateInput = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.definition !== undefined) {
        data.definition = body.definition as unknown as Prisma.InputJsonValue;
        data.schemaVersion = body.definition.schemaVersion;
      }
      const row = await this.prisma.workflow.update({ where: { id }, data });
      return this.toDetail(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new WorkflowNotFoundError(id);
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.workflow.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new WorkflowNotFoundError(id);
      }
      throw err;
    }
  }

  private toDetail(row: {
    id: string;
    name: string;
    schemaVersion: string;
    definition: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }): WorkflowDetail {
    return {
      id: row.id,
      name: row.name,
      schemaVersion: row.schemaVersion,
      definition: row.definition as unknown as WorkflowDefinition,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
