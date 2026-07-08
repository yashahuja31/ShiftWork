# Shiftwork

A branching, stat-driven day-in-the-life career simulator — Sims-style
mechanics (tracked needs, floating stat pop-ups, a day that visibly moves
from dawn to night) applied to the question "what does this job actually
feel like, minute to minute?" Eight careers are fully playable end to end,
sharing one engine.

> **Before you read further:** see [`SECURITY.md`](./SECURITY.md). It explains
> what security measures are actually in place, and — just as important —
> what "secure" can and can't mean for a piece of software. Please read it
> before deploying this anywhere real users will use it.

---

## What's actually built

| Feature | Status |
|---|---|
| Landing page, career picker, difficulty picker | ✅ |
| **8 fully playable careers**, ~15-18 scenes each, each with a signature high-stakes 4-way decision and 5 possible endings: Trauma Surgeon, Astronaut, Detective, Michelin Chef, Pilot, Wildlife Photographer, Investment Banker, Air Traffic Controller | ✅ |
| Live stat tracking (stress / energy / reputation / pay / a career-specific highlight counter) | ✅ |
| Signature UI: an animated ECG line whose speed and color react to your stress in real time | ✅ |
| **Sims-style "living" animation layer** — see below | ✅ |
| End-of-shift report with a "career compatibility" score that's actually tied to how the run went (see "Fixing the compatibility score") | ✅ |
| Accounts via Clerk (email + social login), session-gated routes | ✅ |
| Server-side scoring — the server replays your decisions itself rather than trusting a client-submitted score | ✅ |
| Run history persisted per user (Postgres/SQLite via Prisma) | ✅ |
| Optional AI narration hook for one scene (OpenAI), with a static fallback so the game is fully playable with zero API keys | ✅ |
| More careers, random/chaos events beyond difficulty scaling, NPC conversations, leaderboards, voice narration, multiplayer, a literal 3D/graphical world | 🔜 see "Future enhancements" below |

"Sims-like" here means the mechanic (a life simulated through tracked
needs/stats, visible consequence, and a day that palpably passes) — a literal
3D graphical world is a much larger undertaking and is listed as a future
direction, not attempted here.

### The Sims-style animation layer

This is the part that's meant to make a text-and-buttons game feel like a
person is actually living through the day, not filling out a form:

- **Typewriter narration** — scene text reveals a couple of characters at a
  time instead of appearing all at once; choices fade in only once it's
  finished, so a beat has to land before you can act on it.
- **Floating stat pop-ups** (`FloatingDeltas.tsx`) — the moment a choice
  lands, "+10 REP" / "-8 ENERGY" style badges fly up and fade, the same
  language The Sims uses for need/mood changes.
- **A mood face** (`lib/mood.ts`) next to the shift clock — 🙂 / 😬 / 😰 / 😴 /
  😊 — that updates live from your current stress and energy, with a small
  spring-in animation on change.
- **A day/night ambient background** (`lib/dayCycle.ts`) — the whole screen's
  background gradient shifts through dawn → day → golden hour → night as the
  in-game clock advances through each career's scenes.
- **Tension staging** — the signature 4-choice decision in every career gets
  a slow pulsing amber glow, distinguishing "this one matters more" without
  any text saying so.
- **Ending flourishes** — a small on-brand confetti burst for the best
  ending, a brief shake for the worst one, in `EndingReport.tsx`.

Everything above respects `prefers-reduced-motion`: the typewriter reveals
instantly and pop-up/spring animations collapse to near-zero duration for
anyone with that OS setting on (see `globals.css`).

### Fixing the compatibility score

An earlier version of the "would you enjoy this career?" score used one
continuous formula over your final stats. Testing it against every possible
playthrough of the trauma-surgeon career (2,048 distinct paths) showed the
score never actually dropped below the mid-50s, even on the most reckless
path possible — the formula was technically working, but the *reachable*
range of stats in these scene graphs never drove it low enough to feel
meaningful. "Nothing I do changes this" is a real bug in a game, even though
no exception was ever thrown.

The fix (`compatibilityScore` in `simulationEngine.ts`) ties the score to a
band determined by which **ending** you actually got — triumphant scores
85-99, burned out scores 5-24, and so on — with your composure and
reputation moving you within that band. This was verified the same way the
bug was found: brute-forcing every reachable path in all 8 careers now shows
genuine spread (roughly 30-99 depending on the career), and a bad run
reliably produces a low number instead of a slightly-less-high one.

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
- **Optional AI:** OpenAI's Chat Completions API for one dynamic scene per
  career (entirely optional — the app works with zero AI keys configured)

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
│   └── schema.prisma                  # User + SimulationRun models
├── src/
│   ├── proxy.ts                       # Clerk route protection (Next.js 16's renamed middleware.ts; runs before every request)
│   ├── app/
│   │   ├── page.tsx                   # Public landing page
│   │   ├── careers/page.tsx           # Career picker (protected) — generated from CAREER_GRAPHS
│   │   ├── simulation/page.tsx        # Redirects /simulation -> /simulation/trauma_surgeon
│   │   ├── simulation/[career]/page.tsx  # The game itself (protected, validates career id)
│   │   ├── sign-in/, sign-up/         # Clerk-hosted auth pages
│   │   └── api/
│   │       ├── simulation/route.ts    # Save/list runs — auth + validation + server-side scoring
│   │       └── narrate/route.ts       # Optional AI narration — auth + rate limit + safe fallback
│   ├── components/
│   │   ├── VitalsMonitor.tsx          # ECG signature element + mood face + stat readouts
│   │   ├── SceneView.tsx              # Typewriter narration + staggered, tension-staged choices
│   │   ├── FloatingDeltas.tsx         # Sims-style floating "+10 REP" stat pop-ups
│   │   ├── SimulationClient.tsx       # The game's client-side state machine, per career
│   │   ├── CareerCard.tsx
│   │   └── EndingReport.tsx           # Ending copy, compatibility score, confetti/shake flourish
│   ├── lib/
│   │   ├── simulationEngine.ts        # Career registry + pure functions: effects, replay, ending, score
│   │   ├── dayCycle.ts                # Scene time -> hour-of-day -> ambient gradient
│   │   ├── mood.ts                    # Stats -> mood face + label
│   │   ├── validation.ts              # Zod schemas for every API input
│   │   ├── rateLimit.ts
│   │   └── db.ts                      # Prisma client singleton
│   └── data/careers/
│       ├── trauma-surgeon.json
│       ├── astronaut.json
│       ├── detective.json
│       ├── chef.json
│       ├── pilot.json
│       ├── wildlife-photographer.json
│       ├── investment-banker.json
│       └── air-traffic-controller.json
└── SECURITY.md
```

---

## Adding a new career

The whole point of the JSON-scene approach from the original design doc is
that a new career is content, not code. As of this version, the engine is a
proper registry — there is no per-career code to write:

1. Create `src/data/careers/<career-id>.json` with this shape (see any
   existing file for a full example):
   ```jsonc
   {
     "id": "your_career_id",
     "title": "A Day as a ...",
     "emoji": "🧑‍🎨",
     "tagline": "One line describing the day's core tension.",
     "highlightLabel": "Something tracked", // e.g. "Cases solved"
     "startScene": "wake_up",
     "scenes": {
       "wake_up": {
         "time": "06:00 AM",
         "text": "...",
         "choices": [
           { "id": "...", "text": "...", "next": "next_scene_id", "effects": { "stress": 5, "energy": -5, "rep": 5, "money": 0, "highlights": 0 } }
         ]
       }
       // ... 14-18 scenes total reads well; include one scene with 4 choices
       // for the "signature decision" moment and the tension-glow treatment
     },
     "endings": {
       "triumphant": { "title": "...", "blurb": "..." },
       "steady_hand": { "title": "...", "blurb": "..." },
       "ordinary_day": { "title": "...", "blurb": "..." },
       "burned_out": { "title": "...", "blurb": "..." },
       "written_up": { "title": "...", "blurb": "..." }
     }
   }
   ```
2. Register it in `src/lib/simulationEngine.ts`: add one `import` line and
   one line in the `CAREER_GRAPHS` object. That's the entire integration —
   `/careers` picks it up automatically, `/simulation/<career-id>` becomes a
   valid route, and the API route's Zod schema accepts it automatically
   because `saveRunSchema` derives its enum from `CAREER_IDS`, which is
   derived from `CAREER_GRAPHS`.
3. Before shipping it, validate the graph structurally — no dangling `next`
   references, no unreachable scenes, all 5 ending keys present. The
   one-off Python validation script used while building this (checks
   reachability, duplicate choice ids, dangling links) is worth keeping
   as a `scripts/validate-careers.*` step if you add many more careers.

No changes to the database schema, auth, API routes, or UI components are
needed — `career` is already a free-text column validated against the
registry at the API boundary, and every component that displays
career-specific text (`highlightLabel`, endings) reads it from the graph
rather than having it hardcoded.

---

## Future enhancements

Roughly in the order they'd add the most value:

- **More careers.** The original brainstorm doc also named air traffic
  controller and investment banker (both now built) alongside ideas like
  a firefighter, a teacher, a journalist, or a park ranger — all straightforward
  additions under the registry pattern above.
- **Genuinely random/chaos events**, not just the difficulty multiplier.
  Right now "chaos mode" scales existing effect magnitudes; the original
  design doc's Feature 4 envisioned occasional injected events (equipment
  failure, a walk-in emergency) layered onto any scene, not just the
  handful that are hardcoded per career today. This would need each scene
  to optionally declare an event pool and a trigger chance, resolved
  client-side before rendering choices.
- **A real leaderboard.** `SimulationRun` already stores every run per
  user; a `shared` leaderboard view (e.g. "top compatibility score this
  week, by career") is mostly a read-only aggregation query away, not a
  new subsystem.
- **NPC conversations** (Feature: "Talk to your boss/patients/crewmates") —
  a natural extension of the existing optional-AI-narration pattern in
  `api/narrate/route.ts`, but as a back-and-forth exchange instead of a
  single generated beat, gated the same way (works with zero AI keys,
  degrades to scripted dialogue if none are configured).
- **AI career recommendations** after several completed runs — "you
  consistently stay calm under pressure, you might like: Pilot, Surgeon" —
  straightforward once there's enough `SimulationRun` history per user to
  aggregate over.
- **Voice narration, badges/achievements, multiplayer, a literal
  graphical/3D world** — all named in the original brainstorm's "Future
  Features" list. Each is a substantially larger project in its own right
  (voice needs a TTS pipeline and per-scene audio direction; multiplayer
  needs a real-time transport and a shared-state model; a graphical world
  is closer to a second product than an extension of this one) — worth
  scoping as separate efforts once the text-based version has real usage
  data to justify them, rather than building speculatively now.

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
