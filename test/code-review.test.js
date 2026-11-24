'use strict';

// Contract checks for the code-review skill and the /review, /review-pr, and /review-staged prompt entry
// points. Static checks read template text: they show that both layouts carry the same skill and prompts,
// that each scoped prompt activates the skill, that the staged and PR evidence boundaries are stated and
// do not widen, that the generic local-scope git commands live only in the skill, and that a missing
// requirement is never a pass or a veto. The real-git checks run git in a temp repo to prove the state
// distinctions the boundaries rely on. They do not prove how an agent behaves at runtime.
// Run with: node --test test/code-review.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const SKILL = '.agents/skills/code-review/SKILL.md';
const REVIEW = '.claude/prompt-snippets/review.md';
const REVIEW_PR = '.claude/prompt-snippets/review-pr.md';
const REVIEW_STAGED = '.claude/prompt-snippets/review-staged.md';
const READ_SKILL = 'Read and follow `.agents/skills/code-review/SKILL.md`';

const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');

// Skill: source of truth for scope, requirements, and reporting. Shared across layouts.
test('skill is identical across src/repo and src/monorepo', () => {
  assert.equal(read('src/repo', SKILL), read('src/monorepo', SKILL));
});

test('skill has frontmatter name code-review and a use-when description', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /^---\nname: code-review\ndescription: Use for /);
});

test('skill attributes the two-lens idea to the pinned upstream commit and copies no text', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /mattpocock\/skills \(MIT\)/);
  assert.match(skill, /d65391149dbb5fe76478e76fa8d5122b2aa5a70e/);
  assert.match(skill, /No text is copied/);
});

test('skill names both lenses and the requirements-fit categories', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /\*\*Project standards\.\*\*/);
  assert.match(skill, /\*\*Requirements fit\*\*/);
  assert.match(skill, /\*\*Missed:\*\*/);
  assert.match(skill, /\*\*Misimplemented:\*\*/);
  assert.match(skill, /\*\*Scope creep:\*\*/);
});

test('skill: supplied requirements come first, a linked approved artifact is fallback only', () => {
  const skill = read('src/repo', SKILL);
  const supplied = skill.indexOf('1. Requirements supplied in the request');
  const fallback = skill.indexOf('2. Fallback only: a recognized, project-linked approved artifact');
  assert.ok(supplied > 0 && fallback > supplied, 'supplied requirements, then fallback artifact');
  assert.match(skill, /Do not guess artifact paths\./);
  assert.match(skill, /the request, PR description, or linked issue points to and the project marks as approved/);
});

test('skill does not mistake a bare argument, a generic title, or a branch name for a requirement', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /A bare command argument \(`\/review this`\), a generic title \(`fix stuff`, `WIP`\), or a branch name is not a requirement\./);
});

test('skill has no Factory-only artifact path', () => {
  const skill = read('src/repo', SKILL);
  assert.doesNotMatch(skill, /factory/i);
});

test('skill marks a missing source not assessed, never pass, and a draft is not a source', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /A draft is not a source\. If neither applies, the requirements lens is \*\*not assessed\*\*\./);
  assert.match(skill, /Never write "pass" for an unassessed lens/);
});

test('skill keeps requirement gaps out of the veto, approval, and extra-round path', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /It is not a veto, a new approval step, or an extra review round/);
  assert.match(skill, /Scope creep:\*\* a change that no requirement traces to\. Report it for the user to decide\. It is not an automatic failure\./);
  assert.doesNotMatch(skill, /blocks merge|hard veto|must approve/i);
});

test('skill is read-only and adds no reviewers beyond the calling workflow', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /Read-only\. No edits, staging, commits, pushes, or thread replies/);
  assert.match(skill, /Do not add reviewers/);
  assert.doesNotMatch(skill, /\bgit (add|commit|push|reset|checkout|stash)\b/);
});

test('skill is native: no tracker, MCP, auth, or bootstrap dependency', () => {
  const skill = read('src/repo', SKILL);
  // Case-insensitive for tracker and auth tooling; case-sensitive for the bootstrap file and path,
  // so the skill's own "no bootstrap needed" sentence does not trip the check.
  assert.doesNotMatch(skill, /issue-tracker|mcp|gh api|gh auth/i);
  assert.doesNotMatch(skill, /BOOTSTRAP|\.nitm\//);
});

test('skill is the single source of the local-scope git commands', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /`git diff --cached`/);
  assert.match(skill, /`git diff`\./);
  assert.match(skill, /`git ls-files --others --exclude-standard`/);
  assert.match(skill, /`git diff` then shows only the later edit and hides the staged change/);
  assert.match(skill, /label each finding `staged` or `unstaged`/);
});

test('skill keeps unrelated dirty files out of local scope and names them as skipped', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /Include a dirty file only if it is in the explicit scope or was produced by this session's work/);
  assert.match(skill, /List unrelated dirty files as skipped with the reason/);
});

test('skill keeps PR review on the PR diff, never the working tree', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /Take the diff from the PR host for the PR's base and head/);
  assert.match(skill, /Do not use the local working tree or local branch/);
  assert.match(skill, /Do not substitute a local diff/);
});

test('skill reuses the existing base and head SHA rule instead of a second diff method', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /Reuse the base and head SHA rule in `review\.md`/);
});

test('skill refers to the canonical Lenses block in review.md and defines no lens fields of its own', () => {
  const skill = read('src/repo', SKILL);
  assert.match(skill, /Its Lenses block is the single canonical format/);
  assert.doesNotMatch(skill, /### Lenses/);
  assert.doesNotMatch(skill, /^- (Scope|Skipped|Project standards|Requirements fit|Requirements source):/m);
});

test('lens field lines appear only in review.md, never in the skill or the scoped prompts', () => {
  for (const layout of LAYOUTS) {
    for (const file of [SKILL, REVIEW_PR, REVIEW_STAGED]) {
      assert.doesNotMatch(read(layout, file), /^- (Requirements fit|Requirements source|Project standards):/m, `${layout}/${file}`);
    }
  }
});

for (const layout of LAYOUTS) {
  test(`${layout}: /review activates the skill, reports the lenses, and keeps git commands out`, () => {
    const review = read(layout, REVIEW);
    assert.match(review, /If no argument, resolve local scope per `\.agents\/skills\/code-review\/SKILL\.md`/);
    assert.ok(review.includes(READ_SKILL), 'read-and-follow link for the skill');
    assert.match(review, /or report it as not assessed\. Never write a pass for an unassessed lens\./);
    assert.equal(review.split('### Lenses').length - 1, 1, 'one canonical Lenses block');
    assert.ok(review.includes(
      '### Lenses\n\n' +
      '- Scope: <staged | unstaged | new | range <base>...HEAD | PR #n>\n' +
      '- Skipped: <unrelated dirty or untracked files, with reason | none>\n' +
      '- Project standards: <n findings, or pass with checks made>\n' +
      '- Requirements fit: <pass | n gaps | not assessed>\n' +
      '- Requirements source: <request | linked approved artifact at <exact path or link> | absent (requirements fit is not assessed)>\n'
    ), 'canonical Lenses fields in order');
    // Single source: the generic prompt names no local or branch git command; the skill owns them.
    assert.doesNotMatch(review, /git (diff|ls-files|status)/);
    // Existing verdict contract stays intact.
    assert.match(review, /### Assessment\n\n\[✅ Approved \| ⚠️ Approved with suggestions \| ❌ Changes required\]/);
    assert.match(review, /## Review Loop/);
  });

  test(`${layout}: /review-pr activates the skill and states the PR evidence boundary`, () => {
    const pr = read(layout, REVIEW_PR);
    assert.ok(pr.includes(READ_SKILL), 'read-and-follow link for the skill');
    assert.match(pr, /Get the PR diff and file changes from the PR host for the PR's base and head/);
    assert.match(pr, /Do not use the local working tree or local branch/);
    assert.match(pr, /Evidence boundary: the PR host's base-to-head diff plus the PR's own comments and threads\./);
    assert.match(pr, /Staged, unstaged, untracked, and local-branch files are not review input\./);
    assert.match(pr, /If the PR diff cannot be fetched, stop and report it/);
    assert.match(pr, /Read and follow `\.agents\/skills\/code-review\/SKILL\.md` for the requirements source\. If none applies, mark the requirements-fit lens not assessed/);
    assert.match(pr, /including its Lenses block \(scope is the PR diff\)/);
    // No local git command may widen PR evidence.
    assert.doesNotMatch(pr, /git (diff|ls-files|status|add|stash)/);
    // Existing decision and thread-resolution contract stays intact.
    assert.match(pr, /\*\*✅ Approve\*\*: All criteria met, ready for merge/);
    assert.match(pr, /\*\*Resolve the comment thread\*\* via your issue tracker's tools/);
    assert.match(pr, /Confirm Execution Plan/);
  });

  test(`${layout}: /review-staged activates the skill and is bounded to the staged index`, () => {
    const staged = read(layout, REVIEW_STAGED);
    assert.ok(staged.includes(READ_SKILL), 'read-and-follow link for the skill');
    assert.match(staged, /Run `git diff --cached` to get all staged changes/);
    assert.match(staged, /Run `git diff --cached --stat`/);
    assert.match(staged, /Evidence boundary: the staged index only, via `git diff --cached`\./);
    assert.match(staged, /Do not read unstaged changes or untracked files as review input, even when dirty\./);
    assert.match(staged, /If nothing is staged, stop and report that\. Do not fall through to unstaged or untracked changes/);
    assert.match(staged, /Assess the requirements-fit lens per the code-review skill against the staged change, or report it as not assessed/);
    assert.match(staged, /The Lenses block scope is `staged`\./);
    // Only the staged diff command may appear: no bare diff, no ls-files, no unstaged fallback command.
    assert.doesNotMatch(staged, /git diff(?! --cached)/);
    assert.doesNotMatch(staged, /git ls-files|git status/);
    assert.doesNotMatch(staged, /blocks? merge|hard veto|must approve|second reviewer|additional review round/i);
  });

  test(`${layout}: scoped prompts add no reviewer dispatch or new approval step`, () => {
    for (const file of [REVIEW, REVIEW_PR, REVIEW_STAGED]) {
      const text = read(layout, file);
      assert.doesNotMatch(text, /requirements gap[^.\n]*(veto|block)/i, file);
      assert.doesNotMatch(text, /second reviewer|additional review round/i, file);
    }
  });
}

test('review prompts are identical across src/repo and src/monorepo', () => {
  for (const file of [REVIEW, REVIEW_PR, REVIEW_STAGED]) {
    assert.equal(read('src/repo', file), read('src/monorepo', file), file);
  }
});

// Real git: the boundaries rely on these state distinctions.
const gitAvailable = () => spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;

function tempRepo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-review-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.email=test@example.invalid', '-c', 'user.name=test', ...args], { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout;
  };
  git('init', '-q');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'base\n');
  git('add', 'a.txt');
  git('commit', '-q', '-m', 'base');
  return { dir, git };
}

test('real git: a staged change hidden from git diff stays visible to git diff --cached', (t) => {
  if (!gitAvailable()) return t.skip('git not available');
  const { dir, git } = tempRepo(t);

  // Stage a change, then edit the file again so the worktree differs from the index.
  fs.writeFileSync(path.join(dir, 'a.txt'), 'base\nstaged line\n');
  git('add', 'a.txt');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'base\nstaged line\nlater edit\n');
  fs.writeFileSync(path.join(dir, 'new.txt'), 'untracked\n');

  const unstaged = git('diff');
  const staged = git('diff', '--cached');
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);

  assert.match(unstaged, /\+later edit/);
  assert.doesNotMatch(unstaged, /\+staged line/, 'git diff must hide the staged line');
  assert.match(staged, /\+staged line/, 'git diff --cached must show the staged line');
  assert.doesNotMatch(staged, /later edit/, 'staged view must not include the later worktree edit');
  assert.deepEqual(untracked, ['new.txt']);
});

test('real git: with nothing staged, the staged boundary is empty and the fallback sources are not', (t) => {
  if (!gitAvailable()) return t.skip('git not available');
  const { dir, git } = tempRepo(t);

  // Dirty but unstaged, plus an untracked file. /review-staged must stop here, not review these.
  fs.writeFileSync(path.join(dir, 'a.txt'), 'base\nunstaged only\n');
  fs.writeFileSync(path.join(dir, 'new.txt'), 'untracked\n');

  assert.equal(git('diff', '--cached'), '', 'staged boundary is empty');
  assert.match(git('diff'), /\+unstaged only/, 'unstaged source is non-empty, so falling through would expand scope');
  assert.deepEqual(git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean), ['new.txt']);
});
