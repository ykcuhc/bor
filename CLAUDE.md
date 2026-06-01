# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing two distinct projects:

1. **Bor** (root) — A Go Ethereum fork implementing the Matic/Polygon protocol. The main binary is `bor` (entry point: `cmd/geth`).
2. **MyCloset** (`mycloset/`) — A Next.js 16 marketplace web app (Poshmark-style resale platform) with no backend integration yet (mock data only).

---

## Bor (Go Ethereum Fork)

### Build & Run

Requires Go 1.14+ and a C compiler.

```bash
make bor          # Build main bor binary → ./build/bin/bor
make bor-all      # Build all utilities (abigen, bootnode, evm, geth, puppeth, rlpdump, clef)
make all          # Full suite
make clean        # Remove build artifacts
make devtools     # Install codegen tools: stringer, go-bindata, gencodec, abigen, solc, protoc
```

### Testing

```bash
make test                                              # Runs bor + tests/bor packages
go test ./consensus/bor/...                            # Single package
go test -run TestName ./consensus/bor/...              # Single test
go test -v -count=1 ./...                              # All packages, no cache
```

### Linting

```bash
make lint   # Uses golangci-lint with config in .golangci.yml
```

Active linters: `deadcode`, `goconst`, `goimports`, `gosimple`, `govet`, `ineffassign`, `misspell`, `unconvert`, `varcheck`. Timeout is 3 minutes. `core/genesis_alloc.go` is excluded.

---

## Bor Architecture

Bor is a fork of go-ethereum. The key divergence is in **consensus**: Bor replaces Ethash (PoW) with a custom PoS algorithm in `consensus/bor/bor.go`.

### Layer Map

| Layer | Package(s) | Role |
|---|---|---|
| CLI | `cmd/geth` | Entry point; `main.go` delegates to `app` with urfave/cli.v1 |
| Consensus | `consensus/bor`, `consensus/clique`, `consensus/ethash` | Pluggable engines; `consensus.Engine` interface |
| Blockchain core | `core/` | State machine, types, VM, raw DB, bloom filters |
| Protocol | `eth/` | Ethereum wire protocol, downloader, fetcher, tracers |
| Networking | `p2p/` | Discovery (v4/v5), RLPX transport, NAT |
| Accounts | `accounts/` | Keystore, ABI binding, USB/Smart Card wallet, external signer |
| Crypto | `crypto/` | secp256k1, BLS12-381, bn256, blake2b, ECIES |
| RPC | `rpc/` | JSON-RPC server (HTTP, WS, IPC) |
| Storage | `ethdb/` | Database abstraction over LevelDB or in-memory |
| Node | `node/` | Lifecycle and service registration |
| Contracts | `contracts/` | On-chain checkpoint oracle |
| Mobile | `mobile/` | Android/iOS SDK bindings |

### Key Patterns

- All consensus engines implement `consensus.Engine` (in `consensus/consensus.go`).
- Logging uses `github.com/ethereum/go-ethereum/log` throughout; never use `fmt.Println` in production paths.
- Serialization uses RLP (not JSON) for wire and storage formats.
- Database access goes through the `ethdb.Database` interface — never write directly to LevelDB.

---

## MyCloset (Next.js Marketplace)

> **Important**: This project uses **Next.js 16**, which has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. APIs, conventions, and file structures may differ from training data.

### Commands

```bash
cd mycloset
npm run dev     # Dev server at http://localhost:3000
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint
```

### Architecture

The app uses the **App Router** (Next.js 13+ style) with all routes under `src/app/`:

| Route | File |
|---|---|
| Home feed | `src/app/page.tsx` |
| Search | `src/app/search/page.tsx` |
| Listing detail | `src/app/listings/[id]/page.tsx` |
| User closet | `src/app/closet/[username]/page.tsx` |
| Sell form | `src/app/sell/page.tsx` |
| Notifications | `src/app/notifications/page.tsx` |
| Auth | `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx` |

### State Management

All client state lives in a single **Zustand** store at `src/store/useStore.ts`, split into slices:

- **AuthSlice** — `currentUser`, `login`, `register`, `logout`, `updateProfile`
- **ListingsSlice** — listings array, filters, `addListing`, `toggleLike`, `filteredListings()`
- **SocialSlice** — comments, follow/unfollow
- **OfferSlice** — offers and negotiation state

The store uses `persist` middleware (localStorage). All client components import from `useStore`.

### Data Layer

Currently **mock data only** — no backend calls. All seed data lives in `src/lib/mockData.ts` (`MOCK_USERS`, `MOCK_LISTINGS`, `MOCK_COMMENTS`, `MOCK_NOTIFICATIONS`). Supabase MCP is configured (`.mcp.json`) for future backend integration.

### Component Conventions

- `'use client'` directive required for any component using hooks or browser APIs.
- Path alias `@/*` maps to `src/*`.
- UI primitives come from **Radix UI** (dialog, dropdown, select, slider, tabs, toast, avatar).
- Styling via **Tailwind CSS 4** + `tailwind-merge`.
- Domain types are centralized in `src/types/index.ts` (`User`, `Listing`, `Offer`, `Order`, `Notification`, `Comment`).

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `make all` then `make test` on every push/PR against ubuntu-latest with Go 1.15.5.
