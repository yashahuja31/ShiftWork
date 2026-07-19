import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { compatibilityScore, getGraph, getEnding, replayWithHistory, type EndingKey, type TimelineStep } from '@/lib/simulationEngine';
import { CareerAvatar } from '@/components/CareerAvatar';
import { StatTimeline } from '@/components/StatTimeline';
import { moodFor } from '@/lib/mood';

interface PageProps {
  params: Promise<{ runId: string }>;
}

export default async function HistoryDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const { runId } = await params;

  const run = await db.simulationRun.findUnique({ where: { id: runId } }).catch(() => null);
  // Ownership check: a run detail page is private, unlike /share/[runId] —
  // never render another user's run here even if they guess a valid id.
  if (!run || run.userId !== userId) {
    notFound();
  }

  let graph;
  try {
    graph = getGraph(run.career);
  } catch {
    notFound();
  }

  const decisions = JSON.parse(run.decisions) as string[];
  let timeline: TimelineStep[];
  try {
    timeline = replayWithHistory(run.career, decisions, run.difficulty).timeline;
  } catch {
    timeline = [];
  }

  const stats = { stress: run.finalStress, energy: run.finalEnergy, rep: run.finalRep, money: run.finalMoney, highlights: run.highlights };
  const endingKey = run.endingKey as EndingKey;
  const ending = getEnding(run.career, endingKey);
  const score = compatibilityScore(stats, graph.calibration, run.difficulty);

  return (
    <main className="min-h-screen px-6 sm:px-10 py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/history" className="text-xs font-mono text-muted hover:text-ivory">
            ← Back to history
          </Link>
          <Link
            href={`/share/${run.id}`}
            className="text-xs font-mono uppercase tracking-widest text-vital hover:brightness-110"
          >
            Share this run →
          </Link>
        </div>

        <div className="flex justify-center">
          <CareerAvatar careerId={run.career} mood={moodFor(stats)} ending={endingKey} size={120} />
        </div>

        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-vital mb-2">
            {graph.emoji} {graph.title} · <span className="capitalize">{run.difficulty}</span>
          </p>
          <h1 className="font-display text-3xl text-ivory mb-2">{ending.title}</h1>
          <p className="text-muted text-sm">{ending.blurb}</p>
        </div>

        <div className="rounded-xl border border-vital/40 bg-vital/5 p-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono mb-1">Career compatibility</p>
          <p className="font-display text-5xl text-vital">{score}%</p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Final stress</p>
            <p className="font-mono text-2xl text-ivory">{stats.stress}/100</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-mono">{graph.highlightLabel}</p>
            <p className="font-mono text-2xl text-ivory">{stats.highlights}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Final reputation</p>
            <p className="font-mono text-2xl text-ivory">{stats.rep}/100</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-mono">Pay earned</p>
            <p className="font-mono text-2xl text-gold">${stats.money}</p>
          </div>
        </div>

        <StatTimeline timeline={timeline} />

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/simulation/${run.career}`}
            className="rounded-lg bg-vital text-ink font-medium px-5 py-2.5 hover:brightness-110 transition"
          >
            Play again
          </Link>
          <Link
            href="/careers"
            className="rounded-lg border border-line text-ivory font-medium px-5 py-2.5 hover:border-vital transition"
          >
            Back to careers
          </Link>
        </div>
      </div>
    </main>
  );
}
