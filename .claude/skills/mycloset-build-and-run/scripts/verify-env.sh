#!/usr/bin/env bash
# verify-env.sh — sanity-check the MyCloset toolchain, deps, and lint state.
# Usage: bash /home/user/bor/.claude/skills/mycloset-build-and-run/scripts/verify-env.sh
# Exit 0 = environment is usable. Non-zero = fix the printed FAIL line first.
set -u

APP_DIR="/home/user/bor/mycloset"
FAILS=0

say()  { printf '%s\n' "$*"; }
ok()   { say "OK   $*"; }
fail() { say "FAIL $*"; FAILS=$((FAILS + 1)); }

# 1. Node present and modern enough (v22 is the verified-working line; nothing is pinned).
if command -v node >/dev/null 2>&1; then
  NODE_V="$(node --version)"
  NODE_MAJOR="${NODE_V#v}"; NODE_MAJOR="${NODE_MAJOR%%.*}"
  if [ "$NODE_MAJOR" -ge 20 ] 2>/dev/null; then
    ok "node $NODE_V (verified with v22.22.2; Next.js 16 requires >= 20.9.0)"
  else
    fail "node $NODE_V is too old — Next.js 16 needs Node >= 20.9.0 (v22.22.2 is the verified version)"
  fi
else
  fail "node not found on PATH"
fi

# 2. npm present.
if command -v npm >/dev/null 2>&1; then
  ok "npm $(npm --version)"
else
  fail "npm not found on PATH"
fi

# 3. Correct working directory exists and has the app's package.json.
if [ -f "$APP_DIR/package.json" ]; then
  ok "app dir $APP_DIR (package.json present)"
else
  fail "$APP_DIR/package.json missing — wrong checkout? npm must run in mycloset/, never at the repo root"
fi

# 4. Dependencies installed.
if [ -d "$APP_DIR/node_modules/next" ]; then
  ok "node_modules present (next is installed)"
else
  fail "node_modules missing or incomplete — run: cd $APP_DIR && npm ci"
fi

# 5. Lint (only if everything above passed; ~3-4 s).
if [ "$FAILS" -eq 0 ]; then
  say "running lint..."
  LINT_OUT="$(cd "$APP_DIR" && npm run lint 2>&1)"
  LINT_RC=$?
  SUMMARY="$(printf '%s\n' "$LINT_OUT" | grep -E '✖|error|warning' | tail -1)"
  if [ "$LINT_RC" -eq 0 ]; then
    ok "lint passed (exit 0). Summary: ${SUMMARY:-no problems reported}"
    say "     (warnings are pre-existing; 0 errors is the passing bar — see SKILL.md)"
  else
    fail "lint exited $LINT_RC — there are ERRORS, not just warnings. Last line: ${SUMMARY:-unknown}"
  fi
else
  say "skipping lint until the failures above are fixed"
fi

if [ "$FAILS" -eq 0 ]; then
  say "verify-env: all checks passed"
else
  say "verify-env: $FAILS check(s) failed"
  exit 1
fi
