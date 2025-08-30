import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { TestContainers } from './testcontainers-setup';
import {
  PrismaClient,
  PostStatus,
  Platform,
} from '@repo/db/prisma/generated/prisma';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

describe('Post-worker (e2e)', () => {
  let app: INestApplication;
  const containers = new TestContainers();
  let prisma: PrismaClient;
  let postQueue: Queue;

  beforeAll(async () => {
    const { dbUri, redisUrl } = await containers.start();
    prisma = new PrismaClient({ datasources: { db: { url: dbUri } } });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'REDIS_HOST') {
            return new URL(redisUrl).hostname;
          }
          if (key === 'REDIS_PORT') {
            return Number(new URL(redisUrl).port);
          }
          return null;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    postQueue = app.get<Queue>(getQueueToken('post'));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
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
  }, 10000);

  it('should mark a post as FAILED if processing fails', async () => {
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

    const post = await prisma.post.create({
      data: {
        content: 'FAIL',
        scheduledFor: new Date(),
        status: PostStatus.SCHEDULED,
        platform: Platform.TWITTER,
        userId: user.id,
        socialAccountId: socialAccount.id,
      },
    });

    await postQueue.add(
      'schedulePost',
      { postId: post.id },
      { jobId: post.id },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
    });
    expect(updatedPost?.status).toBe(PostStatus.FAILED);
    expect(updatedPost?.errorMessage).toBe('Simulated post failure');
  }, 10000);

  it('should not process a post that is not in a SCHEDULED state', async () => {
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

    const post = await prisma.post.create({
      data: {
        content: 'This is a test post',
        scheduledFor: new Date(),
        status: PostStatus.PUBLISHED, // Not in SCHEDULED state
        platform: Platform.TWITTER,
        userId: user.id,
        socialAccountId: socialAccount.id,
      },
    });

    await postQueue.add(
      'schedulePost',
      { postId: post.id },
      { jobId: post.id },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
    });
    expect(updatedPost?.status).toBe(PostStatus.PUBLISHED);
  }, 10000);

  it('should not process a post that does not exist', async () => {
    const nonExistentPostId = 'non-existent-post-id';

    await postQueue.add(
      'schedulePost',
      { postId: nonExistentPostId },
      { jobId: nonExistentPostId },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // No assertion needed, we just want to make sure the worker doesn't crash
  });
});
