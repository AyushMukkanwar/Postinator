import { Platform } from './generated/client';

export * from './constants';
export * from './generated/client';

export const Platforms = [Platform.TWITTER, Platform.LINKEDIN] as const;

export const getPlatformDisplayName = (platform: Platform): string => {
  switch (platform) {
    case Platform.TWITTER:
      return 'Twitter';
    case Platform.LINKEDIN:
      return 'LinkedIn';
    default:
      return platform;
  }
};
