'use strict';

// Focused tests for the install/patch/upgrade workflow: dry runs, group selection,
// persisted selection, handoff, version, manifest and stale-file safety.
// Run with: npm test  (node --test). No network: upgrade tests inject npm and spawn stubs.

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cli = require('../bin/cli.js');

const SRC = path.join(__dirname, '..', 'src');
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
const FIXTURE = path.join(__dirname, 'data', 'ponytail-3.0.23.mjs.fixture');
const BOOTSTRAP_SRC = path.join(SRC, 'repo', '.claude', 'prompt-snippets', 'bootstrap.md');
const EXCLUDED = ['factory', 'prisma', 'bkt-cli', 'gh-cli', 'codex'];

function tmp(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-flow-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

function sha(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

// Every file and directory under root, with content hashes. Directories end in '/'.
function snapshot(root) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (e.isDirectory()) {
        out[rel + '/'] = '';
        walk(p);
      } else {
        out[rel] = sha(p);
      }
    }
  };
  walk(root);
  return out;
}

function listFiles(root) {
  return Object.keys(snapshot(root)).filter((k) => !k.endsWith('/')).sort();
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

// npm stub: `npm view <spec> <field>` returns the given text and is recorded as "<spec> <field>" in .queries.
function fakeNpm(text) {
  const fn = (spec, field) => { fn.queries.push(`${spec} ${field}`); return text; };
  fn.queries = [];
  return fn;
}

// ---- dry runs ----

test('dry-run install: lists adds, writes nothing, exits 0 on an empty repo', (t) => {
  const d = tmp(t);
  const before = snapshot(d);
  const r = run(() => cli.cmdInstall(d, { repo: true, dryRun: true }));
  assert.deepEqual(snapshot(d), before);
  assert.equal(r.exitCode, 0);
  assert.ok(r.result.planned.add > 0);
  assert.equal(r.result.planned.overwrite + r.result.planned.conflict, 0);
  assert.equal(r.result.copied, 0);
  assert.match(r.out, /Would add \(\d+\):/);
  assert.match(r.out, /\.nitm\/BOOTSTRAP\.md: create/);
});

test('dry-run install: existing files are conflicts (exit 1); --force lists overwrites instead', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.writeFileSync(path.join(d, 'AGENTS.md'), 'mine');
  const before = snapshot(d);
  const plain = run(() => cli.cmdInstall(d, { repo: true, dryRun: true }));
  assert.deepEqual(snapshot(d), before);
  assert.equal(plain.exitCode, 1);
  assert.ok(plain.result.conflicts > 0);
  assert.match(plain.out, /- AGENTS\.md \(exists\)/);
  const forced = run(() => cli.cmdInstall(d, { repo: true, force: true, dryRun: true }));
  assert.deepEqual(snapshot(d), before);
  assert.equal(forced.exitCode, 0);
  assert.ok(forced.result.planned.overwrite > 0);
  assert.equal(forced.result.planned.conflict, 0);
});

test('dry-run patch: lists adds and skips, writes nothing', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, 'AGENTS.md'));
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), 'mine');
  const before = snapshot(d);
  const r = run(() => cli.cmdPatch(d, { repo: true, dryRun: true }));
  assert.deepEqual(snapshot(d), before);
  assert.equal(r.exitCode, 0);
  assert.equal(r.result.planned.add, 1);
  assert.ok(r.result.skipped > 0);
  assert.match(r.out, /Would add \(1\):\n\s+- AGENTS\.md/);
  assert.match(r.out, /- CLAUDE\.md \(kept, differs from template\)/);
});

test('dry-run and real patch: a file where a directory must go is a conflict, never overwritten', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.rmSync(path.join(d, 'docs'), { recursive: true, force: true });
  fs.writeFileSync(path.join(d, 'docs'), 'a file, not a directory');
  const before = snapshot(d);
  const dry = run(() => cli.cmdPatch(d, { repo: true, dryRun: true }));
  assert.deepEqual(snapshot(d), before);
  assert.equal(dry.exitCode, 1);
  assert.ok(dry.result.conflicts > 0);
  const real = run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(real.exitCode, 1);
  assert.equal(fs.readFileSync(path.join(d, 'docs'), 'utf8'), 'a file, not a directory');
});

test('dry-run never persists the selection', (t) => {
  const d = tmp(t);
  const before = snapshot(d);
  run(() => cli.cmdInstall(d, { repo: true, dryRun: true, exclude: ['factory'] }));
  assert.deepEqual(snapshot(d), before);
  assert.equal(fs.existsSync(path.join(d, '.nitm')), false);
});

// ---- upgrade: pinned version, dry run ----

test('upgrade --dry-run: resolves and pins the version, runs its dry run, writes nothing', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const before = snapshot(d);
  const calls = [];
  const npmView = fakeNpm('5.0.1\n');
  const spawn = (cmd, args, opts) => { calls.push({ cmd, args, cwd: opts.cwd }); return { status: 0 }; };
  const r = run(() => cli.cmdUpgrade(d, { _: ['upgrade'], dryRun: true }, { npmView, spawn }));
  assert.deepEqual(snapshot(d), before);
  assert.deepEqual(npmView.queries, ['nitm-ai-dev-toolkit dist-tags.latest']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].cmd, 'npx');
  assert.deepEqual(calls[0].args, ['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'patch', '--dry-run']);
  assert.equal(calls[0].cwd, d);
  assert.match(r.out, /Resolved nitm-ai-dev-toolkit@5\.0\.1/);
  assert.match(r.out, /Dry run complete; nothing was written/);
  assert.equal(r.exitCode, 0);
});

test('upgrade --dry-run refuses a version that has no dry run, before running anything', (t) => {
  const d = tmp(t);
  const calls = [];
  const spawn = (...a) => { calls.push(a); return { status: 0 }; };
  assert.throws(() => run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.0'], dryRun: true },
    { npmView: fakeNpm('5.0.0\n'), spawn })), /needs nitm-ai-dev-toolkit >= 5\.0\.1/);
  assert.equal(calls.length, 0);
});

test('upgrade: forwards selection flags to the pinned run', () => {
  const args = cli.upgradeArgs({ exclude: ['factory', 'codex'], only: [] }, '5.0.1');
  assert.deepEqual(args, ['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'patch', '--exclude', 'factory,codex', '--only', '']);
});

test('upgrade: accepts an exact version as argument, upgrade@version, or --version', () => {
  assert.equal(cli.parseUpgradeTarget({ _: ['upgrade'] }), undefined);
  assert.equal(cli.parseUpgradeTarget({ _: ['upgrade', '5.0.1'] }), '5.0.1');
  assert.equal(cli.parseUpgradeTarget({ _: ['upgrade', 'nitm-ai-dev-toolkit@5.0.1'] }), '5.0.1');
  assert.equal(cli.parseUpgradeTarget({ _: ['upgrade'], version: '5.0.1-beta.2' }), '5.0.1-beta.2');
});

test('upgrade: refuses ranges, tags, unknown extras and two versions at once', () => {
  for (const args of [['upgrade', 'latest'], ['upgrade', 'nitm-ai-dev-toolkit@latest'], ['upgrade', '^5.0.0'], ['upgrade', '5']]) {
    assert.throws(() => cli.parseUpgradeTarget({ _: args }), /Pin an exact version/, args.join(' '));
  }
  assert.throws(() => cli.parseUpgradeTarget({ _: ['upgrade', '5.0.1'], version: '5.0.2' }), /once/);
  assert.throws(() => cli.parseUpgradeTarget({ _: ['upgrade', '5.0.1', 'extra'] }), /Unknown option/);
});

test('upgrade: resolves the requested version against npm, or the latest dist-tag', () => {
  const npm = fakeNpm("nitm-ai-dev-toolkit@5.0.1 '5.0.1'\n");
  assert.equal(cli.resolveUpgradeVersion('5.0.1', npm), '5.0.1');
  assert.deepEqual(npm.queries, ['nitm-ai-dev-toolkit@5.0.1 version']);
  const latest = fakeNpm('5.0.3\n');
  assert.equal(cli.resolveUpgradeVersion(undefined, latest), '5.0.3');
  assert.deepEqual(latest.queries, ['nitm-ai-dev-toolkit dist-tags.latest']);
  assert.throws(() => cli.resolveUpgradeVersion('9.9.9', fakeNpm('')), /not published/);
  assert.throws(() => cli.resolveUpgradeVersion(undefined, fakeNpm('latest\n')), /no usable latest/);
});

test('upgrade: the real run pins the resolved version and prints it first', (t) => {
  const d = tmp(t);
  const calls = [];
  const spawn = (cmd, args) => { calls.push(args); return { status: 0 }; };
  const r = run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.1'] }, { npmView: fakeNpm('5.0.1'), spawn }));
  assert.deepEqual(calls, [['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'patch']]);
  assert.match(r.out, /Resolved nitm-ai-dev-toolkit@5\.0\.1/);
  assert.ok(calls.every((args) => !args.some((a) => a.includes('@latest'))));
});

// ---- group selection ----

test('install --exclude removes only the named groups; shared files stay', (t) => {
  const full = tmp(t);
  const ex = tmp(t);
  run(() => cli.cmdInstall(full, { repo: true }));
  run(() => cli.cmdInstall(ex, { repo: true, exclude: EXCLUDED }));
  // .nitm/ holds the install state (handoff, manifest, saved selection), not template files.
  const all = listFiles(full).filter((f) => !f.startsWith('.nitm/'));
  const kept = listFiles(ex).filter((f) => !f.startsWith('.nitm/'));
  const removed = all.filter((f) => !kept.includes(f));
  assert.ok(removed.length > 0);
  assert.deepEqual(kept.filter((f) => !all.includes(f)), []);
  for (const f of removed) assert.match(f, /factory|prisma|bkt-cli|gh-cli|^\.codex\//, f);
  for (const rel of ['factory/README.md', '.codex/config.toml', '.agents/skills/bkt-cli/SKILL.md',
    '.claude/rules/prisma-migrations.md']) {
    assert.ok(all.includes(rel), `${rel} is in the full install`);
    assert.ok(!kept.includes(rel), `${rel} is excluded`);
  }
  for (const rel of ['AGENTS.md', '.claude/prompt-snippets/bootstrap.md', '.agents/skills/ponytail/SKILL.md']) {
    assert.ok(kept.includes(rel), `${rel} is kept`);
  }
  assert.deepEqual(run(() => cli.cmdDoctor(ex, { repo: true, exclude: EXCLUDED })).result.missingFiles, []);
});

test('install --only keeps the named groups plus shared files', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true, only: ['codex'] }));
  const files = listFiles(d);
  assert.ok(files.includes('.codex/config.toml'));
  assert.ok(files.includes('AGENTS.md'));
  assert.ok(files.includes('.agents/skills/ponytail/SKILL.md'));
  assert.ok(!files.some((f) => f.startsWith('factory/')));
  assert.ok(!files.some((f) => f.startsWith('.cursor/')));
  assert.ok(!files.some((f) => f.startsWith('.vscode/')));
  assert.ok(!files.some((f) => f.startsWith('.claude/commands/')));
});

test('persisted selection: saved by install, applied by patch and doctor, cleared by an explicit empty list', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true, exclude: ['factory'] }));
  const configPath = path.join(d, '.nitm', 'toolkit.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')), { exclude: ['factory'], only: [] });
  assert.equal(fs.existsSync(path.join(d, 'factory')), false);

  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(patched.result.planned.add, 0);
  assert.equal(fs.existsSync(path.join(d, 'factory')), false);

  const doc = run(() => cli.cmdDoctor(d, { repo: true }));
  assert.deepEqual(doc.result.missingFiles, []);
  assert.deepEqual(doc.result.selection.exclude, ['factory']);
  assert.match(doc.out, /Selection \(\.nitm[\\/]toolkit\.json\): exclude \[factory\]/);

  const cleared = run(() => cli.cmdPatch(d, { repo: true, exclude: [] }));
  assert.ok(cleared.result.planned.add > 0);
  assert.ok(fs.existsSync(path.join(d, 'factory', 'README.md')));
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')), { exclude: [], only: [] });
});

test('unknown groups are refused before any write', (t) => {
  const d = tmp(t);
  const before = snapshot(d);
  assert.throws(() => run(() => cli.cmdInstall(d, { repo: true, exclude: ['nope'] })),
    /Unknown group "nope" for --exclude/);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true, only: ['bogus'] })),
    /Unknown group "bogus" for --only/);
  assert.deepEqual(snapshot(d), before);
});

test('parseFlags: --exclude/--only take comma lists, an empty value clears; --version pins', () => {
  assert.deepEqual(cli.parseFlags(['patch', '--exclude', 'factory,prisma']).exclude, ['factory', 'prisma']);
  assert.deepEqual(cli.parseFlags(['patch', '--only=codex, cursor']).only, ['codex', 'cursor']);
  assert.deepEqual(cli.parseFlags(['patch', '--exclude', '']).exclude, []);
  assert.equal(cli.parseFlags(['upgrade', '--version', '5.0.1']).version, '5.0.1');
  assert.equal(cli.parseFlags(['upgrade', '--version=5.0.1']).version, '5.0.1');
  assert.throws(() => cli.parseFlags(['patch', '--exclude']), /requires a value/);
  assert.throws(() => cli.parseFlags(['upgrade', '--version']), /requires a value/);
});

// ---- handoff, version, manifest ----

test('handoff: rewritten only when it differs; the previous copy is backed up, and repeat runs are no-ops', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const handoff = path.join(d, '.nitm', 'BOOTSTRAP.md');
  const first = snapshot(d);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.deepEqual(snapshot(d), first);
  assert.equal(fs.existsSync(path.join(d, '.nitm', 'backups')), false);

  fs.writeFileSync(handoff, 'user edited handoff\n');
  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  const backups = fs.readdirSync(path.join(d, '.nitm', 'backups'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(d, '.nitm', 'backups', backups[0]), 'utf8'), 'user edited handoff\n');
  assert.equal(fs.readFileSync(handoff, 'utf8'),
    cli.envHeader('repo', undefined) + '\n\n' + fs.readFileSync(BOOTSTRAP_SRC, 'utf8'));
  assert.match(patched.out, /backed up to \.nitm[\\/]backups[\\/]/);

  const again = snapshot(d);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.deepEqual(snapshot(d), again);
});

test('.toolkit-version: written by install and patch, mismatch and missing reported by doctor', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const versionFile = path.join(d, '.toolkit-version');
  assert.equal(fs.readFileSync(versionFile, 'utf8'), PKG_VERSION + '\n');
  const matched = run(() => cli.cmdDoctor(d, { repo: true }));
  assert.equal(matched.result.version.status, 'match');
  assert.match(matched.out, /matches toolkit/);

  fs.writeFileSync(versionFile, '4.0.0\n');
  const mismatch = run(() => cli.cmdDoctor(d, { repo: true }));
  assert.equal(mismatch.result.version.status, 'mismatch');
  assert.match(mismatch.out, /\.toolkit-version is 4\.0\.0, toolkit is /);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.readFileSync(versionFile, 'utf8'), PKG_VERSION + '\n');

  fs.rmSync(versionFile);
  assert.equal(run(() => cli.cmdDoctor(d, { repo: true })).result.version.status, 'missing');
  run(() => cli.cmdPatch(d, { repo: true }));
  const settled = snapshot(d);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.deepEqual(snapshot(d), settled);
});

test('manifest: records owned template paths and hashes; a user-changed file is not recorded as owned', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.toolkit, PKG_VERSION);
  const expected = {};
  for (const rel of cli.templateFiles('repo')) {
    expected[cli.installName(rel)] = sha(path.join(SRC, 'repo', rel));
  }
  assert.deepEqual(manifest.files, expected);

  const bytes = fs.readFileSync(manifestPath, 'utf8');
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), bytes);

  fs.writeFileSync(path.join(d, 'AGENTS.md'), 'mine');
  run(() => cli.cmdPatch(d, { repo: true }));
  const after = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(after.files['AGENTS.md'], expected['AGENTS.md']);
  assert.deepEqual(run(() => cli.cmdDoctor(d, { repo: true })).result.customized, ['AGENTS.md']);
});

// ---- stale toolkit files: flagged, never deleted ----

test('known historical hash matches the recovered 3.0.23 template fixture', () => {
  assert.equal(sha(FIXTURE), cli.KNOWN_HISTORICAL['.opencode/plugins/ponytail.mjs'][0]);
});

test('stale: a file matching the historical ponytail.mjs is reported by doctor and patch, never deleted', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const plugin = path.join(d, '.opencode', 'plugins', 'ponytail.mjs');
  fs.mkdirSync(path.dirname(plugin), { recursive: true });
  fs.copyFileSync(FIXTURE, plugin);
  const custom = path.join(d, '.opencode', 'plugins', 'custom.mjs');
  fs.writeFileSync(custom, 'export default () => {};\n');
  const rel = path.join('.opencode', 'plugins', 'ponytail.mjs');

  const doc = run(() => cli.cmdDoctor(d, { repo: true }));
  assert.deepEqual(doc.result.stale, [rel]);
  assert.match(doc.out, /stale toolkit file/);

  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  assert.deepEqual(patched.result.stale, [rel]);
  assert.equal(patched.exitCode, 0);
  assert.equal(sha(plugin), cli.KNOWN_HISTORICAL['.opencode/plugins/ponytail.mjs'][0]);
  assert.equal(fs.readFileSync(custom, 'utf8'), 'export default () => {};\n');
});

test('stale: a user file at the same path with different content is never flagged or touched', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const plugin = path.join(d, '.opencode', 'plugins', 'ponytail.mjs');
  fs.mkdirSync(path.dirname(plugin), { recursive: true });
  fs.writeFileSync(plugin, '// my own plugin\n');
  assert.deepEqual(run(() => cli.cmdDoctor(d, { repo: true })).result.stale, []);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.readFileSync(plugin, 'utf8'), '// my own plugin\n');
});

// ---- doctor placeholder allowlist ----

test('doctor: intentional placeholders in docs/, bootstrap*.md, constitution.md, create-skill.md are not flagged', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  for (const rel of ['.claude/prompt-snippets/bootstrap.md', '.claude/prompt-snippets/constitution.md',
    '.claude/prompt-snippets/create-skill.md', 'docs/api/README.md']) {
    assert.match(fs.readFileSync(path.join(d, rel), 'utf8'), /\{\{[A-Z]/, `${rel} ships placeholders`);
  }
  const res = run(() => cli.cmdDoctor(d, { repo: true })).result;
  for (const f of res.placeholders) {
    assert.ok(!/(^|[\\/])(bootstrap[^\\/]*\.md|constitution\.md|create-skill\.md)$/.test(f) && !f.startsWith('docs'), f);
  }
  fs.appendFileSync(path.join(d, 'AGENTS.md'), '\nProject: {{PROJECT_NAME}}\n');
  assert.ok(run(() => cli.cmdDoctor(d, { repo: true })).result.placeholders.includes('AGENTS.md'));
});

// ---- review fixes ----

test('saved selection: a config that exists but does not parse throws before any write', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true, exclude: ['factory'] }));
  fs.writeFileSync(path.join(d, '.nitm', 'toolkit.json'), '{ "exclude": ["factory"'); // truncated JSON
  fs.rmSync(path.join(d, 'factory'), { recursive: true, force: true });
  const before = snapshot(d);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /not valid JSON/);
  assert.deepEqual(snapshot(d), before);
  assert.throws(() => run(() => cli.cmdInstall(d, { repo: true, dryRun: true })), /not valid JSON/);
  assert.throws(() => run(() => cli.cmdDoctor(d, { repo: true })), /not valid JSON/);
  assert.equal(fs.existsSync(path.join(d, 'factory')), false);
});

test('--exclude and --only together are refused before any write', (t) => {
  const d = tmp(t);
  const before = snapshot(d);
  const msg = /Use either --exclude or --only, not both/;
  assert.throws(() => run(() => cli.cmdInstall(d, { repo: true, exclude: ['factory'], only: ['codex'] })), msg);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true, exclude: [], only: [] })), msg);
  assert.throws(() => run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.1'], exclude: [], only: [] },
    { npmView: fakeNpm('5.0.1'), spawn: () => ({ status: 0 }) })), msg);
  assert.deepEqual(snapshot(d), before);
});

test('upgrade: a target below 5.0.1 is refused before spawning when a selection is active', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true, exclude: ['factory'] }));
  const calls = [];
  const spawn = (...a) => { calls.push(a); return { status: 0 }; };
  // saved selection
  assert.throws(() => run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.0'] },
    { npmView: fakeNpm('5.0.0'), spawn })), /predates --exclude\/--only[\s\S]*selection saved in \.nitm/);
  // flag selection
  assert.throws(() => run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.0'], only: ['codex'] },
    { npmView: fakeNpm('5.0.0'), spawn })), /predates --exclude\/--only[\s\S]*you passed/);
  assert.equal(calls.length, 0);
  // a version that understands selections is not gated
  const ok5 = run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.1'] }, { npmView: fakeNpm('5.0.1'), spawn }));
  assert.equal(ok5.exitCode, 0);
  assert.equal(calls.length, 1);
});

test('upgrade: an explicit empty selection clears the saved one for an older target, then runs', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true, exclude: ['factory'] }));
  const calls = [];
  const spawn = (cmd, args) => { calls.push(args); return { status: 0 }; };
  const r = run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.0'], exclude: [] },
    { npmView: fakeNpm('5.0.0'), spawn }));
  assert.equal(r.exitCode, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(d, '.nitm', 'toolkit.json'), 'utf8')), { exclude: [], only: [] });
  assert.equal(calls.length, 1);
});

test('compareVersions: a prerelease of X sorts below X, and prerelease identifiers compare per semver', () => {
  assert.ok(cli.compareVersions('5.0.1-beta.0', '5.0.1') < 0);
  assert.ok(cli.compareVersions('5.0.1', '5.0.1-beta.0') > 0);
  assert.equal(cli.compareVersions('5.0.1-beta.0', '5.0.1-beta.0'), 0);
  assert.ok(cli.compareVersions('5.0.1-alpha', '5.0.1-beta') < 0);
  assert.ok(cli.compareVersions('5.0.1-beta.2', '5.0.1-beta.10') < 0);
  assert.ok(cli.compareVersions('5.0.1-1', '5.0.1-alpha') < 0);
  assert.ok(cli.compareVersions('5.0.0', '5.0.1-beta.0') < 0);
  assert.ok(cli.compareVersions('5.0.1', '5.0.1') === 0);
});

test('upgrade --dry-run: a prerelease below 5.0.1 is refused as having no dry run', (t) => {
  const d = tmp(t);
  const calls = [];
  assert.throws(() => run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.1-beta.0'], dryRun: true },
    { npmView: fakeNpm('5.0.1-beta.0'), spawn: (...a) => { calls.push(a); return { status: 0 }; } })),
  /needs nitm-ai-dev-toolkit >= 5\.0\.1/);
  assert.equal(calls.length, 0);
});

test('upgrade: npm is queried with argv, and crafted versions are refused before any query', () => {
  for (const v of ['5.0.1;rm -rf ~', '5.0.1 $(id)', '5.0.1`id`', '^5.0.0']) {
    const npm = fakeNpm('5.0.1');
    assert.throws(() => cli.resolveUpgradeVersion(v, npm), /Pin an exact version/, v);
    assert.throws(() => cli.parseUpgradeTarget({ _: ['upgrade', v] }), /Pin an exact version/, v);
    assert.deepEqual(npm.queries, []);
  }
});

test('omo-slim-starter install --dry-run prints the command and runs nothing', (t) => {
  const d = tmp(t);
  const before = snapshot(d);
  const r = run(() => cli.cmdOmoStarter(d, { _: ['omo-slim-starter', 'install'], dryRun: true }));
  assert.match(r.out, /would run `npx --yes nitm-opencode-starter install`/);
  assert.deepEqual(snapshot(d), before);
});

test('upgrade dry run that finds conflicts reports that, not a failed upgrade', (t) => {
  const d = tmp(t);
  const r = run(() => cli.cmdUpgrade(d, { _: ['upgrade', '5.0.1'], dryRun: true },
    { npmView: fakeNpm('5.0.1'), spawn: () => ({ status: 1 }) }));
  assert.match(r.out, /dry run found conflicts/);
  assert.doesNotMatch(r.out, /Upgrade failed/);
  assert.equal(r.exitCode, 1);
});

test('backups: a second replacement in the same millisecond gets a new name, earlier backups survive', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const handoff = path.join(d, '.nitm', 'BOOTSTRAP.md');
  const realIso = Date.prototype.toISOString;
  Date.prototype.toISOString = () => '2026-01-01T00:00:00.000Z'; // fixed stamp: every backup collides
  t.after(() => { Date.prototype.toISOString = realIso; });
  fs.writeFileSync(handoff, 'first edit\n');
  run(() => cli.cmdPatch(d, { repo: true }));
  fs.writeFileSync(handoff, 'second edit\n');
  run(() => cli.cmdPatch(d, { repo: true }));
  const backups = fs.readdirSync(path.join(d, '.nitm', 'backups')).sort();
  assert.equal(backups.length, 2);
  const contents = backups.map((b) => fs.readFileSync(path.join(d, '.nitm', 'backups', b), 'utf8')).sort();
  assert.deepEqual(contents, ['first edit\n', 'second edit\n']);
});

test('customizedOwned: manifest keys that are absolute or escape the target are ignored; keys use /', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const outside = path.join(path.dirname(d), `outside-${process.pid}.md`);
  fs.writeFileSync(outside, 'outside');
  t.after(() => fs.rmSync(outside, { force: true }));
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files['../' + path.basename(outside)] = 'x';
  manifest.files[outside] = 'x';
  manifest.files['AGENTS.md'] = 'not-the-hash';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const customized = run(() => cli.cmdDoctor(d, { repo: true })).result.customized;
  assert.deepEqual(customized, ['AGENTS.md']);
});

test('help: keeps the factory archive/prune --dry-run line and lists --exclude/--only on install', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'cli.js'), '--help'], { encoding: 'utf8' });
  assert.match(r.stdout, /factory archive\/prune: list only, change nothing/);
  assert.match(r.stdout, /install \[.*--exclude <groups>\|--only <groups>\]/);
  assert.match(r.stdout, /Feature groups apply everywhere, including factory\//);
});

test('regression: a dry run after a manual downgrade leaves handoff, version, manifest and no backups untouched', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.writeFileSync(path.join(d, '.nitm', 'BOOTSTRAP.md'), 'edited handoff\n');
  fs.writeFileSync(path.join(d, '.toolkit-version'), '4.0.0\n');
  fs.rmSync(path.join(d, '.nitm', 'manifest.json'));
  const before = snapshot(d);
  const patchDry = run(() => cli.cmdPatch(d, { repo: true, exclude: ['factory'], dryRun: true }));
  assert.equal(patchDry.exitCode, 0);
  assert.deepEqual(snapshot(d), before);
  const forceDry = run(() => cli.cmdInstall(d, { repo: true, force: true, dryRun: true }));
  assert.ok(forceDry.result.planned.overwrite > 0);
  assert.deepEqual(snapshot(d), before);
  assert.equal(fs.existsSync(path.join(d, '.nitm', 'backups')), false);
  assert.equal(fs.readFileSync(path.join(d, '.nitm', 'BOOTSTRAP.md'), 'utf8'), 'edited handoff\n');
});

test('regression: install without --force leaves existing file content unchanged', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  fs.writeFileSync(path.join(d, 'AGENTS.md'), 'my own agents file\n');
  assert.throws(() => run(() => cli.cmdInstall(d, { repo: true })), /conflicting files/);
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), 'my own agents file\n');
});

// ---- removed factory-* agents (5.1.0): flagged as stale, never deleted ----

const FACTORY_FIXTURE = path.join(__dirname, 'data', 'factory-builder.agent.md');
const REMOVED_FACTORY = ['spec-writer', 'builder', 'reviewer-code', 'reviewer-security', 'reviewer-ux', 'reviewer-ui', 'approver']
  .flatMap(name => [
    `.claude/agents/factory-${name}.agent.md`,
    `.cursor/agents/factory-${name}.agent.md`,
    `.github/agents/factory-${name}.agent.md`,
    `.opencode/agents/factory-${name}.md`,
    `.claude/agents-snippets/factory-${name}.md`,
  ]);

test('removed factory-* files are known historical files, one set per harness path', () => {
  assert.equal(REMOVED_FACTORY.length, 35);
  for (const key of REMOVED_FACTORY) assert.ok(cli.KNOWN_HISTORICAL[key], `${key} is known historical`);
  assert.equal(Object.keys(cli.KNOWN_HISTORICAL).filter(key => key.includes('factory-')).length, 35);
});

test('removed factory-* files are not shipped by either template', () => {
  for (const type of ['repo', 'monorepo']) {
    for (const key of REMOVED_FACTORY) {
      assert.ok(!fs.existsSync(path.join(SRC, type, ...key.split('/'))), `${type}/${key} must not ship`);
    }
  }
});

test('stale: a leftover factory-builder agent from 5.0.0 is reported by doctor and patch, never deleted', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const rel = '.claude/agents/factory-builder.agent.md';
  const leftover = path.join(d, ...rel.split('/'));
  fs.mkdirSync(path.dirname(leftover), { recursive: true });
  fs.copyFileSync(FACTORY_FIXTURE, leftover);
  assert.ok(cli.KNOWN_HISTORICAL[rel].includes(sha(FACTORY_FIXTURE)), 'fixture matches the 5.0.0 hash');

  const doc = run(() => cli.cmdDoctor(d, { repo: true }));
  assert.deepEqual(doc.result.stale, [path.join(...rel.split('/'))]);
  assert.match(doc.out, /stale toolkit file/);

  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  assert.deepEqual(patched.result.stale, [path.join(...rel.split('/'))]);
  assert.equal(patched.exitCode, 0);
  assert.ok(fs.existsSync(leftover), 'stale file is left in place');
});

test('stale: a leftover 5.0.0 OpenCode factory-approver agent is reported by doctor', (t) => {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  const rel = '.opencode/agents/factory-approver.md';
  const fixture = path.join(__dirname, 'data', 'factory-approver-5.0.0.opencode.fixture');
  const leftover = path.join(d, ...rel.split('/'));
  fs.mkdirSync(path.dirname(leftover), { recursive: true });
  fs.copyFileSync(fixture, leftover);
  assert.ok(cli.KNOWN_HISTORICAL[rel].includes(sha(fixture)), 'fixture matches the 5.0.0 hash');

  const doc = run(() => cli.cmdDoctor(d, { repo: true }));
  assert.deepEqual(doc.result.stale, [path.join(...rel.split('/'))]);
  assert.ok(fs.existsSync(leftover), 'stale file is left in place');
});
