import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsDate,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Platform } from '../../../generated/prisma';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  media?: string[];

  @IsDate()
  @Type(() => Date)
  scheduledFor: Date;

  @IsString()
  @IsNotEmpty()
  socialAccountId: string;

  @IsEnum(Platform)
  @IsNotEmpty()
  platform: Platform;
}
