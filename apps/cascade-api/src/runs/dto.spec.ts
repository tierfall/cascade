import { ListRunsQuerySchema, TriggerRunBodySchema } from './dto.js';

describe('TriggerRunBodySchema', () => {
  it('accepts an empty body', () => {
    expect(TriggerRunBodySchema.safeParse({}).success).toBe(true);
  });

  it('accepts input record', () => {
    expect(TriggerRunBodySchema.safeParse({ input: { a: 1 } }).success).toBe(true);
  });

  it('rejects extra keys', () => {
    expect(TriggerRunBodySchema.safeParse({ input: {}, extra: 1 }).success).toBe(false);
  });
});

describe('ListRunsQuerySchema', () => {
  it('coerces limit/offset', () => {
    const result = ListRunsQuerySchema.safeParse({ limit: '10', offset: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(5);
    }
  });

  it('applies defaults', () => {
    const result = ListRunsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('accepts workflowId filter', () => {
    const result = ListRunsQuerySchema.safeParse({ workflowId: 'wf_1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workflowId).toBe('wf_1');
    }
  });

  it('rejects limit over 100', () => {
    expect(ListRunsQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
