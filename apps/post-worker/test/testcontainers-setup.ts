import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

export class TestContainers {
  private pgContainer?: StartedPostgreSqlContainer;
  private redisContainer?: StartedRedisContainer;

  async start(): Promise<{ dbUri: string; redisUrl: string }> {
    console.log('🟢 Starting test containers…');
    this.pgContainer = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    this.redisContainer = await new RedisContainer('redis:alpine').start();

    const dbUri = this.pgContainer.getConnectionUri();
    const redisUrl = this.redisContainer.getConnectionUrl();

    console.log(`🟢 Postgres container started at ${dbUri}`);
    console.log(`🟢 Redis container started at ${redisUrl}`);

    process.env.DATABASE_URL = dbUri;
    process.env.REDIS_URL = redisUrl;

    return { dbUri, redisUrl };
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping test containers…');
    try {
      await this.pgContainer?.stop();
      await this.redisContainer?.stop();
      console.log('✅ Containers stopped & removed');
    } catch (err) {
      console.error('❌ Error stopping containers:', err);
    }
  }

  getDbConnectionString(): string {
    if (!this.pgContainer) {
      throw new Error('Postgres container not started yet');
    }
    return this.pgContainer.getConnectionUri();
  }

  getRedisUrl(): string {
    if (!this.redisContainer) {
      throw new Error('Redis container not started yet');
    }
    return this.redisContainer.getConnectionUrl();
  }
}
