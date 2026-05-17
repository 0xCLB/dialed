import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import type { GoalKey } from '@/types/domain';

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
  const parsed = phoneSchema.parse(phone);
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
  const parsedPhone = phoneSchema.parse(phone);
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
  goals,
}: {
  userId: string;
  displayName: string;
  username: string;
  goals: GoalKey[];
}) {
  const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: displayName.trim(),
    username: normalizedUsername,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    onboarding_complete: true,
  });

  if (profileError) {
    throw profileError;
  }

  if (goals.length > 0) {
    await supabase.from('user_goals').delete().eq('user_id', userId);
    const { error: goalsError } = await supabase.from('user_goals').insert(
      goals.map((goal, index) => ({
        user_id: userId,
        goal_key: goal,
        priority: index + 1,
      })),
    );

    if (goalsError) {
      throw goalsError;
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
