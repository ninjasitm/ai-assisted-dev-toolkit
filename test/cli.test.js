'use strict';

// Tests for the nitm-ai-dev-toolkit CLI.
// Run with: npm test  (node --test)
// No network: exercises the pure logic + local file scaffolding only.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cli = require('../bin/cli.js');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-cli-'));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
}
function captureOutput(fn) {
  const lines = [];
  const log = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = log;
  }
  return lines.join('\n');
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

test('install: scaffolds repo template', () => {
  const d = tmp();
  const r1 = cli.cmdInstall(d, {});
  assert.ok(r1.copied > 0, 'should copy files');
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')), 'AGENTS.md present');
  assert.ok(fs.existsSync(path.join(d, '.claude')), '.claude present');
  assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')), 'handoff written');
});

test('install: aborts when files already exist without --force', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  assert.throws(() => cli.cmdInstall(d, {}), /conflicting files/);
});

test('conflicts: reports existing scaffold files', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const cf = cli.conflicts('repo', d, undefined);
  assert.ok(cf.length > 0, 'detects installed files');
  assert.ok(cf.includes('AGENTS.md'), 'includes AGENTS.md');
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

test('patch: never overwrites existing files', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const f = path.join(d, 'AGENTS.md');
  fs.writeFileSync(f, 'changed-by-user');
  cli.cmdPatch(d, { force: true });
  assert.equal(fs.readFileSync(f, 'utf8'), 'changed-by-user');
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

test('envHeader: generic includes Codex and directs agents to the handoff file', () => {
  const h = cli.envHeader('repo', undefined);
  assert.match(h, /OpenAI Codex/);
  assert.match(h, /read and follow `\.nitm\/BOOTSTRAP\.md`/);
  assert.match(h, /no native `\/bootstrap` command is provided/);
  assert.doesNotMatch(h, /auto-detects your harness/);
});

test('envHeader: tailored when env given', () => {
  const h = cli.envHeader('repo', 'claude');
  assert.match(h, /Claude Code/);
});

test('scopeFiles: Codex keeps .codex, .agents, and shared files only', () => {
  const files = ['AGENTS.md', 'docs/x.md', '.codex/config.toml', '.agents/skills/a.md',
    '.claude/a.md', '.cursor/a.md', '.github/a.md', '.vscode/a.json', '.opencode/a.md'];
  assert.deepEqual(cli.ENV_DIRS.codex, ['.codex', '.agents']);
  assert.deepEqual(cli.scopeFiles(files, 'codex'), files.slice(0, 4));
  assert.deepEqual(cli.ENV_DIRS.claude, ['.claude', '.agents']);
  assert.deepEqual(cli.ENV_DIRS.copilot, ['.github', '.vscode']);
  assert.deepEqual(cli.ENV_DIRS.cursor, ['.cursor']);
  assert.deepEqual(cli.ENV_DIRS.opencode, ['.opencode']);
  for (const env of ['claude', 'copilot', 'cursor', 'opencode']) {
    assert.ok(!cli.scopeFiles(files, env).includes('.codex/config.toml'));
  }
});

for (const type of ['repo', 'monorepo']) {
  test(`install: default ${type} includes Codex and all other harnesses`, () => {
    const d = tmp();
    const output = captureOutput(() => cli.cmdInstall(d, { [type]: true }));
    assert.ok(fs.existsSync(path.join(d, '.codex', 'config.toml')));
    for (const dir of ['.agents', '.claude', '.github', '.vscode', '.cursor', '.opencode']) {
      assert.ok(fs.existsSync(path.join(d, dir)), `${dir} present`);
    }
    assert.match(output, /OpenAI Codex/);
    assert.match(output, /read and follow `\.nitm\/BOOTSTRAP\.md`/);
    assert.doesNotMatch(output, /auto-detects your harness/);
  });

  test(`install: scoped Codex ${type} has shared files and no other harness dirs`, () => {
    const d = tmp();
    const flags = { [type]: true, env: 'codex' };
    const output = captureOutput(() => cli.cmdInstall(d, flags));
    for (const rel of ['AGENTS.md', '.agents', '.codex/config.toml', '.nitm/BOOTSTRAP.md']) {
      assert.ok(fs.existsSync(path.join(d, rel)), `${rel} present`);
    }
    for (const dir of ['.claude', '.github', '.vscode', '.cursor', '.opencode']) {
      assert.ok(!fs.existsSync(path.join(d, dir)), `${dir} absent`);
    }
    const header = fs.readFileSync(path.join(d, '.nitm', 'BOOTSTRAP.md'), 'utf8');
    assert.ok(header.startsWith(cli.envHeader(type, 'codex')));
    assert.match(output, /tailored to OpenAI Codex/);
    assert.match(output, /read and follow \.nitm\/BOOTSTRAP\.md/);
    assert.match(output, /doctor --env codex/);
    assert.doesNotMatch(output, /\/bootstrap|auto-detects|Unknown --env/);
    assert.equal(cli.cmdDoctor(d, flags).missingFiles.length, 0);
    fs.rmSync(path.join(d, '.codex', 'config.toml'));
    let result;
    const doctorOutput = captureOutput(() => { result = cli.cmdDoctor(d, flags); });
    assert.deepEqual(result.missingFiles, [path.join('.codex', 'config.toml')]);
    assert.match(doctorOutput, /\.codex[\\/]config\.toml/);
  });

  test(`patch: scoped Codex ${type} adds missing files and preserves custom config with --force`, () => {
    const d = tmp();
    const flags = { [type]: true, env: 'codex', force: true };
    const first = cli.cmdPatch(d, flags);
    assert.ok(first.copied > 0);
    const config = path.join(d, '.codex', 'config.toml');
    assert.ok(fs.existsSync(config));
    const custom = '# User customization\nmodel = "user-selected-model"\n';
    fs.writeFileSync(config, custom);
    fs.rmSync(path.join(d, 'AGENTS.md'));
    fs.rmSync(path.join(d, '.nitm', 'BOOTSTRAP.md'));
    const patched = cli.cmdPatch(d, flags);
    assert.equal(patched.copied, 1);
    assert.equal(fs.readFileSync(config, 'utf8'), custom);
    assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')));
    assert.equal(cli.cmdDoctor(d, flags).missingFiles.length, 0);
  });
}

test('parseFlags: supports Codex in both env forms', () => {
  assert.equal(cli.parseFlags(['install', '--env', 'codex']).env, 'codex');
  assert.equal(cli.parseFlags(['doctor', '--env=codex']).env, 'codex');
});

test('envHeader: Codex reads the handoff file and uses scoped doctor', () => {
  const h = cli.envHeader('repo', 'codex');
  assert.match(h, /environment: OpenAI Codex/);
  assert.match(h, /read and follow \.nitm\/BOOTSTRAP\.md/);
  assert.match(h, /doctor --env codex/);
  assert.doesNotMatch(h, /\/bootstrap|auto-detects/);
});

test('help: lists Codex and truthful default and bootstrap instructions', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'cli.js'), '--help'],
    { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /claude\|codex\|copilot\|cursor\|opencode/);
  assert.match(r.stdout, /ALL environments, including OpenAI Codex/);
  assert.match(r.stdout, /read and follow \.nitm\/BOOTSTRAP\.md/);
  assert.match(r.stdout, /no native \/bootstrap command is provided/);
  assert.doesNotMatch(r.stdout, /auto-detects your harness/);
});
