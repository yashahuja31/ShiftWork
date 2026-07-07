import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SimulationClient } from '@/components/SimulationClient';

// Server component wrapper: this is the actual defense-in-depth auth check
// for the game itself (see the comment in proxy.ts for why one layer isn't
// enough). The game logic lives in SimulationClient because it needs
// client-side state (useState) to drive the moment-to-moment UI.
export default async function SimulationPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return <SimulationClient />;
}
