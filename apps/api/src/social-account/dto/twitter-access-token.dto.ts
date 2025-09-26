import { ApiProperty } from '@nestjs/swagger';

export class TwitterAccessTokenDto {
  @ApiProperty()
  oauth_token: string;

  @ApiProperty()
  oauth_verifier: string;

  @ApiProperty()
  oauth_token_secret: string;
}
