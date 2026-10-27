'use strict';

// Behaviour of relevance-aware patch and doctor: retirement, relevance decisions, locally changed files,
// untouched-file updates and wrapper findings. Run with: npm test (node --test). No network.

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cli = require('../bin/cli.js');

function tmp(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-patch-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function snapshot(root) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (e.isDirectory()) walk(p);
      else out[rel] = sha(fs.readFileSync(p, 'utf8'));
    }
  };
  walk(root);
  return out;
}

// Runs fn with console output captured and process.exitCode isolated.
function run(fn) {
  const lines = [];
  const log = console.log;
  const prevExit = process.exitCode;
  process.exitCode = undefined;
  console.log = (...args) => lines.push(args.join(' '));
  let result;
  let exitCode;
  try {
    result = fn();
  } finally {
    console.log = log;
    exitCode = process.exitCode || 0;
    process.exitCode = prevExit;
  }
  return { result, out: lines.join('\n'), exitCode };
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function writeRetired(d, obj) {
  writeJson(path.join(d, '.nitm', 'retired.json'), obj);
}

const REVIEW_PR = path.join('.claude', 'commands', 'review-pr.md');

test('patch: a retired file is never re-added; doctor reports it as retired, not missing', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, REVIEW_PR));
  writeRetired(d, { retired: [{ path: '.claude/commands/review-pr.md', reason: 'no PR review command', date: '2026-10-27' }] });
  const retiredBytes = fs.readFileSync(path.join(d, '.nitm', 'retired.json'), 'utf8');

  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.existsSync(path.join(d, REVIEW_PR)), false);
  assert.equal(patched.result.planned.retired, 1);
  assert.match(patched.out, /Retired \(never re-added\) \(1\):\n\s+- \.claude\/commands\/review-pr\.md \(no PR review command \(retired 2026-10-27\)\)/);
  assert.equal(fs.readFileSync(path.join(d, '.nitm', 'retired.json'), 'utf8'), retiredBytes, 'patch never rewrites the list');

  const doc = run(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.equal(doc.missingFiles.includes(REVIEW_PR), false);
  assert.deepEqual(doc.retired.map((r) => [r.rel, r.present]), [[REVIEW_PR, false]]);
});

test('patch: a retired directory covers every file under it', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, '.agents', 'skills', 'using-superpowers'), { recursive: true, force: true });
  writeRetired(d, { retired: [{ path: '.agents/skills/using-superpowers', reason: 'Claude-only skill', date: '2026-10-27' }] });
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.existsSync(path.join(d, '.agents', 'skills', 'using-superpowers', 'SKILL.md')), false);
  const doc = run(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.ok(doc.retired.some((r) => r.rel === path.join('.agents', 'skills', 'using-superpowers', 'SKILL.md')));
});

test('install: a retired path is not restored by install --force', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, 'factory', 'README.md'));
  writeRetired(d, { retired: [{ path: 'factory/README.md', reason: 'factory not used', date: '2026-10-27' }] });
  run(() => cli.cmdInstall(d, { repo: true, force: true }));
  assert.equal(fs.existsSync(path.join(d, 'factory', 'README.md')), false);
});

test('patch: an invalid retirement list stops before any write', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.writeFileSync(path.join(d, '.nitm', 'retired.json'), '{ "retired": [');
  fs.rmSync(path.join(d, 'AGENTS.md'));
  const before = snapshot(d);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /not valid JSON/);
  assert.deepEqual(snapshot(d), before);
});

test('patch: a Playwright command ships only with a Playwright setup', (t) => {
  const bare = tmp(t);
  const pw = path.join('.claude', 'commands', 'playwright-test.md');
  const plain = run(() => cli.cmdPatch(bare, { repo: true }));
  assert.equal(fs.existsSync(path.join(bare, pw)), false);
  assert.match(plain.out, /playwright-test\.md \(no Playwright setup detected\)/);

  const withPw = tmp(t);
  writeJson(path.join(withPw, 'package.json'), { devDependencies: { '@playwright/test': '1.50.0' } });
  run(() => cli.cmdPatch(withPw, { repo: true }));
  assert.equal(fs.existsSync(path.join(withPw, pw)), true);
});

test('patch: tracker skills follow the git origin; an unknown tracker is held for a decision', (t) => {
  const github = tmp(t);
  if (spawnSync('git', ['init', '-q'], { cwd: github }).status !== 0) return t.skip('git is not available');
  spawnSync('git', ['remote', 'add', 'origin', 'git@github.com:acme/app.git'], { cwd: github });
  const out = run(() => cli.cmdPatch(github, { repo: true })).out;
  assert.equal(fs.existsSync(path.join(github, '.agents', 'skills', 'gh-cli', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(github, '.agents', 'skills', 'linear-cli', 'SKILL.md')), false);
  assert.match(out, /Project facts: tracker github \(git origin\)/);
  assert.match(out, /linear-cli\/SKILL\.md \(project tracker is github\)/);

  const unknown = tmp(t);
  run(() => cli.cmdPatch(unknown, { repo: true }));
  assert.equal(fs.existsSync(path.join(unknown, '.agents', 'skills', 'gh-cli', 'SKILL.md')), false);
  const doc = run(() => cli.cmdDoctor(unknown, { repo: true })).result;
  assert.ok(doc.undecided.some((u) => u.rel === path.join('.agents', 'skills', 'gh-cli', 'SKILL.md')));
  assert.equal(doc.missingFiles.includes(path.join('.agents', 'skills', 'gh-cli', 'SKILL.md')), false);
});

test('patch: an explicit trackers list decides tracker skills without a git remote', (t) => {
  const d = tmp(t);
  writeRetired(d, { trackers: ['linear'], retired: [] });
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.existsSync(path.join(d, '.agents', 'skills', 'linear-cli', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(d, '.agents', 'skills', 'gh-cli', 'SKILL.md')), false);
});

test('patch: empty MCP templates are not added to a project without servers', (t) => {
  const d = tmp(t);
  const plan = run(() => cli.cmdPatch(d, { repo: true })).result;
  assert.equal(fs.existsSync(path.join(d, '.mcp.json')), false);
  assert.equal(fs.existsSync(path.join(d, '.cursor', 'mcp.json')), false);
  assert.ok(plan.planned.irrelevant > 0);
  const doc = run(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.equal(doc.missingFiles.includes('.mcp.json'), false);
});

test('patch: a locally changed file is reported and never overwritten, even with --force', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.writeFileSync(path.join(d, 'AGENTS.md'), 'my own agents file');
  const patched = run(() => cli.cmdPatch(d, { repo: true, force: true }));
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), 'my own agents file');
  assert.match(patched.out, /Needs review \(not written\) \(\d+\):\n[\s\S]*- AGENTS\.md \(kept, differs from template\)/);
});

test('patch: a file the toolkit wrote and the user never changed is updated to the new template', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const old = 'an earlier toolkit version of this file\n';
  fs.writeFileSync(path.join(d, 'AGENTS.md'), old);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files['AGENTS.md'] = sha(old);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));

  const dry = run(() => cli.cmdPatch(d, { repo: true, dryRun: true }));
  assert.match(dry.out, /Would update \(unchanged since the toolkit wrote them; template changed\) \(1\):\n\s+- AGENTS\.md/);
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), old, 'dry run writes nothing');

  run(() => cli.cmdPatch(d, { repo: true }));
  const template = fs.readFileSync(path.join(__dirname, '..', 'src', 'repo', 'AGENTS.md'), 'utf8');
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), template);
  assert.equal(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files['AGENTS.md'], sha(template));
});

test('patch: prints the plan before it writes', (t) => {
  const d = tmp(t);
  const out = run(() => cli.cmdPatch(d, { repo: true })).out;
  assert.ok(out.indexOf('Plan:') >= 0 && out.indexOf('Plan:') < out.indexOf('Patched:'), out);
});

test('doctor and patch: an inlined harness wrapper is reported and left unchanged', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const wrapper = path.join(d, '.claude', 'rules', 'api-server.md');
  const inlined = `${fs.readFileSync(wrapper, 'utf8')}\nAll handlers must return the envelope shape.\nNever skip auth on a route.\n`;
  fs.writeFileSync(wrapper, inlined);
  const doc = run(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.ok(doc.wrappers.some((w) => w.rel === path.join('.claude', 'rules', 'api-server.md') && w.status === 'inlined'));
  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  assert.match(patched.out, /harness wrapper\(s\) inline policy or diverge from their snippet/);
  assert.equal(fs.readFileSync(wrapper, 'utf8'), inlined);
});

test('doctor: a relevant file that is missing is reported; an undecided one is listed separately', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, 'AGENTS.md'));
  fs.rmSync(path.join(d, '.agents', 'skills', 'gh-cli', 'SKILL.md'));
  const doc = run(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.deepEqual(doc.missingFiles, ['AGENTS.md']);
  assert.ok(doc.undecided.some((u) => u.rel === path.join('.agents', 'skills', 'gh-cli', 'SKILL.md')));
});

test('doctor: a present file that does not apply is listed as a retirement candidate, never deleted', (t) => {
  const d = tmp(t);
  writeJson(path.join(d, 'package.json'), { dependencies: { react: '19' } });
  run(() => cli.cmdInstall(d, { repo: true }));
  const pw = path.join(d, '.claude', 'commands', 'playwright-test.md');
  const doc = run(() => cli.cmdDoctor(d, { repo: true })).result;
  assert.equal(fs.existsSync(pw), true);
  assert.ok(doc.notRelevant.includes(path.join('.claude', 'commands', 'playwright-test.md')));
});
