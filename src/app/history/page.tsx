import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db, type SimulationRunRow } from '@/lib/db';
import { CareerIcon } from '@/lib/careerIcons';
import { rankRuns } from '@/lib/leaderboard';
import { computeAchievements } from '@/lib/achievements';
import { computeRecommendation } from '@/lib/recommendations';
import { CAREER_IDS } from '@/lib/simulationEngine';
import { Achievements } from '@/components/Achievements';
import { RecommendationCard } from '@/components/RecommendationCard';

export default async function HistoryPage() {
  // Defense in depth: proxy.ts already gates this route, but this page
  // checks again independently — see the comment in proxy.ts for why.
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  let runs: SimulationRunRow[] = [];
  let loadError = false;
  try {
    runs = await db.simulationRun.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  } catch {
    // Most likely cause locally: the migration hasn't been run yet
    // (P2021, "table does not exist"). Fail soft here rather than a raw
    // 500 — an empty state with a hint is more useful than a stack trace.
    loadError = true;
  }

  // rankRuns() sorts by score, which is right for the leaderboard but not
  // for a history timeline — re-sort the same scored entries back to
  // chronological order rather than reimplementing the scoring logic here.
  const entries = [...rankRuns(runs)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const achievements = computeAchievements(entries, CAREER_IDS.length);
  const recommendation = computeRecommendation(entries);

  return (
    <main className="min-h-screen px-6 sm:px-10 py-10">
      <header className="flex items-center justify-between mb-10 max-w-3xl mx-auto">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-vital mb-1">Your record</p>
          <h1 className="font-display text-3xl text-ivory">Shift history</h1>
        </div>
        <Link href="/careers" className="text-xs font-mono text-muted hover:text-ivory">
          ← Back to careers
        </Link>
      </header>

      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {loadError && (
          <div className="rounded-xl border border-alert/40 bg-alert/5 p-6 text-center">
            <p className="text-ivory font-medium mb-1">Couldn&apos;t load your history</p>
            <p className="text-sm text-muted">
              If you just set up the project, run <code className="font-mono">npx prisma migrate dev --name init</code> and
              refresh this page.
            </p>
          </div>
        )}

        {!loadError && entries.length === 0 && (
          <div className="rounded-xl border border-line bg-panel p-10 text-center flex flex-col items-center gap-4">
            <p className="text-ivory font-medium">No shifts logged yet.</p>
            <p className="text-sm text-muted">Play one through to an ending and it&apos;ll show up here.</p>
            <Link
              href="/careers"
              className="rounded-lg bg-vital text-ink font-medium px-5 py-2.5 hover:brightness-110 transition"
            >
              Choose a shift
            </Link>
          </div>
        )}

        {entries.length > 0 && recommendation && <RecommendationCard recommendation={recommendation} />}
        {entries.length > 0 && <Achievements achievements={achievements} />}

        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={`/history/${entry.id}`}
            className="rounded-xl border border-line bg-panel p-5 flex items-center gap-4 hover:border-vital/50 transition-colors"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-panel2 border border-line text-vital shrink-0">
              <CareerIcon careerId={entry.careerId} size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-ivory font-medium truncate">{entry.careerTitle}</p>
                <span className="text-[10px] uppercase tracking-widest font-mono text-muted">{entry.difficulty}</span>
              </div>
              <p className="text-sm text-muted truncate">
                {entry.endingTitle} ·{' '}
                {entry.createdAt.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-mono text-lg text-vital">{entry.score}%</p>
              <span className="text-[10px] uppercase tracking-widest font-mono text-muted">Details →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
