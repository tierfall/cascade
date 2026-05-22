import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CascadeApiError, CascadeClient } from '../src/index.js';

describe('CascadeClient', () => {
  const fetchMock = jest.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('issues a GET to /health on healthcheck()', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    const result = await client.health();
    expect(result.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws CascadeApiError on a 500 response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'boom' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    await expect(client.health()).rejects.toBeInstanceOf(CascadeApiError);
  });

  it('attaches the Authorization header when an api token is configured', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test', apiToken: 't0ken' });
    await client.health();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/health',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer t0ken' }),
      }),
    );
  });

  it('listWorkflows() issues a GET to /workflows and returns the parsed array', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 'wf_1', name: 'Demo' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    const wfs = await client.listWorkflows();
    expect(wfs).toEqual([{ id: 'wf_1', name: 'Demo' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/workflows',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('triggerWorkflow() POSTs JSON to /workflows/:id/runs', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'run_1', status: 'queued' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    const run = await client.triggerWorkflow('wf_1', { input: { hello: 'world' } });
    expect(run.id).toBe('run_1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/workflows/wf_1/runs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ input: { hello: 'world' } }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('rejects with CascadeApiError when content-type is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('not json', { status: 200, headers: { 'content-type': 'text/plain' } }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    await expect(client.health()).rejects.toBeInstanceOf(CascadeApiError);
  });

  it('strips trailing slashes from baseUrl', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test///' });
    await client.health();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uses an injected fetch implementation when provided', async () => {
    const injected = jest.fn(async () =>
      Promise.resolve(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      ),
    );
    const client = new CascadeClient({
      baseUrl: 'http://api.test',
      fetch: injected,
    });
    await client.health();
    expect(injected).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects with CascadeApiError when content-type header is missing', async () => {
    const fakeResponse = {
      status: 200,
      ok: true,
      headers: { get: () => null },
      json: () => Promise.resolve({}),
    };
    fetchMock.mockResolvedValueOnce(fakeResponse as unknown as Response);
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    await expect(client.health()).rejects.toBeInstanceOf(CascadeApiError);
  });
});
