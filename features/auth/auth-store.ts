import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { identify } from '@/lib/analytics';
import { configureRevenueCat, identifyPurchasesUser, logoutRevenueCat } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications } from '@/lib/notifications';
import type { Profile } from '@/types/domain';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  bootstrap: () => Promise<() => void>;
  refreshProfile: () => Promise<void>;
  setSession: (session: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
};

function mapProfile(row: {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  bio: string | null;
  city: string | null;
  timezone: string;
  onboarding_completed: boolean;
  privacy_default: 'private' | 'friends' | 'public';
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}): Profile {
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
    isPro: row.is_pro,
    proUntil: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data) : null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,
  bootstrap: async () => {
    set({ loading: true });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      set({ error: error.message, loading: false, initialized: true });
    } else {
      await get().setSession(data.session);
      set({ loading: false, initialized: true });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      get().setSession(session);
    });

    return () => subscription.unsubscribe();
  },
  refreshProfile: async () => {
    const { session } = get();
    if (!session) {
      set({ profile: null });
      return;
    }
    const profile = await fetchProfile(session.user.id);
    set({ profile });
  },
  setSession: async (session) => {
    set({ session, error: null });

    if (!session) {
      set({ profile: null });
      return;
    }

    identify(session.user.id);
    configureRevenueCat(session.user.id);
    identifyPurchasesUser(session.user.id).catch(() => undefined);
    registerForPushNotifications(session.user.id).catch(() => undefined);

    const profile = await fetchProfile(session.user.id);
    set({ profile });
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    logoutRevenueCat().catch(() => undefined);
    set({ session: null, profile: null });
  },
}));
