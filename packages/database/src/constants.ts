import { Platform, SubscriptionTier } from './generated/client';

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

export interface TierLimitConfig {
  maxPostsPerMonth: number;
}
export const TierLimits: Record<SubscriptionTier, TierLimitConfig> = {
  [SubscriptionTier.FREE]: {
    maxPostsPerMonth: 3,
  },
  [SubscriptionTier.PRO]: {
    maxPostsPerMonth: 10,
  },
};

export interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  price: number; // in lowest currency unit (e.g. paise) if strictly handling payments, or standard if display
  currency: string;
  features: string[];
  cta: string;
  limits: {
    maxPostsPerMonth: number;
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanConfig> = {
  [SubscriptionTier.FREE]: {
    id: SubscriptionTier.FREE,
    name: 'Free Starter',
    price: 0,
    currency: 'INR',
    features: ['3 Posts/month', 'Basic Analytics'],
    cta: 'Get Started',
    limits: {
      maxPostsPerMonth: 3,
    },
  },
  [SubscriptionTier.PRO]: {
    id: SubscriptionTier.PRO,
    name: 'Pro',
    price: 29900,
    currency: 'INR',
    features: ['10 Posts/month', 'Advanced Analytics'],
    cta: 'Upgrade to Pro',
    limits: {
      maxPostsPerMonth: 10,
    },
  },
};
