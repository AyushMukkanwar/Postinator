import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { TestContainers } from './testcontainers-setup';
import { execSync } from 'child_process';
import { getTestAccessToken } from './helpers/get-test-token';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';
import { ConfigService } from '@nestjs/config';
import { User } from '@repo/db/prisma/generated/prisma';

describe('User e2e tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testContainers: TestContainers;

  // User and token for tests that need a pre-existing user
  let testUser: User;
  let token: string;

  beforeAll(async () => {
    try {
      testContainers = new TestContainers();
      const { dbUri, redisUrl } = await testContainers.start();

      process.env.DATABASE_URL = dbUri;
      process.env.REDIS_URL = redisUrl;

      execSync('npx prisma db push', {
        cwd: '../../packages/db',
        env: { ...process.env, DATABASE_URL: dbUri },
        stdio: 'inherit',
      });

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: (key: string) => {
            return process.env[key];
          },
        })
        .overrideProvider('SUPABASE_CLIENT')
        .useValue({
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: {
                user: { id: 'test-supabase-id', email: 'test@example.com' },
              },
              error: null,
            }),
          },
        })
        .compile();

      app = moduleFixture.createNestApplication();

      prisma = moduleFixture.get<PrismaService>(PrismaService);

      app.useGlobalFilters(new PrismaExceptionFilter());
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        })
      );

      await app.init();
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    if (testContainers) {
      await testContainers.stop();
    }
  });

  // Create a clean user and token before each test
  beforeEach(async () => {
    await prisma.user.deleteMany({});
    testUser = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    // FIX: Pass the user's internal ID, Supabase ID, and email to generate a valid token
    token = getTestAccessToken(
      testUser.id,
      testUser.supabaseId!,
      testUser.email
    );
  });

  // Note: Most tests below are refactored to use the `testUser` and `token`
  // from the beforeEach hook for simplicity and consistency.

  it('/users/:id GET - should return user by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
    });
  });

  it('/users/:id GET - should return 404 for non-existent user', async () => {
    const nonExistentId = 'clxvwq2hb0000z41k3t3y4xza'; // Example CUID
    await request(app.getHttpServer())
      .get(`/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("/users/:id GET - should return 403 when user tries to get another user's data", async () => {
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-B`,
        email: 'userB@test.com',
        name: 'User B',
      },
    });

    // Token is for testUser (User A), trying to access User B's data
    await request(app.getHttpServer())
      .get(`/users/${userB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  // --- THIS WAS ONE OF THE FAILING TESTS ---
  it('/users/:id/social-accounts GET - should return user with social accounts', async () => {
    // The token is already for testUser, so this will now pass the ResourceOwnerGuard
    const response = await request(app.getHttpServer())
      .get(`/users/${testUser.id}/social-accounts`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testUser.id,
      email: testUser.email,
    });
  });

  it("/users/:id/social-accounts GET - should return 403 when user tries to get another user's social accounts", async () => {
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-social-B`,
        email: 'userB_social@test.com',
        name: 'User B Social',
      },
    });

    await request(app.getHttpServer())
      .get(`/users/${userB.id}/social-accounts`)
      .set('Authorization', `Bearer ${token}`) // Token for testUser (User A)
      .expect(403);
  });

  // --- THIS WAS THE OTHER FAILING TEST ---
  it('/users/:id/recent-posts GET - should return user with recent posts', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${testUser.id}/recent-posts?limit=5`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testUser.id,
      email: testUser.email,
    });
  });

  it("/users/:id/recent-posts GET - should return 403 when user tries to get another user's recent posts", async () => {
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-posts-B`,
        email: 'userB_posts@test.com',
        name: 'User B Posts',
      },
    });

    await request(app.getHttpServer())
      .get(`/users/${userB.id}/recent-posts?limit=5`)
      .set('Authorization', `Bearer ${token}`) // Token for testUser (User A)
      .expect(403);
  });

  it('/users/:id PUT - should update user', async () => {
    const updateDto = {
      name: 'Updated Name',
      email: 'updated@test.com',
    };

    const response = await request(app.getHttpServer())
      .put(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateDto)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testUser.id,
      name: updateDto.name,
      email: updateDto.email,
    });
  });

  it("/users/:id PUT - should return 403 when user tries to update another user's data", async () => {
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-update-B`,
        email: 'userB_update@test.com',
        name: 'User B Update',
      },
    });

    await request(app.getHttpServer())
      .put(`/users/${userB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Malicious Update' })
      .expect(403);
  });

  it('/users/:id DELETE - should delete user', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/users/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({ id: testUser.id });

    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(deletedUser).toBeNull();
  });

  it("/users/:id DELETE - should return 403 when user tries to delete another user's data", async () => {
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-delete-B`, // FIX: Use dynamic ID
        email: 'userB_delete@test.com',
        name: 'User B Delete',
      },
    });

    await request(app.getHttpServer())
      .delete(`/users/${userB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  // These general auth tests can remain as they are.
  it('should return 401 for requests without token', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('should return 401 for requests with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
