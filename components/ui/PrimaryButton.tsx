import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/Button';

export function PrimaryButton(props: Omit<ComponentProps<typeof Button>, 'variant'>) {
  return <Button {...props} variant="primary" />;
}
