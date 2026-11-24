'use strict';

// Tests for bin/skill-integrity.js. Most cases build a temporary fixture package (src/<type>/.<x>/skills
// plus a manifest snapshot), so they do not depend on the real reviewed manifest. The fixtures are inert:
// names with control or bidi characters are only created inside temp dirs and never executed or read as code.
// The real-package test asserts the real tree matches the reviewed manifest; it fails until the manifest is added.
// Run with: node --test test/skill-integrity.test.js. No network.
// Source is ASCII only: non-ASCII characters are built with String.fromCharCode.

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const si = require('../bin/skill-integrity.js');
const cli = require('../bin/cli.js');

const ESC = String.fromCharCode(0x1b);
const RLO = String.fromCharCode(0x202e);
const NFC_E_ACUTE = String.fromCharCode(0xe9);
const COMBINING_ACUTE = String.fromCharCode(0x301);
const RAW_CONTROL_OR_BIDI = new RegExp("[" + String.fromCharCode(0) + "-" + String.fromCharCode(0x08) + String.fromCharCode(0x0b) + "-" + String.fromCharCode(0x1f) + String.fromCharCode(0x7f) + "-" + String.fromCharCode(0x9f) + String.fromCharCode(0x202e) + "]");

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function write(root, rel, text) {
  const abs = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
  return abs;
}

const MANIFEST_ABS = (root) => path.join(root, ...si.MANIFEST_REL.split('/'));

// A fixture package with the same skill layout as the real templates, plus one hidden ancillary file.
function makePkg() {
  const root = tempDir('skill-integrity-pkg-');
  write(root, 'src/repo/.agents/skills/alpha/SKILL.md', '---\nname: alpha\ndescription: a\n---\nbody\n');
  write(root, 'src/repo/.agents/skills/alpha/ref.md', 'reference\n');
  write(root, 'src/repo/.agents/skills/alpha/.hidden-notes.md', 'hidden ancillary\n');
  write(root, 'src/repo/.claude/skills/README.md', 'readme\n');
  write(root, 'src/monorepo/.agents/skills/beta/SKILL.md', '---\nname: beta\ndescription: b\n---\n');
  write(root, 'src/repo/AGENTS.md', 'not a skill, never hashed\n');
  return root;
}

// Writes a candidate snapshot outside the package and copies it in as the reviewed manifest.
function pin(root) {
  const candidate = path.join(tempDir('skill-integrity-cand-'), 'candidate.json');
  si.snapshot(candidate, root);
  fs.mkdirSync(path.dirname(MANIFEST_ABS(root)), { recursive: true });
  fs.copyFileSync(candidate, MANIFEST_ABS(root));
}

function readManifestObject(root) {
  return JSON.parse(fs.readFileSync(MANIFEST_ABS(root), 'utf8'));
}

function writeManifestRaw(root, text) {
  fs.mkdirSync(path.dirname(MANIFEST_ABS(root)), { recursive: true });
  fs.writeFileSync(MANIFEST_ABS(root), text);
}

test('valid fixture: pinned manifest matches; hidden ancillary and non-skill files are handled as specified', () => {
  const root = makePkg();
  pin(root);
  const r = si.check(root);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.changes, []);
  assert.ok(r.ok);
  // Five skill files: alpha/SKILL.md, alpha/ref.md, alpha/.hidden-notes.md, .claude/skills/README.md, beta/SKILL.md.
  // AGENTS.md sits outside the skill roots and is not hashed.
  assert.equal(r.count, 5);
  const manifest = readManifestObject(root);
  assert.ok(Object.hasOwn(manifest.files, 'src/repo/.agents/skills/alpha/.hidden-notes.md'));
  assert.ok(!Object.hasOwn(manifest.files, 'src/repo/AGENTS.md'));
  assert.doesNotThrow(() => si.assertIntact(root));
});

test('snapshot is deterministic: same tree gives identical bytes with sorted keys', () => {
  const root = makePkg();
  const a = path.join(tempDir('skill-integrity-det-'), 'a.json');
  const b = path.join(tempDir('skill-integrity-det-'), 'b.json');
  si.snapshot(a, root);
  si.snapshot(b, root);
  const text = fs.readFileSync(a, 'utf8');
  assert.equal(text, fs.readFileSync(b, 'utf8'));
  const keys = Object.keys(JSON.parse(text).files);
  assert.deepEqual(keys, [...keys].sort());
  assert.ok(text.endsWith('\n'));
});

test('modified skill file fails closed and is named', () => {
  const root = makePkg();
  pin(root);
  write(root, 'src/repo/.agents/skills/alpha/ref.md', 'changed\n');
  const r = si.check(root);
  assert.equal(r.ok, false);
  assert.deepEqual(r.changes, [{ kind: 'modified', path: 'src/repo/.agents/skills/alpha/ref.md' }]);
  assert.throws(() => si.assertIntact(root), /modified: src\/repo\/.agents\/skills\/alpha\/ref\.md/);
});

test('added visible and added hidden ancillary files fail closed', () => {
  const root = makePkg();
  pin(root);
  write(root, 'src/repo/.agents/skills/alpha/new.md', 'added\n');
  write(root, 'src/monorepo/.agents/skills/beta/.secret.sh', 'echo hidden\n');
  const r = si.check(root);
  assert.deepEqual(r.changes, [
    { kind: 'added', path: 'src/monorepo/.agents/skills/beta/.secret.sh' },
    { kind: 'added', path: 'src/repo/.agents/skills/alpha/new.md' },
  ]);
});

test('missing visible and missing hidden ancillary files fail closed', () => {
  const root = makePkg();
  pin(root);
  fs.rmSync(path.join(root, 'src/repo/.agents/skills/alpha/ref.md'));
  fs.rmSync(path.join(root, 'src/repo/.agents/skills/alpha/.hidden-notes.md'));
  const r = si.check(root);
  assert.deepEqual(r.changes, [
    { kind: 'missing', path: 'src/repo/.agents/skills/alpha/.hidden-notes.md' },
    { kind: 'missing', path: 'src/repo/.agents/skills/alpha/ref.md' },
  ]);
});

test('symlink inside a skill root is a problem, even when it points inside the root', () => {
  const root = makePkg();
  pin(root);
  fs.symlinkSync(path.join(root, 'src/repo/.agents/skills/alpha/ref.md'), path.join(root, 'src/repo/.agents/skills/alpha/link.md'));
  const r = si.check(root);
  assert.ok(r.problems.some((p) => p === 'src/repo/.agents/skills/alpha/link.md: symlink (not allowed in skill roots)'), r.problems.join('\n'));
  assert.equal(r.ok, false);
});

test('symlink escaping the package is a problem and its target is not read', () => {
  const root = makePkg();
  const outside = tempDir('skill-integrity-outside-');
  write(outside, 'SKILL.md', '---\nname: x\ndescription: y\n---\n');
  fs.symlinkSync(outside, path.join(root, 'src/repo/.agents/skills/escape'));
  const { problems, files } = si.collect(root);
  assert.ok(problems.some((p) => p === 'src/repo/.agents/skills/escape: symlink (not allowed in skill roots)'), problems.join('\n'));
  assert.ok(!Object.keys(files).some((k) => k.includes('escape')));
});

test('symlinked skill root or symlinked harness dir in a template is a problem', () => {
  const root = makePkg();
  fs.rmSync(path.join(root, 'src/repo/.claude'), { recursive: true });
  fs.symlinkSync(path.join(root, 'src/repo/.agents'), path.join(root, 'src/repo/.claude'));
  const { problems } = si.collect(root);
  assert.ok(problems.some((p) => p === 'src/repo/.claude: symlink in template tree (not allowed)'), problems.join('\n'));
});

test('non-regular entry (FIFO) in a skill root is a problem', (t) => {
  const root = makePkg();
  try {
    execFileSync('mkfifo', [path.join(root, 'src/repo/.agents/skills/alpha/pipe')]);
  } catch (_) {
    return t.skip('mkfifo unavailable on this platform');
  }
  const { problems } = si.collect(root);
  assert.ok(problems.some((p) => p === 'src/repo/.agents/skills/alpha/pipe: non-regular entry (not allowed in skill roots)'), problems.join('\n'));
});

test('a SKILL.md outside the skill roots is a problem (no unverified entry points)', () => {
  // `skills/` without a dot-directory parent is not a harness root, but the installer still copies it.
  const root = makePkg();
  write(root, 'src/repo/skills/rogue/SKILL.md', '---\nname: r\ndescription: r\n---\n');
  // A SKILL.md beside a harness root, not inside it.
  write(root, 'src/monorepo/.agents/SKILL.md', '---\nname: r\ndescription: r\n---\n');
  const { problems } = si.collect(root);
  assert.ok(problems.some((p) => p === 'src/repo/skills/rogue/SKILL.md: skill entry point outside the skill roots (not verified)'), problems.join('\n'));
  assert.ok(problems.some((p) => p === 'src/monorepo/.agents/SKILL.md: skill entry point outside the skill roots (not verified)'), problems.join('\n'));
});

test('a new harness dir with a skills subdirectory is discovered as a root and hashed, not ignored', () => {
  const root = makePkg();
  pin(root);
  write(root, 'src/repo/.codex/skills/rogue/SKILL.md', '---\nname: r\ndescription: r\n---\n');
  const r = si.check(root);
  assert.equal(r.ok, false);
  assert.deepEqual(r.changes, [{ kind: 'added', path: 'src/repo/.codex/skills/rogue/SKILL.md' }]);
});

test('case-folded aliases of reserved names and harness dirs are rejected (wrong case, trailing dot, dot-dir case)', () => {
  const cases = [
    ['src/repo/.agents/Skills/alpha/SKILL.md', /Skills: wrong-case or alias of reserved name/],
    ['src/repo/.agents/skills/alpha/skill.md', /wrong-case or alias of reserved name.*SKILL\.md/],
    ['src/repo/.agents/skills/alpha/SKILL.md.', /wrong-case or alias of reserved name/],
    ['src/repo/Skill.md', /wrong-case or alias of reserved name/],
    ['src/repo/.AGENTS/skills/alpha/ref.md', /non-canonical dot-directory name/],
  ];
  for (const [rel, expected] of cases) {
    const root = makePkg();
    write(root, rel, '---\nname: x\ndescription: y\n---\n');
    const { problems } = si.collect(root);
    assert.ok(problems.some((p) => expected.test(p)), `expected rejection of ${rel}:\n${problems.join('\n')}`);
  }
});

test('case-folded collisions in a directory that holds or sits inside a skill root are rejected', () => {
  const cases = [
    ['alpha file collision', (root) => write(root, 'src/repo/.agents/skills/alpha/REF.md', 'x'), /alpha: case-folded name collision/],
    ['sibling dir collision', (root) => fs.mkdirSync(path.join(root, 'src/repo/.agents/Skills'), { recursive: true }), /case-folded name collision/],
    ['NFC vs NFD', (root) => {
      write(root, `src/repo/.agents/skills/alpha/caf${NFC_E_ACUTE}.md`, 'x');
      write(root, `src/repo/.agents/skills/alpha/cafe${COMBINING_ACUTE}.md`, 'x');
    }, /alpha: case-folded name collision/],
  ];
  for (const [label, mutate, expected] of cases) {
    const root = makePkg();
    mutate(root);
    const { problems } = si.collect(root);
    assert.ok(problems.some((p) => expected.test(p)), `expected ${label}:\n${problems.join('\n')}`);
  }
  // Outside the roots the collision rule does not apply (only the installed-and-verified scope is policed).
  const root = makePkg();
  write(root, 'src/repo/docs/A.md', 'x');
  write(root, 'src/repo/docs/a.md', 'x');
  assert.equal(si.collect(root).problems.filter((p) => /collision/.test(p)).length, 0);
});

test('nested ancillary-only harness skills dir (no SKILL.md) fails closed, not silently copied', () => {
  const root = makePkg();
  pin(root);
  write(root, 'src/monorepo/apps/web/.agents/skills/helper/run.sh', 'echo inert\n');
  const r = si.check(root);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => p === 'src/monorepo/apps/web/.agents/skills: skills directory outside the discovered skill roots (not verified)'), r.problems.join('\n'));
});

test('file names with control or bidi characters are rejected and shown escaped, never raw', () => {
  const root = makePkg();
  pin(root);
  write(root, `src/repo/.agents/skills/alpha/evil\n${ESC}[31mX${RLO}.md`, 'x');
  assert.throws(() => si.assertIntact(root), (e) => {
    const body = e.message.split('\n').slice(1);
    return body.every((line) => !RAW_CONTROL_OR_BIDI.test(line))
      && e.message.includes('control or format character in name')
      && e.message.includes('\\u001b') && e.message.includes('\\u202e') && e.message.includes('\\n');
  });
});

test('manifest keys with control or bidi characters are rejected with escaped diagnostics', () => {
  const root = makePkg();
  pin(root);
  const m = readManifestObject(root);
  m.files[`src/repo/.agents/skills/bad${ESC}${RLO}/x.md`] = 'a'.repeat(64);
  writeManifestRaw(root, JSON.stringify(m, null, 2) + '\n');
  const { problems } = si.check(root);
  assert.ok(problems.length > 0);
  for (const p of problems) assert.doesNotMatch(p, RAW_CONTROL_OR_BIDI, JSON.stringify(p));
  assert.ok(problems.some((p) => p.includes('\\u001b') && p.includes('\\u202e')), problems.join('\n'));
});

test('ordinary names stay readable in diagnostics', () => {
  assert.equal(si.show('src/repo/.agents/skills/alpha/SKILL.md'), 'src/repo/.agents/skills/alpha/SKILL.md');
  assert.equal(si.show('a b'), '"a b"');
});

test('unreadable directories fail closed (EACCES throws) instead of reading as absent', (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) return t.skip('root ignores directory permissions');
  const root = makePkg();
  pin(root);
  const dirs = [path.join(root, 'bin'), path.join(root, 'src/repo/.agents')];
  for (const d of dirs) fs.chmodSync(d, 0o000);
  try {
    assert.throws(() => si.check(root), (e) => e.code === 'EACCES');
  } finally {
    for (const d of dirs) fs.chmodSync(d, 0o755);
  }
});

test('digests are over exact bytes: a CRLF copy of a pinned skill is drift, not normalized away', () => {
  const root = makePkg();
  pin(root);
  write(root, 'src/repo/.agents/skills/alpha/ref.md', 'reference\r\n');
  const r = si.check(root);
  assert.deepEqual(r.changes, [{ kind: 'modified', path: 'src/repo/.agents/skills/alpha/ref.md' }]);
});

test('.gitattributes keeps LF bytes for skill text (incl. nested) and the manifest on every checkout', (t) => {
  const repo = path.join(__dirname, '..');
  const probe = spawnSync('git', ['-C', repo, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) return t.skip('git work tree not available');
  const paths = ['src/repo/.agents/skills/acli/SKILL.md', 'src/monorepo/.claude/skills/README.md',
    'src/monorepo/apps/x/.agents/skills/y/z.md', 'bin/skill-integrity.manifest.json'];
  const r = spawnSync('git', ['-C', repo, 'check-attr', 'text', 'eol', '--', ...paths], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const p of paths) {
    const text = p.startsWith('bin/') ? 'set' : 'auto';
    assert.ok(r.stdout.includes(`${p}: text: ${text}`), `text not ${text} for ${p}:\n${r.stdout}`);
    assert.ok(r.stdout.includes(`${p}: eol: lf`), `eol not lf for ${p}:\n${r.stdout}`);
  }
  const unrelated = spawnSync('git', ['-C', repo, 'check-attr', 'eol', '--', 'AGENTS.md'], { encoding: 'utf8' });
  assert.ok(unrelated.stdout.includes('AGENTS.md: eol: unspecified'), unrelated.stdout);
});

test('.gitattributes: skill text is text=auto (binary helpers are not transformed), manifest is forced text eol=lf', (t) => {
  const repo = path.join(__dirname, '..');
  if (spawnSync('git', ['-C', repo, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' }).status !== 0) {
    return t.skip('git work tree not available');
  }
  const r = spawnSync('git', ['-C', repo, 'check-attr', 'text', 'eol', '--',
    'src/repo/.agents/skills/acli/SKILL.md', 'src/monorepo/apps/x/.agents/skills/y/helper.bin', 'bin/skill-integrity.manifest.json'],
  { encoding: 'utf8' });
  assert.ok(r.stdout.includes('src/repo/.agents/skills/acli/SKILL.md: text: auto'), r.stdout);
  assert.ok(r.stdout.includes('src/monorepo/apps/x/.agents/skills/y/helper.bin: text: auto'), r.stdout);
  assert.ok(r.stdout.includes('bin/skill-integrity.manifest.json: text: set'), r.stdout);
  assert.ok(r.stdout.includes('bin/skill-integrity.manifest.json: eol: lf'), r.stdout);
});

test('git raw-bytes coverage in a temp repo: text skill is stored LF, a binary helper keeps its exact bytes', (t) => {
  if (spawnSync('git', ['--version']).status !== 0) return t.skip('git not available');
  const repoDir = tempDir('skill-integrity-gitattr-');
  const git = (args) => spawnSync('git', ['-C', repoDir, ...args], { encoding: 'utf8' });
  const CR = String.fromCharCode(13);
  const LF = String.fromCharCode(10);
  const binary = Buffer.from([0, 1, 2, 13, 10, 255, 0, 13, 10]);
  fs.copyFileSync(path.join(__dirname, '..', '.gitattributes'), path.join(repoDir, '.gitattributes'));
  write(repoDir, 'src/monorepo/apps/x/.agents/skills/y/SKILL.md', `---${CR}${LF}name: y${CR}${LF}---${CR}${LF}`);
  fs.mkdirSync(path.join(repoDir, 'src/monorepo/apps/x/.agents/skills/y'), { recursive: true });
  fs.writeFileSync(path.join(repoDir, 'src/monorepo/apps/x/.agents/skills/y/helper.bin'), binary);
  git(['init', '-q']);
  git(['-c', 'core.autocrlf=false', 'add', '-A']);
  const eol = git(['ls-files', '--eol']).stdout;
  // Index is LF for the text skill; the working copy column is not rewritten by `git add`, so it is not asserted.
  assert.match(eol, /i\/lf\s+w\/\S+\s+attr\/text=auto eol=lf\s+src\/monorepo\/apps\/x\/.agents\/skills\/y\/SKILL\.md/, eol);
  assert.match(eol, /i\/-text\s+w\/-text\s+attr\/text=auto eol=lf\s+src\/monorepo\/apps\/x\/.agents\/skills\/y\/helper\.bin/, eol);
  // The binary helper is stored byte-for-byte; the text skill is stored with LF (CRLF normalized on add).
  const blob = spawnSync('git', ['-C', repoDir, 'cat-file', 'blob', ':src/monorepo/apps/x/.agents/skills/y/helper.bin'], { encoding: 'buffer' });
  assert.ok(blob.stdout.equals(binary), 'binary helper bytes changed in the index');
  const text = spawnSync('git', ['-C', repoDir, 'cat-file', 'blob', ':src/monorepo/apps/x/.agents/skills/y/SKILL.md'], { encoding: 'utf8' });
  assert.equal(text.stdout, `---${LF}name: y${LF}---${LF}`);
});

test('inherited Object.prototype names (constructor, toString, __proto__) are ordinary names, not reserved', () => {
  const root = makePkg();
  for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    write(root, `src/repo/.agents/skills/alpha/${name}`, 'x');
  }
  const { problems } = si.collect(root);
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('missing reviewed manifest fails closed and names the snapshot procedure', () => {
  const root = makePkg();
  const r = si.check(root);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => p.startsWith(`${si.MANIFEST_REL}: missing.`) && /snapshot/.test(p)), r.problems.join('\n'));
  assert.throws(() => si.assertIntact(root), /packaged skill integrity check failed/);
});

test('manifest that is a symlink is rejected', () => {
  const root = makePkg();
  pin(root);
  const real = path.join(tempDir('skill-integrity-real-'), 'm.json');
  fs.copyFileSync(MANIFEST_ABS(root), real);
  fs.rmSync(MANIFEST_ABS(root));
  fs.symlinkSync(real, MANIFEST_ABS(root));
  const r = si.check(root);
  assert.ok(r.problems.some((p) => /must be a regular file/.test(p)), r.problems.join('\n'));
});

test('unsafe or malformed manifests are rejected (fail closed on shape and paths)', () => {
  const cases = {
    'parent traversal key': (m) => { m.files['src/repo/.agents/skills/../../../../etc/passwd'] = 'a'.repeat(64); },
    'absolute key': (m) => { m.files['/etc/passwd'] = 'a'.repeat(64); },
    'backslash key': (m) => { m.files['src\\repo\\.agents\\skills\\alpha\\SKILL.md'] = 'a'.repeat(64); },
    'key outside the skill roots': (m) => { m.files['package.json'] = 'a'.repeat(64); },
    'dot segment key': (m) => { m.files['src/repo/./.agents/skills/alpha/SKILL.md'] = 'a'.repeat(64); },
    'uppercase digest': (m) => { m.files['src/repo/.agents/skills/alpha/ref.md'] = 'A'.repeat(64); },
    'short digest': (m) => { m.files['src/repo/.agents/skills/alpha/ref.md'] = 'abc'; },
    'non-string digest': (m) => { m.files['src/repo/.agents/skills/alpha/ref.md'] = 42; },
    'extra top-level key': (m) => { m.note = 'x'; },
    'unsupported version': (m) => { m.version = 2; },
    'files is an array': (m) => { m.files = []; },
  };
  for (const [label, mutate] of Object.entries(cases)) {
    const root = makePkg();
    pin(root);
    const m = readManifestObject(root);
    mutate(m);
    writeManifestRaw(root, JSON.stringify(m, null, 2) + '\n');
    const r = si.check(root);
    assert.equal(r.ok, false, `expected rejection: ${label}`);
    assert.ok(r.problems.length > 0, `expected a manifest problem: ${label}`);
  }
});

test('non-canonical manifest text is rejected even when every entry is valid', () => {
  const root = makePkg();
  pin(root);
  const m = readManifestObject(root);
  // Same content, compact JSON: not the canonical snapshot form, so it cannot be hand-edited in silently.
  writeManifestRaw(root, JSON.stringify(m));
  let r = si.check(root);
  assert.ok(r.problems.some((p) => /not in canonical form/.test(p)), r.problems.join('\n'));
  // Same content with keys out of order.
  const reversed = { version: m.version, algorithm: m.algorithm, files: Object.fromEntries(Object.entries(m.files).reverse()) };
  writeManifestRaw(root, JSON.stringify(reversed, null, 2) + '\n');
  r = si.check(root);
  assert.ok(r.problems.some((p) => /not in canonical form/.test(p)), r.problems.join('\n'));
});

test('duplicate keys in the manifest are rejected', () => {
  const root = makePkg();
  pin(root);
  const text = fs.readFileSync(MANIFEST_ABS(root), 'utf8');
  const [firstKey] = Object.keys(readManifestObject(root).files);
  const dup = text.replace('"files": {', `"files": {\n    "${firstKey}": "${'b'.repeat(64)}",`);
  writeManifestRaw(root, dup);
  const r = si.check(root);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => /not in canonical form|not valid JSON/.test(p)), r.problems.join('\n'));
});

test('check never writes: a failing check leaves the reviewed manifest and the tree untouched', () => {
  const root = makePkg();
  pin(root);
  const manifestBefore = fs.readFileSync(MANIFEST_ABS(root), 'utf8');
  const changed = write(root, 'src/repo/.agents/skills/alpha/ref.md', 'drifted\n');
  const treeBefore = fs.readFileSync(changed, 'utf8');
  const r = si.check(root);
  assert.equal(r.ok, false);
  assert.equal(fs.readFileSync(MANIFEST_ABS(root), 'utf8'), manifestBefore);
  assert.equal(fs.readFileSync(changed, 'utf8'), treeBefore);
});

test('snapshot refuses the reviewed manifest path and never overwrites an existing candidate', () => {
  const root = makePkg();
  pin(root);
  assert.throws(() => si.snapshot(MANIFEST_ABS(root), root), /refusing to write the reviewed manifest/);
  const existing = path.join(tempDir('skill-integrity-exists-'), 'c.json');
  fs.writeFileSync(existing, 'keep me');
  assert.throws(() => si.snapshot(existing, root), /EEXIST/);
  assert.equal(fs.readFileSync(existing, 'utf8'), 'keep me');
});

test('snapshot refuses when skill roots have problems and writes nothing', () => {
  const root = makePkg();
  fs.symlinkSync(path.join(root, 'src/repo/AGENTS.md'), path.join(root, 'src/repo/.agents/skills/alpha/link.md'));
  const out = path.join(tempDir('skill-integrity-refuse-'), 'c.json');
  assert.throws(() => si.snapshot(out, root), /snapshot refused/);
  assert.equal(fs.existsSync(out), false);
});

test('diff reports a changed candidate and passes an identical one (read-only)', () => {
  const root = makePkg();
  pin(root);
  const same = path.join(tempDir('skill-integrity-diff-'), 'same.json');
  si.snapshot(same, root);
  assert.deepEqual(si.diff(same, root).changes, []);
  assert.equal(si.diff(same, root).ok, true);
  write(root, 'src/repo/.agents/skills/alpha/ref.md', 'new content\n');
  const changedCandidate = path.join(tempDir('skill-integrity-diff-'), 'changed.json');
  si.snapshot(changedCandidate, root);
  const r = si.diff(changedCandidate, root);
  assert.equal(r.ok, false);
  assert.deepEqual(r.changes, [{ kind: 'modified', path: 'src/repo/.agents/skills/alpha/ref.md' }]);
  // diff is read-only: the reviewed manifest still holds the old digest, not the candidate's.
  const key = 'src/repo/.agents/skills/alpha/ref.md';
  assert.notEqual(readManifestObject(root).files[key], si.collect(root).files[key]);
  assert.equal(readManifestObject(root).files[key], JSON.parse(fs.readFileSync(same, 'utf8')).files[key]);
});

test('discovered skill roots cover exactly the files the installer plans for both templates', () => {
  for (const type of ['repo', 'monorepo']) {
    const installed = cli.templateFiles(type)
      .filter((rel) => {
        const parts = rel.split(path.sep);
        return parts.length >= 3 && parts[0].startsWith('.') && parts[1] === 'skills';
      })
      .map((rel) => `src/${type}/${rel.split(path.sep).join('/')}`)
      .sort();
    const covered = Object.keys(si.collect(si.PKG_ROOT).files).filter((k) => k.startsWith(`src/${type}/`));
    assert.deepEqual(covered, installed, `skill coverage mismatch for ${type}`);
  }
});

test('real package: packaged skill files match the reviewed manifest (no skip; fails until the manifest is added)', () => {
  const r = si.check(si.PKG_ROOT);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.changes, []);
});
