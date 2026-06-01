import { Share2 } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { theme } from '@/components/ui/theme';

export function ShareCTAButton({
  label = 'Share',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}) {
  return (
    <Button variant="secondary" onPress={onPress}>
      <Share2 size={18} color={theme.colors.ink} />
      {label}
    </Button>
  );
}
