#!/usr/bin/env bash
# check-parity.sh — Verify shared content parity across template variants.
# Compares assign-tasks and bootstrap files across cursor/claude/github × repo/monorepo.
# Exit code 0 = all in sync, 1 = drift detected.

set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || { cd "$(dirname "$0")/.." && pwd; })"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

errors=0

# --- Helper ---
check_identical() {
  local label="$1" base="$2" target="$3"
  if [[ ! -f "$base" ]]; then
    printf "${RED}MISSING${NC} %s (base)\n" "$base"
    ((errors += 1))
    return
  fi
  if [[ ! -f "$target" ]]; then
    printf "${RED}MISSING${NC} %s\n" "$target"
    ((errors += 1))
    return
  fi
  if diff -q "$base" "$target" >/dev/null 2>&1; then
    printf "${GREEN}  OK${NC}  %s\n" "$label"
  else
    printf "${RED}DRIFT${NC} %s\n" "$label"
    diff --unified=1 "$base" "$target" | head -20 || true
    echo "  ..."
    ((errors += 1))
  fi
}

extract_section() {
  local file="$1" section="$2"
  awk -v header="## ${section}" '
    $0 == header {
      in_section = 1
    }
    in_section {
      if (seen_header && $0 ~ /^## / && $0 != header) {
        exit
      }
      print
      seen_header = 1
    }
  ' "$file"
}

check_section_match() {
  local label="$1" base="$2" target="$3" section="$4"
  if [[ ! -f "$base" || ! -f "$target" ]]; then
    printf "${YELLOW}SKIP${NC}  %s (file missing)\n" "$label"
    return
  fi
  local base_section target_section
  base_section=$(extract_section "$base" "$section")
  target_section=$(extract_section "$target" "$section")
  if [[ "$base_section" == "$target_section" ]]; then
    printf "${GREEN}  OK${NC}  %s [%s]\n" "$label" "$section"
  else
    printf "${RED}DRIFT${NC} %s [%s]\n" "$label" "$section"
    diff <(printf '%s\n' "$base_section") <(printf '%s\n' "$target_section") | head -15 || true
    echo "  ..."
    ((errors += 1))
  fi
}

# Compare body text of two files after stripping frontmatter and markdown link targets.
# This allows tool-specific frontmatter and link paths to differ across tools.
check_body_match() {
  local label="$1" base="$2" target="$3"
  if [[ ! -f "$base" ]]; then
    printf "${RED}MISSING${NC} %s (base)\n" "$base"
    ((errors += 1))
    return
  fi
  if [[ ! -f "$target" ]]; then
    printf "${RED}MISSING${NC} %s\n" "$target"
    ((errors += 1))
    return
  fi
  # Extract body (skip frontmatter between first two `---` lines)
  # Then normalize: strip markdown link targets, trim trailing whitespace
  local base_body target_body
  base_body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2' "$base" \
    | sed -E 's/\]\([^)]*\)/](#)/g' \
    | sed -E 's/[[:space:]]+$//')
  target_body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2' "$target" \
    | sed -E 's/\]\([^)]*\)/](#)/g' \
    | sed -E 's/[[:space:]]+$//')
  if [[ "$base_body" == "$target_body" ]]; then
    printf "${GREEN}  OK${NC}  %s\n" "$label"
  else
    printf "${RED}DRIFT${NC} %s\n" "$label"
    diff <(printf '%s\n' "$base_body") <(printf '%s\n' "$target_body") | head -20 || true
    echo "  ..."
    ((errors += 1))
  fi
}

echo "=== Assign-Tasks Parity ==="
echo ""

# Cursor repo is the canonical source for cursor/claude variants
BASE_AT="src/repo/.cursor/commands/assign-tasks.md"
BASE_AT_CLAUDE="src/repo/.claude/commands/assign-tasks.md"

check_body_match "repo: cursor ↔ claude (body)" \
  "$BASE_AT" "src/repo/.claude/commands/assign-tasks.md"

check_identical "repo ↔ monorepo: cursor" \
  "$BASE_AT" "src/monorepo/.cursor/commands/assign-tasks.md"

check_identical "repo ↔ monorepo: claude" \
  "$BASE_AT_CLAUDE" "src/monorepo/.claude/commands/assign-tasks.md"

# GitHub prompt variants share PM sections but differ in formatting
BASE_GH="src/repo/.github/prompts/assign-tasks.prompt.md"

check_identical "repo ↔ monorepo: github prompt" \
  "$BASE_GH" "src/monorepo/.github/prompts/assign-tasks.prompt.md"

# Cross-format: check shared sections between cursor and github prompt
check_body_match "cursor ↔ github prompt (body)" \
  "$BASE_AT" "$BASE_GH"

echo ""
echo "=== Skills Parity ==="
echo ""

for skill in issue-tracker acli gh-cli linear-cli; do
  check_identical "skill: $skill repo ↔ monorepo" \
    "src/repo/.agents/skills/$skill/SKILL.md" \
    "src/monorepo/.agents/skills/$skill/SKILL.md"
done

echo ""
echo "=== Ponytail Parity ==="
echo ""

for skill in ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review; do
  check_identical "skill: $skill repo ↔ monorepo" \
    "src/repo/.agents/skills/$skill/SKILL.md" \
    "src/monorepo/.agents/skills/$skill/SKILL.md"
done

for snippet in ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review; do
  check_identical "prompt-snippet: $snippet repo ↔ monorepo" \
    "src/repo/.claude/prompt-snippets/$snippet.md" \
    "src/monorepo/.claude/prompt-snippets/$snippet.md"
done

for cmd in ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review; do
  check_identical "opencode-command: $cmd repo ↔ monorepo" \
    "src/repo/.opencode/commands/$cmd.md" \
    "src/monorepo/.opencode/commands/$cmd.md"
done

# Note: only ponytail.mdc exists (not 6 variants) — the .cursor/commands/ directory
# has the 6 command variants instead.
check_identical "cursor-rule: ponytail repo ↔ monorepo" \
  "src/repo/.cursor/rules/ponytail.mdc" \
  "src/monorepo/.cursor/rules/ponytail.mdc"

check_identical "plugin: ponytail repo ↔ monorepo" \
  "src/repo/.opencode/plugins/ponytail.mjs" \
  "src/monorepo/.opencode/plugins/ponytail.mjs"

check_identical "agent-rule: ponytail repo ↔ monorepo" \
  "src/repo/.agents/rules/ponytail.md" \
  "src/monorepo/.agents/rules/ponytail.md"

# .js files for the runtime hooks, .sh and .ps1 for statusline
for hook in ponytail-activate.js ponytail-config.js ponytail-instructions.js ponytail-mode-tracker.js ponytail-runtime.js ponytail-statusline.sh ponytail-statusline.ps1; do
  check_identical "hook: $hook repo ↔ monorepo" \
    "src/repo/hooks/$hook" \
    "src/monorepo/hooks/$hook"
done

echo ""
echo "=== Ponytail Wrapper Parity ==="
echo ""

# Rules snippet
check_identical "rules-snippet: ponytail repo ↔ monorepo" \
  "src/repo/.claude/rules-snippets/ponytail.md" \
  "src/monorepo/.claude/rules-snippets/ponytail.md"

# OpenCode rules
check_identical "opencode-rule: ponytail repo ↔ monorepo" \
  "src/repo/.opencode/rules/ponytail.md" \
  "src/monorepo/.opencode/rules/ponytail.md"

# Claude commands
for cmd in ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review; do
  check_identical "claude-command: $cmd repo ↔ monorepo" \
    "src/repo/.claude/commands/$cmd.md" \
    "src/monorepo/.claude/commands/$cmd.md"
done

# Cursor commands
for cmd in ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review; do
  check_identical "cursor-command: $cmd repo ↔ monorepo" \
    "src/repo/.cursor/commands/$cmd.md" \
    "src/monorepo/.cursor/commands/$cmd.md"
done

# GitHub prompts
for cmd in ponytail ponytail-audit ponytail-debt ponytail-gain ponytail-help ponytail-review; do
  check_identical "github-prompt: $cmd repo ↔ monorepo" \
    "src/repo/.github/prompts/$cmd.prompt.md" \
    "src/monorepo/.github/prompts/$cmd.prompt.md"
done

# opencode.jsonc
check_identical "opencode.jsonc repo ↔ monorepo" \
  "src/repo/.opencode/opencode.jsonc" \
  "src/monorepo/.opencode/opencode.jsonc"

echo ""
echo "=== orient-to-recent-work Parity ==="
echo ""

check_identical "skill: orient-to-recent-work repo ↔ monorepo" \
  "src/repo/.agents/skills/orient-to-recent-work/SKILL.md" \
  "src/monorepo/.agents/skills/orient-to-recent-work/SKILL.md"

check_identical "cursor-rule: orient-to-recent-work repo ↔ monorepo" \
  "src/repo/.cursor/rules/orient-to-recent-work.mdc" \
  "src/monorepo/.cursor/rules/orient-to-recent-work.mdc"

echo ""
echo "=== AGENTS.md PM Section Parity ==="
echo ""

check_section_match "AGENTS.md repo ↔ monorepo" \
  "src/repo/AGENTS.md" "src/monorepo/AGENTS.md" "Project Management"

echo ""
echo "=== Orphaned References ==="
echo ""

orphans=0
for pattern in "TRACKER_SKILL_REPO" "TRACKER_SKILL_NAME" 'npx -y skills find'; do
  hits=$(grep -rl "$pattern" src/ 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    printf "${RED}FOUND${NC} orphaned '%s' in:\n" "$pattern"
    echo "$hits" | sed 's/^/  /'
    ((orphans += 1))
  fi
done

if [[ "$orphans" -eq 0 ]]; then
  printf "${GREEN}  OK${NC}  No orphaned references found\n"
fi

echo ""
if [[ "$errors" -eq 0 && "$orphans" -eq 0 ]]; then
  printf "${GREEN}All checks passed.${NC}\n"
  exit 0
else
  printf "${RED}%d issue(s) detected.${NC}\n" "$((errors + orphans))"
  exit 1
fi
