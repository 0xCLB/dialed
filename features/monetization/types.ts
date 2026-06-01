import type { CustomerInfo } from 'react-native-purchases';

export type Entitlement = 'dialed_pro';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'inactive'
  | 'billing_issue'
  | 'cancelled'
  | 'expired';

export type PaywallPlacement =
  | 'share_template'
  | 'reel_export'
  | 'weekly_digest'
  | 'advanced_insights'
  | 'private_challenge'
  | 'settings'
  | 'profile';

export type ProFeature = {
  id:
    | 'advanced_ai_scoring'
    | 'premium_share_templates'
    | 'reel_exports'
    | 'weekly_digest'
    | 'friend_compare_insights'
    | 'advanced_leaderboards'
    | 'streak_freeze'
    | 'private_challenges'
    | 'remove_watermark'
    | 'advanced_health_analytics'
    | 'pro_badge';
  title: string;
  description: string;
  placement: PaywallPlacement;
  available: boolean;
  placeholder?: boolean;
};

export type CustomerSubscriptionState = {
  userId: string;
  entitlement: Entitlement;
  status: SubscriptionStatus;
  isPro: boolean;
  revenuecatCustomerId: string | null;
  productId: string | null;
  currentPeriodEnd: string | null;
  managementUrl: string | null;
  updatedAt: string | null;
  source: 'supabase' | 'revenuecat' | 'fallback';
  customerInfo?: CustomerInfo | null;
};
