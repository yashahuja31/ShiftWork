import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { CareerCard } from '@/components/CareerCard';
import { CAREER_GRAPHS } from '@/lib/simulationEngine';

export default async function CareersPage() {
  // Defense in depth: proxy.ts already gates this route, but this page
  // checks again independently rather than assuming the network layer did
  // its job. See the comment in proxy.ts for why.
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Generated straight from the engine's career registry — adding a new
  // career JSON file automatically puts an unlocked card here. There is no
  // separate hardcoded list to remember to update.
  const careers = Object.values(CAREER_GRAPHS);

  return (
    <main className="min-h-screen px-6 sm:px-10 py-10">
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-vital mb-1">Choose a shift</p>
          <h1 className="font-display text-3xl text-ivory">What&apos;s it actually like?</h1>
        </div>
        <UserButton />
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
        {careers.map((career) => (
          <CareerCard
            key={career.id}
            emoji={career.emoji}
            title={career.title}
            tagline={career.tagline}
            href={`/simulation/${career.id}`}
          />
        ))}
      </div>
    </main>
  );
}
