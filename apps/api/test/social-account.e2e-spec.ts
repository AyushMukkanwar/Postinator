import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { DatabaseTestContainer } from './testcontainers-setup';
import { execSync } from 'child_process';
import { getTestAccessToken } from './helpers/get-test-token';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';
import { Platform, User } from 'generated/prisma';

describe('SocialAccount e2e tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbContainer: DatabaseTestContainer;
  let userA: User;
  let userB: User;
  let tokenA: string;
  let tokenB: string;

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
        whitelist: true,
        transform: true,
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

  beforeEach(async () => {
    await prisma.socialAccount.deleteMany({});
    await prisma.user.deleteMany({});

    userA = await prisma.user.create({
      data: {
        email: 'userA@test.com',
        name: 'User A',
      },
    });
    userB = await prisma.user.create({
      data: {
        email: 'userB@test.com',
        name: 'User B',
      },
    });

    // Pass the actual user ID and email
    tokenA = getTestAccessToken(userA.id, userA.email);
    tokenB = getTestAccessToken(userB.id, userB.email);
  });

  it('/social-account POST - should create a social account', async () => {
    const response = await request(app.getHttpServer())
      .post('/social-account')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        userId: userA.id,
        platform: Platform.TWITTER,
        platformId: 'twitter123',
        username: 'userA_twitter',
        accessToken: 'test-token',
        isActive: true,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      userId: userA.id,
      platform: Platform.TWITTER,
      platformId: 'twitter123',
      username: 'userA_twitter',
    });
  });

  it('/social-account POST - should return 409 for duplicate social account', async () => {
    await request(app.getHttpServer())
      .post('/social-account')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        userId: userA.id,
        platform: Platform.TWITTER,
        platformId: 'twitter123',
        username: 'userA_twitter',
        accessToken: 'test-token',
        isActive: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/social-account')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        userId: userA.id,
        platform: Platform.TWITTER,
        platformId: 'twitter456',
        username: 'userA_twitter_new',
        accessToken: 'test-token-new',
        isActive: true,
      })
      .expect(409);
  });

  it('/social-account/:id GET - should return social account by ID', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter_test_id_1',
        username: 'userA_twitter_test',
        accessToken: 'test-token',
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: socialAccount.id,
      userId: userA.id,
      platform: Platform.TWITTER,
    });
  });

  it('/social-account/:id GET - should return 404 for non-existent social account', async () => {
    await request(app.getHttpServer())
      .get('/social-account/non-existent-id')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it("/social-account/:id GET - should return 403 when user tries to get another user's social account", async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.LINKEDIN,
        platformId: 'linkedin123',
        username: 'userA_linkedin',
        accessToken: 'test-token',
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    await request(app.getHttpServer())
      .get(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('/social-account/:id PATCH - should update social account by ID', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.LINKEDIN,
        platformId: 'linkedin123',
        username: 'userA_linkedin',
        accessToken: 'test-token',
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    const updateDto = {
      username: 'userA_linkedin_updated',
    };

    const response = await request(app.getHttpServer())
      .patch(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(updateDto)
      .expect(200);

    expect(response.body).toMatchObject({
      id: socialAccount.id,
      username: updateDto.username,
    });
  });

  it('/social-account/:id PATCH - should return 404 for non-existent social account', async () => {
    await request(app.getHttpServer())
      .patch('/social-account/non-existent-id')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        username: 'updated',
      })
      .expect(404);
  });

  it("/social-account/:id PATCH - should return 403 when user tries to update another user's social account", async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.LINKEDIN,
        platformId: 'linkedin_test_id_2',
        username: 'userA_linkedin_test_2',
        accessToken: 'test-token',
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    await request(app.getHttpServer())
      .patch(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        username: 'malicious_update',
      })
      .expect(403);
  });

  it('/social-account/:id PATCH - should update isActive field', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter_active_test',
        username: 'userA_twitter_active',
        accessToken: 'test-token',
        isActive: true,
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    const updateDto = {
      isActive: false,
    };

    const response = await request(app.getHttpServer())
      .patch(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(updateDto)
      .expect(200);

    expect(response.body).toMatchObject({
      id: socialAccount.id,
      isActive: false,
    });
  });

  it('/social-account POST - should return 400 for invalid input (missing fields)', async () => {
    await request(app.getHttpServer())
      .post('/social-account')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        // Missing userId, platform, platformId, username, accessToken
        isActive: true,
      })
      .expect(400);
  });

  it('/social-account POST - should return 400 for invalid input (invalid platform enum)', async () => {
    await request(app.getHttpServer())
      .post('/social-account')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        userId: userA.id,
        platform: 'INVALID_PLATFORM', // Invalid enum value
        platformId: 'test_id',
        username: 'test_user',
        accessToken: 'test_token',
        isActive: true,
      })
      .expect(400);
  });

  it('/social-account/:id PATCH - should return 400 for invalid input (invalid isActive type)', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter_patch_invalid_type',
        username: 'userA_patch_invalid_type',
        accessToken: 'test-token',
        isActive: true,
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    await request(app.getHttpServer())
      .patch(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        isActive: 'not_a_boolean', // Invalid type
      })
      .expect(400);
  });

  it('/social-account/:id DELETE - should delete social account by ID', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter_test_id_2',
        username: 'userA_twitter_test_2',
        accessToken: 'test-token',
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    await request(app.getHttpServer())
      .delete(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const deletedAccount = await prisma.socialAccount.findUnique({
      where: { id: socialAccount.id },
    });
    expect(deletedAccount).toBeNull();
  });

  it('/social-account/:id DELETE - should return 404 for non-existent social account', async () => {
    await request(app.getHttpServer())
      .delete('/social-account/non-existent-id')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it("/social-account/:id DELETE - should return 403 when user tries to delete another user's social account", async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter_test_id_3',
        username: 'userA_twitter_test_3',
        accessToken: 'test-token',
        user: {
          connect: {
            id: userA.id,
          },
        },
      },
    });

    await request(app.getHttpServer())
      .delete(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });
});
