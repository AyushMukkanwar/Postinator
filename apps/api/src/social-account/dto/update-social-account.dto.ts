import { PartialType } from '@nestjs/mapped-types';
import { CreateSocialAccountDto } from './create-social-account.dto';
import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSocialAccountDto extends PartialType(
  CreateSocialAccountDto
) {
  @ApiProperty({
    description: 'Token expiration in seconds',
    required: false,
    example: 3600,
  })
  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}
