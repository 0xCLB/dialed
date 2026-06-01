import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { identify } from '@/lib/analytics';
import { configureRevenueCat, identifyPurchasesUser } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications } from '@/lib/notifications';
import type { Profile } from '@/types/domain';
import {
  ensureProfileForUser,
  getProfile,
  getSession,
  signOut as signOutWithSupabase,
} from '@/features/auth/auth-service';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,
  bootstrap: async () => {
    set({ loading: true });
    try {
      await get().setSession(await getSession());
      set({ loading: false, initialized: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not restore your session.',
        loading: false,
        initialized: true,
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      get()
        .setSession(session)
        .catch((error) =>
          set({ error: error instanceof Error ? error.message : 'Could not update auth state.' }),
        );
    });

    return () => subscription.unsubscribe();
  },
  refreshProfile: async () => {
    const { session } = get();
    if (!session) {
      set({ profile: null });
      return;
    }
    const profile = await getProfile(session.user.id);
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

    const profile = await ensureProfileForUser(session.user);
    set({ profile });
  },
  signOut: async () => {
    await signOutWithSupabase();
    set({ session: null, profile: null });
  },
}));
