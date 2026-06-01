import type { User } from '@supabase/supabase-js';
import { z } from 'zod';

import { logoutRevenueCat } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/domain';

export const emailSchema = z.string().trim().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Enter a valid phone number')
  .regex(/^\+?[1-9]\d{9,14}$/, 'Use E.164 format, for example +14155552671');

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6 digit code');

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  bio: string | null;
  city: string | null;
  timezone: string;
  onboarding_completed: boolean;
  privacy_default: 'private' | 'friends' | 'public';
  is_pro?: boolean | null;
  pro_until?: string | null;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_path,
    bio: row.bio,
    city: row.city,
    timezone: row.timezone,
    onboardingComplete: row.onboarding_completed,
    privacyDefault: row.privacy_default,
    isPrivate: row.privacy_default === 'private',
    isPro: Boolean(row.is_pro),
    proUntil: row.pro_until ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fallbackDisplayName(user: User) {
  const metadataName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null;

  if (metadataName?.trim()) {
    return metadataName.trim().slice(0, 80);
  }

  const emailPrefix = user.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return emailPrefix ? emailPrefix.slice(0, 80) : 'Dialed athlete';
}

export async function signUpWithEmail(email: string, password: string) {
  const parsedEmail = emailSchema.parse(email).toLowerCase();
  const parsedPassword = passwordSchema.parse(password);
  const { data, error } = await supabase.auth.signUp({
    email: parsedEmail,
    password: parsedPassword,
  });

  if (error) {
    throw error;
  }

  if (data.session?.user) {
    await ensureProfileForUser(data.session.user);
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const parsedEmail = emailSchema.parse(email).toLowerCase();
  const parsedPassword = passwordSchema.parse(password);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsedEmail,
    password: parsedPassword,
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  logoutRevenueCat().catch(() => undefined);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data as ProfileRow) : null;
}

export async function ensureProfileForUser(user: User) {
  const existing = await getProfile(user.id);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: fallbackDisplayName(user),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      privacy_default: 'friends',
      onboarding_completed: false,
    })
    .select('*')
    .single();

  if (error) {
    if ('code' in error && error.code === '23505') {
      return getProfile(user.id);
    }
    throw error;
  }

  return mapProfile(data as ProfileRow);
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

export async function signInWithPhoneOtp(_phone: string): Promise<never> {
  throw new Error('Phone OTP requires Twilio and is disabled in dev.');
}

export async function verifyPhoneOtp(_phone: string, _token: string): Promise<never> {
  throw new Error('Phone OTP requires Twilio and is disabled in dev.');
}

export async function signInWithApple(): Promise<never> {
  throw new Error('Apple Sign-In not implemented yet.');
}

export const sendOtp = signInWithPhoneOtp;
export const verifyOtp = verifyPhoneOtp;

export function formatE164Phone(input: string) {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  const value = trimmed.startsWith('+') ? `+${digits}` : `+1${digits}`;
  return phoneSchema.parse(value);
}
