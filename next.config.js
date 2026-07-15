/**
 * Security-hardened Next.js configuration.
 *
 * The headers below are applied to EVERY response. They are the first line of
 * defense against clickjacking, MIME-sniffing, and script-injection attacks.
 * See SECURITY.md for the full threat model and why each header is here.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js" to attackers

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // TEMPORARY DEBUGGING ESCAPE HATCH — not a permanent setting, and never
    // set this in Vercel/production. If the sign-in/sign-up page is
    // rendering blank or partially blank, the fastest way to find out
    // whether the CSP is the cause (rather than something else entirely)
    // is to rule it out completely for one test:
    //   1. Add DISABLE_CSP_FOR_DEBUGGING=1 to your local .env
    //   2. Stop the dev server, delete .next, run `npm run dev` again
    //      (env changes and CSP changes both need a full restart, not
    //      hot-reload, to take effect)
    //   3. Reload the broken page
    // If it renders correctly now: the CSP is confirmed as the cause, and
    // the browser console (F12 -> Console, with this flag OFF again) will
    // show a "Refused to ... because it violates the following Content
    // Security Policy directive: ..." message that says exactly which
    // directive is still too narrow — paste that exact line for a precise
    // fix instead of another guess.
    // If it still renders blank with CSP fully disabled: the CSP was never
    // the problem, and the real cause is something else (a JS error, a bad
    // Clerk key, a stale build) — check the Console tab for any red error
    // regardless of this flag.
    // Remove DISABLE_CSP_FOR_DEBUGGING from .env once you're done testing.
    if (process.env.DISABLE_CSP_FOR_DEBUGGING) {
      return [];
    }

    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      isDev && "'unsafe-eval'",
      'https://*.clerk.accounts.dev',
      'https://clerk.shiftwork.app',
      'https://challenges.cloudflare.com',
    ]
      .filter(Boolean)
      .join(' ');

    const connectSrc = [
      "'self'",
      'https://*.clerk.accounts.dev',
      'https://api.clerk.dev',
      'https://challenges.cloudflare.com',
      isDev && 'ws://localhost:*',
      isDev && 'http://localhost:*',
    ]
      .filter(Boolean)
      .join(' ');

    const csp = [
      "default-src 'self'",
      // Clerk needs to load its own scripts/frames for auth UI + bot protection.
      // 'unsafe-eval' is added ONLY in dev — React's Fast Refresh and dev-mode
      // debugging (reconstructing component stacks) require eval(), but React
      // never uses eval() in a production build, so production keeps this
      // locked down. This is exactly the gap that caused a real console error
      // during local testing: an earlier version of this policy had no dev/
      // prod distinction and blocked eval() unconditionally, which breaks
      // React dev mode even though it would have been perfectly fine (and
      // more secure) in production.
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://img.clerk.com",
      "font-src 'self' data:",
      // Clerk's bot-protection challenge (Cloudflare Turnstile) runs inside a
      // Web Worker loaded from a blob: URL. With no explicit worker-src, CSP
      // falls back to script-src for that check, which doesn't allow blob: —
      // so the challenge silently fails to complete on first load, and the
      // sign-in/sign-up button appears to need several clicks before it
      // works (each click re-triggers the challenge, which eventually
      // succeeds by luck of timing/caching rather than actually being
      // fixed). This is a documented Clerk/Turnstile CSP requirement, not
      // a guess — see SECURITY.md.
      "worker-src 'self' blob:",
      // Turbopack's dev server talks to the browser over a local HMR
      // websocket; production serves no such thing, so this only needs to be
      // open in dev.
      `connect-src ${connectSrc}`,
      "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isDev ? [] : ['upgrade-insecure-requests']), // forcing HTTPS upgrades locally would break http://localhost
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS also only makes sense once real HTTPS is in front of the
          // app — sending it in local dev over plain http:// is a no-op at
          // best, so it's production-only too.
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]),
        ],
      },
    ];
  },
};

module.exports = nextConfig;
