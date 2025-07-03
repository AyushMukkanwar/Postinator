import { TestingModule } from '@nestjs/testing';
import { mockPrismaService } from '../mocks/prisma.mock';

export const createMockTestingModule = async (
  providers: any[],
  additionalProviders: any[] = []
): Promise<TestingModule> => {
  const { Test } = await import('@nestjs/testing');

  return Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: 'PrismaService',
        useValue: mockPrismaService,
      },
      ...additionalProviders,
    ],
  }).compile();
};

export const resetAllMocks = () => {
  Object.values(mockPrismaService).forEach((model: any) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method: any) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
};
