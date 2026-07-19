import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { compatibilityScore, getGraph, getEnding, type EndingKey } from '@/lib/simulationEngine';
import { CareerAvatar } from '@/components/CareerAvatar';
import { moodFor } from '@/lib/mood';

interface PageProps {
  params: Promise<{ runId: string }>;
}

async function loadSharedRun(runId: string) {
  const run = await db.simulationRun.findUnique({ where: { id: runId } }).catch(() => null);
  if (!run) return null;

  let graph;
  try {
    graph = getGraph(run.career);
  } catch {
    return null;
  }

  const stats = { stress: run.finalStress, energy: run.finalEnergy, rep: run.finalRep, money: run.finalMoney, highlights: run.highlights };
  const endingKey = run.endingKey as EndingKey;
  const ending = getEnding(run.career, endingKey);
  const score = compatibilityScore(stats, graph.calibration, run.difficulty);

  // Deliberately not returning run.userId or anything from the User table —
  // this page and its metadata are public, so only the non-identifying
  // fields also already visible on the global leaderboard leave this
  // function.
  return { graph, stats, endingKey, ending, score, difficulty: run.difficulty, careerId: run.career };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { runId } = await params;
  const shared = await loadSharedRun(runId);
  if (!shared) return { title: 'Shiftwork' };

  const title = `${shared.score}% compatible — ${shared.graph.title} | Shiftwork`;
  const description = `${shared.ending.title}: ${shared.ending.blurb}`;
  const imageUrl = `/api/og/${runId}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { runId } = await params;
  const shared = await loadSharedRun(runId);
  if (!shared) {
    notFound();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
        <p className="font-display text-lg tracking-tight text-ivory">Shiftwork</p>

        <CareerAvatar careerId={shared.careerId} mood={moodFor(shared.stats)} ending={shared.endingKey} size={128} />

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-vital mb-2">
            {shared.graph.emoji} {shared.graph.title} · <span className="capitalize">{shared.difficulty}</span>
          </p>
          <h1 className="font-display text-3xl text-ivory mb-2">{shared.ending.title}</h1>
          <p className="text-muted text-sm">{shared.ending.blurb}</p>
        </div>

        <div className="rounded-xl border border-vital/40 bg-vital/5 p-6 w-full">
          <p className="text-[10px] uppercase tracking-widest text-muted font-mono mb-1">Career compatibility</p>
          <p className="font-display text-5xl text-vital">{shared.score}%</p>
        </div>

        <Link
          href={`/simulation/${shared.careerId}`}
          className="rounded-lg bg-vital text-ink font-medium px-8 py-3.5 hover:brightness-110 transition text-lg"
        >
          Try this shift yourself
        </Link>
        <p className="text-xs text-muted font-mono">Sign up free — 12 careers to try.</p>
      </div>
    </main>
  );
}
