import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'node:child_process';

export interface BackingServices {
  pg: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
  databaseUrl: string;
  redisUrl: string;
}

export async function startBackingServices(): Promise<BackingServices> {
  const pg = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('cascade_test')
    .withUsername('cascade')
    .withPassword('cascade')
    .start();
  const redis = await new RedisContainer('redis:7-alpine').start();

  const databaseUrl = pg.getConnectionUri();
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379).toString()}`;

  // Apply prisma schema. cascade-api owns the schema; we shell out to its prisma CLI.
  process.env.DATABASE_URL = databaseUrl;
  execSync('pnpm --filter cascade-api exec prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  return { pg, redis, databaseUrl, redisUrl };
}

export async function stopBackingServices(services: BackingServices): Promise<void> {
  await services.pg.stop();
  await services.redis.stop();
}
