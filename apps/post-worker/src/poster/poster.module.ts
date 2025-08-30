import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PosterProcessor } from './poster.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'post',
    }),
    PrismaModule,
  ],
  providers: [PosterProcessor],
})
export class PosterModule {}
