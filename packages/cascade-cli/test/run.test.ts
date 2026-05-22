import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { runCommand } from '../src/run.js';

describe('runCommand', () => {
  const fetchMock = jest.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('triggers the workflow and prints the run id', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'run_42', status: 'queued', workflowId: 'wf_1' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const logs: string[] = [];
    await runCommand(
      { workflowId: 'wf_1', apiUrl: 'http://api.test', input: { x: 1 }, wait: false },
      (m) => logs.push(m),
    );
    expect(logs.join('\n')).toContain('run_42');
  });

  it('forwards api-token to the SDK as Bearer', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'r', status: 'queued', workflowId: 'wf_1' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
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
    fetchMock.mockResolvedValueOnce(
      new Response('{"error":"x"}', {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(
      runCommand({ workflowId: 'wf_1', apiUrl: 'http://api.test', wait: false }, () => undefined),
    ).rejects.toThrow();
  });

  it('logs --wait notice when wait is true', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'r2', status: 'queued', workflowId: 'wf_1' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const logs: string[] = [];
    await runCommand({ workflowId: 'wf_1', apiUrl: 'http://api.test', wait: true }, (m) =>
      logs.push(m),
    );
    expect(logs.join('\n')).toContain('B-CLI-WAIT');
  });
});
