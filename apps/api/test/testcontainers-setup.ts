// testcontainers-setup.ts
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

export class DatabaseTestContainer {
  private container?: StartedPostgreSqlContainer;

  async start(): Promise<string> {
    console.log('🟢 Starting test container…');
    this.container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    const uri = this.container.getConnectionUri();
    console.log(`🟢 Container started at ${uri}`);
    process.env.DATABASE_URL = uri;
    return uri;
  }

  async stop(): Promise<void> {
    if (!this.container) {
      console.warn('⚠️  No container instance to stop');
      return;
    }

    try {
      console.log('🛑 Stopping test container…');
      await this.container.stop();
      console.log('✅ Container stopped & removed');
    } catch (err) {
      console.error('❌ Error stopping container:', err);
    }
  }

  getConnectionString(): string {
    if (!this.container) {
      throw new Error('Container not started yet');
    }
    return this.container.getConnectionUri();
  }
}
