import { Platform, User } from 'generated/prisma';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { DatabaseTestContainer } from './testcontainers-setup';
import { execSync } from 'child_process';
import { getTestAccessToken } from './helpers/get-test-token';
import { EncryptionService } from 'src/encryption/encryption.service';

describe('SocialAccount e2e tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbContainer: DatabaseTestContainer;
  let userA: User;
  let userB: User;
  let tokenA: string;
  let tokenB: string;
  let encryptionService: EncryptionService;

  beforeAll(async () => {
    // 1. Compile the module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => process.env[key],
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

    // 2. Create the Nest App instance
    app = moduleFixture.createNestApplication();

    // 3. Apply standard pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );

    // 4. Get provider instances
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    encryptionService = moduleFixture.get<EncryptionService>(EncryptionService);

    // 5. Initialize the app
    await app.init();

    // 6. Setup database
    dbContainer = new DatabaseTestContainer();
    const connectionString = await dbContainer.start();
    execSync('npx prisma db push', {
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'inherit',
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await dbContainer.stop();
  });

  beforeEach(async () => {
    await prisma.socialAccount.deleteMany({});
    await prisma.user.deleteMany({});

    userA = await prisma.user.create({
      data: {
        email: 'userA@test.com',
        name: 'User A',
        supabaseId: 'supabase-user-a',
      },
    });
    userB = await prisma.user.create({
      data: {
        email: 'userB@test.com',
        name: 'User B',
        supabaseId: 'supabase-user-b',
      },
    });

    tokenA = getTestAccessToken(userA.id, userA.supabaseId!, userA.email);
    tokenB = getTestAccessToken(userB.id, userB.supabaseId!, userB.email);
  });

  // --- POSITIVE TEST CASES ---

  it('/social-account POST - should create a social account', async () => {
    const response = await request(app.getHttpServer())
      .post('/social-account')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        platform: Platform.TWITTER,
        platformId: 'twitter123',
        username: 'userA_twitter',
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
      })
      .expect(201);

    expect(response.body).toMatchObject({ userId: userA.id });
  });

  it('/social-account/:id GET - should return a social account owned by the user', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter-get-test',
        username: 'userA_twitter_get',
        accessToken: encryptionService.encrypt('test-token'),
        user: { connect: { id: userA.id } },
      },
    });

    // Use the correct token (tokenA) to access the resource
    const response = await request(app.getHttpServer())
      .get(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body.id).toEqual(socialAccount.id);
    expect(response.body.userId).toEqual(userA.id);
  });

  it('/social-account/:id PATCH - should update a social account owned by the user', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter-patch-test',
        username: 'userA_twitter_patch',
        accessToken: encryptionService.encrypt('test-token'),
        user: { connect: { id: userA.id } },
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/social-account/${socialAccount.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ username: 'updated_username' })
      .expect(200);

    expect(response.body.username).toEqual('updated_username');
  });

  it('/social-account/:id DELETE - should delete a social account owned by the user', async () => {
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter-delete-test',
        username: 'userA_twitter_delete',
        accessToken: encryptionService.encrypt('test-token'),
        user: { connect: { id: userA.id } },
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

  // --- NEGATIVE (PERMISSION) TEST CASES ---

  it("/social-account/:id GET - should return 403 when user tries to get another user's social account", async () => {
    const socialAccountOfA = await prisma.socialAccount.create({
      data: {
        platform: Platform.LINKEDIN,
        platformId: 'linkedin123',
        username: 'userA_linkedin',
        accessToken: encryptionService.encrypt('test-token'),
        user: { connect: { id: userA.id } },
      },
    });

    await request(app.getHttpServer())
      .get(`/social-account/${socialAccountOfA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it("/social-account/:id PATCH - should return 403 when user tries to update another user's social account", async () => {
    const socialAccountOfA = await prisma.socialAccount.create({
      data: {
        platform: Platform.LINKEDIN,
        platformId: 'linkedin_test_id_2',
        username: 'userA_linkedin_test_2',
        accessToken: encryptionService.encrypt('test-token'),
        user: { connect: { id: userA.id } },
      },
    });

    await request(app.getHttpServer())
      .patch(`/social-account/${socialAccountOfA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ username: 'malicious_update' })
      .expect(403);
  });

  it("/social-account/:id DELETE - should return 403 when user tries to delete another user's social account", async () => {
    const socialAccountOfA = await prisma.socialAccount.create({
      data: {
        platform: Platform.TWITTER,
        platformId: 'twitter_test_id_3',
        username: 'userA_twitter_test_3',
        accessToken: encryptionService.encrypt('test-token'),
        refreshToken: encryptionService.encrypt('test-refresh-token'),
        user: { connect: { id: userA.id } },
      },
    });

    await request(app.getHttpServer())
      .delete(`/social-account/${socialAccountOfA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });
});
