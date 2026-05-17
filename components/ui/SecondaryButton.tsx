import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/Button';

export function SecondaryButton(props: Omit<ComponentProps<typeof Button>, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}
