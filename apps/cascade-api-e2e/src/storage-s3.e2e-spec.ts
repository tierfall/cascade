import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { S3Storage } from '../../cascade-api/src/storage/s3-storage.js';

const BUCKET = 'cascade-test';

describe('S3Storage (integration, MinIO via Testcontainers)', () => {
  let container: StartedTestContainer;
  let storage: S3Storage;

  beforeAll(async () => {
    container = await new GenericContainer('minio/minio:RELEASE.2024-12-18T13-15-44Z')
      .withCommand(['server', '/data'])
      .withEnvironment({
        MINIO_ROOT_USER: 'cascade',
        MINIO_ROOT_PASSWORD: 'cascade_change_me_on_first_boot',
      })
      .withExposedPorts(9000)
      .start();

    const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000).toString()}`;

    // Create the bucket up front.
    const bootstrap = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: 'cascade', secretAccessKey: 'cascade_change_me_on_first_boot' },
    });
    await bootstrap.send(new CreateBucketCommand({ Bucket: BUCKET }));
    bootstrap.destroy();

    storage = new S3Storage({
      bucket: BUCKET,
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      accessKeyId: 'cascade',
      secretAccessKey: 'cascade_change_me_on_first_boot',
    });
  }, 120_000);

  afterAll(async () => {
    await container.stop();
  });

  it('put → get round-trips the body and content type', async () => {
    await storage.put({
      key: 'roundtrip.json',
      body: Buffer.from('{"hello":"world"}'),
      contentType: 'application/json',
    });
    const result = await storage.get('roundtrip.json');
    expect(result).not.toBeNull();
    expect(result?.body.toString('utf8')).toBe('{"hello":"world"}');
    expect(result?.contentType).toBe('application/json');
  });

  it('exists returns true after put, false after delete', async () => {
    await storage.put({ key: 'temp.bin', body: Buffer.from([1, 2, 3]) });
    expect(await storage.exists('temp.bin')).toBe(true);
    await storage.delete('temp.bin');
    expect(await storage.exists('temp.bin')).toBe(false);
  });

  it('get returns null for missing key', async () => {
    expect(await storage.get('does-not-exist')).toBeNull();
  });

  it('exists returns false for missing key (no throw)', async () => {
    expect(await storage.exists('does-not-exist')).toBe(false);
  });

  it('round-trips a binary buffer with no content type', async () => {
    const bytes = Buffer.from([0, 1, 2, 250, 251, 255]);
    await storage.put({ key: 'binary.bin', body: bytes });
    const result = await storage.get('binary.bin');
    expect(result).not.toBeNull();
    expect(Buffer.compare(result?.body ?? Buffer.alloc(0), bytes)).toBe(0);
  });
});
