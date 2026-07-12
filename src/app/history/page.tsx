import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db, type SimulationRunRow } from '@/lib/db';
import { compatibilityScore, getGraph, type EndingKey, type Stats } from '@/lib/simulationEngine';
import { CareerIcon } from '@/lib/careerIcons';

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
      take: 50,
    });
  } catch {
    // Most likely cause locally: the migration hasn't been run yet
    // (P2021, "table does not exist"). Fail soft here rather than a raw
    // 500 — an empty state with a hint is more useful than a stack trace.
    loadError = true;
  }

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

        {!loadError && runs.length === 0 && (
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

        {runs.map((run) => {
          let graph;
          try {
            graph = getGraph(run.career);
          } catch {
            return null; // career no longer exists in the registry — skip rather than crash the page
          }

          const stats: Stats = {
            stress: run.finalStress,
            energy: run.finalEnergy,
            rep: run.finalRep,
            money: run.finalMoney,
            highlights: run.highlights,
          };
          const endingKey = run.endingKey as EndingKey;
          const ending = graph.endings[endingKey];
          const score = compatibilityScore(stats, graph.calibration);

          return (
            <div
              key={run.id}
              className="rounded-xl border border-line bg-panel p-5 flex items-center gap-4"
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-panel2 border border-line text-vital shrink-0">
                <CareerIcon careerId={run.career} size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-ivory font-medium truncate">{graph.title}</p>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-muted">
                    {run.difficulty}
                  </span>
                </div>
                <p className="text-sm text-muted truncate">
                  {ending?.title ?? run.endingKey} ·{' '}
                  {new Date(run.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-mono text-lg text-vital">{score}%</p>
                <Link
                  href={`/simulation/${run.career}`}
                  className="text-[10px] uppercase tracking-widest font-mono text-muted hover:text-ivory"
                >
                  Play again
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
