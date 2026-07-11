'use strict';

// Tests for the nitm-ai-dev-toolkit CLI.
// Run with: npm test  (node --test)
// No network: exercises the pure logic + local file scaffolding only.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const cli = require('../bin/cli.js');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-cli-'));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
}

test('detectType: defaults to repo', () => {
  const d = tmp();
  assert.equal(cli.detectType(d, {}), 'repo');
});

test('detectType: --monorepo flag forces monorepo', () => {
  const d = tmp();
  assert.equal(cli.detectType(d, { monorepo: true }), 'monorepo');
});

test('detectType: --repo flag overrides workspaces', () => {
  const d = tmp();
  writeJson(path.join(d, 'package.json'), { workspaces: ['packages/*'] });
  assert.equal(cli.detectType(d, { repo: true }), 'repo');
});

test('detectType: workspaces package.json => monorepo', () => {
  const d = tmp();
  writeJson(path.join(d, 'package.json'), { workspaces: ['packages/*'] });
  assert.equal(cli.detectType(d, {}), 'monorepo');
});

test('detectType: apps + packages dirs => monorepo', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, 'apps'));
  fs.mkdirSync(path.join(d, 'packages'));
  assert.equal(cli.detectType(d, {}), 'monorepo');
});

test('scopeFiles: no env returns every file', () => {
  const files = ['AGENTS.md', '.claude/a.md', '.cursor/a.md', '.github/a.md', '.opencode/a.md', 'docs/x.md'];
  assert.equal(cli.scopeFiles(files, undefined).length, files.length);
});

test('scopeFiles: cursor env keeps only .cursor + shared', () => {
  const files = ['AGENTS.md', '.claude/a.md', '.cursor/a.md', '.github/a.md', '.opencode/a.md', 'docs/x.md'];
  const scoped = cli.scopeFiles(files, 'cursor');
  assert.ok(scoped.includes('.cursor/a.md'), 'keeps .cursor');
  assert.ok(scoped.includes('AGENTS.md'), 'keeps shared AGENTS.md');
  assert.ok(!scoped.includes('.claude/a.md'), 'drops .claude');
  assert.ok(!scoped.includes('.github/a.md'), 'drops .github');
  assert.ok(!scoped.includes('.opencode/a.md'), 'drops .opencode');
});

test('scopeFiles: unknown env returns every file', () => {
  const files = ['.claude/a.md', '.cursor/a.md'];
  assert.equal(cli.scopeFiles(files, 'bogus').length, files.length);
});

test('install: scaffolds repo template and is idempotent', () => {
  const d = tmp();
  const r1 = cli.cmdInstall(d, {});
  assert.ok(r1.copied > 0, 'should copy files');
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')), 'AGENTS.md present');
  assert.ok(fs.existsSync(path.join(d, '.claude')), '.claude present');
  assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')), 'handoff written');
  const r2 = cli.cmdInstall(d, {});
  assert.equal(r2.copied, 0, 'second run copies nothing');
});

test('install: --env cursor scaffolds only cursor + shared', () => {
  const d = tmp();
  cli.cmdInstall(d, { env: 'cursor' });
  assert.ok(fs.existsSync(path.join(d, '.cursor')), '.cursor present');
  assert.ok(!fs.existsSync(path.join(d, '.claude')), '.claude absent');
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')), 'shared AGENTS.md present');
});

test('install: --force overwrites modified files', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const f = path.join(d, 'AGENTS.md');
  fs.writeFileSync(f, 'changed-by-user');
  const r = cli.cmdInstall(d, { force: true });
  assert.ok(r.copied > 0, 'force re-copies');
  assert.notEqual(fs.readFileSync(f, 'utf8'), 'changed-by-user', 'file restored');
});

test('doctor: no missing files right after install', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const res = cli.cmdDoctor(d, {});
  assert.equal(res.missingFiles.length, 0, 'nothing missing');
});

test('doctor: detects a removed template file', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  fs.rmSync(path.join(d, 'AGENTS.md'));
  const res = cli.cmdDoctor(d, {});
  assert.ok(res.missingFiles.includes('AGENTS.md'), 'reports missing AGENTS.md');
});

test('scanPlaceholders: finds unresolved placeholders', () => {
  const d = tmp();
  const f = path.join(d, 'sample.md');
  fs.writeFileSync(f, 'Project: {{PROJECT_NAME}}');
  assert.deepEqual(cli.scanPlaceholders(d, ['sample.md']), ['sample.md']);
});

test('scanPlaceholders: ignores resolved text', () => {
  const d = tmp();
  const f = path.join(d, 'sample.md');
  fs.writeFileSync(f, 'Project: MyApp');
  assert.equal(cli.scanPlaceholders(d, ['sample.md']).length, 0);
});

test('doctor: reports unresolved placeholders', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const f = path.join(d, 'AGENTS.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8') + '\nProject: {{PROJECT_NAME}}\n');
  const res = cli.cmdDoctor(d, {});
  assert.ok(res.placeholders.includes('AGENTS.md'), 'flags placeholder');
});

test('patch: ensures files present and re-emits handoff', () => {
  const d = tmp();
  const r = cli.cmdPatch(d, {});
  assert.ok(r.copied > 0, 'copied files');
  assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')), 'handoff present');
});

test('mergeStarterScripts: adds ai:* scripts', () => {
  const pkg = cli.mergeStarterScripts({ name: 'x' });
  assert.equal(pkg.scripts['ai:install'], 'nitm-ai-dev-toolkit install');
  assert.equal(pkg.scripts['ai:patch'], 'nitm-ai-dev-toolkit patch');
  assert.equal(pkg.scripts['ai:upgrade'], 'nitm-ai-dev-toolkit upgrade');
  assert.equal(pkg.scripts['ai:doctor'], 'nitm-ai-dev-toolkit doctor');
});

test('mergeStarterScripts: preserves existing scripts', () => {
  const pkg = cli.mergeStarterScripts({ name: 'x', scripts: { build: 'tsc' } });
  assert.equal(pkg.scripts.build, 'tsc');
  assert.equal(pkg.scripts['ai:install'], 'nitm-ai-dev-toolkit install');
});

test('parseFlags: parses env, monorepo, force, positional', () => {
  const f = cli.parseFlags(['install', '--env', 'cursor', '--monorepo', '--force']);
  assert.equal(f._[0], 'install');
  assert.equal(f.env, 'cursor');
  assert.equal(f.monorepo, true);
  assert.equal(f.force, true);
});

test('parseFlags: supports --env=val form', () => {
  const f = cli.parseFlags(['doctor', '--env=opencode']);
  assert.equal(f.env, 'opencode');
});

test('envHeader: generic when no env (mentions auto-detect)', () => {
  const h = cli.envHeader('repo', undefined);
  assert.match(h, /auto-detects/);
});

test('envHeader: tailored when env given', () => {
  const h = cli.envHeader('repo', 'claude');
  assert.match(h, /Claude Code/);
});
