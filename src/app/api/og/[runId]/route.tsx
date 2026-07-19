import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import { compatibilityScore, getGraph, getEnding, type EndingKey } from '@/lib/simulationEngine';

export const runtime = 'nodejs'; // needs Prisma's Node client, not the Edge one

export async function GET(_req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  const run = await db.simulationRun.findUnique({ where: { id: runId } }).catch(() => null);
  if (!run) {
    return new Response('Not found', { status: 404 });
  }

  let graph;
  try {
    graph = getGraph(run.career);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const stats = { stress: run.finalStress, energy: run.finalEnergy, rep: run.finalRep, money: run.finalMoney, highlights: run.highlights };
  const endingKey = run.endingKey as EndingKey;
  const ending = getEnding(run.career, endingKey);
  const score = compatibilityScore(stats, graph.calibration, run.difficulty);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B1220',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(62,207,142,0.15), transparent 60%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 120, marginBottom: 12 }}>{graph.emoji}</div>
        <div style={{ display: 'flex', fontSize: 30, color: '#7C8AA5', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          {graph.title}
        </div>
        <div style={{ display: 'flex', fontSize: 56, color: '#E8ECF1', fontWeight: 700, marginBottom: 24 }}>
          {ending.title}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '2px solid rgba(62,207,142,0.4)',
            backgroundColor: 'rgba(62,207,142,0.08)',
            borderRadius: 24,
            padding: '24px 64px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 24, color: '#7C8AA5', letterSpacing: 2, textTransform: 'uppercase' }}>
            Career compatibility
          </div>
          <div style={{ display: 'flex', fontSize: 96, color: '#3ECF8E', fontWeight: 700 }}>{score}%</div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#7C8AA5', marginTop: 40, letterSpacing: 2 }}>
          SHIFTWORK — LIVE A DAY IN 12 DIFFERENT CAREERS
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
