import { Platform } from './generated/client';

export interface PlatformLimitConfig {
  maxTextLength: number;
  maxMediaCount: number;
  supportedMediaTypes: string[];
}

export const PlatformLimits: Record<Platform, PlatformLimitConfig> = {
  [Platform.TWITTER]: {
    maxTextLength: 280,
    maxMediaCount: 4,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
  [Platform.LINKEDIN]: {
    maxTextLength: 3000,
    maxMediaCount: 9,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
};
