---
name: mycloset-debugging-playbook
description: >
  Symptom-to-root-cause triage for the MyCloset app (mycloset/ — Next.js 16 App
  Router + React 19 + Tailwind 4 + Zustand 5 persist). Load this on ANY MyCloset
  runtime error, hydration warning/mismatch ("Hydration failed", "Text content
  does not match"), blank or half-rendered page, stale/weird UI state after code
  changes, login state not sticking, "use client" / useState-in-Server-Component
  errors, useSearchParams build failures, dynamic route params errors, next/image
  hostname errors, KWD price/rounding bugs, or Tailwind classes not applying.
  Gives the exact error text, one cheap discriminating check, and the fix, with
  file:line references into this repo.
---

# MyCloset Debugging Playbook

Triage guide for `/home/user/bor/mycloset`. Every repo-specific claim below was
verified by reading the code **as of 2026-07-13** and is cited `path:line`
(paths relative to `mycloset/`). Items marked **[generic Next.js/React]** are
framework knowledge, not repo facts.

**When NOT to use this skill:**
- Build/install/dev-server won't start at all → `mycloset-build-and-run`
- "What fields does a Listing have?", mock data / config schema questions → `mycloset-data-and-config-reference`
- Anything on the Go side of the repo → the `bor` skills
- "Is this fix acceptable / done?" → `mycloset-validation-and-qa`

**Jargon, defined once:**
- **SSR / prerender**: Next.js renders every page to HTML on the server first —
  *including* `'use client'` components. The browser then re-runs the same
  components and attaches event handlers to that HTML.
- **Hydration**: that browser-side re-run. React compares its render output to
  the server HTML; any difference = hydration mismatch error.
- **Persist**: Zustand's `persist` middleware saves part of the store to
  `localStorage` and restores ("rehydrates") it on page load. The server has no
  `localStorage`, so server HTML always reflects the *default* state.

---

## First move: one command splits the space

```bash
cd /home/user/bor/mycloset && npx tsc --noEmit
```

- **Errors** → it's a type/shape problem. Fix those first; runtime symptoms are
  often downstream of a bad refactor the compiler already sees.
- **Clean** → it's runtime/config. Use the table below.

Note: `npm run lint` has **40 pre-existing warnings, 0 errors** (as of
2026-07-13). New *warnings* matching that baseline are not your bug; a new
*error* is. Do NOT run `npm run build` / `npm run dev` if another agent owns
the dev server — reason from code and `npx tsc --noEmit`.

---

## Quick index: symptom → entry

| # | SYMPTOM (error text / behavior) | LIKELY CAUSE | DISCRIMINATING CHECK | ENTRY |
|---|---|---|---|---|
| 1 | "Hydration failed because the server rendered HTML didn't match the client" / "Text content does not match" | Zustand persisted auth state read during first render (no hydration guard exists in this repo) | Open the page in an **incognito window**: error gone → persisted state; error remains → time-based rendering (`formatRelativeTime`) | §1 |
| 2 | UI shows old/impossible data; login half-works; crash reading a field of `currentUser` after changing its shape | Stale `localStorage` under key **`mycloset-store`** (persist has **no `version`/`migrate`** — defaults to version 0) | Devtools: `JSON.parse(localStorage.getItem('mycloset-store'))` — compare to current `AuthUser` type | §2 |
| 3 | Build/dev error: "You're importing a component that needs `useState`. This React hook only works in a Client Component…" or same for `useStore`/`useEffect` | New Server Component imports Zustand hooks or React state without `'use client'` | `head -1` the file in the error stack — is `'use client'` the first line? | §3 |
| 4 | `next build` fails: "useSearchParams() should be wrapped in a suspense boundary at page \"/…\"" | New page calls `useSearchParams()` outside `<Suspense>` | Grep the page for `useSearchParams` and `Suspense` | §4 |
| 5 | `params.username` / `params.id` is `undefined`, or error saying `params` is a Promise / must be unwrapped with `React.use()` | Next 16: dynamic route `params` is a **Promise**; code read it synchronously | Check the page's props type: is it `params: Promise<{...}>` consumed via `use(params)`? | §5 |
| 6 | Runtime error: 'Invalid src prop … hostname "images.unsplash.com" is not configured under images in your `next.config.js`' — or lint warning about `<img>` | `next.config.ts` is empty: **no `images.remotePatterns`**; the whole app uses raw `<img>` | Grep `next.config.ts` for `remotePatterns` (there are none) | §6 |
| 7 | KWD amounts off by 0.001, `28.499999999…`, fee splits that don't sum to the price | Raw float arithmetic instead of the repo's mill-rounding (`Math.round(x*1000)/1000`); `formatKWD` masks it in display | `node -e "console.log(0.1+0.2)"` on the suspect expression | §7 |
| 8 | A Tailwind class (esp. `brand-*`, custom animation) silently does nothing | Tailwind 4: theme lives in **`@theme` in `src/app/globals.css`** — there is **no `tailwind.config.js`**; or the class name is built dynamically | Grep `src/app/globals.css` for the token; check the class string is a static literal | §8 |
| 9 | 404 on /likes or /settings from the header/profile menu | Those routes **don't exist** — known gap, links are dead by design (mock app) | `ls src/app` — no `likes/` or `settings/` dirs | §9 |
| 10 | View count jumps by 2 per visit in dev; heart/like state differs between pages | React StrictMode double-effect (dev only); two different sources of truth for "liked" | Prod build increments once; compare `ProductCard.tsx:16` vs raw listing flag | §10 |

---

## §1 Hydration mismatch — Zustand persist is suspect #1

**SYMPTOM** — console error on page load, page may flash logged-out→logged-in:

> Hydration failed because the server rendered HTML didn't match the client. …
> (older phrasing: "Text content does not match server-rendered HTML")

**WHAT THE CODE ACTUALLY DOES (verified):** The store
(`src/store/useStore.ts:99-100, 382-397`) uses `persist` with **no
`skipHydration`, no `onRehydrateStorage`, no `version`, no `migrate`**, and
there are **zero mounted-state guards, `useSyncExternalStore` wrappers, or
`suppressHydrationWarning` anywhere in `src/`** (grep confirms no matches).
Storage is synchronous `localStorage` behind an SSR-safe no-op stub
(`useStore.ts:384-390`). `partialize` persists **only `currentUser` and
`isAuthenticated`** (`useStore.ts:392-395`).

**FAILURE MODE:** With synchronous storage, Zustand rehydrates the store at
module load in the browser — *before* React hydrates **[generic Zustand
behavior]**. So while a user is logged in, `Header.tsx:25,112` renders the
avatar/notifications branch on the client but the server HTML has the
"Log In / Sign Up" branch → mismatch on every full page load. The same applies
to **any new component whose first render depends on `currentUser` or
`isAuthenticated`**. React 19 recovers by re-rendering the client tree, so the
page usually *works* — the error is real, though, and can mask other bugs.

Note the app "gets away with it" today only when logged out (persisted default
`currentUser: null` matches the server's default). Logged-in reloads are the
repro.

**DISCRIMINATING CHECK (one action):** Reproduce, then open the same URL in an
**incognito window** (empty `localStorage`):
- Error gone in incognito → persisted-state mismatch (this entry).
- Error persists in incognito → not persist. Next suspect: time-relative text —
  `formatRelativeTime` (`src/lib/utils.ts:16-26`) renders `Date.now()`-relative
  strings like "3m ago" that can differ between server render and client
  hydration **[generic]**. Third suspect: browser extensions mutating HTML.

(`localStorage.removeItem('mycloset-store')` + reload discriminates the same
way without leaving the window.)

**FIX (pick one, smallest first):**
1. Gate the divergent UI behind a mounted flag in the affected component:
   `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);`
   and render the logged-out/skeleton branch until `mounted`.
2. Store-wide: add `skipHydration: true` to the persist options
   (`useStore.ts:396` area) and call `useStore.persist.rehydrate()` in a
   top-level client effect — bigger blast radius; every consumer then sees
   default state on first paint.

Never "fix" this with `suppressHydrationWarning` on real content — it hides the
class of bug this playbook exists to catch.

---

## §2 Stale persisted state — the `mycloset-store` localStorage key

**SYMPTOM** — after a code change to `AuthUser` or auth logic: crashes like
`Cannot read properties of undefined (reading 'includes')` (e.g.
`currentUser.likedListings` on `useStore.ts:199`), UI showing pre-change data,
login state stuck.

**LIKELY CAUSE (verified):** persist key is **`name: 'mycloset-store'`**
(`useStore.ts:383`) with **no `version` field and no `migrate`** — so the
stored blob is `{"state":{"currentUser":…,"isAuthenticated":…},"version":0}`
and Zustand will happily rehydrate an *old shape* into your *new code*. Only
`currentUser` + `isAuthenticated` are persisted (`useStore.ts:392-395`);
listings/comments/offers re-derive from `src/lib/mockData.ts` on every load, so
they can never be stale — if listings look stale, the bug is elsewhere (§10 or
your derivation).

**DISCRIMINATING CHECK** — paste in the browser devtools console:

```js
JSON.parse(localStorage.getItem('mycloset-store'))
```

If `state.currentUser` is missing a field your new code reads, this is it.

**FIX** — immediate unblock (devtools console):

```js
localStorage.removeItem('mycloset-store'); location.reload();
```

Durable fix when you change the persisted shape: add to the persist options in
`useStore.ts:382-397`:

```ts
version: 1,
migrate: (persisted: any, fromVersion: number) => {
  // map old shape → new shape, or return undefined to drop it
  return persisted;
},
```

Bumping `version` without `migrate` silently discards old state (users get
logged out) — acceptable for this mock app, say so in the PR.

---

## §3 "use client" boundary errors

**SYMPTOM** — dev overlay / build error, exact pattern:

> You're importing a component that needs `useState`. This React hook only
> works in a Client Component. To fix, mark the file (or its parent) with the
> `"use client"` directive.

(Same wording for `useEffect`, and it fires for `useStore` because
`src/store/useStore.ts:1` is itself `'use client'` and calls `create`.)

**LIKELY CAUSE:** a Server Component imported Zustand or hooks. **Verified
inventory:** the ONLY Server Components in this app are
`src/app/layout.tsx` and `src/components/layout/Footer.tsx`. Every page under
`src/app/**/page.tsx` and every other component in `src/components/` starts
with `'use client'`. So this error appears when (a) you add a new page/component
and forget the directive, or (b) you add a `useStore`/hook import to `layout.tsx`
or `Footer.tsx`.

**DISCRIMINATING CHECK:**

```bash
head -1 <file-from-the-error-stack>   # is it 'use client'; ?
```

**RULE for this repo:** anything that touches `useStore`, React hooks, event
handlers, or `window`/`localStorage` needs `'use client'` as **line 1** of the
file (before imports). `layout.tsx` must stay a Server Component (it exports
`metadata`, `layout.tsx:11-15` — `metadata` export + `'use client'` is a build
error **[generic]**); it already composes client children (`Header`, `Toast`,
`OfferModal`) which is fine — Server Components may *render* client ones, they
just can't pass them functions or use their hooks.

---

## §4 useSearchParams needs Suspense

**SYMPTOM** — `next build` fails (dev may only warn):

> useSearchParams() should be wrapped in a suspense boundary at page "/mypage".

**VERIFIED PATTERN:** `/search` does it correctly —
`src/app/search/page.tsx` calls `useSearchParams()` inside an inner
`SearchResults` component (`page.tsx:11-12`) and the default export wraps it in
`<Suspense fallback={…skeleton…}>` (`page.tsx:75-85`). The `FilterSidebar`
sits outside the boundary because it doesn't read search params.

**LIKELY CAUSE:** a new page calls `useSearchParams()` at the top level of the
page component. During prerender the search params aren't known, so Next
requires a Suspense boundary to punch out that subtree **[generic Next.js]**.

**DISCRIMINATING CHECK:**

```bash
grep -n "useSearchParams\|Suspense" src/app/<page>/page.tsx
```

`useSearchParams` present without a `<Suspense>` ancestor in the same page =
this bug.

**FIX:** copy the `/search` structure: move the params-reading JSX into a child
component; wrap that child in `<Suspense fallback={...}>` in the page export.

---

## §5 Dynamic route params are a Promise (Next 16)

**SYMPTOM** — `params.username` / `params.id` is `undefined`; or a type error /
runtime message that `params` is a Promise and must be unwrapped (Next's
message references `React.use()` or awaiting `params`) **[generic Next.js ≥15,
error wording varies by version — see `node_modules/next/dist/docs/`]**.

**VERIFIED PATTERN in this repo** — both dynamic routes are client components
that type params as a Promise and unwrap with React's `use`:

- `src/app/closet/[username]/page.tsx:14-15`:
  `({ params }: { params: Promise<{ username: string }> })` then
  `const { username } = use(params);`
- `src/app/listings/[id]/page.tsx:149-150`: same with `{ id: string }`.

**RULE:** copy that pattern for any new `[param]` route. In a client component:
`use(params)`. In a server component: `async` function + `await params`. Never
`params.foo` directly, and never type it as a plain object — `npx tsc --noEmit`
catches the mistyped version, which is your discriminating check.

Per `mycloset/AGENTS.md`, Next 16 differs from training data — confirm any
params/searchParams API against `node_modules/next/dist/docs/` before coding.

---

## §6 Images: raw `<img>`, no remotePatterns configured

**VERIFIED FACTS:** `next.config.ts:3-5` is empty (`/* config options here */`)
— **no `images` config at all**. There are **zero `next/image` imports** in
`src/`; every image is a raw `<img>` (e.g. `ProductCard.tsx:41-46`,
`closet/[username]/page.tsx:52,63`). Mock data image hosts are exactly two:
**`images.unsplash.com`** and **`i.pravatar.cc`** (dozens of URLs in
`src/lib/mockData.ts`; registration also mints `i.pravatar.cc` avatars at
`useStore.ts:131`).

**SYMPTOM A** — lint warning:
`Warning: Using <img> could result in slower LCP… Use <Image /> from next/image`
(`@next/next/no-img-element`). This is **part of the 40 pre-existing warnings**
— not a regression; don't chase it during unrelated debugging.

**SYMPTOM B** — someone converts to `next/image` and gets a runtime error:

> Invalid src prop (https://images.unsplash.com/…) on `next/image`, hostname
> "images.unsplash.com" is not configured under images in your `next.config.js`

**DISCRIMINATING CHECK:** `grep -n remotePatterns next.config.ts` → empty
confirms the config gap.

**FIX** (only if actually adopting `next/image`) — in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};
```

Otherwise the correct "fix" for Symptom A is: leave it; it's baseline.

---

## §7 Money: KWD has 3 decimals — round at the boundary

**VERIFIED FACTS:**
- Fee model: `PLATFORM_FEE_RATE = 0.20`, `SHIPPING_FEE_KWD = 1.500`
  (`src/lib/mockData.ts:447-448`).
- `calcEarnings` (`mockData.ts:450-454`) is the canonical rounding pattern —
  **mill rounding**: `Math.round(x * 1000) / 1000` on both `platformFee` and
  `sellerEarnings`.
- Display: `formatKWD` (`src/lib/utils.ts:8-14`) uses
  `Intl.NumberFormat('en-KW', { currency: 'KWD', minimumFractionDigits: 3 })` —
  it **rounds for display**, so a stored `5.6999999…` prints as `KWD 5.700` and
  the bug hides until a comparison or sum exposes it.
- Offers display via `amount.toFixed(3)` (`useStore.ts:348`).

**SYMPTOM:** earnings + fee ≠ price; equality checks on computed amounts fail;
values like `0.30000000000000004` appear in state or tests.

**LIKELY CAUSE:** new code does raw float math (`price * 0.2`, `a + b`,
`price - fee`) without mill rounding. Binary floats can't represent most
3-decimal KWD values exactly (`0.1 + 0.2 === 0.30000000000000004`)
**[generic]**.

**DISCRIMINATING CHECK:** evaluate the exact expression in isolation:

```bash
node -e "console.log(<the suspect expression with real numbers>)"
```

**FIX:** route every derived amount through mill rounding — reuse
`calcEarnings` for fee splits, or apply `Math.round(x * 1000) / 1000`
immediately after each arithmetic step. Never compare computed KWD with `===`
without rounding both sides first. Keep display in `formatKWD` — don't
`toFixed` into state.

---

## §8 Tailwind 4: theme lives in CSS, not a config file

**VERIFIED FACTS:** there is **no `tailwind.config.js`/`.ts`** in the repo.
Configuration is CSS-first: `src/app/globals.css:1` is `@import "tailwindcss";`
and `globals.css:3-21` is an `@theme` block defining the `--color-brand-50…950`
palette (used everywhere as `bg-brand-600`, `text-brand-600`, …), `--font-sans`,
and two animations (`--animate-slide-up`, `--animate-fade-in`, keyframes at
`:23-31`). `line-clamp-2/3` are hand-written utilities (`globals.css:51-62`).
PostCSS uses `@tailwindcss/postcss` (`postcss.config.mjs`).

**SYMPTOM:** a class silently has no effect — element renders unstyled.

**TRIAGE (in order):**
1. Custom token (`brand-*`, `animate-slide-up`)? →
   `grep -n "<token>" src/app/globals.css`. Missing = add it to `@theme`;
   creating `tailwind.config.js` will NOT work here and editing one is a
   red flag in review.
2. Dynamically-built class string (`` `bg-${color}-600` ``)? Tailwind only
   generates classes it can see as complete static strings at build time
   **[generic Tailwind]**. Fix: map to full literal class names.
3. Class overridden? Components merge classes via `cn` =
   `twMerge(clsx(...))` (`src/lib/utils.ts:4-6`) — `tailwind-merge` drops the
   *earlier* of two conflicting utilities, so a caller-passed `className` can
   legitimately erase a component default. Check the rendered `class` attribute
   in devtools.

---

## §9 Known dead links (not your regression)

**VERIFIED:** `src/app/` contains only `auth/`, `closet/[username]`,
`listings/[id]`, `notifications/`, `search/`, `sell/`, and `/`. But the UI
links to routes that don't exist:

- `/likes` — Header heart icon, `Header.tsx:126`
- `/settings` — Header profile menu `Header.tsx:172` and own-closet gear button
  `closet/[username]/page.tsx:102`

Clicking them 404s. If a bug report says "liked items page is broken" — the
page was never built. Decide with `mycloset-validation-and-qa` whether building
it is in scope; don't "fix" the 404 by deleting the links without asking.

---

## §10 State weirdness: double view counts and inconsistent hearts

**A. View count +2 in dev.** `listings/[id]/page.tsx:157-159` calls
`incrementViews(id)` in a `useEffect` keyed on `[id]`. React StrictMode
double-invokes effects in development **[generic React 19 dev behavior; Next
enables StrictMode by default]**, so `viewsCount` climbs by 2 per visit in
`next dev` and by 1 in production. Discriminating check: reproduce in a prod
build (or reason from this note). Not a store bug — don't add locks to the
store for it; if it must be fixed, dedupe in the effect (ref guard).

**B. Heart/like state disagrees between views.** Two sources of truth exist:
the per-listing flag `isLikedByCurrentUser` baked into mock data
(`mockData.ts:110,139,226,…`) and the user's `currentUser.likedListings` array
(seeded to `['l2','l5']` on login, `useStore.ts:113`). `filteredListings()`
recomputes the flag from `likedListings` (`useStore.ts:225-228`), but
`getListingsByUser` (`useStore.ts:167-168`) does NOT — the closet page grid
gets raw flags. `ProductCard.tsx:16` and `listings/[id]/page.tsx:155` paper
over this by preferring `currentUser?.likedListings` and falling back to the
raw flag — so **logged-out** users see whatever hearts the mock data hardcodes,
and any new component that reads `listing.isLikedByCurrentUser` directly will
be inconsistent with the rest of the app. RULE: always derive liked state as
`currentUser?.likedListings.includes(id) ?? listing.isLikedByCurrentUser`.

---

## Provenance and maintenance

All repo claims verified 2026-07-13 against the working tree. Re-verify before
trusting after significant changes:

```bash
cd /home/user/bor/mycloset
grep -n "name: '" src/store/useStore.ts                      # persist key (expect 'mycloset-store')
grep -n "version\|migrate\|skipHydration\|partialize" src/store/useStore.ts   # persist options
grep -rn "mounted\|suppressHydrationWarning\|skipHydration" src/  # hydration guards (expect none)
grep -n "Suspense\|useSearchParams" src/app/search/page.tsx  # Suspense pattern intact
grep -n "Promise<{" "src/app/closet/[username]/page.tsx" "src/app/listings/[id]/page.tsx"  # params-as-Promise
grep -n "remotePatterns\|images" next.config.ts              # image config (expect none)
grep -rn "next/image" src/                                   # next/image adoption (expect none)
grep -oh "https://[a-z.]*" src/lib/mockData.ts | sort -u     # image hosts
sed -n '446,454p' src/lib/mockData.ts                        # fee model + calcEarnings rounding
sed -n '1,25p' src/app/globals.css                           # @theme block
ls tailwind.config.* 2>/dev/null                             # expect: no such file
ls src/app                                                   # route inventory (no likes/, no settings/)
grep -rLn "use client" src/app/**/page.tsx src/components/*/*.tsx  # server-component inventory
```

Volatile facts most likely to drift: the persist options (someone may add
`version`/`skipHydration` — §1/§2 change materially), `next.config.ts` gaining
an `images` block (§6), the 40-warning lint baseline, and the dead `/likes`
and `/settings` routes getting built (§9).
