---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Proactive Setup

Before first use, ensure `.worktrees/` is in the project's `.gitignore`:

```bash
# Add to the repo-root .gitignore if not already present
git_root="$(git rev-parse --show-toplevel)"
gitignore_path="$git_root/.gitignore"

grep -qxF '.worktrees' "$gitignore_path" 2>/dev/null \
  || grep -qxF '.worktrees/' "$gitignore_path" 2>/dev/null \
  || echo '.worktrees/' >> "$gitignore_path"
```

This prevents worktree contents from ever being tracked. Do this **once per project** rather than relying on runtime detection.

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

### 2. Check Project Configuration

```bash
# Check common config files for worktree directory preference
grep -i "worktree.*director" CLAUDE.md AGENTS.md .github/copilot-instructions.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no project configuration preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.worktrees/<project-name>/ (global location, outside repo)

Which would you prefer?
```

## Safety Verification

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:**

Fix immediately before proceeding:

1. Add appropriate line to .gitignore
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

### For Global Directory (~/.worktrees)

No .gitignore verification needed - outside project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.worktrees/*)
    path="~/.worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation                  | Action                          |
| -------------------------- | ------------------------------- |
| `.worktrees/` exists       | Use it (verify ignored)         |
| `worktrees/` exists        | Use it (verify ignored)         |
| Both exist                 | Use `.worktrees/`               |
| Neither exists             | Check project config → Ask user |
| Directory not ignored      | Add to .gitignore + commit      |
| Tests fail during baseline | Report failures + ask           |
| No package.json/Cargo.toml | Skip dependency install         |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > project config > ask

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check .worktrees/ - exists]
[Verify ignored - git check-ignore confirms .worktrees/ is ignored]
[Create worktree: git worktree add .worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /home/user/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Cleanup After Merge

Once work is completed and merged into the parent branch, **always remove the worktree** to avoid stale checkouts and disk bloat.

### 1. Verify the branch was merged

```bash
# Detect the default branch
base=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
base=${base:-main}  # fallback to main if detection fails

# From the main working tree, confirm the feature branch is merged
git branch --merged "$base" | grep <feature-branch>
```

### 2. Remove the worktree

```bash
# Remove the worktree directory and its administrative files
git worktree remove <worktree-path>
```

If the worktree has uncommitted changes, Git will refuse. Use `--force` only after confirming nothing valuable remains:

```bash
git worktree remove --force <worktree-path>
```

### 3. Delete the feature branch

```bash
# Safe delete (fails if not merged)
git branch -d <feature-branch>

# Also remove the remote tracking branch if pushed
git push origin --delete <feature-branch>
```

### 4. Verify cleanup

```bash
# Confirm no stale worktrees remain
git worktree list

# Prune any worktrees whose directories were manually deleted
git worktree prune
```

**Tip:** Run `git worktree list` periodically to catch forgotten worktrees. Stale entries from manually deleted directories can be cleaned up with `git worktree prune`.

## Red Flags

**Never:**

- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip project configuration check
- Leave worktrees around after the branch has been merged

**Always:**

- Follow directory priority: existing > project config > ask
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Clean up worktrees and branches after merge
- Verify clean test baseline

## Integration

**Called by:**

- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- Any skill needing isolated workspace

**Pairs with:**

- **finishing-a-development-branch** - REQUIRED for cleanup after work complete
- **executing-plans** or **subagent-driven-development** - Work happens in this worktree
