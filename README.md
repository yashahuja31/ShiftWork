# Shiftwork

A branching, stat-driven day-in-the-life career simulator — Sims-style
mechanics (tracked needs, a living animated character, a day that visibly
moves from dawn to night) applied to the question "what does this job
actually feel like, minute to minute?" **12 careers** are fully playable end
to end, sharing one engine.

> **Before you read further:** see [`SECURITY.md`](./SECURITY.md). It explains
> what security measures are actually in place, and — just as important —
> what "secure" can and can't mean for a piece of software. Please read it
> before deploying this anywhere real users will use it.

---

## What's actually built

| Feature | Status |
|---|---|
| Landing page, career picker, difficulty picker | ✅ |
| **12 fully playable careers** (~15-19 scenes each, a signature high-stakes 4-way decision, 5 possible endings, one randomized "life happens" beat for replay variety): Trauma Surgeon, Astronaut, Detective, Michelin Chef, Pilot, Wildlife Photographer, Investment Banker, Air Traffic Controller, Firefighter, Teacher, Paramedic, Software Engineer | ✅ |
| Live stat tracking (stress / energy / reputation / pay / a career-specific highlight counter) | ✅ |
| **An animated visual character** (`CareerAvatar.tsx`) — not text, an actual SVG figure with a career-specific prop icon, whose posture, expression, and pace change with mood and react to the big-decision moments — see below | ✅ |
| **Per-scene animated backdrop** (`SceneBackdrop.tsx`) — every one of the ~200 scenes across all careers carries its own environment tag (commute, briefing, rest, alert, ...) driving a distinctly-animated icon, not just a different picture — see below | ✅ |
| Signature UI: an animated ECG line whose speed and color react to your stress in real time | ✅ |
| Sims-style "living" text/UI animation layer (typewriter narration, floating stat pop-ups, day/night ambient background) — see below | ✅ |
| **Replay variety** — each career has at least one randomized branch point so two playthroughs of the same career don't play out identically | ✅ |
| End-of-shift report with a compatibility score that's an honest percentile against real random play, not a formula that quietly can't go below 50 (see "Fixing the compatibility score") | ✅ |
| Accounts via Clerk (email + social login), session-gated routes | ✅ |
| Server-side scoring — the server replays your decisions itself rather than trusting a client-submitted score | ✅ |
| Run history persisted per user (Postgres/SQLite via Prisma) | ✅ |
| Optional AI narration hook for one scene (OpenAI), with a static fallback so the game is fully playable with zero API keys | ✅ |
| Every career in the world, NPC conversations, leaderboards, voice narration, multiplayer, a full 3D/graphical world | 🔜 see "Future enhancements" and "On 'every career in the world'" below |

### A distinct animation for every scene, not just mood

Beyond the character's own mood-driven animation, each individual scene now
carries an `environment` tag (`commute`, `briefing`, `rest`, `alert`,
`social`, `outdoors`, `paperwork`, `work`) that drives a small animated
badge next to the scene text (`SceneBackdrop.tsx` / `lib/sceneEnvironments.tsx`).
This isn't just a different icon per tag — each environment has its own
*kind* of motion, so the animation itself communicates something: a commute
scene's icon shifts side to side like movement, a rest scene drifts slowly
and fades in and out, an alert scene pulses sharply and fast, paperwork
gives a small back-and-forth "writing" rotation. All ~200 scenes across the
12 careers were tagged (auto-classified from scene content, with every
signature 4-choice decision forced to `alert` regardless of wording) and
verified structurally sound the same way the rest of the content is (see
`scripts/validate_careers.py`).

### The animated character (the actual game-style animation, not text)

`CareerAvatar.tsx` is a hand-built SVG figure — not an image asset, not a
GIF, an actual vector character animated with Framer Motion — that's meant
to feel like a small game character rather than a UI decoration:

- **Idle motion**: a continuous gentle bob and an occasional blink, so the
  character reads as "alive" even when nothing's happening.
- **Mood-driven posture**: arm position, head tilt, eyebrow angle, and mouth
  shape all shift based on the current mood computed from your stats
  (`lib/mood.ts`) — slumped and heavy-lidded when exhausted, tense and
  wide-eyed when overwhelmed, upright with a soft green glow when things are
  going well.
- **Tension reaction**: during each career's signature 4-choice decision, a
  pulsing amber ring appears around the character — the same visual language
  as the tension glow around the scene text, now on the character too.
- **A career-specific prop**: a small icon badge (stethoscope, rocket, chef's
  hat, radar dish, and so on, via `lucide-react`) rendered on the character,
  so the same base figure reads as a different job per career without
  needing twelve hand-drawn illustrations.
- **A final pose on the ending screen**: arms raised for the best ending,
  slumped forward for burned out, arms drawn in for written up — the
  character visibly reacts to how the day went, not just the text around it.

### The text/UI animation layer

This is the part that makes the surrounding screen feel like a day is
passing, not a form being filled out:

- **Typewriter narration** — scene text reveals a couple of characters at a
  time; choices fade in only once it's finished.
- **Floating stat pop-ups** (`FloatingDeltas.tsx`) — "+10 REP" / "-8 ENERGY"
  badges fly up and fade the moment a choice lands.
- **A day/night ambient background** (`lib/dayCycle.ts`) — the screen's
  background gradient shifts through dawn → day → golden hour → night as the
  in-game clock advances.
- **Tension staging** — the signature decision in every career gets a slow
  pulsing amber glow around the scene text as well as the character.
- **Ending flourishes** — on-brand confetti for the best ending, a brief
  shake for the worst, in `EndingReport.tsx`.

Everything above respects `prefers-reduced-motion`: the typewriter reveals
instantly, the character's idle bob and blink stop, and spring/pop-up
animations collapse to near-zero duration for anyone with that OS setting on.

### Replay variety — not always the same questions

Every career has at least one scene marked `"randomized": true`
(`src/data/careers/*.json`). Instead of showing choice buttons, the game
auto-picks one of that scene's 2-3 minor outcomes at random and narrates it
— a rookie's good question, a supply delivery running early, a radio
crackling with static — small texture that means two playthroughs of the
same career don't unfold identically. The random pick is recorded in the
decisions list exactly like a click would be
(`pickRandomChoice` in `simulationEngine.ts`), so server-side replay and
scoring don't need to know or care that it wasn't a manual choice.

### Fixing the compatibility score (twice)

**First attempt.** An early version of the score used one continuous formula
over your final stats. Testing it against every possible playthrough of the
trauma-surgeon career (2,048 distinct paths) showed it never dropped below
the mid-50s even on the most reckless path — technically working, but
meaningless in practice.

**That fix wasn't enough either.** The next version tied the score to a band
based on which of 5 endings you got. That solved the "never below 50" case
for *deliberately, maximally bad* play — but random-sampling 10,000
*ordinary* (randomly-chosen-choice) playthroughs showed 93% of them still
landed in the top two tiers, with mean final reputation at 81/100 against a
starting value of 60. In other words: is everyone compatible with this job?
The numbers said yes, which was exactly the complaint — a system that can't
tell an average attempt from a good one isn't measuring anything.

**The actual fix** (`scripts/calibrate_careers.py` +
`compatibilityScore`/`determineEnding` in `simulationEngine.ts`) replaces
fixed thresholds with **per-career percentile calibration**: for each
career, 20,000 simulated random playthroughs are run offline, a
"performance index" (reputation-weighted, composure and energy contributing
less) is computed for each, and the resulting percentile checkpoints are
stored in that career's JSON under `"calibration"`. At runtime, your score
*is* your percentile rank against that baseline — "better than N% of people
who tried this shift" — and the ending tier is read off the same rank.

This was verified the way the bug was found: simulating 20,000 random
playthroughs against the finished system gives a mean and median score of
**exactly 50.0**, with **50% of random players scoring below 50**, by
construction. Optimal play scores 99; consistently poor play scores 1. The
number now means what it says.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript, strict mode, Active LTS as of this writing — see "Keeping this current" below)
- **Auth:** [Clerk](https://clerk.com) — hosted sign-in/sign-up UI, session
  management, and edge middleware. (Auth0 was the other option named in the
  brief; see "Using Auth0 instead" below if you'd rather use that.)
- **Database:** PostgreSQL in production, SQLite for zero-setup local dev —
  both through [Prisma](https://prisma.io), so every query is parameterized
  and there is no hand-written SQL anywhere in the app.
- **Styling/animation:** Tailwind CSS, Framer Motion, `lucide-react` (career prop icons on the animated avatar)
- **Validation:** Zod on every API input
- **Optional AI:** OpenAI's Chat Completions API for one dynamic scene per
  career (entirely optional — the app works with zero AI keys configured)
- **Career tooling:** `scripts/validate_careers.py` (structural checks) and
  `scripts/calibrate_careers.py` (Monte Carlo scoring calibration) — run
  both after adding or editing any career JSON

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
├── scripts/
│   ├── validate_careers.py            # Structural checks (run before shipping a career)
│   └── calibrate_careers.py           # Monte Carlo scoring calibration (run after any edit)
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
│   │   ├── CareerAvatar.tsx           # The animated SVG character (mood, tension, ending poses)
│   │   ├── SceneBackdrop.tsx          # Per-scene animated environment badge (commute/rest/alert/...)
│   │   ├── VitalsMonitor.tsx          # ECG signature element + mood face + stat readouts
│   │   ├── SceneView.tsx              # Typewriter narration + staggered, tension-staged choices, randomized-scene auto-advance
│   │   ├── FloatingDeltas.tsx         # Sims-style floating "+10 REP" stat pop-ups
│   │   ├── SimulationClient.tsx       # The game's client-side state machine, per career
│   │   ├── CareerCard.tsx
│   │   └── EndingReport.tsx           # Ending copy, compatibility score, confetti/shake flourish, final avatar pose
│   ├── lib/
│   │   ├── simulationEngine.ts        # Career registry + pure functions: effects, replay, ending, calibrated score
│   │   ├── careerIcons.tsx            # Career id -> prop icon for the avatar
│   │   ├── sceneEnvironments.tsx      # Scene environment tag -> icon + label for the backdrop
│   │   ├── dayCycle.ts                # Scene time -> hour-of-day -> ambient gradient
│   │   ├── mood.ts                    # Stats -> mood + label (drives both the mood face and the avatar's posture)
│   │   ├── validation.ts              # Zod schemas for every API input
│   │   ├── rateLimit.ts
│   │   └── db.ts                      # Prisma client singleton
│   └── data/careers/                  # One JSON per career — see "Adding a new career"
│       ├── trauma-surgeon.json
│       ├── astronaut.json
│       ├── detective.json
│       ├── chef.json
│       ├── pilot.json
│       ├── wildlife-photographer.json
│       ├── investment-banker.json
│       ├── air-traffic-controller.json
│       ├── firefighter.json
│       ├── teacher.json
│       ├── paramedic.json
│       └── software-engineer.json
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
         "environment": "rest", // optional: commute|briefing|rest|alert|social|outdoors|paperwork|work — drives the animated scene badge, defaults to "work" if omitted
         "choices": [
           { "id": "...", "text": "...", "next": "next_scene_id", "effects": { "stress": 5, "energy": -5, "rep": 5, "money": 0, "highlights": 0 } }
         ]
       },
       "a_random_beat": {
         "time": "08:30 AM",
         "text": "...",
         "randomized": true, // optional: UI auto-picks one outcome instead of showing buttons
         "choices": [ /* 2-3 minor, low-stakes outcomes — see "Replay variety" above */ ]
       }
       // ... 14-18 scenes total reads well; include one scene with 4 choices
       // for the "signature decision" moment and the tension-glow treatment
       // (tag it "environment": "alert" too), and at least one randomized
       // beat for replay variety
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
   `/careers` picks it up automatically (the career cards are generated from
   this registry, not a hardcoded list), `/simulation/<career-id>` becomes a
   valid route, and the API route's Zod schema accepts it automatically
   because `saveRunSchema` derives its enum from `CAREER_IDS`.
3. Give it a prop icon: add one line to the `switch` in `src/lib/careerIcons.tsx`
   (pick anything from [lucide.dev](https://lucide.dev/icons)) so the
   animated avatar has something to hold for this career. It falls back to a
   generic briefcase icon if you skip this step, so it's not blocking.
4. Run the two scripts, in this order, from the project root:
   ```bash
   python3 scripts/validate_careers.py   # structural check: dangling links,
                                          # unreachable scenes, duplicate
                                          # choice ids, missing ending keys
   python3 scripts/calibrate_careers.py  # writes this career's "calibration"
                                          # block (see "Fixing the
                                          # compatibility score" above) —
                                          # without this, the new career's
                                          # score will error at runtime
   ```
   Both need to pass/run clean before the career is playable end to end.

No changes to the database schema, auth, API routes, or other UI components
are needed — `career` is already a free-text column validated against the
registry at the API boundary, and every component that displays
career-specific text (`highlightLabel`, endings) reads it from the graph
rather than having it hardcoded.

---

## Future enhancements

Roughly in the order they'd add the most value:

- **More careers.** 12 are built now (the original brainstorm's own
  examples — astronaut, trauma surgeon, investment banker, air traffic
  controller — plus firefighter, teacher, paramedic, and software engineer).
  See "On 'every career in the world'" below for the honest scope on this.
- **Richer randomized events.** Right now each career has exactly one
  randomized beat and "chaos mode" scales existing effect magnitudes. The
  original design doc's Feature 4 envisioned a broader pool of injectable
  events (equipment failure, a walk-in emergency) usable at more points in a
  shift, not just one fixed beat per career. The data model already
  supports adding more `"randomized": true` scenes anywhere in a graph — this
  is more content work than engine work at this point.
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
- **A richer character.** `CareerAvatar.tsx` is deliberately a simple,
  abstract figure (see "The animated character" above) so it scales to any
  number of careers without needing bespoke art. A fuller version — walking
  between locations, more than one pose per mood, actual per-career outfits
  instead of a single prop icon — is a natural next step once there's a
  reason to invest in more elaborate art direction for a specific career.
- **Voice narration, badges/achievements, multiplayer, a full 3D/graphical
  world** — all named in the original brainstorm's "Future Features" list.
  Each is a substantially larger project in its own right (voice needs a TTS
  pipeline and per-scene audio direction; multiplayer needs a real-time
  transport and a shared-state model; a 3D world is closer to a second
  product than an extension of this one) — worth scoping separately once the
  current version has real usage data to justify them.

### On "every career in the world"

Worth being direct about this rather than overselling it: there is no
version of "every career in the world" that gets hand-authored in a chat
session, or realistically by any small team — O\*NET alone lists roughly a
thousand distinct occupations, and this project's bar for a career (15+
scenes, a real signature decision, calibrated scoring, a distinct voice) is
intentionally higher than a one-line description would need. What *is* true
now: adding one is a bounded, mechanical, well-documented process — write
one JSON file, run two scripts, done (see "Adding a new career") — rather
than something that requires touching the engine, the database, or the UI.
That's the honest version of "scales to any career": the infrastructure to
add the 13th, the 50th, or the 200th career is now fully in place and
doesn't get harder as the library grows; actually writing that many is a
content project, not a software one, and would reasonably be its own
multi-session effort (or a good candidate for a contribution process if
this were opened up beyond one person).

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
