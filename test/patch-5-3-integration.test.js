'use strict';

// Temp-project integration: an install from the current templates is edited the way an older install
// would look (fit-review brief missing, plan guidance customised), then patched. Patch must add the new
// brief, keep the customised guidance under review without overwriting it, and never re-add a retired path.
// Uses the local CLI only: no network, no npm, no git. Run: node --test test/patch-5-3-integration.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const cli = require('../bin/cli.js');

const FIT = path.join('.claude', 'rules-snippets', 'fit-review.md');
const PLAN = path.join('.claude', 'prompt-snippets', 'plan.md');

function tmp(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-int-53-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

function quiet(fn) {
  const log = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  const prevExit = process.exitCode;
  process.exitCode = undefined;
  try {
    return { result: fn(), out: lines.join('\n') };
  } finally {
    console.log = log;
    process.exitCode = prevExit;
  }
}

// Build an install from current templates, then reshape it to look like an older install.
function olderInstall(t) {
  const d = tmp(t);
  quiet(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, FIT));
  fs.writeFileSync(path.join(d, PLAN), fs.readFileSync(path.join(d, PLAN), 'utf8') + '\n\nLocal rule: plans need two reviewers.\n');
  return d;
}

test('patch adds the new goal-fit brief and keeps customised plan guidance for review without overwriting it', (t) => {
  const d = olderInstall(t);
  const customised = fs.readFileSync(path.join(d, PLAN), 'utf8');

  const { result, out } = quiet(() => cli.cmdPatch(d, { repo: true }));

  assert.equal(fs.existsSync(path.join(d, FIT)), true, 'new fit-review brief was not added');
  assert.equal(fs.readFileSync(path.join(d, FIT), 'utf8'), fs.readFileSync(path.join(__dirname, '..', 'src', 'repo', FIT), 'utf8'));
  assert.equal(fs.readFileSync(path.join(d, PLAN), 'utf8'), customised, 'customised plan guidance was overwritten');
  assert.ok(result.planned.review >= 1, 'customised file should be counted for review');
  assert.match(out, /needs review|kept for review/i);
  assert.match(out, /plan\.md/);
});

test('patch --force still does not overwrite customised guidance', (t) => {
  const d = olderInstall(t);
  const customised = fs.readFileSync(path.join(d, PLAN), 'utf8');

  quiet(() => cli.cmdPatch(d, { repo: true, force: true }));

  assert.equal(fs.readFileSync(path.join(d, PLAN), 'utf8'), customised);
});

test('patch does not re-add a retired path, and doctor reports it as retired', (t) => {
  const d = olderInstall(t);
  fs.mkdirSync(path.join(d, '.nitm'), { recursive: true });
  fs.writeFileSync(path.join(d, '.nitm', 'retired.json'), JSON.stringify({
    retired: [{ path: FIT, reason: 'goal-fit brief not used in this project', date: '2026-11-14' }],
  }, null, 2));

  const { result } = quiet(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.existsSync(path.join(d, FIT)), false, 'retired path was re-added');
  assert.ok(result.planned.retired >= 1);

  const doc = quiet(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.ok(doc.retired.some((r) => r.rel === FIT && r.present === false));
  assert.equal(doc.missingFiles.includes(FIT), false);
});
