import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { CareerCard } from '@/components/CareerCard';

const CAREERS = [
  {
    emoji: '🩺',
    title: 'Trauma Surgeon',
    tagline: 'Three patients, one critical, sixteen hours to get it right.',
    href: '/simulation',
  },
  { emoji: '🧑‍🚀', title: 'Astronaut', tagline: 'A full day aboard the station.', locked: true },
  { emoji: '🕵️', title: 'Detective', tagline: 'One case, whatever it takes.', locked: true },
  { emoji: '🧑‍🍳', title: 'Michelin Chef', tagline: 'Service starts at 5pm sharp.', locked: true },
  { emoji: '🧑‍✈️', title: 'Pilot', tagline: 'Pre-flight to touchdown.', locked: true },
  { emoji: '📷', title: 'Wildlife Photographer', tagline: 'The shot is never guaranteed.', locked: true },
];

export default async function CareersPage() {
  // Defense in depth: proxy.ts already gates this route, but this page
  // checks again independently rather than assuming the network layer did
  // its job. See the comment in proxy.ts for why.
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

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
        {CAREERS.map((career) => (
          <CareerCard key={career.title} {...career} />
        ))}
      </div>
    </main>
  );
}
