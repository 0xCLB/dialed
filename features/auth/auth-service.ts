import { z } from 'zod';

import { logoutRevenueCat } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';

export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Enter a valid phone number')
  .regex(/^\+?[1-9]\d{9,14}$/, 'Use E.164 format, for example +14155552671');

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6 digit code');

export async function sendOtp(phone: string) {
  const parsed = formatE164Phone(phone);
  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed,
    options: {
      channel: 'sms',
    },
  });

  if (error) {
    throw error;
  }
}

export async function verifyOtp(phone: string, token: string) {
  const parsedPhone = formatE164Phone(phone);
  const parsedToken = otpSchema.parse(token);
  const { data, error } = await supabase.auth.verifyOtp({
    phone: parsedPhone,
    token: parsedToken,
    type: 'sms',
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function completeOnboarding({
  userId,
  displayName,
  username,
  city,
  timezone,
  privacyDefault,
}: {
  userId: string;
  displayName: string;
  username: string;
  city?: string | null;
  timezone?: string | null;
  privacyDefault: 'private' | 'friends' | 'public';
}) {
  const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: displayName.trim(),
    username: normalizedUsername,
    city: city?.trim() || null,
    timezone: timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone,
    privacy_default: privacyDefault,
    onboarding_completed: true,
  });

  if (profileError) {
    throw profileError;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  logoutRevenueCat().catch(() => undefined);
}

export function formatE164Phone(input: string) {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  const value = trimmed.startsWith('+') ? `+${digits}` : `+1${digits}`;
  return phoneSchema.parse(value);
}
