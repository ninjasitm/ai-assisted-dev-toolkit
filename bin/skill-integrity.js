#!/usr/bin/env node
'use strict';

// Drift check for the packaged skill files: every regular file under the `skills` roots of
// src/<type>/.<harness>/skills (both templates). It records SHA-256 digests in a reviewed manifest
// and fails closed on any added, missing or modified file, on a symlink or non-regular entry in a
// root, on a SKILL.md outside the roots, on a `skills` directory outside the roots (at any depth),
// on case-folded aliases or collisions of reserved names (`skills`, `SKILL.md`) and of names in the
// roots, and on a malformed or non-canonical manifest. Unreadable paths (EACCES, EIO, ...) are errors,
// not absence. Digests are over exact bytes: no line-ending or other normalization. It shows drift
// only. It does not judge content, and it is not a signature or a safety claim.
//
// `check` never writes. Expected hashes change only by hand: `snapshot` writes a candidate file,
// `diff` shows what would change, and a maintainer reviews the skill content before copying the
// candidate to bin/skill-integrity.manifest.json. Node stdlib only; no network.
//
// Usage (from the package root):
//   node bin/skill-integrity.js check                  verify the packaged skills (exit 1 on any problem)
//   node bin/skill-integrity.js snapshot <candidate>   write a new candidate manifest (never the reviewed one)
//   node bin/skill-integrity.js diff <candidate>       compare the reviewed manifest with a candidate (no writes)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PKG_ROOT = path.join(__dirname, '..');
const TEMPLATE_TYPES = ['repo', 'monorepo'];
const SKILLS_DIR = 'skills';
const SKILL_FILE = 'SKILL.md';
const MANIFEST_REL = 'bin/skill-integrity.manifest.json';
const SCHEMA = { version: 1, algorithm: 'sha256' };
const HASH_RE = /^[0-9a-f]{64}$/;
// Manifest keys: src/<type>/.<harness>/skills/<path>, POSIX separators, no empty, '.' or '..' segments.
const SKILL_KEY_RE = /^src\/(?:repo|monorepo)\/\.[^/\\]+\/skills\/[^/\\]+(?:\/[^/\\]+)*$/;
const MAX_LISTED = 20;
// Reserved names by folded key (see fold) and their only accepted spelling. A Map, so inherited
// Object.prototype keys such as `constructor` are never looked up as reserved names.
const RESERVED = new Map([['skills', 'skills'], ['skill.md', SKILL_FILE]]);

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Folding that matches how case-insensitive or normalizing targets treat names (macOS, Windows):
// Unicode NFC, lowercase, and trailing dots or spaces (Windows ignores them).
function fold(name) {
  return name.normalize('NFC').toLowerCase().replace(/[. ]+$/, '');
}

// Names come from the filesystem or a manifest, so diagnostics show them plainly only when they are
// ordinary; anything else is JSON-quoted, and control, DEL/C1, soft hyphen, Arabic letter mark,
// zero-width and bidi format characters, and the BOM are escaped as backslash-u sequences.
const PLAIN_RE = /^[A-Za-z0-9._/@+,=~-]+$/;
const BACKSLASH = String.fromCharCode(92);
function suspiciousCode(code) {
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || code === 0xad || code === 0x61c
    || (code >= 0x200b && code <= 0x200f) || (code >= 0x2028 && code <= 0x202e)
    || (code >= 0x2066 && code <= 0x2069) || code === 0xfeff;
}
function show(value) {
  const s = String(value);
  if (PLAIN_RE.test(s)) return s;
  let out = '';
  for (const ch of JSON.stringify(s)) {
    const code = ch.codePointAt(0);
    out += suspiciousCode(code) ? `${BACKSLASH}u${code.toString(16).padStart(4, '0')}` : ch;
  }
  return out;
}

// Only "does not exist" (ENOENT, ENOTDIR) counts as absence. Anything else (EACCES, EIO, ...) throws,
// so an unreadable tree fails the check instead of looking like a missing file.
function lstatOrNull(abs) {
  try {
    return fs.lstatSync(abs);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return null;
    throw e;
  }
}

function digestOf(abs) {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

// Real directories named `skills` directly under a dot-directory (harness config) of each template.
// Symlinks in those dot-directories are problems: they could pull content in from outside the package.
function discoverRoots(pkgRoot) {
  const roots = [];
  const problems = [];
  for (const type of TEMPLATE_TYPES) {
    const typeRel = `src/${type}`;
    const typeStat = lstatOrNull(path.join(pkgRoot, typeRel));
    if (!typeStat || !typeStat.isDirectory()) {
      problems.push(`${typeRel}: template directory missing or not a real directory`);
      continue;
    }
    for (const name of fs.readdirSync(path.join(pkgRoot, typeRel)).sort()) {
      if (!name.startsWith('.')) continue;
      const dotRel = `${typeRel}/${name}`;
      const dotStat = lstatOrNull(path.join(pkgRoot, dotRel));
      if (!dotStat) continue;
      if (dotStat.isSymbolicLink()) {
        problems.push(`${show(dotRel)}: symlink in template tree (not allowed)`);
        continue;
      }
      if (!dotStat.isDirectory()) continue;
      if (fold(name) !== name) {
        problems.push(`${show(dotRel)}: non-canonical dot-directory name (must be lowercase, no trailing dot or space)`);
        continue;
      }
      const rootRel = `${dotRel}/${SKILLS_DIR}`;
      const st = lstatOrNull(path.join(pkgRoot, rootRel));
      if (!st) continue;
      if (st.isSymbolicLink()) problems.push(`${show(rootRel)}: symlink (skill roots must be real directories)`);
      else if (!st.isDirectory()) problems.push(`${show(rootRel)}: not a directory`);
      else roots.push(rootRel);
    }
  }
  return { roots, problems };
}

// Every regular file under one root. Symlinks and other non-regular entries are problems, not skipped.
// Hidden files and directories are included: they are shipped and installed like any other file.
function walkRoot(pkgRoot, rootRel, files, problems) {
  const walk = (relDir) => {
    for (const e of fs.readdirSync(path.join(pkgRoot, relDir), { withFileTypes: true })) {
      const rel = `${relDir}/${e.name}`;
      if (e.isSymbolicLink()) problems.push(`${show(rel)}: symlink (not allowed in skill roots)`);
      else if (e.isDirectory()) walk(rel);
      else if (e.isFile()) files.push(rel);
      else problems.push(`${show(rel)}: non-regular entry (not allowed in skill roots)`);
    }
  };
  walk(rootRel);
}

// Walks every directory under src once (no symlink following). Rejects:
//  - reserved names in any spelling other than the canonical one (case, trailing dot/space aliases);
//  - reserved names outside the discovered roots, at any depth (they would install unverified,
//    including ancillary-only nested harness dirs such as apps/<app>/.agents/skills);
//  - case-folded collisions between names in a directory that holds or sits inside a root.
// Collisions are reported, not resolved: on a case-insensitive target one file would overwrite the other.
function scanNames(pkgRoot, roots) {
  const problems = [];
  const inRoot = (rel) => roots.some((r) => rel === r || rel.startsWith(`${r}/`));
  const touchesRoot = (rel) => roots.some((r) => rel === r || rel.startsWith(`${r}/`) || r.startsWith(`${rel}/`));
  const walk = (relDir) => {
    const entries = fs.readdirSync(path.join(pkgRoot, relDir), { withFileTypes: true });
    const groups = new Map();
    for (const e of entries) {
      const rel = `${relDir}/${e.name}`;
      const key = fold(e.name);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e.name);
      if (touchesRoot(relDir) && hasSuspicious(e.name)) {
        problems.push(`${show(rel)}: control or format character in name (not allowed)`);
      }
      const canonical = RESERVED.get(key);
      if (canonical === undefined) continue;
      if (e.name !== canonical) {
        problems.push(`${show(rel)}: wrong-case or alias of reserved name (use ${show(canonical)})`);
      } else if (!inRoot(rel)) {
        problems.push(key === SKILLS_DIR
          ? `${show(rel)}: skills directory outside the discovered skill roots (not verified)`
          : `${show(rel)}: skill entry point outside the skill roots (not verified)`);
      }
    }
    if (touchesRoot(relDir)) {
      for (const names of groups.values()) {
        if (names.length > 1) problems.push(`${show(relDir)}: case-folded name collision: ${names.map(show).join(', ')}`);
      }
    }
    for (const e of entries) {
      if (e.isDirectory()) walk(`${relDir}/${e.name}`);
    }
  };
  walk('src');
  return problems;
}

// Current state of the packaged skill roots: { files: { relPath: sha256 }, problems: [] }.
function collect(pkgRoot = PKG_ROOT) {
  const srcStat = lstatOrNull(path.join(pkgRoot, 'src'));
  if (!srcStat || !srcStat.isDirectory()) {
    return { files: {}, problems: ['src: missing or not a real directory'] };
  }
  const { roots, problems } = discoverRoots(pkgRoot);
  if (roots.length === 0) problems.push('no skill roots found under src/<type>/.<harness>/skills');
  const rels = [];
  for (const r of roots) walkRoot(pkgRoot, r, rels, problems);
  problems.push(...scanNames(pkgRoot, roots));
  const files = {};
  for (const rel of rels.sort()) files[rel] = digestOf(path.join(pkgRoot, rel));
  return { files, problems };
}

function hasSuspicious(text) {
  return Array.from(text).some((ch) => suspiciousCode(ch.codePointAt(0)));
}

function isSkillPath(key) {
  return typeof key === 'string' && SKILL_KEY_RE.test(key) && !hasSuspicious(key)
    && !key.split('/').some((s) => s === '.' || s === '..');
}

// The only accepted manifest text: keys sorted, 2-space JSON, trailing newline.
function manifestText(files) {
  const sorted = Object.fromEntries(Object.keys(files).sort().map((k) => [k, files[k]]));
  return JSON.stringify({ version: SCHEMA.version, algorithm: SCHEMA.algorithm, files: sorted }, null, 2) + '\n';
}

// Reads and validates a manifest. Returns { files, problems }. Problems mean the files map is not trusted.
// Read errors propagate; only a missing file and malformed content are reported as problems.
function readManifestAt(abs, rawLabel) {
  const label = show(rawLabel);
  const st = lstatOrNull(abs);
  if (!st) {
    return { files: {}, problems: [`${label}: missing. Run "snapshot" to a candidate file, review the diff, then copy it here`] };
  }
  if (!st.isFile()) return { files: {}, problems: [`${label}: must be a regular file (symlink or other entry found)`] };
  const text = fs.readFileSync(abs, 'utf8');
  let m;
  try {
    m = JSON.parse(text);
  } catch (_) {
    return { files: {}, problems: [`${label}: not valid JSON`] };
  }
  const problems = [];
  if (!isPlainObject(m) || Object.keys(m).sort().join(',') !== 'algorithm,files,version') {
    problems.push(`${label}: top level must hold exactly version, algorithm and files`);
  } else {
    if (m.version !== SCHEMA.version) problems.push(`${label}: unsupported version`);
    if (m.algorithm !== SCHEMA.algorithm) problems.push(`${label}: algorithm must be "${SCHEMA.algorithm}"`);
    if (!isPlainObject(m.files)) {
      problems.push(`${label}: "files" must be an object`);
    } else {
      for (const [key, value] of Object.entries(m.files)) {
        if (!isSkillPath(key)) problems.push(`${label}: unsafe or out-of-scope path ${show(key)}`);
        if (typeof value !== 'string' || !HASH_RE.test(value)) {
          problems.push(`${label}: digest for ${show(key)} must be 64 lowercase hex characters`);
        }
      }
      if (problems.length === 0 && text !== manifestText(m.files)) {
        problems.push(`${label}: not in canonical form (sorted keys, 2-space JSON, trailing newline); regenerate with snapshot`);
      }
    }
  }
  return { files: problems.length === 0 ? m.files : {}, problems };
}

// Keys in the reviewed manifest but not on disk are missing; on disk but not in the manifest are added.
function diffFiles(expected, actual) {
  const changes = [];
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  for (const k of keys) {
    if (!hasOwn(actual, k)) changes.push({ kind: 'missing', path: k });
    else if (!hasOwn(expected, k)) changes.push({ kind: 'added', path: k });
    else if (expected[k] !== actual[k]) changes.push({ kind: 'modified', path: k });
  }
  return changes;
}

// Read-only comparison of the packaged skill roots with the reviewed manifest.
function check(pkgRoot = PKG_ROOT) {
  const reviewed = readManifestAt(path.join(pkgRoot, MANIFEST_REL), MANIFEST_REL);
  const current = collect(pkgRoot);
  const count = Object.keys(current.files).length;
  const problems = [...reviewed.problems, ...current.problems];
  if (count === 0) problems.push('no skill files discovered');
  const changes = reviewed.problems.length ? [] : diffFiles(reviewed.files, current.files);
  return { count, problems, changes, ok: problems.length === 0 && changes.length === 0 };
}

// Throws before any write when the packaged skills do not match. Used by install and patch.
function assertIntact(pkgRoot = PKG_ROOT) {
  const r = check(pkgRoot);
  if (r.ok) return r.count;
  const lines = [...r.problems, ...r.changes.map((c) => `${c.kind}: ${show(c.path)}`)];
  const shown = lines.slice(0, MAX_LISTED).map((l) => `     - ${l}`);
  if (lines.length > MAX_LISTED) shown.push(`     ...and ${lines.length - MAX_LISTED} more`);
  throw new Error(`packaged skill integrity check failed (${lines.length} problem(s)); nothing was written:\n`
    + `${shown.join('\n')}\n     Run: npm run skills:check`);
}

function report(r) {
  if (r.ok) {
    console.log(`OK: ${r.count} packaged skill file(s) match ${MANIFEST_REL}.`);
    return 0;
  }
  console.log(`FAIL: packaged skills do not match ${MANIFEST_REL}.`);
  for (const p of r.problems) console.log(`  problem: ${p}`);
  for (const c of r.changes) console.log(`  ${c.kind}: ${show(c.path)}`);
  console.log('Nothing was changed. Review the skill content, then update the manifest through snapshot and diff.');
  return 1;
}

// Writes a new candidate manifest. Refuses the reviewed manifest path and any existing file.
function snapshot(out, pkgRoot = PKG_ROOT) {
  const outAbs = path.resolve(out);
  if (outAbs === path.join(path.resolve(pkgRoot), MANIFEST_REL)) {
    throw new Error(`refusing to write the reviewed manifest ${MANIFEST_REL}; write a candidate file, review the diff, then copy it in`);
  }
  const { files, problems } = collect(pkgRoot);
  if (problems.length) {
    problems.forEach((p) => console.log(`  problem: ${p}`));
    throw new Error('snapshot refused: the skill roots have problems (nothing written)');
  }
  fs.writeFileSync(outAbs, manifestText(files), { flag: 'wx' });
  return Object.keys(files).length;
}

// Compares the reviewed manifest with a candidate. Read-only. Exit 0 only when both are valid and identical.
function diff(candidate, pkgRoot = PKG_ROOT) {
  const reviewed = readManifestAt(path.join(pkgRoot, MANIFEST_REL), MANIFEST_REL);
  const cand = readManifestAt(path.resolve(candidate), candidate);
  const problems = [...reviewed.problems, ...cand.problems];
  const changes = problems.length ? [] : diffFiles(reviewed.files, cand.files);
  return { problems, changes, ok: problems.length === 0 && changes.length === 0 };
}

function usage() {
  console.log('Usage: node bin/skill-integrity.js check | snapshot <candidate.json> | diff <candidate.json>');
}

function main(argv) {
  const [cmd, arg] = argv;
  try {
    if (cmd === 'check' && argv.length === 1) {
      process.exitCode = report(check());
    } else if (cmd === 'snapshot' && arg && argv.length === 2) {
      const n = snapshot(arg);
      console.log(`Wrote candidate ${show(arg)} with ${n} file(s). Review the skill diff, then copy it to ${MANIFEST_REL}.`);
    } else if (cmd === 'diff' && arg && argv.length === 2) {
      const r = diff(arg);
      if (r.ok) {
        console.log(`OK: ${show(arg)} matches ${MANIFEST_REL}.`);
      } else {
        for (const p of r.problems) console.log(`  problem: ${p}`);
        for (const c of r.changes) console.log(`  ${c.kind}: ${show(c.path)}`);
        process.exitCode = 1;
      }
    } else {
      usage();
      process.exitCode = 1;
    }
  } catch (e) {
    console.error(`FAIL: ${e.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main(process.argv.slice(2));

module.exports = {
  PKG_ROOT,
  MANIFEST_REL,
  SKILL_FILE,
  discoverRoots,
  collect,
  manifestText,
  readManifestAt,
  diffFiles,
  check,
  assertIntact,
  snapshot,
  diff,
  show,
  fold,
};
