import { Link, Stack } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <Text variant="title">This route is off the board.</Text>
        <Text muted>The screen you opened does not exist in Dialed Self.</Text>
        <Link href="/" asChild>
          <Button>Back to Today</Button>
        </Link>
      </Screen>
    </>
  );
}
