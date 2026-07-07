import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';

export default async function LandingPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <span className="font-display text-lg tracking-tight text-ivory">Shiftwork</span>
        <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
          {user ? (
            <Link href="/careers" className="text-vital hover:brightness-110">
              Enter ward →
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
            04:45 AM · pager already buzzing
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory leading-tight">
            Live a full trauma surgery shift, one decision at a time.
          </h1>
          <p className="text-muted text-lg">
            Sixteen hours. Three patients. Every choice you make — pause the surgery or push
            through, call for backup or handle it alone — changes what happens next, and what
            you&apos;re like by the time you clock out.
          </p>
        </div>

        <Link
          href={user ? '/careers' : '/sign-up'}
          className="rounded-lg bg-vital text-ink font-medium px-8 py-3.5 hover:brightness-110 transition text-lg"
        >
          {user ? 'Start your shift' : 'Create a free account'}
        </Link>

        <p className="text-xs text-muted font-mono">
          One career live today — Trauma Surgeon. More on the way.
        </p>
      </section>
    </main>
  );
}
