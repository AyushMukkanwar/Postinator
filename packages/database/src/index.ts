import { Platform } from './generated/client';

export * from './generated/client';
// Named exports are handled by export * above, avoiding duplicate export errors

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
