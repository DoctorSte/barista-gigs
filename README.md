# Barista Gigs

A two-sided marketplace connecting specialty coffee shops with freelance baristas
("extras") for one-off shifts, city by city.

- **Shops** create a profile, subscribe (€29/mo via Stripe), post gigs, review
  applicants, and message the baristas they accept.
- **Baristas** build a profile (skills, rate, availability, portfolio photos),
  browse open gigs in their city, and apply with a single message.

## Stack

- [Next.js](https://nextjs.org) (App Router, Server Actions, TypeScript)
- [Supabase](https://supabase.com) — Postgres + RLS, Auth, Storage
- [Stripe](https://stripe.com) subscriptions (optional; dev fallback included)
- Tailwind CSS v4, sonner, lucide

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase project values
pnpm dev
```

The database schema lives in `supabase/migrations/` — apply it with
`supabase db push` (or the Supabase dashboard) if you're pointing at a fresh
project.

### Demo data

```bash
pnpm seed:demo
```

Creates two ready-to-use accounts (password `demo-password-123`):

| Role    | Email                        |
| ------- | ---------------------------- |
| Shop    | demo-shop@baristagigs.dev    |
| Barista | demo-barista@baristagigs.dev |

The demo shop has an active subscription and one open gig in Paris.

### Billing

With `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` set,
shops subscribe through Stripe Checkout and the webhook
(`/api/stripe/webhook`) keeps the `subscriptions` table in sync. Without them,
the billing page activates a 30-day dev subscription directly (requires
`SUPABASE_SERVICE_ROLE_KEY`).

Posting gigs is enforced at the database level: the `announcements` insert
policy requires an active subscription row.

## Structure

```
app/            routes (server components) + server actions in app/actions
components/     UI kit (components/ui) and feature components
lib/            supabase clients, auth/city helpers, validation, formatting
proxy.ts        session refresh + auth routing (Next.js proxy/middleware)
supabase/       database migrations (source of truth for the schema)
scripts/        seed-demo.mjs
```
