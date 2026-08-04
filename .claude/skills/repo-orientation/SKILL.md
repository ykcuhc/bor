---
name: repo-orientation
description: >-
  Entry point and router for the bor + MyCloset monorepo. Load this FIRST when:
  starting any session in this repo; you are unsure which project (Go
  blockchain vs Next.js marketplace) a task belongs to; the user asks "what is
  this repo" / "how is this organized"; you need to know which sibling skill to
  load for a task; or you are maintaining docs of record (CLAUDE.md, AGENTS.md,
  the .claude/skills library itself). Covers repo map, skill routing table,
  house rules, and doc/skill-writing style.
---

# Repo Orientation: Two Projects in One Repo

Read this before touching anything. This repository at `/home/user/bor` is **two unrelated projects sharing one git history**. Most mistakes here come from assuming it is one project.

## The two projects (as of 2026-07-13)

| | Project A: "bor" | Project B: "MyCloset" |
|---|---|---|
| What | Fork of `maticnetwork/bor` — Polygon/Matic's fork of go-ethereum (an Ethereum blockchain client written in Go). A "fork" here means a copied codebase that diverged: upstream geth code plus Matic-specific additions. | Poshmark-style social marketplace web app for Kuwait (KWD currency, 3 decimal places). |
| Where | Repo root: `consensus/`, `core/`, `eth/`, `cmd/`, etc. | Entirely inside `mycloset/`. |
| Stack | Go. Module name is `github.com/ethereum/go-ethereum` (NOT bor — imports use the geth path). `go.mod` says `go 1.15`; installed Go is 1.24.7; CI (`.github/workflows/ci.yml`) pins Go 1.15.5. | Next.js 16.2.6, React 19.2.4, Tailwind 4, Zustand 5 (a small React state library) with persist. |
| State | Frozen at ~geth v1.10.3 (May 2021). Builds and consensus tests pass on Go 1.24 with caveats (see bor-build-and-test). | Frontend-complete on mock data (`mycloset/src/lib/mockData.ts`). A complete but **unwired** Supabase Postgres schema sits at `mycloset/src/lib/schema.sql` (8 tables, count-sync triggers, RLS policies). No supabase dependency in `package.json` yet. |
| History | Original repo content. | Added 2026-05-31 by a Claude session (commit `1bb95c3`), merged via PR #2 (`a7fbc70`, 2026-06-01). |

Jargon, defined once:
- **geth** — go-ethereum, the reference Ethereum client in Go.
- **Heimdall** — Polygon's validator/checkpoint service; bor's consensus code calls it over HTTP (`consensus/bor/bor.go` has `HeimdallClient`).
- **Supabase** — hosted Postgres with auth/storage APIs; MyCloset's intended backend.
- **RLS** — Row Level Security, Postgres per-row access policies (used in `schema.sql`).
- **Poshmark** — a US social marketplace for second-hand fashion; MyCloset copies its model.

## Repo map

| Path | What it is | Touch? |
|---|---|---|
| `consensus/bor/` | Matic-specific consensus engine (the reason this fork exists) | Yes — this is bor-specific code |
| `tests/bor/` | Matic-specific integration tests | Yes |
| `cmd/utils/bor_flags.go` | Matic-specific CLI flags | Yes |
| `params/config.go` (`BorConfig`) | Matic chain config struct | Carefully — mixed upstream/fork file |
| Everything else at root (`core/`, `eth/`, `les/`, `p2p/`, `miner/`, `trie/`, `swarm/`, `mobile/`, ...) | Upstream go-ethereum v1.10.3 code | Effectively read-only — see House Rules |
| `Makefile` | `make bor` builds; `make test` runs only the two bor packages | Read; don't rewrite |
| `.github/workflows/` | CI pinned to Go 1.15.5 | Don't touch without owner sign-off |
| `mycloset/` | The entire MyCloset app (self-contained, own `package.json`) | Yes — main active work area |
| `mycloset/CLAUDE.md` | Just `@AGENTS.md` (a pointer) | Maintain per house style below |
| `mycloset/AGENTS.md` | Warns: Next.js 16 differs from training data — read `node_modules/next/dist/docs/` before writing Next code. Obey it. | Maintain |
| `.claude/skills/` | House skill library (this file and siblings) | Yes — one skill per topic |
| `.agents/skills/` + `skills-lock.json` | Vendored third-party Supabase skills (`supabase`, `supabase-postgres-best-practices`), installed via `npx skills add` | Don't hand-edit; managed by the skills tool |
| `docs/`, `README.md` | Upstream geth/bor docs | Read-only reference |

## Routing table

Load exactly the sibling skill(s) that match the task, then work from there. All live in `/home/user/bor/.claude/skills/`. (Re-verify the list exists with `ls /home/user/bor/.claude/skills` — siblings are being authored as of 2026-07-13 and any not yet present are pending, not lost.)

| Skill | Load when... |
|---|---|
| `mycloset-architecture-contract` | Changing MyCloset's structure: routes, components, store shape, types — the invariants that must hold. |
| `mycloset-build-and-run` | Building, linting, or running MyCloset locally (`npm run build/lint/dev`), or a build breaks. |
| `mycloset-debugging-playbook` | A MyCloset bug: hydration errors, Zustand persist issues, Next.js 16 surprises. |
| `mycloset-data-and-config-reference` | You need the mock-data shapes, `schema.sql` contents, config files, or KWD/currency rules. |
| `marketplace-domain-reference` | Domain questions: offers, orders, likes, follows, closets — what a marketplace feature should do. |
| `mycloset-supabase-campaign` | Wiring MyCloset to Supabase (the current hardest live problem): auth, DB, replacing mock data. |
| `mycloset-validation-and-qa` | Verifying MyCloset work: what to check, lint/build gates, manual QA passes. |
| `bor-build-and-test` | Building the Go tree (`make bor`) or running its tests, including Go 1.24 linker workarounds. |
| `bor-consensus-reference` | Understanding `consensus/bor/`: spans, snapshots, validators, Heimdall interaction. |
| `bor-failure-archaeology` | A Go-side failure that smells historical: old toolchain, frozen deps, known-broken paths. |
| `bor-fork-change-control` | Any edit to the Go tree — rules for keeping fork changes isolated from upstream code. |
| `research-frontier` | Open questions and candidate ideas not yet proven — what we don't know yet. |
| `research-methodology` | How to investigate in this repo: verification standards, evidence rules, writing up findings. |

## House rules

Rules 1, 2, and the ambition/weighting assumptions below are **inferred from repo history, not user-confirmed**. Treat as defaults; escalate to the owner before violating.

1. **Upstream go-ethereum code is effectively read-only.** Bor-specific changes stay in bor-specific files (`consensus/bor/`, `tests/bor/`, `cmd/utils/bor_flags.go`, the `BorConfig` block in `params`). Before editing anything else in the Go tree, load `bor-fork-change-control`. (Inferred: the fork's own commits confine themselves this way.)
2. **MyCloset stays self-contained under `mycloset/`.** No imports, build coupling, or shared config with the Go tree in either direction. (Inferred: PR #2 added it as a fully isolated subtree.)
3. **Verify commands against the repo before documenting them.** Run the command (or at minimum confirm the file/target exists) before writing it into any doc or skill. Never document from memory.
4. **Skills live in `.claude/skills/`, one home per fact.** Each fact is documented in exactly one skill; other skills link to it by name instead of restating it. Vendored third-party skills live in `.agents/skills/` and are not hand-edited.

## Docs-and-writing: maintaining the docs of record

This skill owns the style for CLAUDE.md, AGENTS.md, and the skill library itself.

- **Imperative runbook voice.** "Run X. Check Y." Not "one could consider...".
- **Date-stamp volatile facts.** Anything that can drift (versions, test results, what's unwired) gets "as of YYYY-MM-DD".
- **Provenance sections.** Every skill ends with one-line re-verification commands for its volatile claims.
- **One home per fact.** Before adding a fact, check whether a sibling skill already owns it; if so, reference, don't duplicate.
- **Never oversell.** Unproven things stay labeled "open" or "candidate". A command you didn't run is labeled "reported, not re-verified".
- **Audience is a zero-context mid-level engineer or small model.** Define jargon once, prefer tables and checklists, make every command copy-pasteable with absolute paths.
- `mycloset/CLAUDE.md` stays a one-line `@AGENTS.md` pointer; content goes in AGENTS.md or a skill.

## Unresolved questions for the human owner

These were **assumed, not answered**. Record answers here when the owner responds; until then the assumptions below are in force.

| Question | Current assumption (unconfirmed) |
|---|---|
| Scope weighting between the two projects? | Both in scope, weighted heavily toward MyCloset; the Go tree is maintenance-only. |
| Hardest live problem? | Wiring MyCloset to Supabase (schema exists, nothing connected). |
| Unwritten rules we should know? | None captured beyond the inferred house rules above. |
| Ambition level for MyCloset? | Best-in-class regional (Kuwait/Gulf) marketplace, not a demo. |

## When NOT to use this skill

Any task-specific work. Once you know which project and task type you have, go straight to the routed sibling skill and follow it — do not use this file as a substitute for the specialist skill's detail.

## Provenance and maintenance

All facts above verified directly against the repo on 2026-07-13 unless marked inferred/reported. Re-verify before trusting:

- Two-projects layout: `ls /home/user/bor /home/user/bor/mycloset`
- MyCloset history: `git -C /home/user/bor log --oneline -5` (expect `a7fbc70` merge of PR #2, `1bb95c3` MyCloset add)
- Module name / Go version: `head -3 /home/user/bor/go.mod` and `go version`; CI pin: `grep go-version /home/user/bor/.github/workflows/ci.yml`
- Make targets: `grep -A3 '^bor:\|^test:' /home/user/bor/Makefile`
- Bor tests: `cd /home/user/bor && go test ./consensus/bor/` (passes as of 2026-07-13); `go test ./tests/bor/` fails to link on Go 1.24 (`memsize: invalid reference to runtime.stopTheWorld`) but passes with `go test -ldflags=-checklinkname=0 ./tests/bor/` (both reproduced 2026-07-13)
- MyCloset stack: `grep '"next"\|"react"\|"zustand"\|tailwindcss' /home/user/bor/mycloset/package.json`
- Supabase unwired: `grep -i supabase /home/user/bor/mycloset/package.json` (expect no dependency); schema: `grep -ci 'create table' /home/user/bor/mycloset/src/lib/schema.sql` (expect 8)
- Build/lint health ("build passes, 9 routes; lint 0 errors / 40 warnings" — reported 2026-07-13, re-run to confirm): `cd /home/user/bor/mycloset && npm run build && npm run lint` (do not run builds while parallel agents are active)
- Routing table vs reality: `ls /home/user/bor/.claude/skills`
- Vendored skills: `ls /home/user/bor/.agents/skills && cat /home/user/bor/skills-lock.json`
