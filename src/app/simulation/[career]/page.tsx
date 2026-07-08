import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { CAREER_IDS } from '@/lib/simulationEngine';
import { SimulationClient } from '@/components/SimulationClient';

interface PageProps {
  params: Promise<{ career: string }>;
}

// Server component wrapper: this is the actual defense-in-depth auth check
// for the game itself (see the comment in proxy.ts for why one layer isn't
// enough). The game logic lives in SimulationClient because it needs
// client-side state (useState) to drive the moment-to-moment UI.
//
// The career id from the URL is validated against the known career
// registry before anything else touches it — an unrecognized value 404s
// here rather than being passed further into the app.
export default async function SimulationPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const { career } = await params;
  if (!CAREER_IDS.includes(career)) {
    notFound();
  }

  return <SimulationClient careerId={career} />;
}
