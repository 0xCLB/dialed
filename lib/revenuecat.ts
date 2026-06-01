import type {
  CustomerInfo,
  MakePurchaseResult,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

import { syncRevenueCatCustomerInfoToSupabase } from '@/features/monetization/proService';
import { REVENUECAT_ENTITLEMENT } from '@/lib/constants';
import { env, isRevenueCatConfigured } from '@/lib/env';
import { track } from '@/lib/analytics';

type RevenueCatModule = typeof import('react-native-purchases');

let purchasesModulePromise: Promise<RevenueCatModule | null> | null = null;
let configured = false;
let configuredUserId: string | null = null;

async function loadPurchasesModule() {
  if (!purchasesModulePromise) {
    purchasesModulePromise = import('react-native-purchases').catch(() => null);
  }

  return purchasesModulePromise;
}

async function requirePurchases() {
  if (!isRevenueCatConfigured) {
    throw new Error('RevenueCat public SDK key is missing.');
  }

  const module = await loadPurchasesModule();
  if (!module?.default) {
    throw new Error('RevenueCat native module is unavailable. Use an iOS/Android development build.');
  }

  return module;
}

function isConfiguredError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes('not configured');
}

export function hasProEntitlement(customerInfo: CustomerInfo | null | undefined) {
  return Boolean(customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT]?.isActive);
}

export async function configureRevenueCat(userId?: string | null) {
  if (!isRevenueCatConfigured) {
    configured = false;
    return false;
  }

  try {
    const module = await requirePurchases();
    const Purchases = module.default;
    const alreadyConfigured = await Purchases.isConfigured().catch(() => configured);

    if (!alreadyConfigured) {
      await Purchases.setLogLevel(__DEV__ ? module.LOG_LEVEL.DEBUG : module.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey: env.revenueCatApiKey, appUserID: userId ?? undefined });
      configured = true;
    }

    if (userId && configuredUserId !== userId) {
      configuredUserId = userId;
      await Purchases.setAttributes({ supabase_user_id: userId }).catch(() => undefined);
    }

    return true;
  } catch (error) {
    configured = false;
    if (__DEV__) {
      console.warn('[revenuecat] configure failed', error);
    }
    return false;
  }
}

export async function identifyUser(userId: string) {
  const isReady = await configureRevenueCat(userId);
  if (!isReady) return null;

  const module = await requirePurchases();
  try {
    const result = await module.default.logIn(userId);
    configuredUserId = userId;
    await module.default.setAttributes({ supabase_user_id: userId }).catch(() => undefined);
    return result.customerInfo;
  } catch (error) {
    if (isConfiguredError(error)) {
      await configureRevenueCat(userId);
      return module.default.logIn(userId).then((result) => result.customerInfo);
    }
    throw error;
  }
}

export async function identifyPurchasesUser(userId: string) {
  return identifyUser(userId);
}

export async function logoutRevenueCat() {
  const module = await loadPurchasesModule();
  if (!module?.default || !configured) return null;

  try {
    configuredUserId = null;
    return await module.default.logOut();
  } catch {
    return null;
  }
}

export async function getCustomerInfo(userId?: string | null): Promise<CustomerInfo | null> {
  const isReady = await configureRevenueCat(userId);
  if (!isReady) return null;

  const module = await requirePurchases();
  return module.default.getCustomerInfo();
}

export async function checkProEntitlement(userId?: string | null) {
  track('entitlement_refreshed');
  return hasProEntitlement(await getCustomerInfo(userId));
}

export async function getOfferings(userId?: string | null): Promise<PurchasesOfferings | null> {
  const isReady = await configureRevenueCat(userId);
  if (!isReady) return null;

  const module = await requirePurchases();
  return module.default.getOfferings();
}

export async function getCurrentOffering(userId?: string | null): Promise<PurchasesOffering | null> {
  const offerings = await getOfferings(userId);
  return offerings?.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage, userId?: string | null): Promise<MakePurchaseResult> {
  track('purchase_started', {
    package_id: pkg.identifier,
    product_id: pkg.product.identifier,
  });

  const isReady = await configureRevenueCat(userId);
  if (!isReady) {
    const error = new Error('RevenueCat is not configured for this build.');
    track('purchase_failed', { package_id: pkg.identifier, message: error.message });
    throw error;
  }

  try {
    const module = await requirePurchases();
    const result = await module.default.purchasePackage(pkg);
    track('purchase_success', {
      package_id: pkg.identifier,
      product_id: result.productIdentifier,
      is_pro: hasProEntitlement(result.customerInfo),
    });
    if (userId) {
      syncRevenueCatCustomerInfoToSupabase(userId, result.customerInfo).catch(() => undefined);
    }
    return result;
  } catch (error) {
    track('purchase_failed', {
      package_id: pkg.identifier,
      message: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
}

export async function purchaseRevenueCatPackage(pkg: PurchasesPackage, userId?: string | null) {
  return purchasePackage(pkg, userId);
}

export async function restorePurchases(userId?: string | null): Promise<CustomerInfo | null> {
  track('restore_started');

  const isReady = await configureRevenueCat(userId);
  if (!isReady) {
    track('restore_failed', { message: 'RevenueCat is not configured.' });
    return null;
  }

  try {
    const module = await requirePurchases();
    const customerInfo = await module.default.restorePurchases();
    track('restore_success', { is_pro: hasProEntitlement(customerInfo) });
    if (userId) {
      syncRevenueCatCustomerInfoToSupabase(userId, customerInfo).catch(() => undefined);
    }
    return customerInfo;
  } catch (error) {
    track('restore_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
}

export type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
};
