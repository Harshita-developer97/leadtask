# Deployment Guide

LeadFlow deploys as a standard Next.js app on Vercel with a Neon Postgres database. Nothing here is deployed automatically by this repository — follow these steps in your own Vercel/Neon accounts.

## 1. Provision the database (Neon)

1. Create a project at https://neon.tech.
2. Copy the **pooled** connection string (needed for serverless functions) — it looks like `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/leadflow?sslmode=require`.
3. Set it locally in `.env` as `DATABASE_URL` (copy `.env.example` to `.env` first).

## 2. Push the schema and seed data

```bash
pnpm install
pnpm db:push      # creates all tables from prisma/schema.prisma
pnpm db:seed       # creates admin@example.com / member@example.com + demo leads
```

## 3. Generate an Auth.js secret

```bash
openssl rand -base64 32
```

Put the result in `.env` as `AUTH_SECRET`.

## 4. Run locally

```bash
pnpm dev
```

Visit `http://localhost:3000`, log in with the seeded admin or member account, and confirm the dashboard loads.

## 5. Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, "Add New Project" → import the repo.
3. Under **Environment Variables**, add:
   - `DATABASE_URL` — the same Neon pooled connection string
   - `AUTH_SECRET` — the value generated above
   - `NEXTAUTH_URL` — your production URL, e.g. `https://leadflow.vercel.app`
4. Set the build command to `pnpm build` (Vercel detects this automatically for Next.js).
5. Deploy. Vercel will run `next build`, which fails the build on any TypeScript or ESLint error — this is intentional (`next.config.mjs` has both checks turned on).
6. After the first deploy, run `pnpm db:seed` **once** against production (e.g. from your local machine with `DATABASE_URL` pointed at the Neon prod branch) to create the demo accounts.

## 6. Post-deploy checklist

- [ ] `/` loads the public marketing site and the lead form submits successfully
- [ ] `/login` works with both seeded accounts
- [ ] A Member cannot open `/dashboard/users` or `/dashboard/analytics` (redirected)
- [ ] An Admin can create, assign, and delete a lead
- [ ] Dragging a card on `/dashboard/pipeline` updates its status and appears in the lead's activity tab

## Notes on scaling the rate limiter

`lib/rate-limit.ts` uses an in-memory map, which works for a single long-running process but **will not** share state across Vercel's serverless function instances. For real production traffic on the public lead form, swap it for `@upstash/ratelimit` + Upstash Redis:

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
});
```

The call site in `app/api/public/lead/route.ts` stays the same shape (`isRateLimited(ip, opts)` → `await ratelimit.limit(ip)`), so this is a small, contained change.
