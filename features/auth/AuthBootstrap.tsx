import { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/AuthProvider';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
