import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/Button';
import { theme } from '@/components/ui/theme';

export function PillButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} style={[{ borderRadius: theme.radius.full }, props.style]} />;
}
