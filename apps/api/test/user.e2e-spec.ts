import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { DatabaseTestContainer } from './testcontainers-setup';
import { execSync } from 'child_process';
import { getTestAccessToken } from './helpers/get-test-token';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';

describe('User e2e tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbContainer: DatabaseTestContainer;
  let token: string;

  beforeAll(async () => {
    // Start database container
    dbContainer = new DatabaseTestContainer();
    const connectionString = await dbContainer.start();

    // Run migrations
    execSync('npx prisma db push', {
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.useGlobalFilters(new PrismaExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Automatically remove non-whitelisted properties
        transform: true, // Automatically transform payloads to DTO instances
      })
    );

    await app.init();
  });

  afterAll(async () => {
    console.log('🛑 afterAll: closing app…');
    await app.close();

    console.log('🛑 afterAll: disconnecting prisma…');
    await prisma.$disconnect();

    console.log('🛑 afterAll: stopping DB container…');
    await dbContainer.stop();
    console.log('🛑 afterAll: STOPPED DB container…');
  });

  let testSupabaseId: string;

  beforeEach(async () => {
    await prisma.user.deleteMany({});
    testSupabaseId = `test-supabase-id-${Date.now()}`;
    token = getTestAccessToken(testSupabaseId, 'test@example.com');
  });

  it('/users POST - should create a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supabaseId: testSupabaseId,
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'IST',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('/users POST - should return 409 for duplicate email', async () => {
    // Create first user
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supabaseId: testSupabaseId,
        email: 'duplicate@example.com',
        name: 'First User',
      })
      .expect(201);

    // Try to create duplicate
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supabaseId: `another-${testSupabaseId}`,
        email: 'duplicate@example.com',
        name: 'Second User',
      })
      .expect(409);
  });

  it('/users GET - should return all users', async () => {
    // Create test users
    await prisma.user.createMany({
      data: [
        { email: 'user1@test.com', name: 'User 1' },
        { email: 'user2@test.com', name: 'User 2' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      email: 'user1@test.com',
      name: 'User 1',
    });
  });

  it('/users GET - should support pagination', async () => {
    // Create test users
    await prisma.user.createMany({
      data: [
        { email: 'user1@test.com', name: 'User 1' },
        { email: 'user2@test.com', name: 'User 2' },
        { email: 'user3@test.com', name: 'User 3' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/users?skip=1&take=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  it('/users GET - should support search', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'john@test.com', name: 'John Doe' },
        { email: 'jane@test.com', name: 'Jane Smith' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/users?search=john')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('John Doe');
  });

  it('/users GET - should support sorting', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'b@test.com', name: 'B User' },
        { email: 'a@test.com', name: 'A User' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/users?sortBy=name&sortOrder=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body[0].name).toBe('A User');
    expect(response.body[1].name).toBe('B User');
  });

  it('/users/count GET - should return user count', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'user1@test.com', name: 'User 1' },
        { email: 'user2@test.com', name: 'User 2' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/users/count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ count: 2 });
  });

  it('/users/count GET - should return filtered count', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'john@test.com', name: 'John Doe' },
        { email: 'jane@test.com', name: 'Jane Smith' },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/users/count?search=john')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ count: 1 });
  });

  it('/users/:id GET - should return user by id', async () => {
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-single`,
        email: 'single@test.com',
        name: 'Single User',
      },
    });
    const token = getTestAccessToken(user.supabaseId, user.email);

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  });

  it('/users/:id GET - should return 404 for non-existent user', async () => {
    await request(app.getHttpServer())
      .get('/users/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("/users/:id GET - should return 403 when user tries to get another user's data", async () => {
    const userA = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-A`,
        email: 'userA@test.com',
        name: 'User A',
      },
    });
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-B`,
        email: 'userB@test.com',
        name: 'User B',
      },
    });

    const tokenA = getTestAccessToken(userA.supabaseId, userA.email);

    await request(app.getHttpServer())
      .get(`/users/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

  it('/users/:id/social-accounts GET - should return user with social accounts', async () => {
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-social`,
        email: 'social@test.com',
        name: 'Social User',
      },
    });
    const token = getTestAccessToken(user.supabaseId, user.email);

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id}/social-accounts`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it("/users/:id/social-accounts GET - should return 403 when user tries to get another user's social accounts", async () => {
    const userA = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-social-A`,
        email: 'userA_social@test.com',
        name: 'User A Social',
      },
    });
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-social-B`,
        email: 'userB_social@test.com',
        name: 'User B Social',
      },
    });

    const tokenA = getTestAccessToken(userA.supabaseId, userA.email);

    await request(app.getHttpServer())
      .get(`/users/${userB.id}/social-accounts`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

  it('/users/:id/recent-posts GET - should return user with recent posts', async () => {
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-posts`,
        email: 'posts@test.com',
        name: 'Posts User',
      },
    });
    const token = getTestAccessToken(user.supabaseId, user.email);

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id}/recent-posts?limit=5`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it("/users/:id/recent-posts GET - should return 403 when user tries to get another user's recent posts", async () => {
    const userA = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-posts-A`,
        email: 'userA_posts@test.com',
        name: 'User A Posts',
      },
    });
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-posts-B`,
        email: 'userB_posts@test.com',
        name: 'User B Posts',
      },
    });

    const tokenA = getTestAccessToken(userA.supabaseId, userA.email);

    await request(app.getHttpServer())
      .get(`/users/${userB.id}/recent-posts?limit=5`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

  it('/users/email/:email GET - should return user by email', async () => {
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-findme`,
        email: 'findme@test.com',
        name: 'Find Me',
      },
    });
    const token = getTestAccessToken(user.supabaseId, user.email);

    const response = await request(app.getHttpServer())
      .get(`/users/email/${user.email}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: user.email,
      name: user.name,
    });
  });

  it('/users/email/:email GET - should return 404 for non-existent email', async () => {
    const nonexistentEmail = 'nonexistent@test.com';
    const token = getTestAccessToken('non-existent-id', nonexistentEmail);

    await request(app.getHttpServer())
      .get(`/users/email/${nonexistentEmail}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("/users/email/:email GET - should return 403 when user tries to get another user's data by email", async () => {
    const userA = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-email-A`,
        email: 'userA_email@test.com',
        name: 'User A Email',
      },
    });
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-email-B`,
        email: 'userB_email@test.com',
        name: 'User B Email',
      },
    });

    const tokenA = getTestAccessToken(userA.supabaseId, userA.email);

    await request(app.getHttpServer())
      .get(`/users/email/${userB.email}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

  it('/users/:id PUT - should update user', async () => {
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-update`,
        email: 'update@test.com',
        name: 'Update User',
      },
    });

    const token = getTestAccessToken(user.supabaseId, user.email);

    const updateDto = {
      name: 'Updated Name',
      email: 'updated@test.com',
    };

    const response = await request(app.getHttpServer())
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateDto)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id,
      name: updateDto.name,
      email: updateDto.email,
    });
  });

  it('/users/:id PUT - should return 404 for non-existent user', async () => {
    await request(app.getHttpServer())
      .put('/users/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      })
      .expect(404);
  });

  it("/users/:id PUT - should return 403 when user tries to update another user's data", async () => {
    const userA = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-update-A`,
        email: 'userA_update@test.com',
        name: 'User A Update',
      },
    });
    const userB = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-update-B`,
        email: 'userB_update@test.com',
        name: 'User B Update',
      },
    });

    const tokenA = getTestAccessToken(userA.supabaseId, userA.email);

    await request(app.getHttpServer())
      .put(`/users/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Malicious Update',
      })
      .expect(403);
  });

  it('/users/:id DELETE - should delete user', async () => {
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}-delete`,
        email: 'delete@test.com',
        name: 'Delete User',
      },
    });
    const token = getTestAccessToken(user.supabaseId, user.email);

    const response = await request(app.getHttpServer())
      .delete(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id,
      email: user.email,
    });

    // Verify user was deleted
    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(deletedUser).toBeNull();
  });

  it('/users/:id DELETE - should return 404 for non-existent user', async () => {
    await request(app.getHttpServer())
      .delete('/users/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("/users/:id DELETE - should return 403 when user tries to delete another user's data", async () => {
    const userA = await prisma.user.create({
      data: {
        supabaseId: 'k1l2m3n4-o5p6-7890-1234-567890abcdef',
        email: 'userA_delete@test.com',
        name: 'User A Delete',
      },
    });
    const userB = await prisma.user.create({
      data: {
        supabaseId: 'l1m2n3o4-p5q6-7890-1234-567890abcdef',
        email: 'userB_delete@test.com',
        name: 'User B Delete',
      },
    });

    const tokenA = getTestAccessToken(userA.supabaseId, userA.email);

    await request(app.getHttpServer())
      .delete(`/users/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

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
