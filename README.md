# Shiftwork

**A Day as a Trauma Surgeon** — a branching, stat-driven day-in-the-life career
simulation. Sixteen hours, three patients, one critical. Every choice moves
four numbers — stress, energy, reputation, pay — and by the end of the shift
those numbers decide which of five endings you get.

This is the MVP slice of a larger idea: a library of careers (astronaut,
detective, chef, pilot, wildlife photographer, ...) each playable as a full
simulated day. The architecture below is built so adding a new career is
mostly "write a JSON file," not "write a new engine."

> **Before you read further:** see [`SECURITY.md`](./SECURITY.md). It explains
> what security measures are actually in place, and — just as important —
> what "secure" can and can't mean for a piece of software. Please read it
> before deploying this anywhere real users will use it.

---

## What's actually built (MVP scope)

| Feature | Status |
|---|---|
| Landing page, career picker, difficulty picker | ✅ |
| One full playable career: Trauma Surgeon (17 scenes, 4 branches on the signature "BP is dropping" decision, 5 possible endings) | ✅ |
| Live stat tracking (stress / energy / reputation / pay / patients saved) | ✅ |
| Signature UI: an animated ECG line whose speed and color react to your stress in real time | ✅ |
| End-of-shift report with a "career compatibility" score | ✅ |
| Accounts via Clerk (email + social login), session-gated routes | ✅ |
| Server-side scoring — the server replays your decisions itself rather than trusting a client-submitted score | ✅ |
| Run history persisted per user (Postgres/SQLite via Prisma) | ✅ |
| Optional AI narration hook for one scene (OpenAI), with a static fallback so the game is fully playable with zero API keys | ✅ |
| Additional careers (astronaut, detective, chef, pilot, photographer) | 🔜 shown as locked cards, not yet implemented |
| Random/chaos events beyond difficulty scaling, NPC conversations, leaderboards, voice narration, multiplayer, VR | 🔜 see the original design doc's "Future Features" — intentionally out of scope for this MVP |

This intentionally does **not** try to build all six careers, a full AI-driven
story engine, or a 3D/Sims-style graphical world in one pass — the original
brief's own "Suggested MVP Scope" section recommends exactly this kind of cut,
and it's the right call for something you can actually ship, review, and
harden. "Sims-like" here means the mechanic (a life simulated through
tracked needs/stats and consequence, not literal 3D avatars) — extending
toward a graphical world is listed as a future direction in the roadmap.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript, strict mode, Active LTS as of this writing — see "Keeping this current" below)
- **Auth:** [Clerk](https://clerk.com) — hosted sign-in/sign-up UI, session
  management, and edge middleware. (Auth0 was the other option named in the
  brief; see "Using Auth0 instead" below if you'd rather use that.)
- **Database:** PostgreSQL in production, SQLite for zero-setup local dev —
  both through [Prisma](https://prisma.io), so every query is parameterized
  and there is no hand-written SQL anywhere in the app.
- **Styling/animation:** Tailwind CSS, Framer Motion
- **Validation:** Zod on every API input
- **Optional AI:** OpenAI's Chat Completions API for one dynamic scene
  (entirely optional — the app works with zero AI keys configured)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Clerk (auth)

1. Create a free account at [clerk.com](https://clerk.com) and a new
   application.
2. Copy `.env.example` to `.env.local`.
3. Paste your **Publishable key** and **Secret key** into `.env.local`.
   The publishable key is safe for the browser; the secret key must never be
   committed or exposed to client code (see `SECURITY.md`).

### 3. Set up the database
 
Local dev needs no setup — SQLite is the default:

```bash
npx prisma migrate dev --name init
```

This creates `prisma/dev.db` (already git-ignored) and generates the Prisma
client.

For production, switch `provider` in `prisma/schema.prisma` from `sqlite` to
`postgresql`, point `DATABASE_URL` at your instance, and re-run
`prisma migrate dev` (or `prisma migrate deploy` in CI/CD). No other code
changes are needed — every query goes through Prisma's query builder, so
nothing in the app is SQLite-specific.

**Use a least-privilege database role** for the app in production: it only
ever needs `SELECT`/`INSERT`/`UPDATE`/`DELETE` on its own tables, never
schema-admin or superuser rights.

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 5. (Optional) enable AI narration

Leave `OPENAI_API_KEY` unset and the game runs fully offline with a static
fallback line for the one AI-eligible scene. To turn on dynamic narration,
add your key to `.env.local`. The key is read server-side only
(`src/app/api/narrate/route.ts`) and is never sent to the browser.

---

## Using Auth0 instead of Clerk

The brief named either as acceptable. Clerk was chosen here because its
Next.js App Router middleware integration needs the least custom code (which
means less custom code to get wrong). If you'd rather use Auth0:

1. Replace `@clerk/nextjs` with `@auth0/nextjs-auth0` in `package.json`.
2. Replace `src/proxy.ts`'s `clerkMiddleware`/`auth.protect()` calls with
   Auth0's `withMiddlewareAuthRequired`.
3. Replace `auth()` / `currentUser()` calls in the two API routes
   (`src/app/api/simulation/route.ts`, `src/app/api/narrate/route.ts`) with
   Auth0's `getSession()`.
4. Swap the `<SignIn>` / `<SignUp>` / `<UserButton>` components for Auth0's
   hosted login redirect and a plain logout link.

The rest of the app (Prisma models, the simulation engine, the UI) is
auth-provider-agnostic and does not need to change.

---

## Project structure

```
shiftwork/
├── prisma/
│   └── schema.prisma             # User + SimulationRun models
├── src/
│   ├── proxy.ts                  # Clerk route protection (Next.js 16's renamed middleware.ts; runs before every request)
│   ├── app/
│   │   ├── page.tsx              # Public landing page
│   │   ├── careers/page.tsx      # Career picker (protected)
│   │   ├── simulation/page.tsx   # The game itself (protected)
│   │   ├── sign-in/, sign-up/    # Clerk-hosted auth pages
│   │   └── api/
│   │       ├── simulation/route.ts  # Save/list runs — auth + validation + server-side scoring
│   │       └── narrate/route.ts     # Optional AI narration — auth + rate limit + safe fallback
│   ├── components/
│   │   ├── VitalsMonitor.tsx     # The ECG signature element + stat readouts
│   │   ├── SceneView.tsx         # Narration + choice buttons
│   │   ├── CareerCard.tsx
│   │   └── EndingReport.tsx
│   ├── lib/
│   │   ├── simulationEngine.ts   # Pure functions: apply effects, replay decisions, pick an ending
│   │   ├── validation.ts         # Zod schemas for every API input
│   │   ├── rateLimit.ts
│   │   └── db.ts                 # Prisma client singleton
│   └── data/
│       └── trauma-surgeon-scenes.json  # The entire story, as data
└── SECURITY.md
```

---

## Adding a new career

The whole point of the JSON-scene approach from the original design doc is
that a new career is content, not code:

1. Create `src/data/<career-id>-scenes.json` following the shape of
   `trauma-surgeon-scenes.json`: a `startScene` id, and a `scenes` map where
   each scene has `time`, `text`, and 2+ `choices`, each choice pointing at a
   `next` scene id (or `null` to end the shift) and an `effects` object
   (`stress` / `energy` / `rep` / `money` / `patientsSaved` deltas).
2. Point a new route (e.g. `src/app/simulation/astronaut/page.tsx`) or a
   `career` route param at that JSON file, the same way
   `src/app/simulation/page.tsx` does today.
3. Add an unlocked `CareerCard` for it on `/careers`.
4. Pick ending thresholds for `determineEnding()` in
   `simulationEngine.ts` (or generalize that function to take the scene
   graph's own threshold config if you're adding several careers at once).

No changes to the database schema, auth, or API routes are needed — the
`career` field on `SimulationRun` already exists for this.

---

## Keeping this current

Next.js 14 — a very common default in tutorials and templates — reached end
of life in October 2025 and no longer receives security patches. This project
is built on **Next.js 16, the current Active LTS line**, specifically because
of that. That won't stay true forever:

- Next.js 16 is Active LTS until the next major version ships, then becomes
  Maintenance LTS, then eventually EOL — the same cycle 14 just went through.
- Check [the Next.js support policy](https://nextjs.org/support-policy) and
  [endoflife.date/nextjs](https://endoflife.date/nextjs) periodically, and
  plan a major-version upgrade while your current line is still supported,
  not after.
- The same applies to Clerk, Prisma, and every other dependency —
  `.github/dependabot.yml` and `npm run audit` (see `SECURITY.md`) are what
  catch this on an ongoing basis. A README can only describe the state of the
  world on the day it was written.

---

## Scripts

```bash
npm run dev             # local dev server
npm run build            # runs ESLint, then a production build
npm run start            # run the production build
npm run lint              # ESLint (flat config, eslint.config.mjs)
npm run lint:fix           # ESLint with autofix
npm run prisma:studio     # visual DB browser
npm run audit              # npm audit, production deps only
```

---

## Deploying

Vercel (frontend) + a managed Postgres instance (Railway, Neon, Supabase, or
RDS) is the path of least resistance, matching the original brief's suggested
stack. Whatever you choose:

- Set every variable from `.env.example` in your host's environment variable
  UI — never bake secrets into the Docker image or commit them.
- Run `prisma migrate deploy` (not `migrate dev`) as part of your deploy step.
- Your build environment needs outbound network access to
  `fonts.googleapis.com`/`fonts.gstatic.com` (for `next/font`) and
  `binaries.prisma.sh` (for the Prisma engine) — both are fetched at build
  time. Most hosted CI (Vercel, Railway, GitHub Actions) allows this by
  default; a fully network-locked-down build sandbox will need those domains
  allow-listed.
- Turn on HTTPS-only / "always use HTTPS" at the host level — `next.config.js`
  already sends `Strict-Transport-Security`, but that header only matters
  once TLS is actually terminating in front of the app.
- See `SECURITY.md` for the full pre-launch checklist.
