import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shiftwork — Live a Day in 12 Different Careers',
  description:
    'A branching career simulator. Surgeon, astronaut, pilot, firefighter, and more — live a full shift, one decision at a time, and find out what the job actually feels like.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
