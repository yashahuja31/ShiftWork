import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { CAREER_GRAPHS } from '@/lib/simulationEngine';

export default async function LandingPage() {
  const user = await currentUser();
  // Pulled from the actual registry rather than hardcoded, so this page
  // can't quietly go stale again the way it did the first time — it
  // launched describing only the trauma surgeon MVP and never got updated
  // when the other 11 careers were added.
  const careers = Object.values(CAREER_GRAPHS);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <span className="font-display text-lg tracking-tight text-ivory">Shiftwork</span>
        <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
          {user ? (
            <Link href="/careers" className="text-vital hover:brightness-110">
              Choose your shift →
            </Link>
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

      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 pb-20">
        <div className="w-full max-w-2xl">
          <svg viewBox="0 0 800 120" className="w-full h-20" aria-hidden="true">
            <path
              d="M0,60 L200,60 L275,60 L285,20 L295,100 L305,40 L315,60 L500,60 L600,60 L675,60 L685,20 L695,100 L705,40 L715,60 L800,60"
              fill="none"
              stroke="#3ECF8E"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="800"
              className="animate-ecg"
              style={{ animationDuration: '2.4s' }}
            />
          </svg>
        </div>

        <div className="max-w-xl flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-vital">
            {careers.length} careers · one decision at a time
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory leading-tight">
            Live a full shift in someone else&apos;s career, before you commit to it.
          </h1>
          <p className="text-muted text-lg">
            Trauma surgeon, astronaut, pilot, firefighter, and more — every shift is a real
            branching day with a genuine high-stakes decision at its center. Every choice you
            make changes what happens next, and what you&apos;re like by the time you clock out.
          </p>
        </div>

        <Link
          href={user ? '/careers' : '/sign-up'}
          className="rounded-lg bg-vital text-ink font-medium px-8 py-3.5 hover:brightness-110 transition text-lg"
        >
          {user ? 'Choose your shift' : 'Create a free account'}
        </Link>

        <div className="flex flex-wrap justify-center gap-3 max-w-lg" aria-hidden="true">
          {careers.map((career) => (
            <span
              key={career.id}
              className="text-2xl opacity-70"
              title={career.title}
            >
              {career.emoji}
            </span>
          ))}
        </div>

        <p className="text-xs text-muted font-mono">
          {careers.length} careers live now, from the OR to the cockpit.
        </p>
      </section>
    </main>
  );
}
