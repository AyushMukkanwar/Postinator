import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestContainers } from './testcontainers-setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let testContainers: TestContainers;
  let prismaService: PrismaService;

  beforeAll(async () => {
    testContainers = new TestContainers();
    await testContainers.start();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await testContainers.stop();
    await prismaService.$disconnect();
  });

  it('/ (GET)', () => {
    return request
      .default(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
