---
name: mycloset-build-and-run
description: >-
  Set up, build, run, and lint the MyCloset Next.js app in mycloset/. Load this
  skill when installing dependencies (npm ci / npm install), starting the dev
  server (npm run dev), producing or verifying a production build (npm run
  build / npm run start), running the linter or type-checker, recreating the
  environment from scratch, or diagnosing install/build/lint errors in
  /home/user/bor/mycloset. Also load it before killing or restarting the dev
  server, or when npm errors mention a missing package.json.
---

# MyCloset: Build and Run

Runbook for the MyCloset app at `/home/user/bor/mycloset` — a Next.js 16.2.6 /
React 19.2.4 / Tailwind CSS 4 (via `@tailwindcss/postcss`) / TypeScript 5 app.
It runs entirely on mock data: **no environment variables, no database, no
external services** (verified: `grep -r "process.env" src/` finds nothing, as
of 2026-08-04).

Every command and output snippet below was executed and captured on
2026-08-04 with Node v22.22.2 and npm 10.9.7.

## The two rules that prevent 90% of failures

1. **All npm commands run in `/home/user/bor/mycloset`.** The repo root
   (`/home/user/bor`) is a large Go project (bor, a Polygon Ethereum client)
   with no `package.json`. Running npm at the root fails immediately:

   ```
   npm error path /home/user/bor/package.json
   npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
   ```

   Bash tool calls do not keep your working directory between calls — prefix
   every command with `cd /home/user/bor/mycloset &&`.

2. **This Next.js version is newer than your training data.** From
   `mycloset/AGENTS.md`: "This version has breaking changes — APIs,
   conventions, and file structure may all differ from your training data.
   Read the relevant guide in `node_modules/next/dist/docs/` before writing
   any code. Heed deprecation notices." The bundled docs are real and current:

   ```
   $ ls node_modules/next/dist/docs/
   01-app  02-pages  03-architecture  04-community  index.md
   $ ls node_modules/next/dist/docs/01-app/
   01-getting-started  02-guides  03-api-reference  04-glossary.md  index.md
   ```

   `01-app/02-guides/` has per-topic files (`environment-variables.md`,
   `debugging.md`, `caching-without-cache-components.md`, ...). Read the
   guide for whatever you are about to touch — do not code Next.js from memory.

## From-scratch setup

| Requirement | State (as of 2026-08-04) |
|---|---|
| Node | **Nothing is pinned** — no `.nvmrc`, no `engines` in `package.json`. Verified working: v22.22.2. Hard floor: Next 16 declares `engines.node >= 20.9.0`. |
| npm | 10.9.7 verified. Any npm bundled with Node >= 20 should work. |
| Env vars | None required. `.env*` is gitignored but no code reads `process.env`. |
| Network | npm registry access needed for install only. |

Install with `npm ci` (a `package-lock.json` exists; `npm ci` gives exact
lockfile versions and a clean slate, and is what you want for reproducing the
environment — use `npm install` only when deliberately changing dependencies):

```
cd /home/user/bor/mycloset && npm ci
```

Verified run: **~33 s**, ends with an npm audit notice you can ignore
("2 moderate severity vulnerabilities" — pre-existing, do not run
`npm audit fix --force`, it applies breaking changes). Result: 447 packages
audited, `node_modules/` ~672 MB. A follow-up `npm install` no-op prints
`up to date, audited 447 packages in 2s` — that is what "already installed"
looks like.

## Command anatomy

All commands assume `cd /home/user/bor/mycloset` first.

| Command | What it does | Verified time | Output lands in |
|---|---|---|---|
| `npm run dev` | Dev server (Turbopack) on port 3000, hot reload | ready ~0.4 s; first page compile ~4 s | terminal only |
| `npm run build` | Production build + full type-check | ~11 s | `.next/` (~33 MB, gitignored) |
| `npm run start` | Serves the **prior** `npm run build` on port 3000 | ready ~0.2 s | terminal only |
| `npm run lint` | ESLint (flat config, `eslint.config.mjs`) | ~3.4 s | terminal only |
| `npx tsc --noEmit` | Type-check without building | ~4.2 s | terminal only |

### `npm run dev`

```
▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in 347ms
○ Compiling / ...
 GET / 200 in 4.0s (next.js: 3.7s, application-code: 347ms)
```

Pages compile on first visit (that one-time 4 s is normal). Smoke-test with
`curl -s --noproxy localhost http://localhost:3000/` — the `--noproxy
localhost` matters in this environment because `HTTPS_PROXY` is set and will
otherwise swallow localhost requests. **Always kill the dev server when done**
(see "Stopping servers" below — a plain kill of the npm process is not enough).

### `npm run build` — what success looks like

Exact output observed 2026-08-04 (Turbopack; compile 4.4 s, TypeScript 4.8 s,
9/9 static pages, total ~11 s):

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /auth/login
├ ○ /auth/register
├ ƒ /closet/[username]
├ ƒ /listings/[id]
├ ○ /notifications
├ ○ /search
└ ○ /sell

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

That is the passing bar: 9 routes, 7 static (`○`), 2 dynamic (`ƒ`), no errors.
If a route is missing or the table changes shape after your edit, you broke
routing. The build writes to `.next/`, which is gitignored
(`mycloset/.gitignore` line `/.next/`) — never commit it, never hand-edit it;
delete it freely to force a cold build.

### `npm run start`

Requires a prior successful `npm run build` (it serves `.next/`, it does not
compile). Verified: `✓ Ready in 151ms`, then `curl -s --noproxy localhost
http://localhost:3000/` returns HTTP 200.

### `npm run lint` — interpreting the current state

Verified result as of 2026-08-04:

```
✖ 40 problems (0 errors, 40 warnings)
```

exit code 0. **These 40 warnings are pre-existing — they are not caused by
your change. The passing bar is 0 errors** (ESLint exits non-zero on errors).
Breakdown by rule (as of 2026-08-04):

| Count | Rule | Meaning |
|---|---|---|
| 23 | `@typescript-eslint/no-unused-vars` | dead imports/vars in src |
| 14 | `@next/next/no-img-element` | `<img>` instead of `next/image` |
| 3 | `react-hooks/exhaustive-deps` | incomplete hook dep arrays |

Compare your before/after warning **count**: 40 → 40 means you added nothing;
don't chase the pre-existing ones unless asked.

### Type-check without building

`cd /home/user/bor/mycloset && npx tsc --noEmit` — verified: exit 0 in
~4.2 s. Fastest correctness signal while editing; `npm run build` runs the
same check anyway, so a clean `tsc --noEmit` is a good predictor of a clean
build.

## Traps (all personally hit or verified)

1. **Next.js 16 vs training data** — rule 2 above. Read
   `node_modules/next/dist/docs/` first; this is a repo AGENTS.md mandate,
   not a suggestion.
2. **npm at repo root** — rule 1 above. The only `package.json` is
   `mycloset/package.json`.
3. **`.next/` is gitignored** build output — safe to delete, never commit.
4. **Killing the dev/prod server takes two kills.** `next dev` and
   `next start` spawn a detached `next-server` child (reparented to PID 1)
   that survives killing the `npm`/`next` wrapper and keeps port 3000 bound.
   Verified cleanup:

   ```
   pkill -f "next dev"; pkill -f "next-server"
   ```

   Then confirm: `pgrep -f "next[-]server"` prints nothing and
   `curl --max-time 3 --noproxy localhost http://localhost:3000/` fails.
   (The `[-]` bracket stops pgrep from matching your own pgrep command line —
   without it you can chase a "phantom" survivor that is your own shell.)
5. **`HTTPS_PROXY` intercepts localhost curl** — always pass
   `--noproxy localhost` when smoke-testing local servers here.
6. **`npm audit fix --force`** — the audit notice after install tempts it;
   it applies semver-major changes. Don't.

## Environment sanity check (optional script)

`scripts/verify-env.sh` (next to this file) checks Node/npm versions,
`package.json` location, `node_modules` presence, then runs lint. Tested
2026-08-04; passes in ~5 s on a healthy checkout:

```
bash /home/user/bor/.claude/skills/mycloset-build-and-run/scripts/verify-env.sh
```

```
OK   node v22.22.2 (verified with v22.22.2; Next.js 16 requires >= 20.9.0)
OK   npm 10.9.7
OK   app dir /home/user/bor/mycloset (package.json present)
OK   node_modules present (next is installed)
running lint...
OK   lint passed (exit 0). Summary: ✖ 40 problems (0 errors, 40 warnings)
verify-env: all checks passed
```

Exit 0 = build away. Non-zero = fix the printed FAIL line first.

## When NOT to use this skill

- App structure, data flow, component/store contracts → `mycloset-architecture-contract`
- Diagnosing runtime bugs in app behavior → `mycloset-debugging-playbook`
- The Go project at the repo root (bor) → `bor-build-and-test`
- Producing acceptance/QA evidence for a change → `mycloset-validation-and-qa`

## Provenance and maintenance

All facts verified by running the commands on 2026-08-04 (Node v22.22.2,
npm 10.9.7). Volatile facts — Node/npm versions, timings, the 447-package
count, the 40-warning breakdown, the 9-route table — will drift; re-verify
with:

```
node --version && npm --version
cd /home/user/bor/mycloset && npm run lint 2>&1 | tail -3
cd /home/user/bor/mycloset && npm run build 2>&1 | tail -20
cd /home/user/bor/mycloset && npx tsc --noEmit && echo TS-OK
ls /home/user/bor/mycloset/node_modules/next/dist/docs/
grep -rn "process.env" /home/user/bor/mycloset/src/ || echo "still no env vars"
```
