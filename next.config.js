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
