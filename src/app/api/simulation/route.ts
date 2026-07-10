import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { saveRunSchema } from '@/lib/validation';
import { replay, InvalidDecisionError } from '@/lib/simulationEngine';

// Mirrors the Prisma-generated SimulationRun model shape. Annotated
// explicitly here (rather than relying on inference from `db.simulationRun`)
// so this compiles the same way regardless of exactly how the generated
// client's types come through in a given environment.
interface SimulationRunRow {
  id: string;
  userId: string;
  career: string;
  difficulty: string;
  endingKey: string;
  finalStress: number;
  finalEnergy: number;
  finalRep: number;
  finalMoney: number;
  highlights: number;
  decisions: string;
  createdAt: Date;
}

// Prisma throws a known-request error with a `.code` of "P2021" when a
// table referenced in a query doesn't exist yet — almost always meaning
// `npx prisma migrate dev --name init` was never run against this database.
// This checks the `.code` property directly (duck-typed) rather than
// `instanceof Prisma.PrismaClientKnownRequestError`: both work, but this
// version doesn't require importing the `Prisma` namespace just to catch
// one error code, and every Prisma error object carries `.code` regardless
// of exactly how the error classes are exported in a given client version.
function isMissingTableError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2021';
}

const MISSING_TABLE_MESSAGE =
  'Database tables not found. Run `npx prisma migrate dev --name init` in the project root, then try again. See README.md > "Set up the database".';

function handleMissingTable(err: unknown): NextResponse | null {
  if (!isMissingTableError(err)) return null;
  // Deliberately loud: this is where a developer running `npm run dev` is
  // actually watching, and the raw Prisma stack trace alone doesn't say
  // what to run to fix it.
  console.error(`\n[shiftwork] ${MISSING_TABLE_MESSAGE}\n`);
  return NextResponse.json({ error: MISSING_TABLE_MESSAGE }, { status: 500 });
}

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
    result = replay(parsed.data.career, parsed.data.decisions, parsed.data.difficulty);
  } catch (err) {
    if (err instanceof InvalidDecisionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // 5. Ensure the local User row exists (first run for this account).
  try {
    const user = await currentUser();
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: user?.primaryEmailAddress?.emailAddress ?? `${userId}@unknown.local` },
    });

    const run = await db.simulationRun.create({
      data: {
        userId,
        career: parsed.data.career,
        difficulty: parsed.data.difficulty,
        endingKey: result.endingKey,
        finalStress: result.finalStats.stress,
        finalEnergy: result.finalStats.energy,
        finalRep: result.finalStats.rep,
        finalMoney: result.finalStats.money,
        highlights: result.finalStats.highlights,
        decisions: JSON.stringify(parsed.data.decisions),
      },
    });

    return NextResponse.json({ id: run.id, endingKey: result.endingKey, finalStats: result.finalStats });
  } catch (err) {
    const missingTableResponse = handleMissingTable(err);
    if (missingTableResponse) return missingTableResponse;
    throw err;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Scoped strictly to the caller's own runs — never accept a userId query
  // param here, or one signed-in user could read another's history.
  try {
    const runs = await db.simulationRun.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    // Stored as a JSON string (see schema.prisma for why) -- parse it back
    // to an array so this endpoint's actual response shape doesn't leak
    // that storage detail to whatever ends up consuming it.
    const parsedRuns = runs.map((run: SimulationRunRow) => ({
      ...run,
      decisions: JSON.parse(run.decisions) as string[],
    }));
    return NextResponse.json({ runs: parsedRuns });
  } catch (err) {
    const missingTableResponse = handleMissingTable(err);
    if (missingTableResponse) return missingTableResponse;
    throw err;
  }
}
