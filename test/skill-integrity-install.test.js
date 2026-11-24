'use strict';

// Verifies that install and patch refuse to touch a target when the packaged skills are tampered with.
// Each case copies bin/, src/ and package.json into a temporary package, pins a manifest snapshot in
// that copy (the real reviewed manifest is never read or written), then runs the copied CLI as a
// subprocess against an empty or pre-installed temporary target. Node stdlib only; no network.
// Run with: node --test test/skill-integrity-install.test.js

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

// Copy of the package with a manifest pinned from its current (untampered) skill files.
function pinnedCopy() {
  const pkg = tempDir('skill-integrity-cli-pkg-');
  fs.cpSync(path.join(REPO_ROOT, 'bin'), path.join(pkg, 'bin'), { recursive: true });
  fs.cpSync(path.join(REPO_ROOT, 'src'), path.join(pkg, 'src'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'package.json'), path.join(pkg, 'package.json'));
  const candidate = path.join(tempDir('skill-integrity-cli-cand-'), 'candidate.json');
  require(path.join(pkg, 'bin', 'skill-integrity.js')).snapshot(candidate, pkg);
  fs.copyFileSync(candidate, path.join(pkg, 'bin', 'skill-integrity.manifest.json'));
  return pkg;
}

function runCli(pkg, args, cwd) {
  const r = spawnSync(process.execPath, [path.join(pkg, 'bin', 'cli.js'), ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const emptyTarget = () => tempDir('skill-integrity-target-');
const isEmpty = (dir) => fs.readdirSync(dir).length === 0;

test('untampered pinned copy: install succeeds and writes (baseline for the tamper cases)', () => {
  const pkg = pinnedCopy();
  const target = emptyTarget();
  const r = runCli(pkg, ['install', '--repo'], target);
  assert.equal(r.status, 0, r.out);
  assert.ok(fs.existsSync(path.join(target, '.nitm', 'manifest.json')));
  assert.ok(fs.existsSync(path.join(target, '.agents', 'skills', 'acli', 'SKILL.md')));
});

test('modified packaged skill: install exits 1 before the first write', () => {
  const pkg = pinnedCopy();
  fs.appendFileSync(path.join(pkg, 'src', 'repo', '.agents', 'skills', 'acli', 'SKILL.md'), '\nINJECTED\n');
  const target = emptyTarget();
  const r = runCli(pkg, ['install', '--repo'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /modified: src\/repo\/\.agents\/skills\/acli\/SKILL\.md/);
  assert.match(r.out, /nothing was written/);
  assert.ok(isEmpty(target), `target was written: ${fs.readdirSync(target).join(', ')}`);
});

test('dry run with a tampered skill also exits 1 and writes nothing (same verdict as the real run)', () => {
  const pkg = pinnedCopy();
  fs.appendFileSync(path.join(pkg, 'src', 'repo', '.agents', 'skills', 'acli', 'SKILL.md'), '\nINJECTED\n');
  const target = emptyTarget();
  const r = runCli(pkg, ['install', '--repo', '--dry-run'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /packaged skill integrity check failed/);
  assert.ok(isEmpty(target));
});

test('added hidden ancillary file in the monorepo template: install exits 1 before the first write', () => {
  const pkg = pinnedCopy();
  fs.writeFileSync(path.join(pkg, 'src', 'monorepo', '.agents', 'skills', 'acli', '.ancillary.sh'), 'echo hi\n');
  const target = emptyTarget();
  const r = runCli(pkg, ['install', '--monorepo'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /added: src\/monorepo\/\.agents\/skills\/acli\/\.ancillary\.sh/);
  assert.ok(isEmpty(target));
});

test('symlink in a skill root: install exits 1 before the first write', () => {
  const pkg = pinnedCopy();
  fs.symlinkSync(path.join(pkg, 'package.json'), path.join(pkg, 'src', 'repo', '.agents', 'skills', 'acli', 'link.md'));
  const target = emptyTarget();
  const r = runCli(pkg, ['install', '--repo'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /symlink \(not allowed in skill roots\)/);
  assert.ok(isEmpty(target));
});

test('missing reviewed manifest in a package: install exits 1 before the first write', () => {
  const pkg = pinnedCopy();
  fs.rmSync(path.join(pkg, 'bin', 'skill-integrity.manifest.json'));
  const target = emptyTarget();
  const r = runCli(pkg, ['install', '--repo'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /missing\. Run "snapshot"/);
  assert.ok(isEmpty(target));
});

test('patch with a tampered skill exits 1 and leaves an existing installed file byte-identical', () => {
  const pkg = pinnedCopy();
  const target = emptyTarget();
  assert.equal(runCli(pkg, ['install', '--repo'], target).status, 0);
  const installed = path.join(target, '.agents', 'skills', 'acli', 'SKILL.md');
  const before = fs.readFileSync(installed, 'utf8');
  fs.appendFileSync(path.join(pkg, 'src', 'repo', '.agents', 'skills', 'acli', 'SKILL.md'), '\nINJECTED\n');
  const r = runCli(pkg, ['patch', '--repo'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /modified: src\/repo\/\.agents\/skills\/acli\/SKILL\.md/);
  assert.equal(fs.readFileSync(installed, 'utf8'), before);
});

test('nested ancillary-only harness skills dir: patch exits 1 and the existing installed skill stays untouched', () => {
  const pkg = pinnedCopy();
  const target = emptyTarget();
  assert.equal(runCli(pkg, ['install', '--monorepo'], target).status, 0);
  const installed = path.join(target, '.agents', 'skills', 'acli', 'SKILL.md');
  const before = fs.readFileSync(installed, 'utf8');
  fs.mkdirSync(path.join(pkg, 'src', 'monorepo', 'apps', 'web', '.agents', 'skills', 'helper'), { recursive: true });
  fs.writeFileSync(path.join(pkg, 'src', 'monorepo', 'apps', 'web', '.agents', 'skills', 'helper', 'run.sh'), 'echo inert\n');
  const r = runCli(pkg, ['patch', '--monorepo'], target);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /skills directory outside the discovered skill roots/);
  assert.equal(fs.readFileSync(installed, 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(target, 'apps', 'web', '.agents', 'skills')), 'nested skills must not be written');
});
