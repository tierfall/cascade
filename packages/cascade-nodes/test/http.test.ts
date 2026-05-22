import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { httpHandler } from '../src/node-types/http.js';
import type { NodeResult } from '../src/types.js';

type HttpResult = Extract<NodeResult, { kind: 'http' }>;

describe('httpHandler', () => {
  const fetchMock = jest.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('validateConfig rejects a missing url', () => {
    expect(httpHandler.validateConfig({ method: 'GET' }).success).toBe(false);
  });

  it('validateConfig rejects a malformed url', () => {
    expect(httpHandler.validateConfig({ url: 'not-a-url' }).success).toBe(false);
  });

  it('execute issues a request to the configured url and returns the body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const result = (await httpHandler.execute(
      { url: 'http://example.com', method: 'GET' },
      { runId: 'r', nodeId: 'n' },
    )) as HttpResult;
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
  });

  it('execute returns the failing status without throwing on 4xx/5xx (caller decides)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('boom', { status: 500, headers: { 'content-type': 'text/plain' } }),
    );
    const result = (await httpHandler.execute(
      { url: 'http://example.com', method: 'GET' },
      { runId: 'r', nodeId: 'n' },
    )) as HttpResult;
    expect(result.status).toBe(500);
  });

  it('execute sends headers and body when provided', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('ok', { status: 201, headers: { 'content-type': 'text/plain' } }),
    );
    const result = (await httpHandler.execute(
      {
        url: 'http://example.com',
        method: 'POST',
        headers: { 'x-token': 'abc' },
        body: { data: 1 },
      },
      { runId: 'r', nodeId: 'n' },
    )) as HttpResult;
    expect(result.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://example.com',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('validateConfig accepts a valid url with default method', () => {
    expect(httpHandler.validateConfig({ url: 'https://api.example.com/v1' }).success).toBe(true);
  });

  it('execute handles null content-type header by reading body as text', async () => {
    const mockResponse = {
      status: 200,
      headers: { get: (_: string) => null },
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('plain text'),
    };
    fetchMock.mockResolvedValueOnce(mockResponse as unknown as Response);
    const result = (await httpHandler.execute(
      { url: 'http://example.com', method: 'GET' },
      { runId: 'r', nodeId: 'n' },
    )) as HttpResult;
    expect(result.status).toBe(200);
    expect(result.body).toBe('plain text');
  });
});
