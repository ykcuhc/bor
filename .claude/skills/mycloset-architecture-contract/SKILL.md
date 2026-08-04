---
name: mycloset-architecture-contract
description: >-
  The "don't break the architecture" contract for MyCloset
  (/home/user/bor/mycloset) — load-bearing design decisions, invariants, and
  known-weak points. Load this BEFORE any structural change: adding routes,
  pages, or store slices; adding dependencies; refactoring src/store/useStore.ts
  or the persist config; touching src/types/index.ts or src/lib/schema.sql;
  changing fee/money logic; or when asked "how is MyCloset structured / how does
  state work / where does data live". Not for build/run problems, schema value
  lookups, business-rule questions, or executing the Supabase migration — see
  "When NOT to use this skill".
---

# MyCloset Architecture Contract

All facts below verified against the code as of **2026-07-13** (repo added
2026-05-31, commit `1bb95c3`). Re-verify with the commands in
[Provenance and maintenance](#provenance-and-maintenance) before trusting
volatile details.

## What this app is

MyCloset (`/home/user/bor/mycloset`) is a Poshmark-style social fashion
marketplace for Kuwait. It is **frontend-complete on mock data**: there is no
backend, no API routes, no database connection. The Zustand store *is* the
backend. Everything runs in the browser; data lives in memory plus one
localStorage key.

Stack (from `package.json`): Next.js 16.2.6 (App Router), React 19.2.4,
Tailwind 4, Zustand 5.0.14 with persist middleware, Radix UI primitives,
lucide-react icons, TypeScript 5. Path alias `@/*` → `./src/*`
(`tsconfig.json`).

**Heed `AGENTS.md`**: this Next.js version may differ from your training data —
read `node_modules/next/dist/docs/` before writing Next-specific code. One
verified example: dynamic-route `params` is a `Promise` unwrapped with React's
`use()` hook (see `src/app/listings/[id]/page.tsx` line 149-150).

## Jargon, defined once

| Term | Meaning here |
|---|---|
| **Zustand** | Minimal React state library. One `create()` call produces a hook (`useStore`) holding all state + actions. |
| **persist middleware** | Zustand add-on that writes selected store state to a storage backend (here: localStorage) and rehydrates it on load. |
| **App Router** | Next.js routing via `src/app/**/page.tsx` files. Components are React Server Components unless the file starts with `'use client'`. |
| **hydration** | React attaching to server-rendered HTML on the client. If client-side state differs from what the server rendered, React warns/repaints ("hydration mismatch"). |
| **RLS** | Row Level Security — Postgres per-row access policies, used by Supabase to enforce auth at the database layer. Present in `src/lib/schema.sql` but **not wired to anything**. |

## Layering contract

Dependency direction is strictly one-way. Verified via the import graph
(every `from '@/...'` import in `src/`):

```
src/types/index.ts        (domain types — imports nothing from the app)
        ↓
src/lib/                  (mockData.ts, utils.ts — imports only @/types)
        ↓
src/store/useStore.ts     (imports @/types and @/lib/mockData)
        ↓
src/components/           (layout/, listing/, ui/ — import store, lib, types)
        ↓
src/app/                  (routes — import components, store, lib, types)
```

Rules that must hold:

- [ ] `src/types/index.ts` never imports from lib, store, components, or app.
- [ ] `src/lib/*` never imports from store, components, or app.
- [ ] `src/store/useStore.ts` never imports from components or app.
- [ ] Components never import from `src/app/`.
- [ ] `src/lib/schema.sql` is data, not code — nothing imports it; keep it that way.
- [ ] New domain types go in `src/types/index.ts`, nowhere else. Do not define
      a second `Listing`/`Offer`/etc. shape locally in a component.

`src/lib/schema.sql` is a complete Supabase Postgres schema (users, listings,
likes, comments, follows, offers, orders, notifications; count-sync triggers;
RLS policies). It is **unwired** — reference material and migration target, not
running infrastructure.

## The single-store decision

All client state lives in **one** Zustand store: `src/store/useStore.ts`
(a `'use client'` module). It composes five slices as TypeScript interfaces
merged into one `Store` type: `AuthSlice`, `ListingsSlice`, `SocialSlice`,
`OfferSlice`, `UISlice` (`type Store = AuthSlice & ListingsSlice & SocialSlice
& OfferSlice & UISlice`, line 84). One `create<Store>()(persist(...))` call.

Why it is this way: with no backend, the store is the single source of truth
for "server" data (listings, comments, offers) *and* UI state (modals, toasts).
Store actions (`login`, `addListing`, `toggleLike`, `makeOffer`, ...) stand in
for API calls — several carry comments like "replace with Supabase
signInWithPassword" (line 107).

Persistence facts (verified, lines 382-396):

| Fact | Value |
|---|---|
| localStorage key | `'mycloset-store'` |
| Storage | `createJSONStorage` → `localStorage` on client; a no-op stub (`getItem: () => null`) during SSR |
| `partialize` | Persists **only** `currentUser` and `isAuthenticated` |
| `skipHydration` | **Not used** — rehydration happens automatically at store creation |
| Mounted/hydration gate in components | **None found** (no `skipHydration`, no `hasHydrated` pattern anywhere in `src/`) |

Implications you must not break (and must not accidentally "fix" without
understanding):

1. **Only auth state survives a reload.** Listings, likes counts, comments, and
   offers reset to `MOCK_LISTINGS`/`MOCK_COMMENTS`/`[]` on every page load
   because `partialize` excludes them. Liked-listing IDs survive only because
   they live *inside* `currentUser.likedListings`. If you add a slice and want
   it persisted, you must add its keys to `partialize` — and accept that
   persisted mock-shaped data becomes a migration liability later.
2. **Auth is fake.** `MOCK_PASSWORDS` is a hardcoded email→password record in
   `useStore.ts` (lines 92-97, all `password123`); `login` compares strings
   client-side after a 500 ms fake delay. `register` creates a user in memory
   only. Anyone can "authenticate" by editing localStorage.
3. **Data is per-browser (per-tab-session for most of it).** Two browsers see
   different worlds. There is no sync.
4. **Latent hydration risk.** The server renders with `currentUser: null`; on
   the client, persist rehydrates synchronously from localStorage. A logged-in
   user can therefore get server HTML (logged-out header) that differs from the
   first client render. No `skipHydration`/mounted-gate mitigates this today.
   If you see hydration warnings around auth-dependent UI, this is why — fix it
   with the standard Zustand `skipHydration` + manual `rehydrate()` pattern,
   not by forking the store.

Do **not** split this into multiple stores or introduce Redux/Context state
containers. The single store is the deliberate seam for the Supabase migration
(see below).

## Server/client component split

Verified `'use client'` directives: **all 8 route pages are client
components**, plus `Header`, `FilterSidebar`, `ProductCard`, `OfferModal`,
`Toast`, and `useStore.ts` itself. Only `src/app/layout.tsx` and
`src/components/layout/Footer.tsx` are server components.

| Route | File | Kind |
|---|---|---|
| `/` | `src/app/page.tsx` | client |
| `/auth/login` | `src/app/auth/login/page.tsx` | client |
| `/auth/register` | `src/app/auth/register/page.tsx` | client |
| `/closet/[username]` | `src/app/closet/[username]/page.tsx` | client, dynamic segment |
| `/listings/[id]` | `src/app/listings/[id]/page.tsx` | client, dynamic segment |
| `/notifications` | `src/app/notifications/page.tsx` | client |
| `/search` | `src/app/search/page.tsx` | client |
| `/sell` | `src/app/sell/page.tsx` | client |

This is forced by the architecture: every page reads the client-only store, so
every page must be a client component. Consequences:

- Do not add `async` server-component data fetching to these pages while the
  store is the data source — you cannot call `useStore` from a server component.
- The dynamic pages take `params: Promise<{...}>` and unwrap with `use(params)`
  (Next 16 App Router convention). Follow that pattern for any new dynamic route.
- `layout.tsx` must stay a server component (it exports `metadata`); it may
  render client components (`Header`, `Toast`, `OfferModal`) as children, which
  is fine.
- Root layout hardcodes `<html lang="en" dir="ltr">` — see weak points.

## Type parity invariant

`src/types/index.ts` (TS, camelCase) and `src/lib/schema.sql` (Postgres,
snake_case) describe the same domain and **must stay in lockstep**. If you
change one, change the other in the same commit. Verified parity as of
2026-07-13:

| Domain value set | `src/types/index.ts` | `src/lib/schema.sql` |
|---|---|---|
| Condition (5) | `'NWT' \| 'NWOT' \| 'Excellent' \| 'Good' \| 'Fair'` (line 3) | `item_condition` enum (line 32) — identical |
| Category (8) | `Women, Men, Kids, Home, Electronics, Beauty, Pets, Garden` (lines 5-13) | `item_category` enum (line 33) — identical, same order |
| Listing status (3) | `'available' \| 'sold' \| 'reserved'` (line 66) | `listing_status` enum (line 31) — identical |
| Offer status (5) | `pending, accepted, declined, expired, countered` (line 90) | `offer_status` enum (line 128) — identical |
| Order status (5) | `pending, shipped, delivered, completed, disputed` (line 107) | `order_status` enum (line 143) — identical |
| Notification type (8) | union of 8 literals (lines 117-125) | `notification_type` enum (lines 162-165) — identical |

Known, intentional asymmetries (do not "fix" by deleting either side):

- TS interfaces embed denormalized join data (`Listing.seller`, `Comment.author`,
  `Offer.buyer`, `Order.listing`, `Notification.actor` as `Pick<User, ...>`) and
  the virtual field `Listing.isLikedByCurrentUser` — these are view-model
  conveniences with no schema column. In Supabase they become query joins.
- TS has a `Size` union type; the schema stores `size` as plain `text`. TS `User.joinedAt`
  maps to schema `users.created_at`.
- The schema has no password column anywhere — auth is delegated to Supabase
  Auth by design.
- `Order`/`orders` exists in types and schema but has **no store slice and no
  UI** yet (nothing outside `types/index.ts` and `schema.sql` references it).
  It is forward-provisioning, not dead code to delete.

## Money invariants

Currency is **KWD with 3 decimal places, everywhere**. Kuwait's dinar has 1000
fils per dinar — 2-decimal assumptions are bugs.

- Formatting: `formatKWD()` in `src/lib/utils.ts` (lines 8-14) uses
  `Intl.NumberFormat('en-KW', { style: 'currency', currency: 'KWD',
  minimumFractionDigits: 3 })`. All price display must go through it (one known
  exception: `makeOffer`'s toast uses `amount.toFixed(3)`, `useStore.ts` line 348).
- Fee constants: `src/lib/mockData.ts` lines 447-448 —
  `PLATFORM_FEE_RATE = 0.20` (20% of sale price, Poshmark model) and
  `SHIPPING_FEE_KWD = 1.500` (flat, buyer pays).
- Fee math: `calcEarnings(salePrice)` (`mockData.ts` lines 450-454) returns
  `platformFee = round3(salePrice * 0.20)` and
  `sellerEarnings = round3(salePrice - platformFee)`, where `round3(x)` is
  `Math.round(x * 1000) / 1000` — **round half up to 3 dp**. Never reimplement
  this math inline; import `calcEarnings`.
- Schema agreement: `orders` table (`schema.sql` lines 145-159) uses
  `numeric(10,3)` for all money columns, `shipping_fee` defaults to `1.500`,
  and comments pin `platform_fee` = 20% of amount and
  `seller_earnings = amount - platform_fee`. Buyer total = `amount +
  shipping_fee`; shipping does not enter the fee/earnings calculation
  (confirmed in `src/app/sell/page.tsx` lines 280-281).

Invariant: `sellerEarnings + platformFee === amount` (to 3 dp). If you change
the fee model, change `PLATFORM_FEE_RATE`/`calcEarnings`, the `orders` table
comments/defaults in `schema.sql`, and the earnings breakdowns rendered in
`src/app/sell/page.tsx` and `src/app/listings/[id]/page.tsx` together.

## The mock-data seam (Supabase migration boundary)

The planned migration replaces mock data with Supabase. **The seam is the store
actions**: `login`, `register`, `addListing`, `toggleLike`, `addComment`,
`followUser`, `makeOffer`, `respondToOffer`, etc. become async calls to
Supabase; component code should not need to change. Protect that property:

- Components must mutate data **only through store actions** — never by
  importing and editing mock arrays.
- Known seam **leaks** (components importing `@/lib/mockData` directly,
  verified; these will each need rework during migration — do not add more):
  - `src/components/layout/Header.tsx` line 12 — `MOCK_NOTIFICATIONS`
  - `src/app/notifications/page.tsx` line 5 — `MOCK_NOTIFICATIONS` (whole page bypasses the store)
  - `src/app/closet/[username]/page.tsx` line 7 — `MOCK_USERS` (user lookup bypasses the store)
  - Fee constants/`calcEarnings` imports (`OfferModal.tsx`, `sell/page.tsx`,
    `listings/[id]/page.tsx`) are acceptable — they are business constants that
    merely live in `mockData.ts` today; moving them to their own module is a
    safe refactor.
- IDs are `` `u_${Date.now()}` ``/`` `l_${Date.now()}` ``-style strings today;
  the schema uses UUIDs. Do not build logic that parses ID formats. (The `uuid`
  package is in `package.json` but unused in `src/` — assumed
  forward-provisioning.)
- For the migration itself — wiring `schema.sql`, Supabase Auth, replacing
  actions — use the sibling skill **`mycloset-supabase-campaign`**. Do not
  improvise a partial migration from this document.

## Known-weak points (stated plainly)

Do not silently paper over these; do not treat them as load-bearing features
either. All verified 2026-07-13.

1. **No real auth.** Demo accounts with plaintext passwords in client code
   (`useStore.ts` `MOCK_PASSWORDS`); the login page even prints credentials on
   screen (`src/app/auth/login/page.tsx` lines 47-51). Nothing is verified
   server-side. `isAuthenticated` is client-editable localStorage.
2. **No server persistence.** Everything except `currentUser`/`isAuthenticated`
   resets on reload; nothing is shared between users or devices.
3. **Counts are maintained client-side by hand** (`likesCount ± 1`,
   `commentsCount + 1`, `followingCount ± 1` inline in store actions). The
   schema's triggers (`trg_likes_count`, `trg_comments_count`) will own this
   after migration; until then count drift is possible (e.g. `login` hardcodes
   `likedListings: ['l2','l5']` without adjusting those listings' counts).
   `followersCount` of the *target* user is never updated on follow — only the
   follower's `followingCount`.
4. **Offer acceptance is inert.** `respondToOffer` flips offer status and shows
   a toast; it does not mark the listing sold, create an `Order`, or notify
   anyone (`useStore.ts` lines 352-362).
5. **Notifications are static.** UI reads `MOCK_NOTIFICATIONS` directly; user
   actions never generate notifications; `notificationCount` is computed once
   at store creation (`useStore.ts` line 380).
6. **No tests.** No test framework, no test files, no test script in
   `package.json` (scripts: dev/build/start/lint only).
7. **Images are URLs only.** No upload pipeline; `/sell` previews local files
   via object URLs with a comment noting Supabase Storage as the future home
   (`src/app/sell/page.tsx` line 41). Mock images are unsplash/pravatar URLs.
8. **No payment integration.** "Buy" flows stop at UI; no KNET/card/anything.
9. **No Arabic/RTL** despite the Kuwait market: `layout.tsx` hardcodes
   `lang="en" dir="ltr"`; no i18n library; all strings inline English.
10. **Dead link:** login page links to `/auth/forgot`, which has no route.
11. **Latent hydration mismatch** for logged-in users (see single-store
    section) — no `skipHydration` or mounted-gate exists.

## Pre-change checklist

Before merging any structural change, confirm:

- [ ] Layering rules still hold (no upward imports; run the import grep below).
- [ ] Any type-or-enum change is mirrored in **both** `src/types/index.ts` and
      `src/lib/schema.sql`.
- [ ] Money never leaves the `formatKWD` / `calcEarnings` / 3-dp world.
- [ ] New data mutations go through store actions (no new direct
      `MOCK_*` imports in components).
- [ ] New pages that read the store carry `'use client'`; new dynamic routes
      unwrap `params` with `use()`.
- [ ] Nothing new is added to `partialize` without a reason written down.
- [ ] `npx tsc --noEmit` passes.

## When NOT to use this skill

| If the task is... | Use instead |
|---|---|
| Build, dev-server, install, or run problems | `mycloset-build-and-run` |
| Looking up schema columns, config values, env details | `mycloset-data-and-config-reference` |
| Business rules (fees policy, offer lifecycle, marketplace behavior questions) | `marketplace-domain-reference` |
| Executing the Supabase migration (wiring schema.sql, auth, storage) | `mycloset-supabase-campaign` |

(Sibling skills listed as designed; verify they exist in `.claude/skills/`
before delegating — as of 2026-07-13 they were being authored in parallel.)

## Provenance and maintenance

Written 2026-07-13 by direct code inspection; every claim above was verified in
the working tree at that date. Re-verify volatile facts before relying on them:

```bash
cd /home/user/bor/mycloset
# Fee constants and rounding
grep -n "PLATFORM_FEE_RATE\|SHIPPING_FEE_KWD" src/lib/mockData.ts
grep -n -A4 "function calcEarnings" src/lib/mockData.ts
# Enum parity: compare these two outputs by hand
grep -n "create type" src/lib/schema.sql
grep -n "Condition =\|Category =\|status:" src/types/index.ts
# localStorage key + what is persisted
grep -n "name: '\|partialize" src/store/useStore.ts
# Layering violations (should output nothing)
grep -rn "from '@/app\|from '@/components" src/types src/lib src/store
# Seam leaks (components/pages importing mock data directly)
grep -rn "from '@/lib/mockData'" src/app src/components
# Client/server split
grep -rln "'use client'" src/app src/components
# KWD formatting
grep -n -A6 "function formatKWD" src/lib/utils.ts
# Type-check
npx tsc --noEmit
```

Assumptions (labeled): the `uuid` dependency and `Order`/`MOCK_OFFER` being
"forward-provisioning" is inferred from context, not documented anywhere;
sibling skill names are taken from the authoring plan, not from files verified
on disk.
