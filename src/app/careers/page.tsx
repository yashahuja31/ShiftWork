import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { CareerCard } from '@/components/CareerCard';
import { Leaderboard } from '@/components/Leaderboard';
import { CAREER_GRAPHS } from '@/lib/simulationEngine';
import { db, type SimulationRunRow } from '@/lib/db';
import { rankRuns } from '@/lib/leaderboard';

export default async function CareersPage() {
  // Defense in depth: proxy.ts already gates this route, but this page
  // checks again independently rather than assuming the network layer did
  // its job. See the comment in proxy.ts for why.
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Generated straight from the engine's career registry — adding a new
  // career JSON file automatically puts an unlocked card here. There is no
  // separate hardcoded list to remember to update.
  const careers = Object.values(CAREER_GRAPHS);

  // Both leaderboards are computed from a bounded, recent slice of runs
  // rather than the entire table — plenty for a top-20 list at this scale,
  // and avoids needing a stored/indexed score column purely for sorting.
  // If this project ever has enough traffic for that bound to matter,
  // that's the next optimization; it isn't needed yet.
  let globalRuns: SimulationRunRow[] = [];
  let personalRuns: SimulationRunRow[] = [];
  try {
    [globalRuns, personalRuns] = await Promise.all([
      db.simulationRun.findMany({ orderBy: { createdAt: 'desc' }, take: 300 }),
      db.simulationRun.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);
  } catch {
    // Most likely the migration hasn't been run yet locally — the
    // leaderboard just renders empty rather than crashing the whole page.
  }

  const globalEntries = rankRuns(globalRuns, 20);
  const personalEntries = rankRuns(personalRuns, 20);

  return (
    <main className="min-h-screen px-6 sm:px-10 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-vital mb-1">Choose a shift</p>
            <h1 className="font-display text-3xl text-ivory">What&apos;s it actually like?</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/history" className="text-xs font-mono uppercase tracking-widest text-muted hover:text-ivory">
              History
            </Link>
            <UserButton />
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {careers.map((career) => (
              <CareerCard
                key={career.id}
                emoji={career.emoji}
                title={career.title}
                tagline={career.tagline}
                href={`/simulation/${career.id}`}
              />
            ))}
          </div>

          <Leaderboard globalEntries={globalEntries} personalEntries={personalEntries} currentUserId={userId} />
        </div>
      </div>
    </main>
  );
}
