import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Supabase user ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  supabaseId: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    required: false,
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'User avatar URL',
    required: false,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'User timezone',
    required: false,
    example: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
