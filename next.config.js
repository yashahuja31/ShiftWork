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
    const csp = [
      "default-src 'self'",
      // Clerk needs to load its own scripts/frames for auth UI + bot protection
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.shiftwork.app https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://img.clerk.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.dev",
      "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
