import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rateLimit';
import { narrateRequestSchema } from '@/lib/validation';

// Static fallback used whenever no AI key is configured, or the call fails.
// This is what makes the app fully playable offline out of the box (see
// "Suggested MVP Scope" in the design doc: AI augments, never gates, the
// experience).
const FALLBACK_TEXT =
  'The monitor beeps steady, then hesitates — a half-second stutter that makes everyone in the room look up at once. It passes. For now.';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimit(`narrate:${userId}`, 15, 60_000);
  if (!limited.success) {
    return NextResponse.json({ text: FALLBACK_TEXT, source: 'fallback' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
  }

  const parsed = narrateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key configured — this is the expected default state, not an error.
    return NextResponse.json({ text: FALLBACK_TEXT, source: 'fallback' });
  }

  // Every value interpolated into the prompt is a bounded number or an id
  // drawn from our own scene graph (validated above) — never raw free-text
  // from the client — so there is no user-controlled prompt-injection
  // surface here.
  const prompt =
    `You are narrating one beat of a realistic trauma-surgery shift simulation. ` +
    `Current time: ${parsed.data.currentTime}. Current stress level: ${parsed.data.stress}/100. ` +
    `Write 2-3 sentences describing an unexpected complication at scene "${parsed.data.sceneId}". ` +
    `Keep it grounded and under 60 words. No dialogue tags, just narration.`;

  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
      // Never let a slow upstream call hang a request indefinitely.
      signal: AbortSignal.timeout(8_000),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ text: FALLBACK_TEXT, source: 'fallback' });
    }

    const data = await aiRes.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({ text: text || FALLBACK_TEXT, source: text ? 'ai' : 'fallback' });
  } catch {
    // Network hiccup, timeout, or upstream outage — degrade gracefully
    // rather than breaking the player's shift.
    return NextResponse.json({ text: FALLBACK_TEXT, source: 'fallback' });
  }
}
