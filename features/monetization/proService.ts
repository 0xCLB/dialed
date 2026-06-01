import type { CustomerInfo } from 'react-native-purchases';

import type {
  CustomerSubscriptionState,
  Entitlement,
  SubscriptionStatus,
} from '@/features/monetization/types';
import { REVENUECAT_ENTITLEMENT } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

type SubscriptionRow = {
  user_id: string;
  revenuecat_customer_id: string;
  entitlement: string;
  status: SubscriptionStatus;
  product_id: string | null;
  current_period_end: string | null;
  updated_at: string | null;
};

function isActiveStatus(status: SubscriptionStatus, currentPeriodEnd: string | null) {
  if (status === 'inactive' || status === 'expired' || status === 'billing_issue') return false;
  if (!currentPeriodEnd) return status === 'active' || status === 'trialing' || status === 'cancelled';
  return new Date(currentPeriodEnd).getTime() > Date.now();
}

function normalizeStatus(value: string | null | undefined): SubscriptionStatus {
  if (
    value === 'active' ||
    value === 'trialing' ||
    value === 'inactive' ||
    value === 'billing_issue' ||
    value === 'cancelled' ||
    value === 'expired'
  ) {
    return value;
  }
  return 'inactive';
}

function stateFromRow(row: SubscriptionRow): CustomerSubscriptionState {
  const status = normalizeStatus(row.status);
  return {
    userId: row.user_id,
    entitlement: (row.entitlement || REVENUECAT_ENTITLEMENT) as Entitlement,
    status,
    isPro: isActiveStatus(status, row.current_period_end),
    revenuecatCustomerId: row.revenuecat_customer_id,
    productId: row.product_id,
    currentPeriodEnd: row.current_period_end,
    managementUrl: null,
    updatedAt: row.updated_at,
    source: 'supabase',
  };
}

export function subscriptionStateFromCustomerInfo(
  userId: string,
  customerInfo: CustomerInfo | null,
): CustomerSubscriptionState {
  const entitlement = customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT]
    ?? customerInfo?.entitlements.all[REVENUECAT_ENTITLEMENT]
    ?? null;
  const currentPeriodEnd = entitlement?.expirationDate ?? customerInfo?.latestExpirationDate ?? null;
  let status: SubscriptionStatus = 'inactive';

  if (entitlement?.isActive) {
    if (entitlement.billingIssueDetectedAt) {
      status = 'billing_issue';
    } else if (entitlement.periodType === 'TRIAL') {
      status = 'trialing';
    } else if (entitlement.unsubscribeDetectedAt) {
      status = 'cancelled';
    } else {
      status = 'active';
    }
  } else if (currentPeriodEnd && new Date(currentPeriodEnd).getTime() <= Date.now()) {
    status = 'expired';
  }

  return {
    userId,
    entitlement: REVENUECAT_ENTITLEMENT,
    status,
    isPro: entitlement?.isActive ?? false,
    revenuecatCustomerId: customerInfo?.originalAppUserId ?? userId,
    productId: entitlement?.productIdentifier ?? customerInfo?.activeSubscriptions[0] ?? null,
    currentPeriodEnd,
    managementUrl: customerInfo?.managementURL ?? null,
    updatedAt: customerInfo?.requestDate ?? new Date().toISOString(),
    source: 'revenuecat',
    customerInfo,
  };
}

export function fallbackSubscriptionState(userId: string): CustomerSubscriptionState {
  return {
    userId,
    entitlement: REVENUECAT_ENTITLEMENT,
    status: 'inactive',
    isPro: false,
    revenuecatCustomerId: null,
    productId: null,
    currentPeriodEnd: null,
    managementUrl: null,
    updatedAt: null,
    source: 'fallback',
    customerInfo: null,
  };
}

export async function getSupabaseSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? stateFromRow(data as SubscriptionRow) : null;
}

export async function upsertLocalSubscriptionCache(state: CustomerSubscriptionState) {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: state.userId,
        revenuecat_customer_id: state.revenuecatCustomerId ?? state.userId,
        entitlement: state.entitlement,
        status: state.status,
        product_id: state.productId,
        current_period_end: state.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .maybeSingle();

  if (error) return null;
  return data ? stateFromRow(data as SubscriptionRow) : null;
}

export async function syncRevenueCatCustomerInfoToSupabase(
  userId: string,
  customerInfo: CustomerInfo | null,
) {
  const revenueCatState = subscriptionStateFromCustomerInfo(userId, customerInfo);
  return (await upsertLocalSubscriptionCache(revenueCatState)) ?? revenueCatState;
}

export async function getCustomerSubscriptionState(
  userId: string,
  customerInfo: CustomerInfo | null,
) {
  const supabaseState = await getSupabaseSubscription(userId).catch(() => null);
  if (supabaseState) return supabaseState;
  if (customerInfo) return subscriptionStateFromCustomerInfo(userId, customerInfo);
  return fallbackSubscriptionState(userId);
}
