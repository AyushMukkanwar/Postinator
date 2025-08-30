import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { TestContainers } from '@repo/test-utils';
import {
  PrismaClient,
  PostStatus,
  Platform,
} from '@repo/db/prisma/generated/prisma';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

describe('Post-worker (e2e)', () => {
  let app: INestApplication;
  const containers = new TestContainers();
  let prisma: PrismaClient;
  let postQueue: Queue;
  let redisClient: Redis;

  beforeAll(async () => {
    const { dbUri, redisUrl } = await containers.start();
    prisma = new PrismaClient({ datasources: { db: { url: dbUri } } });
    redisClient = new Redis(redisUrl);
    postQueue = new Queue('post', { connection: redisClient });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await postQueue.close();
    redisClient.disconnect();
    await containers.stop();
  });

  beforeEach(async () => {
    await postQueue.drain(true);
    await prisma.post.deleteMany({});
    await prisma.socialAccount.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should process a scheduled post from the queue', async () => {
    // 1. Create a user and social account
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        supabaseId: 'test-supabase-id',
      },
    });

    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'test-platform-id',
        username: 'test-username',
        accessToken: 'test-access-token',
        userId: user.id,
        isActive: true,
      },
    });

    // 2. Create a scheduled post
    const post = await prisma.post.create({
      data: {
        content: 'This is a test post',
        scheduledFor: new Date(),
        status: PostStatus.SCHEDULED,
        platform: Platform.TWITTER,
        userId: user.id,
        socialAccountId: socialAccount.id,
      },
    });

    // 3. Add the post to the queue
    await postQueue.add(
      'schedulePost',
      { postId: post.id },
      { jobId: post.id },
    );

    // 4. Wait for the job to be processed
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Check the post status in the database
    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
    });
    expect(updatedPost?.status).toBe(PostStatus.PUBLISHED);
    expect(updatedPost?.platformPostId).toBeDefined();
  }, 10000); // 10 second timeout for this test
});
