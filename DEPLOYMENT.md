# Deploying Shiftwork to Vercel

This is the complete, current path from "working on my machine" to "a real
URL other people can use." If you've been following along piecemeal in
chat, this document supersedes all of that — it's the single source of
truth going forward.

**Currently seeing a bare "Internal Server Error" on your deployed URL?**
Jump straight to [Troubleshooting: Internal Server Error](#troubleshooting-internal-server-error).

---

## Prerequisites

- A GitHub account (Vercel deploys from a git repo, not a zip upload)
- A [Vercel](https://vercel.com) account (free tier is fine)
- A [Neon](https://neon.tech) Postgres database (also free tier)
- A [Clerk](https://clerk.com) application (you should already have this from local setup)

---

## Step 1 — Push the project to GitHub

If you haven't already:
```bash
git init
git add .
git commit -m "Initial commit"
```
Create a new repository on GitHub, then follow GitHub's instructions to push
your existing local repo to it (`git remote add origin ...`, `git push -u origin main`).

`.gitignore` already excludes `.env`, `node_modules`, `.next`, and the
local `dev.db` — double check `git status` doesn't show any of those
before your first commit. If it does, something's off with `.gitignore`
and you should stop and fix that before pushing (never commit real secrets).

---

## Step 2 — Create the Neon database

1. Go to [neon.tech](https://neon.tech) → new project (or use Vercel's
   **Storage** tab → **Neon (Postgres)** from the marketplace, which does
   this for you and auto-wires the connection string into Vercel — if you
   do it this way, skip to Step 5 for the `DATABASE_URL` part, it's already
   set).
2. Copy the connection string from the Neon dashboard. It looks like:
   ```
   postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   Keep the whole thing, query parameters included — don't trim anything off it.

---

## Step 3 — Point Prisma at Postgres and create the migration

1. In `prisma/schema.prisma`, set:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In your local `.env` (not `.env.local` — see README if you're unsure why
   that distinction matters), set `DATABASE_URL` to the Neon string from
   Step 2.
3. **If you already have a `prisma/migrations` folder from when this was
   SQLite, delete it first** — a migration history is locked to the
   provider it was created under, and Prisma will refuse to reuse a SQLite
   one against Postgres (error P3019):
   ```bash
   rm -rf prisma/migrations      # macOS/Linux
   Remove-Item -Recurse -Force prisma\migrations   # Windows PowerShell
   ```
4. Create the migration against Neon:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Commit the new `prisma/migrations` folder — it needs to be in git for
   the next step.

---

## Step 4 — Import the project into Vercel

1. [vercel.com/new](https://vercel.com/new) → import your GitHub repo.
2. Vercel auto-detects Next.js. Leave the build settings on their defaults
   unless you have a specific reason to change them.
3. **Don't click Deploy yet** — add the environment variables first (Step 5),
   or your first deploy will fail/crash for exactly the reason covered in
   Troubleshooting below.

---

## Step 5 — Add every environment variable

In the Vercel project → **Settings → Environment Variables**, add all of
these (values from your `.env`, not committed anywhere):

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `DATABASE_URL` | Your Neon connection string from Step 2 |
| `OPENAI_API_KEY` | Optional — only if you want live AI narration |

**This step is almost certainly why you're seeing "Internal Server Error"
right now** — a `.env` file only exists on your own machine; Vercel never
reads it. If any of the Clerk variables are missing, `src/proxy.ts`
(the auth middleware that runs before every single page, including the
homepage) throws on its very first line, which is exactly what produces a
bare, unstyled error page instead of a normal 500 with Next's usual error
UI. See the Troubleshooting section for how to confirm this and fix it on
an already-deployed project.

After adding variables to an *existing* deployment, you must **redeploy**
for them to take effect — Vercel doesn't hot-apply env var changes to a
build that already happened (Deployments tab → ⋯ menu on the latest
deployment → **Redeploy**).

> **Don't add `NODE_ENV` to Vercel**, even though it's in your local
> `.env`. Vercel sets it automatically based on build context, and
> manually overriding it to `"development"` in production breaks real
> things here — the CSP in `next.config.js` stays in its looser dev-mode
> policy (`'unsafe-eval'`, no HSTS), among other side effects. Copy the
> table above, not the whole file.
>
> **Same goes for `DISABLE_CSP_FOR_DEBUGGING`** if you ever add it locally
> to troubleshoot a blank sign-in page (see `SECURITY.md`) — it's a local
> diagnostic-only flag that removes real security headers. Never let it
> reach Vercel's environment variables.

---

## Step 6 — Run the production migration

`next build` (via `npm run build`) runs `prisma generate` but deliberately
**not** `prisma migrate deploy` — see README.md's deploying section for why
running migrations automatically on every build is more risk than it's
worth for a project this size. Run it once yourself, from your own
machine, pointed at the production database:

```bash
DATABASE_URL="<your Neon connection string>" npx prisma migrate deploy
```

(On Windows PowerShell: `$env:DATABASE_URL="<...>"; npx prisma migrate deploy`.)

Re-run this any time you add a new migration later.

---

## Step 7 — Switch Clerk to a production instance

Development Clerk instances (what you've been using locally) have low
usage limits and show a console warning specifically because they're not
meant for real traffic. In the [Clerk dashboard](https://dashboard.clerk.com):

1. Create a **Production** instance for this application.
2. Clerk will walk you through verifying your domain (the `.vercel.app`
   one Vercel gave you, or a custom domain if you've set one up).
3. Copy the **Production** publishable/secret key pair and update
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` in Vercel's
   environment variables (Step 5) — these are different keys from your
   local dev ones. Redeploy after changing them.

---

## Step 8 — Deploy and verify

Click **Deploy** (or **Redeploy** if you already tried once). Once it's
live:

- Visit the URL. Landing page should load.
- Sign up / sign in.
- `/careers` should show all 12 cards.
- Play one through to an ending.
- `npx prisma studio` (locally, pointed at the production `DATABASE_URL`)
  should show the new row.

---

## Troubleshooting: Internal Server Error

A bare, unstyled "Internal Server Error" page — not Next.js's normal
styled error screen — on **every** route including the homepage is the
signature of the edge middleware (`src/proxy.ts`) throwing before any page
even starts rendering. In this project, that middleware's only job is
calling Clerk's `clerkMiddleware()`, so this almost always means a Clerk
environment variable is missing or wrong in Vercel.

**1. Check the actual error.** Don't guess — Vercel logs the real stack
trace: project → **Deployments** tab → click the specific deployment →
**Runtime Logs** (labeled **Functions** in some Vercel UI versions). Visit
your broken URL again in another tab while this is open, and the exact
error will appear here. This is the single most useful thing you can do —
everything below is a guess without it.

**2. Confirm every variable from Step 5's table is actually set**, for the
right environment (Vercel lets you scope variables to
Production/Preview/Development separately — make sure yours are enabled
for **Production** if that's the URL you're testing).

**3. Confirm you redeployed after adding them.** Adding env vars to an
already-created deployment does nothing until you redeploy.

**4. If the log shows a Prisma/database error instead of a Clerk one**,
confirm `DATABASE_URL` in Vercel matches your Neon string exactly (no
stray quotes — Vercel's env var UI doesn't need the surrounding `"..."`
that `.env` files use, unlike a `.env` file) and that you completed Step 6
(the production database needs its tables created via `migrate deploy`
same as local needed `migrate dev`).

**5. If the log shows a Prisma engine/binary error** (something about a
missing query engine or an unsupported platform), confirm
`prisma/schema.prisma`'s `generator client` block includes
`binaryTargets = ["native", "rhel-openssl-3.0.x"]` and redeploy — this
project's schema already has this, but if you edited it locally without
pulling the latest version, that line might be missing.

**6. Still stuck?** Paste the actual error text from Runtime Logs (Step 1)
— "Internal Server Error" alone doesn't have enough information in it to
diagnose further than the above.
