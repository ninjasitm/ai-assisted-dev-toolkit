#!/usr/bin/env bash
# pre-commit-check.sh — Enforce CHANGELOG hygiene and block forbidden files.
#
# Installed as .git/hooks/pre-commit. Runs before every commit.
# Use `git commit --no-verify` to bypass.
#
# Exit codes:
#   0 — All checks pass
#   1 — One or more checks failed (commit blocked)
#
# Checks:
#   1. CHANGELOG.md  — If substantive files are staged, [Unreleased] must have entries
#   2. Zone.Identifier  — Reject any staged files ending with `:Zone.Identifier`
#   3. Secrets  — Reject staged .env, .env.*, *.key, *.pem files

set -u

# ── Colors (skip if not a terminal) ──────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  NC=''
fi

failures=0

pass_msg() { printf "${GREEN}PASS${NC}  %s\n" "$1"; }
fail_msg() { printf "${RED}FAIL${NC}  %s\n" "$1"; echo "       $2"; ((failures++)); }

# ── Staged file list (Added / Copied / Modified / Renamed) ────────────────────
staged=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
printf "==> pre-commit checks (%s staged file(s))\n\n" "$(echo "$staged" | wc -l)"

# ── Check 1: CHANGELOG hygiene ────────────────────────────────────────────────
# If substantive (non-trivial) files are staged, CHANGELOG.md must reflect it.
non_trivial=$(echo "$staged" | grep -vE '^CHANGELOG\.md$|^docs/fixes/|^\.toolkit-version$|\.md$' || true)

if [[ -n "$non_trivial" ]]; then
  if echo "$staged" | grep -q '^CHANGELOG\.md$'; then
    pass_msg "CHANGELOG.md"
  elif [[ -f CHANGELOG.md ]]; then
    unreleased_lines=$(awk '/^## \[Unreleased\]/{f=1; next} /^## /{f=0} f && NF' CHANGELOG.md 2>/dev/null | wc -l)
    if [[ "$unreleased_lines" -gt 0 ]]; then
      pass_msg "CHANGELOG.md"
    else
      fail_msg "CHANGELOG.md" "Non-trivial files staged but [Unreleased] section is empty."
    fi
  else
    fail_msg "CHANGELOG.md" "CHANGELOG.md missing — non-trivial files are staged."
  fi
else
  pass_msg "CHANGELOG.md"
fi

# ── Check 2: Zone.Identifier files ──────────────────────────────────────────
zone_files=$(echo "$staged" | grep ':Zone\.Identifier$' || true)
if [[ -n "$zone_files" ]]; then
  fail_msg "Zone.Identifier" "Forbidden files staged:"$'\n'"$(echo "$zone_files" | sed 's/^/             /')"
else
  pass_msg "Zone.Identifier"
fi

# ── Check 3: Secrets (.env, .env.*, *.key, *.pem) ────────────────────────────
secrets=$(echo "$staged" | grep -E '(^|/)\.env$|(^|/)\.env\.|\.key$|\.pem$' || true)
if [[ -n "$secrets" ]]; then
  fail_msg "Secrets" "Sensitive files staged:"$'\n'"$(echo "$secrets" | sed 's/^/       /')"
else
  pass_msg "Secrets"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ "$failures" -gt 0 ]]; then
  printf "${RED}FAILED${NC}  %d check(s) blocked commit. Use 'git commit --no-verify' to bypass.\n" "$failures"
  exit 1
else
  printf "${GREEN}OK${NC}  All checks passed.\n"
  exit 0
fi
