'use strict';

// Focused CLI tests for patch review: --skip-path, the Review token (--expect), the write-time guards, strict
// manifest reads, handoff ownership, and flag and pin rules for patch and upgrade. Disposable ordinary-file
// fixtures only: no network, no npm, no hooks added to the CLI for tests.
// Run with: node --test test/patch-skip-review.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cli = require('../bin/cli.js');

const SRC = path.join(__dirname, '..', 'src');
const BOOTSTRAP_SRC = path.join(SRC, 'repo', '.claude', 'prompt-snippets', 'bootstrap.md');
const CLI_BIN = path.join(__dirname, '..', 'bin', 'cli.js');
const HANDOFF = '.nitm/BOOTSTRAP.md';
const ZERO_TOKEN = '0'.repeat(64);

function tmp(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-review-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

function sha(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function shaText(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function snapshot(root) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (e.isDirectory()) walk(p);
      else out[rel] = sha(p);
    }
  };
  walk(root);
  return out;
}

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

// Ordered list of the paths and kinds printed under "Writing N item(s)" / "Would write N item(s)".
function writesIn(out) {
  return [...out.matchAll(/^\s+\d+\. (\S+) \[(\w+)\]/gm)].map((m) => ({ path: m[1], kind: m[2] }));
}

function tokenIn(out) {
  const m = out.match(/Review token: ([0-9a-f]{64})/);
  return m ? m[1] : null;
}

function installedRepo(t) {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true }));
  return d;
}

// Runs fn with target writes observed. applyPatchReview opens each target with fs.openSync and writes it with
// fs.writeSync on that descriptor, so this seam maps descriptors back to their paths. `wrap(p, buf, orig)` runs
// once per target, before its first chunk; `orig()` performs the real write. Restored after.
function withWriteWrapper(wrap, fn) {
  const origOpen = fs.openSync;
  const origWrite = fs.writeSync;
  const paths = new Map();
  fs.openSync = (p, flags, ...rest) => {
    const fd = origOpen(p, flags, ...rest);
    if (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR)) paths.set(fd, String(p));
    else paths.delete(fd);
    return fd;
  };
  fs.writeSync = (fd, buf, off, len, pos) => {
    const p = paths.get(fd);
    const orig = () => origWrite(fd, buf, off, len, pos);
    if (p === undefined || off !== 0) return orig();
    return wrap(p, buf, orig);
  };
  try {
    return fn();
  } finally {
    fs.openSync = origOpen;
    fs.writeSync = origWrite;
  }
}

// Writes in the order the filesystem saw them, for the duration of fn.
function recordWrites(fn) {
  const seen = [];
  withWriteWrapper((p, buf, orig) => { seen.push(p); return orig(); }, fn);
  return seen;
}

// Fixture for the apply tests: a customised handoff, a saved selection, a locally edited instruction, one
// missing template file to add, and a missing skill directory that the operator will leave out.
function reviewFixture(t) {
  const d = tmp(t);
  run(() => cli.cmdInstall(d, { repo: true, exclude: ['factory'] }));
  fs.writeFileSync(path.join(d, HANDOFF), 'customised handoff\n');
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), 'locally edited instruction\n');
  fs.rmSync(path.join(d, 'AGENTS.md'));
  fs.rmSync(path.join(d, '.agents', 'skills', 'ponytail'), { recursive: true, force: true });
  return d;
}

// ---- handoff ownership and stock provenance ----

test('handoff: a byte-exact 5.3.1 stock handoff with no manifest entry is refreshed, whatever the marker says', (t) => {
  const d = installedRepo(t);
  const stock = 'stock 5.3.1 handoff\n';
  const release = cli.envHeader('repo', undefined) + '\n\n' + fs.readFileSync(BOOTSTRAP_SRC, 'utf8');
  const original = cli.STOCK_HANDOFF_5_3_1['repo:all'];
  cli.STOCK_HANDOFF_5_3_1['repo:all'] = shaText(stock);
  t.after(() => { cli.STOCK_HANDOFF_5_3_1['repo:all'] = original; });
  fs.writeFileSync(path.join(d, HANDOFF), stock);
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  delete manifest.files[HANDOFF];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));

  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.4.3\n');
  const owned = run(() => cli.cmdPatch(d, { repo: true }));
  assert.match(owned.out, /refreshed to this release/);
  assert.equal(fs.readFileSync(path.join(d, HANDOFF), 'utf8'), release);
});

test('handoff: a recorded manifest entry is authoritative; a stock match does not override a mismatch', (t) => {
  const d = installedRepo(t);
  const stock = 'stock 5.3.1 handoff\n';
  const original = cli.STOCK_HANDOFF_5_3_1['repo:all'];
  cli.STOCK_HANDOFF_5_3_1['repo:all'] = shaText(stock);
  t.after(() => { cli.STOCK_HANDOFF_5_3_1['repo:all'] = original; });
  fs.writeFileSync(path.join(d, HANDOFF), stock);
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files[HANDOFF] = shaText('something else\n');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  const dry = run(() => cli.cmdPatch(d, { repo: true, dryRun: true }));
  assert.match(dry.out, /\.nitm\/BOOTSTRAP\.md: keep/);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.readFileSync(path.join(d, HANDOFF), 'utf8'), stock);
});

test('handoff: the shipped 5.3.1 table is 12 single lowercase SHA-256 values, one per layout and env', () => {
  const keys = Object.keys(cli.STOCK_HANDOFF_5_3_1).sort();
  assert.equal(keys.length, 12);
  for (const key of keys) assert.match(cli.STOCK_HANDOFF_5_3_1[key], /^[0-9a-f]{64}$/, key);
});

// Set NITM_531_PACKAGE to an unpacked nitm-ai-dev-toolkit@5.3.1 package to re-derive the table from it.
test('handoff: the shipped 5.3.1 table matches the published 5.3.1 package', {
  skip: !process.env.NITM_531_PACKAGE && 'set NITM_531_PACKAGE to an unpacked 5.3.1 package',
}, () => {
  const pkg = process.env.NITM_531_PACKAGE;
  const old = require(path.join(pkg, 'bin', 'cli.js'));
  for (const type of ['repo', 'monorepo']) {
    for (const env of [undefined, 'claude', 'codex', 'copilot', 'cursor', 'opencode']) {
      const body = fs.readFileSync(path.join(pkg, 'src', type, '.claude', 'prompt-snippets', 'bootstrap.md'), 'utf8');
      const layout = `${type}:${env || 'all'}`;
      assert.equal(cli.STOCK_HANDOFF_5_3_1[layout], shaText(old.envHeader(type, env) + '\n\n' + body), layout);
    }
  }
});

// ---- skip paths and flags ----

test('--skip-path: whole-segment literal paths are accepted; typos, globs, non-canonical and metadata are refused', () => {
  assert.deepEqual(cli.validateSkipPaths(['AGENTS.md', 'factory', HANDOFF, 'factory'], 'repo', undefined, null),
    [HANDOFF, 'AGENTS.md', 'factory']);
  const refused = ['', ' AGENTS.md', './AGENTS.md', 'docs/', '../x', '/AGENTS.md', 'C:/x', 'docs/*.md', 'docs/**',
    'a\\b', 'docs//api', 'AGENTS.mdx', 'factory/nope', '.toolkit-version', '.nitm', '.nitm/manifest.json', '.nitm/toolkit.json'];
  for (const s of refused) {
    assert.throws(() => cli.validateSkipPaths([s], 'repo', undefined, null), /--skip-path/, JSON.stringify(s));
  }
  assert.throws(() => cli.validateSkipPaths(['.nitm'], 'repo', undefined, null), /patch metadata/);
});

test('--skip-path: the scope is the --env scope; a path from another harness is a typo', () => {
  assert.throws(() => cli.validateSkipPaths(['.codex/config.toml'], 'repo', 'claude', null), /matches no template path/);
  assert.deepEqual(cli.validateSkipPaths(['.claude/commands'], 'repo', 'claude', null), ['.claude/commands']);
});

test('--skip-path: a path the saved selection already leaves out is refused with a clear reason, not accepted as a no-op', () => {
  const selection = { exclude: ['factory'], only: [] };
  assert.throws(() => cli.validateSkipPaths(['factory'], 'repo', undefined, selection),
    /matches only files the saved selection already leaves out \(exclude \[factory\]/);
  assert.deepEqual(cli.validateSkipPaths(['AGENTS.md'], 'repo', undefined, selection), ['AGENTS.md']);
});

test('review flags: a real patch with skips needs --expect; a dry run rejects --expect; --exclude/--only cannot ride along', () => {
  assert.throws(() => cli.assertReviewOptions({ skipPath: ['AGENTS.md'] }), /needs --expect/);
  assert.equal(cli.assertReviewOptions({ skipPath: ['AGENTS.md'], dryRun: true }), true);
  assert.equal(cli.assertReviewOptions({ skipPath: ['AGENTS.md'], expect: ZERO_TOKEN }), true);
  assert.equal(cli.assertReviewOptions({ expect: ZERO_TOKEN }), true, 'plain apply may bind to a token');
  assert.equal(cli.assertReviewOptions({}), false, 'plain patch needs no token');
  assert.throws(() => cli.assertReviewOptions({ expect: ZERO_TOKEN, dryRun: true }), /only prints the Review token/);
  assert.throws(() => cli.assertReviewOptions({ expect: 'abc' }), /64 lowercase hex/);
  assert.throws(() => cli.assertReviewOptions({ expect: 'A'.repeat(64) }), /64 lowercase hex/);
  assert.throws(() => cli.assertReviewOptions({ skipPath: ['AGENTS.md'], exclude: [], dryRun: true }), /cannot be combined with --exclude\/--only/);
  assert.throws(() => cli.assertReviewOptions({ skipPath: ['AGENTS.md'], only: ['codex'], expect: ZERO_TOKEN }), /cannot be combined/);
});

test('parseFlags: --skip-path repeats, both forms take a value, --expect is given once', () => {
  const f = cli.parseFlags(['patch', '--skip-path', 'AGENTS.md', '--skip-path=factory', '--expect', ZERO_TOKEN]);
  assert.deepEqual(f.skipPath, ['AGENTS.md', 'factory']);
  assert.equal(f.expect, ZERO_TOKEN);
  assert.throws(() => cli.parseFlags(['patch', '--skip-path']), /requires a value/);
  assert.throws(() => cli.parseFlags(['patch', '--skip-path', '--dry-run']), /requires a value/);
  assert.throws(() => cli.parseFlags(['patch', '--expect=']), /requires a value/);
  assert.throws(() => cli.parseFlags(['patch', '--expect', ZERO_TOKEN, '--expect', ZERO_TOKEN]), /only once/);
});

test('patch refuses flags it does not take, mixed layouts and unknown envs before any write', (t) => {
  const d = installedRepo(t);
  const before = snapshot(d);
  const refused = [
    { version: '5.4.4' }, { all: true }, { yes: true }, { dir: 'x' }, { interval: '5' }, { abandoned: true },
    { repo: true, monorepo: true }, { env: 'bogus' },
    { _: ['patch', '--skip-paths'] },
  ];
  for (const extra of refused) {
    assert.throws(() => run(() => cli.cmdPatch(d, { repo: true, ...extra })), /not an option of patch|Use either|Unknown|Unknown option for patch/,
      JSON.stringify(extra));
  }
  assert.deepEqual(snapshot(d), before);
});

test('patch --force is the documented legacy flag: it never overwrites and says so', (t) => {
  const d = installedRepo(t);
  fs.writeFileSync(path.join(d, 'AGENTS.md'), 'mine\n');
  const forced = run(() => cli.cmdPatch(d, { repo: true, force: true }));
  assert.match(forced.out, /--force has no effect on patch/);
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), 'mine\n');
});

test('main: unknown patch flags fail closed, and review flags are refused on other commands', (t) => {
  const d = installedRepo(t);
  const before = snapshot(d);
  const unknown = spawnSync(process.execPath, [CLI_BIN, 'patch', '--repo', '--skip-paths', 'AGENTS.md'], { cwd: d, encoding: 'utf8' });
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr + unknown.stdout, /Unknown option for patch: --skip-paths/);
  const noToken = spawnSync(process.execPath, [CLI_BIN, 'patch', '--repo', '--skip-path', 'AGENTS.md'], { cwd: d, encoding: 'utf8' });
  assert.equal(noToken.status, 1);
  assert.match(noToken.stdout, /needs --expect/);
  const install = spawnSync(process.execPath, [CLI_BIN, 'install', '--repo', '--skip-path', 'AGENTS.md'], { cwd: d, encoding: 'utf8' });
  assert.equal(install.status, 1);
  assert.match(install.stdout, /only for patch and upgrade/);
  assert.deepEqual(snapshot(d), before);
});

// ---- manifest: strict for patch and install ----

test('manifest: a malformed manifest fails closed for patch and install, and nothing is written', (t) => {
  const d = installedRepo(t);
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  fs.writeFileSync(manifestPath, '{"toolkit": "5.4.3", "files": {');
  const before = snapshot(d);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true, dryRun: true })), /not valid JSON/);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /not valid JSON/);
  assert.throws(() => run(() => cli.cmdInstall(d, { repo: true, force: true })), /not valid JSON/);
  assert.deepEqual(snapshot(d), before);
});

test('manifest: a manifest whose "files" values are not hashes fails closed; a missing manifest is recreated', (t) => {
  const d = installedRepo(t);
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ toolkit: '5.4.3', files: { 'AGENTS.md': 7 } }));
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /must map to a hash string/);
  fs.rmSync(manifestPath);
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(fs.existsSync(manifestPath), true, 'absent manifest is created, not treated as an error');
});

test('manifest: legacy records for files the review does not touch are kept by a patch', (t) => {
  const d = installedRepo(t);
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files['legacy/notes.md'] = shaText('old record\n');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files['legacy/notes.md'], shaText('old record\n'));
});

// ---- preview and apply: one plan, token-bound ----

test('apply: the token-bound write set is exactly the approved paths; handoff, config and customised files stay byte-identical', (t) => {
  const d = reviewFixture(t);
  const flags = { repo: true, skipPath: ['.agents/skills/ponytail'] };
  const preview = run(() => cli.cmdPatch(d, { ...flags, dryRun: true }));
  const token = tokenIn(preview.out);
  assert.match(token, /^[0-9a-f]{64}$/);
  const planned = writesIn(preview.out).map((w) => w.path);
  assert.ok(planned.includes('AGENTS.md'), 'the approved add is in the write set');
  for (const p of planned) assert.ok(['AGENTS.md', '.nitm/manifest.json', '.toolkit-version'].includes(p), `unexpected planned write: ${p}`);
  assert.match(preview.out, /Skipped by --skip-path \(not written\)/);
  assert.match(preview.out, /\.nitm\/BOOTSTRAP\.md: keep/);

  const before = snapshot(d);
  const applied = run(() => cli.cmdPatch(d, { ...flags, expect: token }));
  assert.equal(applied.exitCode, 0);
  const after = snapshot(d);
  const changed = Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k]).sort();
  assert.ok(changed.includes('AGENTS.md'), 'the approved add was written');
  for (const k of changed) {
    assert.ok(['AGENTS.md', '.nitm/manifest.json', '.toolkit-version'].includes(k), `unexpected write: ${k}`);
  }
  assert.equal(fs.existsSync(path.join(d, '.agents', 'skills', 'ponytail', 'SKILL.md')), false, 'skipped path stayed absent');
  assert.equal(fs.readFileSync(path.join(d, HANDOFF), 'utf8'), 'customised handoff\n');
  assert.equal(fs.readFileSync(path.join(d, 'CLAUDE.md'), 'utf8'), 'locally edited instruction\n');
  assert.equal(fs.existsSync(path.join(d, '.nitm', 'backups')), false, 'patch makes no backups');
});

test('apply: the digest names the bytes that were written (the preview hash is the hash on disk)', (t) => {
  const d = reviewFixture(t);
  const flags = { repo: true, skipPath: ['.agents/skills/ponytail'] };
  const preview = run(() => cli.cmdPatch(d, { ...flags, dryRun: true }));
  const agents = preview.out.match(/AGENTS\.md \[template\] sha256 ([0-9a-f]{12})/);
  assert.ok(agents, preview.out);
  run(() => cli.cmdPatch(d, { ...flags, expect: tokenIn(preview.out) }));
  assert.equal(sha(path.join(d, 'AGENTS.md')).slice(0, 12), agents[1]);
  assert.equal(sha(path.join(d, 'AGENTS.md')), sha(path.join(SRC, 'repo', 'AGENTS.md')));
});

test('apply: a token that no longer matches writes nothing, for each kind of drift', (t) => {
  const drifts = {
    'customised file edited after preview': (d) => fs.writeFileSync(path.join(d, 'CLAUDE.md'), 'edited again\n'),
    'handoff edited after preview': (d) => fs.writeFileSync(path.join(d, HANDOFF), 'edited again\n'),
    'saved selection edited after preview': (d) => fs.writeFileSync(path.join(d, '.nitm', 'toolkit.json'), '{"exclude":[],"only":[]}\n'),
    'version marker edited after preview': (d) => fs.writeFileSync(path.join(d, '.toolkit-version'), '4.0.0\n'),
    'permission changed after preview': (d) => fs.chmodSync(path.join(d, 'CLAUDE.md'), 0o600),
  };
  for (const [name, drift] of Object.entries(drifts)) {
    const d = reviewFixture(t);
    const flags = { repo: true, skipPath: ['.agents/skills/ponytail'] };
    const token = tokenIn(run(() => cli.cmdPatch(d, { ...flags, dryRun: true })).out);
    drift(d);
    const before = snapshot(d);
    assert.throws(() => run(() => cli.cmdPatch(d, { ...flags, expect: token })), /does not match/, name);
    assert.deepEqual(snapshot(d), before, `${name}: no writes`);
  }
});

test('apply: a token from different flags is refused, and a plain apply without skips needs no token', (t) => {
  const d = reviewFixture(t);
  const token = tokenIn(run(() => cli.cmdPatch(d, { repo: true, skipPath: ['.agents/skills/ponytail'], dryRun: true })).out);
  const before = snapshot(d);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true, expect: token })), /does not match/);
  assert.deepEqual(snapshot(d), before);
  const plain = run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(plain.exitCode, 0);
  assert.equal(plain.out.includes('Review token:'), false, 'token is printed only by a dry run');
  assert.equal(fs.existsSync(path.join(d, 'AGENTS.md')), true);
});

test('apply: a second patch writes nothing, so a same-bytes target is never rewritten', (t) => {
  const d = reviewFixture(t);
  run(() => cli.cmdPatch(d, { repo: true }));
  const written = recordWrites(() => run(() => cli.cmdPatch(d, { repo: true })));
  assert.deepEqual(written, []);
});

test('apply: a directory skip leaves out every file under it, and the rest is still written', (t) => {
  const d = installedRepo(t);
  fs.rmSync(path.join(d, 'factory'), { recursive: true, force: true });
  const flags = { repo: true, skipPath: ['factory'] };
  const token = tokenIn(run(() => cli.cmdPatch(d, { ...flags, dryRun: true })).out);
  const applied = run(() => cli.cmdPatch(d, { ...flags, expect: token }));
  assert.equal(applied.exitCode, 0);
  assert.equal(fs.existsSync(path.join(d, 'factory')), false);
});

// ---- conflicts and guards ----

test('conflicts: a symbolic link on an approved path blocks the whole run before any write', (t) => {
  const d = reviewFixture(t);
  const outside = path.join(tmp(t), 'outside.md');
  fs.writeFileSync(outside, 'outside\n');
  fs.symlinkSync(outside, path.join(d, 'AGENTS.md'));
  const before = snapshot(d);
  const dry = run(() => cli.cmdPatch(d, { repo: true, dryRun: true }));
  assert.equal(dry.exitCode, 1);
  assert.match(dry.out, /AGENTS\.md \(blocked by AGENTS\.md is a symbolic link\)/);
  assert.equal(tokenIn(dry.out), null, 'no token is issued for a blocked plan');
  const real = run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(real.exitCode, 1);
  assert.deepEqual(snapshot(d), before, 'nothing written, including the other adds');
  assert.equal(fs.readFileSync(outside, 'utf8'), 'outside\n');

  // Leaving the conflicting path out is an explicit, reviewable choice.
  const flags = { repo: true, skipPath: ['AGENTS.md'] };
  const token = tokenIn(run(() => cli.cmdPatch(d, { ...flags, dryRun: true })).out);
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(run(() => cli.cmdPatch(d, { ...flags, expect: token })).exitCode, 0);
  assert.equal(fs.lstatSync(path.join(d, 'AGENTS.md')).isSymbolicLink(), true, 'skipped link is not touched');
});

test('conflicts: a hard-linked file that a write would change is refused; a skip of it is allowed', (t) => {
  const d = installedRepo(t);
  const shared = path.join(tmp(t), 'shared.md');
  fs.writeFileSync(shared, 'old\n');
  const agents = path.join(d, 'AGENTS.md');
  fs.rmSync(agents);
  fs.linkSync(shared, agents);
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files['AGENTS.md'] = shaText('old\n'); // the toolkit wrote these bytes, so the file is an update target
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const before = snapshot(d);
  const dry = run(() => cli.cmdPatch(d, { repo: true, dryRun: true }));
  assert.equal(dry.exitCode, 1);
  assert.match(dry.out, /AGENTS\.md \(hard-linked \(2 names\)/);
  assert.equal(run(() => cli.cmdPatch(d, { repo: true })).exitCode, 1);
  assert.deepEqual(snapshot(d), before);
  assert.equal(fs.readFileSync(shared, 'utf8'), 'old\n', 'the other name is untouched');

  const flags = { repo: true, skipPath: ['AGENTS.md'] };
  const token = tokenIn(run(() => cli.cmdPatch(d, { ...flags, dryRun: true })).out);
  assert.equal(run(() => cli.cmdPatch(d, { ...flags, expect: token })).exitCode, 0);
  assert.equal(fs.readFileSync(shared, 'utf8'), 'old\n');
});

// ---- metadata ordering and write-time guards ----

test('metadata: the version marker is the last write, after the manifest', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  const flags = { repo: true, skipPath: ['.agents/skills/ponytail'] };
  const preview = run(() => cli.cmdPatch(d, { ...flags, dryRun: true }));
  const names = writesIn(preview.out).map((w) => w.path);
  assert.equal(names[names.length - 1], '.toolkit-version', names.join(', '));
  assert.ok(names.indexOf('.nitm/manifest.json') < names.indexOf('.toolkit-version'));
  const token = tokenIn(preview.out);
  const seen = recordWrites(() => run(() => cli.cmdPatch(d, { ...flags, expect: token })));
  const rel = seen.map((p) => path.relative(d, p).split(path.sep).join('/'));
  assert.equal(rel[rel.length - 1], '.toolkit-version');
  assert.equal(fs.readFileSync(path.join(d, '.toolkit-version'), 'utf8'), require('../package.json').version + '\n');
});

test('guard: a failed template write leaves the version marker at its prior value', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  withWriteWrapper((p, buf, orig) => {
    if (p.endsWith('AGENTS.md')) throw new Error('simulated write failure');
    return orig();
  }, () => {
    assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /Failed writing AGENTS\.md[\s\S]*may be partly written and was not removed[\s\S]*version marker was not advanced/);
  });
  assert.equal(fs.readFileSync(path.join(d, '.toolkit-version'), 'utf8'), '5.3.1\n');
  // The target was created exclusively before the failed write. It is reported, not removed by path.
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), '');
});

test('guard: a new file is opened with O_EXCL, and an existing file is opened without create or truncate', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  const opens = new Map();
  const origOpen = fs.openSync;
  fs.openSync = (p, flags, ...rest) => {
    if (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR)) opens.set(path.relative(d, String(p)).split(path.sep).join('/'), flags);
    return origOpen(p, flags, ...rest);
  };
  try {
    run(() => cli.cmdPatch(d, { repo: true }));
  } finally {
    fs.openSync = origOpen;
  }
  const { O_CREAT, O_EXCL, O_TRUNC } = fs.constants;
  const created = opens.get('AGENTS.md');
  assert.ok(created !== undefined, 'AGENTS.md was opened for writing');
  assert.equal(created & (O_CREAT | O_EXCL), O_CREAT | O_EXCL, 'a missing file is created exclusively');
  const existing = opens.get('.toolkit-version');
  assert.ok(existing !== undefined, 'the version marker was opened for writing');
  assert.equal(existing & (O_CREAT | O_TRUNC), 0, 'an existing file is opened without create or truncate');
  assert.equal(fs.readFileSync(path.join(d, '.toolkit-version'), 'utf8'), require('../package.json').version + '\n');
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), fs.readFileSync(path.join(SRC, 'repo', 'AGENTS.md'), 'utf8'));
});

// Ordinary fs failure stubs on the version marker only. `fail.write` makes the marker's write throw before any
// byte is written; `fail.close` makes its close throw after the real close (so no descriptor is leaked).
function withMarkerFailure(fail, fn) {
  const origOpen = fs.openSync;
  const origWrite = fs.writeSync;
  const origClose = fs.closeSync;
  const paths = new Map();
  const isMarker = (p) => p !== undefined && p.endsWith('.toolkit-version');
  fs.openSync = (p, flags, ...rest) => {
    const fd = origOpen(p, flags, ...rest);
    if (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR)) paths.set(fd, String(p));
    return fd;
  };
  fs.writeSync = (fd, buf, off, len, pos) => {
    if (fail.write && isMarker(paths.get(fd))) throw new Error('simulated marker write failure');
    return origWrite(fd, buf, off, len, pos);
  };
  fs.closeSync = (fd) => {
    const p = paths.get(fd);
    paths.delete(fd);
    origClose(fd);
    if (fail.close && isMarker(p)) throw new Error('simulated marker close failure');
  };
  try {
    return fn();
  } finally {
    fs.openSync = origOpen;
    fs.writeSync = origWrite;
    fs.closeSync = origClose;
  }
}

test('guard: a failed marker write reports the marker as unconfirmed, not as not advanced', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  withMarkerFailure({ write: true }, () => {
    assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), (ex) => {
      assert.match(ex.message, /Failed writing \.toolkit-version \(simulated marker write failure\)\./);
      assert.match(ex.message, /version marker state is unconfirmed/);
      assert.match(ex.message, /Inspect \.toolkit-version and run patch --dry-run again/);
      assert.doesNotMatch(ex.message, /was not advanced/);
      return true;
    });
  });
  assert.equal(fs.readFileSync(path.join(d, '.toolkit-version'), 'utf8'), '5.3.1\n');
});

test('guard: a failed marker close is reported with context, and the marker is unconfirmed', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  withMarkerFailure({ close: true }, () => {
    assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), (ex) => {
      assert.match(ex.message, /Failed closing \.toolkit-version \(simulated marker close failure\)\./);
      assert.match(ex.message, /version marker state is unconfirmed/);
      assert.doesNotMatch(ex.message, /was not advanced/);
      return true;
    });
  });
});

test('guard: when the marker write and its close both fail, the write error is kept and the close error is added', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  withMarkerFailure({ write: true, close: true }, () => {
    assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), (ex) => {
      assert.match(ex.message, /Failed writing \.toolkit-version \(simulated marker write failure\)\. Closing it also failed \(simulated marker close failure\)\./);
      return true;
    });
  });
});

test('guard: a protected file that changes mid-run stops before the marker advances; earlier writes stay', (t) => {
  const d = reviewFixture(t);
  fs.writeFileSync(path.join(d, '.toolkit-version'), '5.3.1\n');
  const manifestPath = path.join(d, '.nitm', 'manifest.json');
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  withWriteWrapper((p, buf, orig) => {
    const r = orig();
    if (p.endsWith('AGENTS.md')) fs.writeFileSync(manifestPath, manifestText + '\n'); // a concurrent edit, after the first write
    return r;
  }, () => {
    assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /manifest\.json changed during the writes[\s\S]*version marker was not advanced/);
  });
  assert.equal(fs.readFileSync(path.join(d, '.toolkit-version'), 'utf8'), '5.3.1\n');
  assert.equal(fs.readFileSync(path.join(d, 'AGENTS.md'), 'utf8'), fs.readFileSync(path.join(SRC, 'repo', 'AGENTS.md'), 'utf8'));
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), manifestText + '\n', 'the concurrent edit is left as it was made');
});

test('handoff: a customised one is kept and the file on disk is never backed up', (t) => {
  const d = reviewFixture(t);
  const patched = run(() => cli.cmdPatch(d, { repo: true }));
  assert.equal(patched.exitCode, 0);
  assert.equal(fs.readFileSync(path.join(d, HANDOFF), 'utf8'), 'customised handoff\n');
  assert.match(patched.out, /customized or of unknown origin: kept as is/);
  assert.equal(fs.existsSync(path.join(d, '.nitm', 'backups')), false);
});

// ---- retirement list and wrapper audit: captured state only ----

test('retired list: a symbolic link at .nitm/retired.json is refused before it is read; its target is never used', (t) => {
  const d = installedRepo(t);
  const outside = path.join(tmp(t), 'retired.json');
  fs.writeFileSync(outside, JSON.stringify({ retired: [{ path: 'AGENTS.md', reason: 'outside list', date: '2026-01-01' }] }));
  fs.symlinkSync(outside, path.join(d, '.nitm', 'retired.json'));
  const before = snapshot(d);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true, dryRun: true })), /retired\.json is not a regular file/);
  assert.throws(() => run(() => cli.cmdPatch(d, { repo: true })), /retired\.json is not a regular file/);
  assert.deepEqual(snapshot(d), before);
  assert.equal(fs.existsSync(path.join(d, 'AGENTS.md')), true);
  assert.match(fs.readFileSync(outside, 'utf8'), /outside list/);
});

test('wrapper audit: a skipped symbolic link is neither read nor reported; its target is never audited', (t) => {
  const d = installedRepo(t);
  const outside = path.join(tmp(t), 'factory.md');
  fs.writeFileSync(outside, 'First policy line that is not a link to anything.\n\nSecond policy line, also no link.\n\nThird policy line.\n');
  const wrapper = path.join(d, '.claude', 'commands', 'factory.md');
  fs.rmSync(wrapper);
  fs.symlinkSync(outside, wrapper);
  const flags = { repo: true, skipPath: ['.claude/commands/factory.md'] };
  const dry = run(() => cli.cmdPatch(d, { ...flags, dryRun: true }));
  assert.equal(dry.exitCode, 0);
  assert.doesNotMatch(dry.out, /factory\.md \((inlined|diverged): /); // wrapper report lines only
  const applied = run(() => cli.cmdPatch(d, { ...flags, expect: tokenIn(dry.out) }));
  assert.equal(applied.exitCode, 0);
  assert.equal(fs.lstatSync(wrapper).isSymbolicLink(), true, 'the skipped link is not touched');
});

// ---- upgrade: exact pin, forwarding, refusals before spawn ----

const upgradeDir = (t) => tmp(t);
const NO_SPAWN = () => { throw new Error('spawn must not run'); };
const NO_NPM = () => { throw new Error('npm must not be queried'); };

test('upgrade: forwards --skip-path, --expect and the layout to a supported target', () => {
  assert.deepEqual(cli.upgradeArgs({ skipPath: ['AGENTS.md', 'factory'], expect: ZERO_TOKEN }, '5.4.4'),
    ['--yes', 'nitm-ai-dev-toolkit@5.4.4', 'patch', '--skip-path', 'AGENTS.md', '--skip-path', 'factory', '--expect', ZERO_TOKEN]);
  assert.deepEqual(cli.upgradeArgs({ monorepo: true, dryRun: true }, '5.4.4'),
    ['--yes', 'nitm-ai-dev-toolkit@5.4.4', 'patch', '--monorepo', '--dry-run']);
  assert.deepEqual(cli.upgradeArgs({ repo: true }, '5.4.4'), ['--yes', 'nitm-ai-dev-toolkit@5.4.4', 'patch', '--repo']);
  assert.deepEqual(cli.upgradeArgs({}, '5.4.4'), ['--yes', 'nitm-ai-dev-toolkit@5.4.4', 'patch']);
});

test('upgrade: a target below 5.4.4 is refused before it runs when the review flags are used', (t) => {
  const calls = [];
  const spawn = (...a) => { calls.push(a); return { status: 0 }; };
  assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.3'], skipPath: ['AGENTS.md'], dryRun: true },
    { npmView: () => '5.4.3\n', spawn })), /predates --skip-path\/--expect/);
  assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.3'], expect: ZERO_TOKEN },
    { npmView: () => '5.4.3\n', spawn })), /would ignore them/);
  assert.equal(calls.length, 0);
});

test('upgrade: review flags need an exact pin; a latest lookup is refused before npm is queried', (t) => {
  assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade'], skipPath: ['AGENTS.md'], dryRun: true },
    { npmView: NO_NPM, spawn: NO_SPAWN })), /need an exact pin/);
  assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade'], expect: ZERO_TOKEN },
    { npmView: NO_NPM, spawn: NO_SPAWN })), /need an exact pin/);
});

test('upgrade: review flags are forwarded to a supported target and refused with --force or --exclude', (t) => {
  const calls = [];
  const spawn = (cmd, args) => { calls.push(args); return { status: 0 }; };
  const deps = { npmView: () => '5.4.4\n', spawn };
  run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.4'], dryRun: true, skipPath: ['AGENTS.md'] }, deps));
  run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.4'], skipPath: ['AGENTS.md'], expect: ZERO_TOKEN }, deps));
  assert.deepEqual(calls, [
    ['--yes', 'nitm-ai-dev-toolkit@5.4.4', 'patch', '--dry-run', '--skip-path', 'AGENTS.md'],
    ['--yes', 'nitm-ai-dev-toolkit@5.4.4', 'patch', '--skip-path', 'AGENTS.md', '--expect', ZERO_TOKEN],
  ]);
  assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.4'], skipPath: ['AGENTS.md'], expect: ZERO_TOKEN, force: true }, deps)),
    /cannot be combined with --force/);
  assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.4'], skipPath: ['AGENTS.md'], exclude: [], expect: ZERO_TOKEN }, deps)),
    /cannot be combined with --exclude\/--only/);
  assert.equal(calls.length, 2, 'refused runs never spawn');
});

test('upgrade: flags upgrade does not take, mixed layouts, unknown envs and typos are refused before npm and spawn', (t) => {
  const deps = { npmView: NO_NPM, spawn: NO_SPAWN };
  const refused = [
    [{ all: true }, /--all is not an option of upgrade/],
    [{ yes: true }, /--yes is not an option of upgrade/],
    [{ dir: 'x' }, /--dir is not an option of upgrade/],
    [{ repo: true, monorepo: true }, /Use either --repo or --monorepo/],
    [{ env: 'bogus' }, /Unknown --env "bogus"/],
    [{ _: ['upgrade', '--skip-paths', 'AGENTS.md'] }, /Unknown option for upgrade: --skip-paths/],
  ];
  for (const [extra, pattern] of refused) {
    assert.throws(() => run(() => cli.cmdUpgrade(upgradeDir(t), { _: ['upgrade', '5.4.4'], ...extra }, deps)), pattern, JSON.stringify(extra));
  }
});
