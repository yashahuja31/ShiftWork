# Security

## Read this first

You asked for this project to be "fully secure from being hacked by anyone at
any point in time in its existence, ever." I want to be straight with you
about that framing before anything else: **no piece of software, built by
anyone, at any company, at any budget, can honestly promise that.** Security
isn't a switch you flip once — it's a process you keep doing for as long as
the app is running, because new vulnerabilities get discovered in every
framework and library on a rolling basis, forever. Anyone who tells you their
app is permanently unhackable is either wrong or selling something.

What I *can* do, and did do, is build this to current best practice and
document exactly what that covers — so you know what's handled, what still
depends on you (rotating keys, applying updates, configuring your host
correctly), and what no app can fully rule out (a zero-day in a dependency,
a compromised upstream package, a misconfigured server you deploy it to).
That's a more useful promise than "unhackable," and it's the honest one.

---

## What's implemented, and why

### Authentication & session management
- All sign-up/sign-in/session handling is delegated to **Clerk**, not
  hand-rolled. Passwords are never seen, stored, or hashed by this codebase —
  that removes an entire category of risk (weak hashing, leaked password
  tables, session-fixation bugs) by simply not owning it.
- `src/proxy.ts` protects every route except the public landing page and
  the auth pages themselves, **at the network boundary**, before any page
  component or API handler executes. This is Next.js 16's renamed
  `middleware.ts` — same mechanism, new name (see "Next.js 16, specifically"
  below for why the version matters here).
- That single check is deliberately not the *only* check: `src/app/careers/page.tsx`
  and `src/app/simulation/page.tsx` both independently call Clerk's `auth()`
  server-side and redirect if there's no session, and every API route checks
  `auth()` again itself. This redundancy is intentional — see "A real bug
  this caught," below.

### Authorization (never trust the client with identity)
- Every database query that touches user data filters by the `userId` Clerk
  verified from the session — never a userId passed in the request body or a
  query string. One signed-in user structurally cannot read or write another
  user's rows; there's no code path where that value comes from anywhere but
  the verified session.

### Don't trust the client with *scoring*, either
- This is a game, so "don't trust the client" also applies to the score
  itself. The client sends the server the raw list of choice ids the player
  made — nothing else. `src/app/api/simulation/route.ts` replays those
  choices through the same scene graph server-side
  (`src/lib/simulationEngine.ts`) and computes the final stats and ending
  itself. A modified client could lie about which button it thinks the
  player pressed, but it cannot inject an arbitrary "I scored 100%" result —
  the server checks every choice id against what was actually valid at that
  point in the story and rejects anything that doesn't match.

### Input validation
- Every API route parses its input through a **Zod schema**
  (`src/lib/validation.ts`) before touching the database: types, ranges, and
  array lengths are all bounded. This blocks malformed payloads, oversized
  arrays meant to exhaust memory/storage, and injection of unexpected
  fields.

### SQL injection
- All database access goes through **Prisma's query builder**. There is no
  string-concatenated or raw SQL anywhere in this codebase, which is the
  single biggest practical defense against SQL injection.

### XSS (cross-site scripting)
- React escapes all rendered text by default, and this codebase never uses
  `dangerouslySetInnerHTML`. Combined with the CSP below, this closes off
  both the "attacker submits a script" and "attacker's script would've been
  allowed to run anyway" paths.

### HTTP security headers (`next.config.js`)
Applied to every response:
- **Content-Security-Policy** — restricts what scripts/frames/images are
  allowed to load, scoped to `'self'` plus Clerk's own domains.
- **X-Frame-Options: DENY** / `frame-ancestors 'none'` — prevents
  clickjacking (the app being embedded in a hidden iframe on someone else's
  malicious page).
- **X-Content-Type-Options: nosniff** — stops the browser from
  MIME-sniffing a file into executing as something it isn't.
- **Strict-Transport-Security** — forces HTTPS once your host has TLS
  configured (see the deploy checklist below — the header alone doesn't add
  TLS, it just refuses to fall back to plain HTTP once it's there).
- **Referrer-Policy** and **Permissions-Policy** — reduce what leaks to
  other origins and disable camera/mic/geolocation the app never uses.
- `poweredByHeader: false` — don't hand an attacker a free
  "this is a Next.js app" fingerprint.

### Rate limiting
- Every API route is rate-limited **per authenticated user id**, not per IP
  (IPs are shared and spoofable via headers). See the in-memory caveat below
  — this is the one place where "works today" and "works at scale" diverge,
  and it's called out explicitly rather than glossed over.

### Secrets management
- `.env.example` contains placeholders only, and is the only env file
  tracked in git. `.gitignore` explicitly excludes `.env`, `.env.local`, and
  every real database file.
- The AI narration key (`OPENAI_API_KEY`) is read only in a server-side
  route handler and is never sent to, or readable by, the browser.
- Prisma logging is configured to never log query parameters in production,
  since those can contain user-entered data.

### Dependency hygiene
- `.github/dependabot.yml` opens weekly automated PRs for vulnerable
  dependencies.
- `npm run audit` is wired up as a one-command check before you deploy.
- `package.json` pins a `postcss` **override** to `^8.5.10`. This isn't
  decorative: Next.js 16.2.10 (the current stable release at the time of
  writing) bundles an older, vulnerable `postcss` internally
  (`GHSA-qx2v-qp2m-jg93` / `CVE-2026-41305`, an XSS in CSS stringification).
  The override forces npm to use the patched version everywhere, including
  inside Next's own dependency tree. `npm audit` came back clean with this
  in place; without it, it does not. If you ever remove this override,
  re-run `npm audit` before assuming it's safe to do so.

### Next.js 16, specifically
This project targets Next.js 16 rather than 14 or 15 for a concrete reason,
not just "use the newest thing": **Next.js 14 reached end-of-life in October
2025 and stopped receiving security patches entirely.** A huge number of
Next.js tutorials, templates, and existing codebases are still on 14 — if
you're evaluating this against another AI-generated or templated project,
check its `package.json` for this. Building on an EOL framework version is
one of the most common, and most avoidable, security mistakes in web apps
right now. See "Keeping this current" in `README.md` for how this will need
to be revisited over time, because 16 will eventually reach the same point.

### A real bug this caught (and why the redundancy above exists)
While building this, testing surfaced a live, documented issue: recent
`@clerk/nextjs` v7 releases running on Next.js 16's new proxy runtime have
had at least one reported case (`clerk/javascript#8302`) where
`auth.protect()` silently failed to redirect unauthenticated users away from
a protected page, under a specific environment-variable/monorepo condition —
meaning the proxy-layer check alone did not reliably block access. This is
exactly why `src/app/careers/page.tsx` and `src/app/simulation/page.tsx` each
independently re-check `auth()` and redirect themselves, rather than relying
solely on `src/proxy.ts`. That redundancy isn't defensive-programming
paranoia for its own sake — it's a direct response to a real, filed bug in
the exact stack this project uses. Keep both layers if you extend this app;
don't remove the page-level checks as "redundant" once proxy.ts looks like
it's working, because "looks like it's working" is precisely how that bug
manifested for other people.

---

## What is *not* handled for you, and needs your attention

Being honest about the edges of this is as important as the list above.

1. **In-memory rate limiting doesn't scale across multiple server
   instances.** If you deploy more than one instance behind a load balancer,
   each gets its own counter. Fine for a single Railway/Render service or
   local use; if you scale horizontally, swap `src/lib/rateLimit.ts` for a
   shared store (Upstash Redis is the natural fit — the file has a comment
   marking exactly what to change).
2. **TLS/HTTPS itself is your hosting provider's job, not this codebase's.**
   `Strict-Transport-Security` tells browsers to insist on HTTPS once it
   exists; it doesn't create the certificate. Vercel, Railway, etc. handle
   this automatically — just don't turn it off.
3. **Dependency vulnerabilities will be found after this is written**, in
   Next.js, Clerk's SDK, Prisma, or anything else in `package.json`. That's
   what Dependabot and `npm audit` are for — they only help if someone
   actually merges the updates. Set a calendar reminder, don't just leave the
   PRs open.
4. **Your Clerk and database credentials are only as safe as wherever you
   store them.** Use your hosting provider's secret manager, not a shared
   doc or a Slack message. Rotate the Clerk secret key and DB password if you
   ever suspect they leaked (e.g. an accidental commit).
5. **This has not been through a third-party penetration test or formal
   security audit.** The list above is solid, current best practice — it is
   not a substitute for one if this is ever handling real patients' data,
   real payments, or anything with genuine regulatory stakes.

---

## Pre-launch checklist

- [ ] Real Clerk keys in your host's env vars (never in git)
- [ ] `DATABASE_URL` pointed at a real Postgres instance with a
      least-privilege app user
- [ ] `prisma migrate deploy` run against production
- [ ] HTTPS confirmed working (most hosts do this automatically — verify it)
- [ ] `npm run audit` clean, or accepted risk documented for anything that
      isn't
- [ ] Dependabot PRs enabled and someone assigned to actually review them
- [ ] If you add features that touch money, health records, or anything
      regulated: get an actual security review before launch, not just this
      document
