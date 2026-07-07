import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { saveRunSchema } from '@/lib/validation';
import { replay, InvalidDecisionError } from '@/lib/simulationEngine';

export async function POST(req: NextRequest) {
  // 1. AuthN — never trust a userId from the request body. The only
  //    identity that matters is the one Clerk verified from the session
  //    cookie/JWT on this request.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit per authenticated user, not per IP (IPs are shared behind
  //    NAT/proxies and are spoofable in headers anyway).
  const limited = rateLimit(`save-run:${userId}`, 10, 60_000);
  if (!limited.success) {
    return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 });
  }

  // 3. Parse + validate the body shape before touching anything else.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
  }

  const parsed = saveRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  // 4. Recompute the outcome ourselves. We never trust a client-reported
  //    score/ending — see validation.ts and simulationEngine.ts for why.
  let result;
  try {
    result = replay(parsed.data.decisions, parsed.data.difficulty);
  } catch (err) {
    if (err instanceof InvalidDecisionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // 5. Ensure the local User row exists (first run for this account).
  const user = await currentUser();
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: user?.primaryEmailAddress?.emailAddress ?? `${userId}@unknown.local` },
  });

  const run = await db.simulationRun.create({
    data: {
      userId,
      career: 'trauma_surgeon',
      difficulty: parsed.data.difficulty,
      endingKey: result.endingKey,
      finalStress: result.finalStats.stress,
      finalEnergy: result.finalStats.energy,
      finalRep: result.finalStats.rep,
      finalMoney: result.finalStats.money,
      patientsSaved: result.finalStats.patientsSaved,
      decisions: JSON.stringify(parsed.data.decisions),
    },
  });

  return NextResponse.json({ id: run.id, endingKey: result.endingKey, finalStats: result.finalStats });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Scoped strictly to the caller's own runs — never accept a userId query
  // param here, or one signed-in user could read another's history.
  const runs = await db.simulationRun.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ runs });
}
