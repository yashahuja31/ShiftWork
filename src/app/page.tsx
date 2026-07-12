import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { CAREER_GRAPHS, type SceneGraph } from '@/lib/simulationEngine';
import { LandingHero, type CareerPreview } from '@/components/LandingHero';

function teaserFor(graph: SceneGraph): string {
  // The signature 4-choice decision scene doubles as genuinely good ad
  // copy — it's the most evocative writing in each career already, so
  // reuse it here instead of writing separate marketing blurbs that could
  // drift out of sync with the actual content.
  const signature = Object.values(graph.scenes).find((scene) => scene.choices.length >= 4);
  const text = signature?.text ?? graph.tagline;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export default async function LandingPage() {
  const user = await currentUser();
  // Pulled from the actual registry rather than hardcoded, so this page
  // can't quietly go stale again the way it did the first time — it
  // launched describing only the trauma surgeon MVP and never got updated
  // when the other 11 careers were added.
  const careers: CareerPreview[] = Object.values(CAREER_GRAPHS).map((graph) => ({
    id: graph.id,
    emoji: graph.emoji,
    title: graph.title,
    tagline: graph.tagline,
    teaser: teaserFor(graph),
  }));

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <span className="font-display text-lg tracking-tight text-ivory">Shiftwork</span>
        <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
          {user ? (
            <>
              <Link href="/history" className="text-muted hover:text-ivory">
                History
              </Link>
              <Link href="/careers" className="text-vital hover:brightness-110">
                Choose your shift →
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-muted hover:text-ivory">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-ink bg-vital rounded px-3 py-1.5 hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <LandingHero isSignedIn={Boolean(user)} careers={careers} />
    </main>
  );
}
