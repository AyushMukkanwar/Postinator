import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { TestContainers } from './testcontainers-setup';
import { getTestAccessToken } from './helpers/get-test-token';
import { execSync } from 'child_process';
import { ConfigService } from '@nestjs/config';
import {
  User,
  SocialAccount,
  Platform,
} from '@repo/db/prisma/generated/prisma';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

describe('Post e2e tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testContainers: TestContainers;
  let testUser: User;
  let testSocialAccount: SocialAccount;
  let token: string;
  let postQueue: Queue;

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
      postQueue = moduleFixture.get<Queue>(getQueueToken('post'));

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

  beforeEach(async () => {
    await postQueue.drain();
    await prisma.post.deleteMany({});
    await prisma.socialAccount.deleteMany({});
    await prisma.user.deleteMany({});
    testUser = await prisma.user.create({
      data: {
        supabaseId: `test-supabase-id-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    testSocialAccount = await prisma.socialAccount.create({
      data: {
        userId: testUser.id,
        platform: Platform.TWITTER,
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        platformId: 'test-profile-id',
        username: 'test-username',
        displayName: 'Test User',
        avatar: 'http://example.com/pic.jpg',
      },
    });

    token = getTestAccessToken(
      testUser.id,
      testUser.supabaseId!,
      testUser.email
    );
  });

  it('/post POST - should create a post and add it to the queue', async () => {
    const createPostDto = {
      content: 'This is a test post',
      scheduledFor: new Date(Date.now() + 10000),
      platform: Platform.TWITTER,
      socialAccountId: testSocialAccount.id,
    };

    const response = await request(app.getHttpServer())
      .post('/post')
      .set('Authorization', `Bearer ${token}`)
      .send(createPostDto)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body).toMatchObject({
      content: createPostDto.content,
      userId: testUser.id,
    });

    const job = await postQueue.getJob(response.body.id);
    expect(job).toBeDefined();
    expect(job.data.postId).toEqual(response.body.id);
  });

  it('/post POST - should return 401 for request without a token', async () => {
    await request(app.getHttpServer())
      .post('/post')
      .send({})
      .expect(401)
      .expect({
        message: 'Unauthorized',
        statusCode: 401,
      });
  });

  it('/post POST - should return 401 for request with an invalid token', async () => {
    await request(app.getHttpServer())
      .post('/post')
      .set('Authorization', 'Bearer invalid-token')
      .send({})
      .expect(401)
      .expect({
        message: 'Unauthorized',
        statusCode: 401,
      });
  });

  it('/post POST - should return 400 for request with an empty body', async () => {
    const response = await request(app.getHttpServer())
      .post('/post')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message.length).toBeGreaterThan(0);
  });
});
