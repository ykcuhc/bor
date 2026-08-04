---
name: marketplace-domain-reference
description: >-
  Business-domain reference for MyCloset (Poshmark-style social resale
  marketplace for Kuwait). Load BEFORE implementing or changing any business
  behavior: offers/negotiation, fees/earnings, orders/checkout, likes/comments/
  shares/follows, listing status (available/sold/reserved), condition grades
  (NWT/NWOT/etc.), currency display or KWD math, notifications, or the sell
  flow. Also load when unsure what a domain term means (NWT, closet, counter
  offer, seller earnings) or which parts of the domain are actually implemented
  vs schema-only.
---

# MyCloset Marketplace Domain Reference

MyCloset (repo: `/home/user/bor/mycloset`) is a **social commerce resale marketplace for Kuwait**, modeled on Poshmark: individual sellers list secondhand items from their "closet," buyers negotiate via time-limited offers, and the platform takes a percentage fee plus flat shipping. All facts below are verified against the repo **as of 2026-08-04**.

**Read this first — implementation status legend.** Every claim in this document carries one of three labels. Do not conflate them; most bugs in this codebase come from assuming schema-only features work.

| Label | Meaning |
|---|---|
| **Implemented** | Wired into the UI/store today (mock-data-backed; there is no live backend) |
| **Schema-only** | Exists in `src/lib/schema.sql` and/or `src/types/index.ts` but no runtime code reads or writes it |
| **Industry context** | General marketplace knowledge, **not encoded in this repo** — background only |

The app runs entirely on seed data (`src/lib/mockData.ts`) and a Zustand store (`src/store/useStore.ts`). `src/lib/schema.sql` is the target Supabase schema; nothing executes against it yet. Only `currentUser` and `isAuthenticated` persist to localStorage (`partialize` in useStore.ts) — all listings, offers, and comments reset to seed on reload.

## 1. The social-commerce model

A **closet** is a seller's public profile page (`src/app/closet/[username]/page.tsx`) showing their listings, follower counts, ratings, and sold count. Selling and socializing are the same surface: engagement drives sales.

**Demand signals** are likes, comments, shares, follows, and views. Counts are **first-class denormalized columns** on `listings` (`likes_count`, `comments_count`, `shares_count`, `views_count` in schema.sql; camelCase in `src/types/index.ts`) rather than computed aggregates, because the feed sorts by them (`most_liked` sort in `filteredListings()`, useStore.ts) and cards render them on every tile. The schema keeps them in sync with DB triggers `trg_likes_count` / `trg_comments_count` (schema.sql lines 74–115) — those two only; there is no trigger for shares or views.

Signal-by-signal reality:

| Signal | Status | Where |
|---|---|---|
| Like (toggle, count +/-, per-user liked set) | Implemented | `toggleLike` in useStore.ts; heart UI in `src/components/listing/ProductCard.tsx` and listing detail page |
| Comment (with `@mention` parsing via regex `/@(\w+)/g`) | Implemented | `addComment` in useStore.ts; increments `commentsCount` |
| Follow/unfollow | Implemented (one-sided) | `followUser`/`unfollowUser` update only the current user's `followingIds`/`followingCount`; the target's `followersCount` is never touched |
| View count | Implemented | `incrementViews` fires on listing-detail mount (`src/app/listings/[id]/page.tsx` useEffect) |
| Share | **Count is schema-only** | Share buttons in ProductCard.tsx and the detail page copy the URL to clipboard and toast "Link copied!" — they never increment `sharesCount` |

**Industry context, not encoded in this repo:** Poshmark's core growth loop is "sharing" listings to followers' feeds and virtual "Posh Parties"; MyCloset has no feed-resharing or party mechanic — share is just a link copier.

## 2. Item taxonomy

**Categories — exactly 8** (verify in `src/types/index.ts` `Category` union, schema.sql `item_category` enum, and the `CATEGORIES` arrays in `src/app/sell/page.tsx` and `src/components/listing/FilterSidebar.tsx`; the arrays list them in a different order but the same 8 values):

`Women, Men, Kids, Home, Electronics, Beauty, Pets, Garden`

**Sub-categories** are plain strings on the listing (`subCategory: string`), not an enum. The canonical per-category lists live only in `SUB_CATEGORIES` in FilterSidebar.tsx (e.g. Women includes `Abayas` — a Kuwait-market signal; Kids includes `Pyjamas & Sleepwear`). The sell flow has a `subCategory` field in its state but **renders no input for it** — new listings always get `subCategory: ''`. Seed listings use values matching the filter list, plus `Lip` (Beauty) which is *not* in the filter list, so filtering can silently miss items.

**Sizes**: the `Size` union in types/index.ts is `XXS–XXXL`, numeric `0–16` (even), `One Size`, `Custom` — but `Listing.size` is typed as plain `string`, and seed data uses out-of-union values (`42` for EU shoes, `4T` for kids). The sell page dropdown omits `Custom`; the filter sidebar offers only letter sizes + `One Size`. Treat size as free text with suggested values.

**Condition grades** — 5 values, ordered best to worst. Definitions come from the sell page's `CONDITIONS` array (sell/page.tsx lines 20–26); always define the acronyms for users:

| Grade | Full name | Sell-page description | Pricing implication (industry context, not encoded in this repo) |
|---|---|---|---|
| `NWT` | **New With Tags** | Brand new, tags attached | Commands the highest resale %; can exceed retail for hyped items (seed listing `l4`, Jordan 1s, lists at 320 vs 165 retail) |
| `NWOT` | **New Without Tags** | Never worn, tags removed | Near-NWT pricing, slight discount for unprovable newness |
| `Excellent` | Excellent Condition | Worn once or twice, like new | Typical 40–60% of retail |
| `Good` | Good Condition | Gently used, minor signs of wear | Mid-tier; flaws must be disclosed/photographed |
| `Fair` | Fair Condition | Visible wear, priced accordingly | Deep discount tier |

The only *encoded* condition-dependent behavior is cosmetic: the listing detail page gives NWT/NWOT/Excellent colored badges and expands the acronyms ("✨ New With Tags", "🏷️ New Without Tags") — `src/app/listings/[id]/page.tsx` lines 240–250. Condition never affects fees, sorting, or validation.

## 3. Money: KWD, discounts, fees

### Currency

**KWD (Kuwaiti dinar) has 3 decimal places** (fils = 1/1000 KD) — unusual; most currencies have 2. Never hardcode `.toFixed(2)` or assume cents.

- `formatKWD` (`src/lib/utils.ts`): `Intl.NumberFormat('en-KW', { style: 'currency', currency: 'KWD', minimumFractionDigits: 3 })`. Use it for **all** price display. (Exceptions that bypass it today: OfferModal's submit button and `makeOffer`'s toast use `amount.toFixed(3) + ' KWD'`.)
- Price inputs use `step="0.001"` with a literal `KD` prefix span (sell page, OfferModal).
- **Rounding rule** for any money math: `Math.round(x * 1000) / 1000` (three decimals). Used in `calcEarnings` (mockData.ts) and OfferModal's `minOffer`.
- Schema money columns are `numeric(10,3)`.

### original_price vs listing_price and discount

Every listing carries `originalPrice` (what the seller paid at retail — informational) and `listingPrice` (the actual asking price; **all commerce math uses this**). Minimum listing price is **0.500 KWD** (sell page input `min="0.500"` + `canProceed` check `>= 0.5`).

`getDiscountPercent(original, current)` in utils.ts: returns `0` when `original <= 0` **or** `current >= original`; otherwise `Math.round(((original - current) / original) * 100)`. So above-retail listings (Jordan 1s) show no discount badge and no strikethrough — ProductCard and the detail page also gate the strikethrough on `originalPrice > listingPrice`.

### The fee model — who pays what

Constants in `src/lib/mockData.ts`, mirrored as column comments in schema.sql `orders`:

- `PLATFORM_FEE_RATE = 0.20` — platform takes **20% of sale price** (flat rate at all price points; **industry context, not encoded in this repo:** real Poshmark uses a flat $2.95 under $15 and 20% above).
- `SHIPPING_FEE_KWD = 1.500` — flat shipping, **paid by the buyer on top of the sale price**.

```ts
// mockData.ts — the single source of truth for earnings math
export function calcEarnings(salePrice: number) {
  const platformFee    = Math.round(salePrice * PLATFORM_FEE_RATE * 1000) / 1000;
  const sellerEarnings = Math.round((salePrice - platformFee) * 1000) / 1000;
  return { platformFee, sellerEarnings };
}
```

**Shipping is NOT in `calcEarnings`.** The seller's number never includes shipping; the buyer's number always adds it. The sell page's earnings breakdown (sell/page.tsx lines 342–360) labels it explicitly: `Shipping (buyer pays)`. Precisely who sees what:

| Actor | Sees | Formula | Where |
|---|---|---|---|
| Buyer | Total outlay | `listingPrice + 1.500` (shipping shown as separate "1.500 KWD flat rate" line) | Detail page: "Buy Now · {listingPrice}" button + shipping info box |
| Seller | "You Earn" | `listingPrice − platformFee` (shipping excluded) | Sell flow Pricing + Review steps |
| Platform | Fee | `0.20 × salePrice` | `calcEarnings` |

Worked examples (all values after the ×1000 rounding rule):

| Sale price | Platform fee (20%) | Seller earns | Buyer pays (+1.500 shipping) |
|---|---|---|---|
| 10.000 KWD | 2.000 | **8.000** | 11.500 |
| 18.000 KWD | 3.600 | **14.400** | 19.500 |
| 3.333 KWD | 0.667 | **2.666** | 4.833 |
| 1400.000 KWD | 280.000 | **1120.000** | 1401.500 |

Notes on where the math is (and isn't) surfaced: the sell page computes an unused `const total = listing + SHIPPING_FEE_KWD`; the listing detail page computes `sellerEarnings` at line 173 but never renders it; **OfferModal imports `calcEarnings` and `SHIPPING_FEE_KWD` but uses neither** — despite folklore, there is no earnings breakdown in the offer modal today. When an accepted offer becomes an order, fees should be computed on the **offer amount**, not the listing price (that's what `orders.amount`/`platform_fee` comments imply) — but see §5: that code path doesn't exist yet.

## 4. Offer / negotiation lifecycle

**Statuses** (`offer_status` enum in schema.sql line 128 = `Offer['status']` in types/index.ts): `pending | accepted | declined | expired | countered`.

What is actually implemented (store: `OfferSlice` in useStore.ts; UI: `src/components/ui/OfferModal.tsx`, opened from the listing detail page):

- **Create (implemented):** `makeOffer(listingId, amount, message?)` pushes a `pending` offer with `expiresAt = now + 24h` (useStore.ts line 344), toasts, closes the modal. Offers live only in the in-memory store (`offers: []` initial state — the seed `MOCK_OFFER` in mockData.ts is *not* loaded into it) and are not persisted, so they vanish on reload.
- **Buyer-side validation (implemented, two layers that disagree):** the JS gate `isValid` requires only `0 < amount < listingPrice` (strictly below asking — you cannot "offer" full price). The **70% floor** (`minOffer = Math.round(listingPrice * 0.70 * 1000) / 1000`) is enforced only via the HTML `min` attribute on the number input plus helper text — native form validation blocks sub-70% submits, but the JS never checks it. Don't assume a store-level floor.
- **24-hour expiry (half-implemented):** the deadline is written in two places — schema default `now() + interval '24 hours'` (schema.sql line 138) and the client `Date.now() + 24*60*60*1000` — and the modal warns "Offers expire after 24 hours." But **no code ever reads `expiresAt` or flips a status to `expired`**. Grep confirms `expired` appears only in the two enum declarations. Expiry is declared, never enforced.
- **Respond (store-only):** `respondToOffer(offerId, 'accepted' | 'declined')` exists in the store and just rewrites the status + toasts — but **no component calls it**. There is no seller offers inbox (`src/app` has no offers route), so sellers cannot see or answer offers in the UI at all.
- **Accept does nothing downstream:** accepting an offer does **not** create an order, does not mark the listing `sold`/`reserved`, does not generate a notification. If you build order creation, this is the hook point.
- **Counter-offers (schema-only):** `counter_amount` column / `counterAmount?` field and the `countered` status exist, but no UI or store action sets them. **Industry context, not encoded in this repo:** on Poshmark, a counter restarts the 24h clock and only buyer accept/decline closes it.

## 5. Order lifecycle

**Statuses** (`order_status` enum, schema.sql line 143 = `Order['status']`): `pending → shipped → delivered → completed`, with `disputed` as the off-ramp. Columns carry the full money snapshot (`amount`, `shipping_fee` default 1.500, `platform_fee`, `seller_earnings`) plus `tracking_number`/`shipping_provider`, and RLS restricts reads to buyer or seller (schema.sql line 205).

**Orders are entirely schema-only today (as of 2026-08-04).** No store slice, no seed orders, no orders page. "Buy Now" on the listing detail page just toasts `'Redirecting to checkout...'` and returns (`handleBuyNow`, listings/[id]/page.tsx line 176–180). There is no checkout, no payment, no order record. **Industry context, not encoded in this repo:** in the Poshmark model, funds are escrowed and released to the seller only after delivery confirmation or a 3-day acceptance window — the detail page's static "Returns accepted within 3 days" copy gestures at this, but nothing implements it.

## 6. Listing lifecycle

**Statuses** (`listing_status` enum = `Listing['status']`): `available | sold | reserved`.

- `addListing` (useStore.ts) always creates `status: 'available'` with all counts zeroed; the sell flow is 4 steps (Photos → Details → Pricing → Review, max 8 photos, first photo = cover, title ≤ 80 chars, description ≤ 1500, quantity 1–99).
- **Nothing at runtime ever sets `sold` or `reserved`.** The only sold listing is seed item `l9` (LV Neverfull) hardcoded in mockData.ts. Search filters support `status: 'available' | 'sold'`.
- Sold rendering: ProductCard shows a black overlay + "Sold" pill when `status === 'sold'` (suppressible via the `showSoldBadge` prop, default `true`); the detail page shows a "This item has been sold" banner and hides Buy/Offer buttons; both Buy Now and Make Offer handlers also toast-and-block on sold.
- `reserved` has **no UI treatment anywhere** — cards and the detail page treat it as available. **Industry context, not encoded in this repo:** "reserved" conventionally means held during an active accepted offer/pending payment.

## 7. Notifications taxonomy

**8 types** (`notification_type` enum in schema.sql = `Notification['type']` in types/index.ts):
`new_like, new_comment, new_offer, offer_accepted, offer_declined, new_follower, item_sold, new_share`

**All 8 are seed/render-only.** No store action ever creates a notification — `toggleLike`, `addComment`, `makeOffer`, `respondToOffer`, `followUser` all skip it. The notifications page (`src/app/notifications/page.tsx`) renders `MOCK_NOTIFICATIONS` directly from mockData.ts (bypassing the store), and the header badge count is computed once from seed unread items (`notificationCount` in useStore.ts line 380). "Mark all read" has no handler.

| Type | Intended trigger (recipient) | Reality as of 2026-08-04 |
|---|---|---|
| `new_like` | Someone likes your listing (seller) | Seed only (`n1`); icon+label maps exist for rendering |
| `new_comment` | Comment on your listing (seller) | Render map only, no seed instance |
| `new_offer` | Offer on your listing (seller) | Seed only (`n3`); OfferModal *claims* "The seller will be notified immediately" — it is not |
| `offer_accepted` / `offer_declined` | Seller answered your offer (buyer) | Render map only |
| `new_follower` | Someone followed you | Seed only (`n2`) |
| `item_sold` | Your item was purchased (seller; label: "purchased your item") | Render map only |
| `new_share` | Someone shared your listing (seller) | Render map only; sharing doesn't even increment the count (§1) |

## 8. Kuwait-market specifics: present and missing

Present (implemented):
- Locale `en-KW` in `formatKWD` and all date formatting (utils.ts, closet page).
- 3-decimal KWD everywhere (§3); `KD` input prefixes.
- Kuwait content: seed users located in Kuwait City/Salmiya/Hawalli/Al Jahra; `Abayas` sub-category; "Pricing Tips for Kuwait" box in the sell flow; seed offer message mentions Salmiya pickup (informal local pickup culture — copy only, no pickup feature).

Open gaps (not implemented — treat as future work; cross-reference the `research-frontier` skill if present in `/home/user/bor/.claude/skills/` for prioritization):
- **No Arabic / RTL**: `layout.tsx` hardcodes `lang="en" dir="ltr"`; zero i18n scaffolding.
- **No KNET or any payment integration**: no checkout at all (§5). Industry context, not encoded in this repo: KNET is Kuwait's dominant domestic debit network and table-stakes for local e-commerce; cash-on-delivery is also common in the Gulf.
- **No local shipping/courier integration**: `shipping_provider` is a bare text column.
- Kuwait has no VAT (as of 2026-08-04) — no tax fields exist anywhere, consistent with that (industry context, not encoded in this repo).

## 9. When NOT to use this skill

- **Exact enum values, seed-data records, brand lists, env/config details** → use `mycloset-data-and-config-reference` (if present); this document explains what the values *mean*, not their exhaustive listing.
- **Code structure, file layout, state-management patterns, component conventions** → `mycloset-architecture-contract`.
- **Migrating mock data to Supabase / wiring schema.sql to a live backend** → `mycloset-supabase-campaign` (if present).
- General repo orientation → `repo-orientation`.

## Provenance and maintenance

Every "Implemented"/"Schema-only" claim above was verified by reading the cited files on 2026-08-04. Re-verify before trusting volatile facts:

- Fees/rounding: `grep -n "PLATFORM_FEE_RATE\|SHIPPING_FEE_KWD\|calcEarnings" mycloset/src/lib/mockData.ts`
- Currency/discount: `grep -n "formatKWD\|getDiscountPercent" mycloset/src/lib/utils.ts`
- Enums (categories/conditions/statuses/notification types): `grep -n "create type\|enum" mycloset/src/lib/schema.sql` and `grep -n "export type\|status:" mycloset/src/types/index.ts`
- Offer reality (expiry still unenforced? counter still unbuilt? respondToOffer still uncalled?): `grep -rn "expired\|counterAmount\|respondToOffer" mycloset/src`
- Orders still schema-only: `grep -rn "Order\b\|order_status" mycloset/src --include="*.tsx"` (expect no hits outside types/schema)
- Notifications still seed-only: `grep -rn "MOCK_NOTIFICATIONS\|Notification" mycloset/src/store/useStore.ts`
- Sub-categories/sizes: `grep -n "SUB_CATEGORIES\|SIZES" mycloset/src/components/listing/FilterSidebar.tsx mycloset/src/app/sell/page.tsx`
- i18n gap: `grep -n "lang=\|dir=" mycloset/src/app/layout.tsx`
