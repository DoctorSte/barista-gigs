# Barista Gigs

Marketplace connecting coffee shops with freelance baristas.

- **Web** (`apps/web`) — Next.js
- **Mobile** (`apps/mobile`) — Expo
- **Backend** — Supabase (Auth, Postgres, Storage, Realtime)
- **Payments** — Stripe ($30/mo coffee shop subscription)

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in Supabase + Stripe keys
supabase start
pnpm dev
```

## Scripts

- `pnpm dev` — start web + mobile dev servers
- `pnpm build` — build all apps
