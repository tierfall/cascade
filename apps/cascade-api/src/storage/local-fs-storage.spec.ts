import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalFsStorage } from './local-fs-storage.js';

describe('LocalFsStorage', () => {
  let root: string;
  let storage: LocalFsStorage;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'cascade-storage-'));
    storage = new LocalFsStorage(root);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('put → get round-trips a buffer', async () => {
    await storage.put({ key: 'a/b/c.txt', body: Buffer.from('hello') });
    const result = await storage.get('a/b/c.txt');
    expect(result?.body.toString('utf8')).toBe('hello');
  });

  it('put with contentType returns it on get', async () => {
    await storage.put({
      key: 'a.json',
      body: Buffer.from('{}'),
      contentType: 'application/json',
    });
    const result = await storage.get('a.json');
    expect(result?.contentType).toBe('application/json');
  });

  it('get returns null when the key does not exist', async () => {
    expect(await storage.get('missing')).toBeNull();
  });

  it('exists returns true after put, false after delete', async () => {
    await storage.put({ key: 'k', body: Buffer.from('x') });
    expect(await storage.exists('k')).toBe(true);
    await storage.delete('k');
    expect(await storage.exists('k')).toBe(false);
  });

  it('exists returns false for missing key', async () => {
    expect(await storage.exists('nope')).toBe(false);
  });

  it('delete on missing key is a no-op (does not throw)', async () => {
    await expect(storage.delete('does-not-exist')).resolves.toBeUndefined();
  });

  it('rejects keys that try to escape the root via ..', async () => {
    await expect(storage.put({ key: '../escape', body: Buffer.from('x') })).rejects.toThrow(
      /escapes root/,
    );
  });

  it('rejects keys with nested traversal segments', async () => {
    await expect(storage.put({ key: 'a/../../escape', body: Buffer.from('x') })).rejects.toThrow(
      /escapes root/,
    );
  });
});
