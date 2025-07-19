export interface TwitterAuthState {
  state: string;
  userId: string;
  timestamp: number;
}

export interface TwitterAuthConfig {
  clientId: string;
  redirectUri: string;
}

export interface TwitterOAuthTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  scope: string;
}
