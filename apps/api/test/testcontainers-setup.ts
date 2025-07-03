import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export class DatabaseTestContainer {
  private container: StartedPostgreSqlContainer;

  async start(): Promise<string> {
    this.container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    const connectionString = this.container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;

    return connectionString;
  }

  async stop(): Promise<void> {
    if (this.container) {
      await this.container.stop();
    }
  }

  getConnectionString(): string {
    return this.container.getConnectionUri();
  }
}
