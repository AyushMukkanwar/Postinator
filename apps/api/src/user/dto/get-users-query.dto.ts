import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';

enum SortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  EMAIL = 'email',
}

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetUsersQueryDto {
  @ApiProperty({
    description: 'Number of records to skip',
    required: false,
    minimum: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiProperty({
    description: 'Number of records to take',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @ApiProperty({
    description: 'Search by name or email',
    required: false,
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort field',
    required: false,
    enum: SortBy,
    example: 'createdAt',
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiProperty({
    description: 'Sort order',
    required: false,
    enum: SortOrder,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
