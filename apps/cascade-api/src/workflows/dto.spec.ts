import { CreateWorkflowBodySchema, ListQuerySchema, UpdateWorkflowBodySchema } from './dto.js';

const validDefinition = {
  schemaVersion: '1.0.0',
  id: 'wf-1',
  name: 'Sample',
  nodes: [{ id: 'n1', type: 'http', config: {} }],
  edges: [],
  triggers: [],
};

describe('CreateWorkflowBodySchema', () => {
  it('accepts a valid workflow definition', () => {
    expect(CreateWorkflowBodySchema.safeParse(validDefinition).success).toBe(true);
  });

  it('rejects an empty nodes array', () => {
    expect(CreateWorkflowBodySchema.safeParse({ ...validDefinition, nodes: [] }).success).toBe(
      false,
    );
  });

  it('rejects malformed schemaVersion', () => {
    expect(
      CreateWorkflowBodySchema.safeParse({ ...validDefinition, schemaVersion: '1' }).success,
    ).toBe(false);
  });

  it('rejects edges referencing unknown nodes', () => {
    expect(
      CreateWorkflowBodySchema.safeParse({
        ...validDefinition,
        edges: [{ from: 'missing', to: 'n1' }],
      }).success,
    ).toBe(false);
  });
});

describe('UpdateWorkflowBodySchema', () => {
  it('accepts name-only update', () => {
    expect(UpdateWorkflowBodySchema.safeParse({ name: 'New name' }).success).toBe(true);
  });

  it('accepts definition-only update', () => {
    expect(UpdateWorkflowBodySchema.safeParse({ definition: validDefinition }).success).toBe(true);
  });

  it('rejects empty object', () => {
    expect(UpdateWorkflowBodySchema.safeParse({}).success).toBe(false);
  });

  it('rejects extra keys', () => {
    expect(UpdateWorkflowBodySchema.safeParse({ name: 'N', schemaVersion: '2.0.0' }).success).toBe(
      false,
    );
  });
});

describe('ListQuerySchema', () => {
  it('coerces numeric query strings', () => {
    const result = ListQuerySchema.safeParse({ limit: '25', offset: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
      expect(result.data.offset).toBe(10);
    }
  });

  it('applies defaults when fields are missing', () => {
    const result = ListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('rejects limit above 100', () => {
    expect(ListQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
