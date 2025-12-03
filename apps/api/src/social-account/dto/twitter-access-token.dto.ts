import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TwitterAccessTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oauth_token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oauth_verifier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oauth_token_secret: string;
}
