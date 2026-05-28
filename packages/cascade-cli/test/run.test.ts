import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RunFailedError, runCommand } from '../src/run.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('runCommand (no --wait)', () => {
  const fetchMock = jest.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('triggers the workflow and prints the run id', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'run_42', status: 'queued', workflowId: 'wf_1' }, 202),
    );
    const logs: string[] = [];
    const result = await runCommand(
      { workflowId: 'wf_1', apiUrl: 'http://api.test', input: { x: 1 }, wait: false },
      (m) => logs.push(m),
    );
    expect(result.id).toBe('run_42');
    expect(logs.join('\n')).toContain('run_42');
  });

  it('forwards api-token to the SDK as Bearer', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'r', status: 'queued', workflowId: 'wf_1' }, 202),
    );
    await runCommand(
      { workflowId: 'wf_1', apiUrl: 'http://api.test', apiToken: 't0k', wait: false },
      () => undefined,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer t0k' }),
      }),
    );
  });

  it('throws on API error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'x' }, 500));
    await expect(
      runCommand({ workflowId: 'wf_1', apiUrl: 'http://api.test', wait: false }, () => undefined),
    ).rejects.toThrow();
  });
});

describe('runCommand (--wait)', () => {
  const fetchMock = jest.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('polls /runs/:id until success', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'queued', workflowId: 'w' }, 202))
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'running', workflowId: 'w' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'success', workflowId: 'w' }));
    const sleep = jest.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
    const logs: string[] = [];
    const result = await runCommand(
      {
        workflowId: 'w',
        apiUrl: 'http://api.test',
        wait: true,
        pollIntervalMs: 50,
        sleep,
      },
      (m) => logs.push(m),
    );
    expect(result.status).toBe('success');
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(50);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws RunFailedError when the run terminates with status error', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'queued', workflowId: 'w' }, 202))
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'error', workflowId: 'w' }));
    const sleep = jest.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
    await expect(
      runCommand(
        { workflowId: 'w', apiUrl: 'http://api.test', wait: true, sleep },
        () => undefined,
      ),
    ).rejects.toBeInstanceOf(RunFailedError);
  });

  it('returns immediately when the trigger response is already terminal', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'r', status: 'success', workflowId: 'w' }, 202),
    );
    const sleep = jest.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
    const result = await runCommand(
      { workflowId: 'w', apiUrl: 'http://api.test', wait: true, sleep },
      () => undefined,
    );
    expect(result.status).toBe('success');
    expect(sleep).not.toHaveBeenCalled();
  });

  it('uses the default 1000ms sleep when none is injected', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'queued', workflowId: 'w' }, 202))
      .mockResolvedValueOnce(jsonResponse({ id: 'r', status: 'success', workflowId: 'w' }));
    const result = await runCommand(
      { workflowId: 'w', apiUrl: 'http://api.test', wait: true, pollIntervalMs: 1 },
      () => undefined,
    );
    expect(result.status).toBe('success');
  });
});
