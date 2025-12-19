import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class LinkedInAccessTokenDto {
  @ApiProperty({
    description: 'The authorization code returned by LinkedIn',
    example: 'AQUw...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The redirect URI used in the initial authorization request',
    example: 'http://localhost:3000/auth/linkedin/callback',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  redirectUri: string;
}
