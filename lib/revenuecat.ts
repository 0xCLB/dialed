import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

import { env, isRevenueCatConfigured } from '@/lib/env';
import { REVENUECAT_ENTITLEMENT } from '@/lib/constants';

let configured = false;

export async function configureRevenueCat(appUserID?: string) {
  if (!isRevenueCatConfigured || configured) {
    return;
  }

  const apiKey = Platform.select({
    ios: env.revenueCatIosKey,
    android: env.revenueCatAndroidKey,
    default: env.revenueCatIosKey,
  });

  if (!apiKey) {
    return;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey, appUserID });
  configured = true;
}

export async function identifyPurchasesUser(userId: string) {
  await configureRevenueCat(userId);
  if (!configured) {
    return null;
  }

  const result = await Purchases.logIn(userId);
  return result.customerInfo;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  await configureRevenueCat();
  if (!configured) {
    return null;
  }
  return Purchases.getCustomerInfo();
}

export function hasProEntitlement(customerInfo: CustomerInfo | null | undefined) {
  return Boolean(customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT]);
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  await configureRevenueCat();
  if (!configured) {
    return null;
  }
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchaseRevenueCatPackage(pkg: PurchasesPackage) {
  await configureRevenueCat();
  if (!configured) {
    throw new Error('RevenueCat is not configured for this build.');
  }
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  await configureRevenueCat();
  if (!configured) {
    return null;
  }
  return Purchases.restorePurchases();
}
