import { describe, expect, it } from '@jest/globals';
import { parseArgs } from '../src/parse-args.js';

describe('parseArgs', () => {
  it('parses `run wf_1`', () => {
    const r = parseArgs(['run', 'wf_1']);
    expect(r.command).toBe('run');
    expect(r.workflowId).toBe('wf_1');
  });

  it('parses --api-url and --api-token flags', () => {
    const r = parseArgs(['run', 'wf_1', '--api-url', 'http://x', '--api-token', 't']);
    expect(r.apiUrl).toBe('http://x');
    expect(r.apiToken).toBe('t');
  });

  it('parses --input as JSON', () => {
    const r = parseArgs(['run', 'wf_1', '--input', '{"x":1}']);
    expect(r.input).toEqual({ x: 1 });
  });

  it('rejects --input that is not valid JSON', () => {
    expect(() => parseArgs(['run', 'wf_1', '--input', 'not json'])).toThrow(/invalid JSON/i);
  });

  it('rejects unknown commands', () => {
    expect(() => parseArgs(['fly', 'wf_1'])).toThrow(/unknown command/i);
  });

  it('rejects `run` with no workflow id', () => {
    expect(() => parseArgs(['run'])).toThrow(/workflow id required/i);
  });

  it('sets wait=true when --wait flag present', () => {
    const r = parseArgs(['run', 'wf_1', '--wait']);
    expect(r.wait).toBe(true);
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['run', 'wf_1', '--unknown', 'val'])).toThrow(/unknown flag/i);
  });

  it('rejects empty argv', () => {
    expect(() => parseArgs([])).toThrow(/command required/i);
  });

  it('rejects a flag with no value', () => {
    expect(() => parseArgs(['run', 'wf_1', '--api-url'])).toThrow(/requires a value/i);
  });

  it('parses --poll-interval as a positive number', () => {
    const r = parseArgs(['run', 'wf_1', '--poll-interval', '2500']);
    expect(r.pollIntervalMs).toBe(2500);
  });

  it('rejects --poll-interval that is not a positive number', () => {
    expect(() => parseArgs(['run', 'wf_1', '--poll-interval', '0'])).toThrow(
      /must be a positive number/i,
    );
    expect(() => parseArgs(['run', 'wf_1', '--poll-interval', 'abc'])).toThrow(
      /must be a positive number/i,
    );
  });
});
