import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Next.js 16 renamed the middleware.ts convention to proxy.ts (same code,
// same clerkMiddleware() call — see Clerk's docs). Only the landing page,
// and Clerk's own sign-in/up pages, are public. Everything else — the
// simulation itself, the report, and every API route that touches the
// database — requires a signed-in session. This is checked here, at the
// network boundary, BEFORE any page component or API handler runs, so a
// missing check inside one route can never accidentally expose data.
//
// IMPORTANT — defense in depth: this is not the ONLY auth check in the app.
// Protected server components (src/app/careers/page.tsx,
// src/app/simulation/page.tsx) and every API route also call Clerk's
// auth()/currentUser() themselves and redirect/reject independently. That
// redundancy is deliberate: proxy.ts runs Clerk's Node.js proxy runtime
// (new in Next.js 16), which is young enough that relying on it as the
// single point of enforcement would be a mistake — see SECURITY.md.
//
// /share/* and /api/og/* are deliberately public too: a shareable run
// result needs to work for logged-out visitors clicking the link, and for
// social media crawlers fetching the preview image, neither of which have
// a Clerk session. Both only ever expose the same non-identifying fields
// already visible on the (also-public-within-the-app) global leaderboard —
// career, difficulty, ending, score — never a userId or email. See
// src/app/share/[runId]/page.tsx and src/app/api/og/[runId]/route.tsx.
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/share/(.*)',
  '/api/og/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except static files and Next internals.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
