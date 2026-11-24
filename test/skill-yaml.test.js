'use strict';

// Validates the YAML frontmatter of every owned SKILL.md: the root `.agents/skills` tree and both
// template trees (`src/repo`, `src/monorepo`). Discovery walks those directories on disk (no fixed
// count, no git, so it also works from a tarball or build context). Hidden directories such as
// `.git` are skipped, a symlink whose target leaves its skills root is an error, and an expected
// root with no skills is an error. Only the top `---` delimited block is parsed by a real YAML
// parser; the body is never read, so examples and {{PLACEHOLDER}} braces there are ignored.
// Rules: the block must hold exactly one YAML document, a mapping, with no duplicate keys, and
// `name` and `description` must be non-empty strings. Every problem is collected and reported
// together. CRLF is accepted. Run with: npm test (node --test) or npm run prepack. No network.

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.join(__dirname, '..');
const SKILL_ROOTS = ['.agents/skills', 'src/repo/.agents/skills', 'src/monorepo/.agents/skills'];
const SKILL_FILE = 'SKILL.md';
const REQUIRED = ['name', 'description'];

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function relToRoot(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// Returns { files: string[], errors: string[] } for one skills root. Symlinks are resolved and
// must stay inside the root; a directory reached twice is walked once.
function discoverSkillFiles(rootAbs) {
  const rootReal = fs.realpathSync(rootAbs);
  const files = [];
  const errors = [];
  const seen = new Set();

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      let real = full;
      let isDir = entry.isDirectory();
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          real = fs.realpathSync(full);
        } catch {
          errors.push(`${relToRoot(full)}: broken symlink`);
          continue;
        }
        if (!isInside(real, rootReal)) {
          errors.push(`${relToRoot(full)}: symlink escapes ${relToRoot(rootAbs)}`);
          continue;
        }
        const stat = fs.statSync(real);
        isDir = stat.isDirectory();
        isFile = stat.isFile();
      }
      if (isDir) {
        if (seen.has(real)) continue;
        seen.add(real);
        walk(full);
      } else if (isFile && entry.name === SKILL_FILE && !seen.has(real)) {
        seen.add(real);
        files.push(full);
      }
    }
  };

  walk(rootAbs);
  files.sort();
  return { files, errors };
}

// Splits the top `---` delimited frontmatter block from the rest of the file.
function frontmatterOf(text) {
  const src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  if (!/^---[ \t]*$/.test(lines[0])) {
    return { error: 'missing opening --- frontmatter delimiter on line 1' };
  }
  const end = lines.findIndex((line, i) => i > 0 && /^---[ \t]*$/.test(line));
  if (end === -1) return { error: 'missing closing --- frontmatter delimiter' };
  return { yamlText: lines.slice(1, end).join('\n') };
}

// Returns a list of { line?, message } issues for one SKILL.md text. Empty list means valid.
// `line` is the 1-based file line when the parser reports a position.
function validateSkillText(text) {
  const fm = frontmatterOf(text);
  if (fm.error) return [{ message: fm.error }];

  // The YAML block starts on file line 2, so YAML line N is file line N + 1.
  const docs = YAML.parseAllDocuments(fm.yamlText, { uniqueKeys: true });
  if (docs.length !== 1) {
    return [{ message: `frontmatter must hold exactly one YAML document, found ${docs.length}` }];
  }
  const doc = docs[0];
  if (doc.errors.length > 0) {
    return doc.errors.map((err) => ({
      line: err.linePos ? err.linePos[0].line + 1 : undefined,
      message: `YAML: ${err.message.split('\n')[0]}`,
    }));
  }

  // Unresolved aliases (e.g. `description: *missing`) raise no parse error but throw here.
  let value;
  try {
    value = doc.toJS();
  } catch (err) {
    // No line is reported: the error does not identify the alias position reliably.
    return [{ message: `YAML: cannot resolve value: ${String(err.message).split('\n')[0]}` }];
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [{ message: 'frontmatter must be a YAML mapping of key: value pairs' }];
  }

  const issues = [];
  for (const key of REQUIRED) {
    const v = value[key];
    if (typeof v !== 'string' || v.trim() === '') {
      issues.push({ message: `"${key}" must be a non-empty string` });
    }
  }
  return issues;
}

function formatIssue(file, issue) {
  const where = issue.line ? `:${issue.line}` : '';
  return `${relToRoot(file)}${where}: ${issue.message}`;
}

test('every expected skills root is discoverable and has no symlink escapes', () => {
  const problems = [];
  for (const rel of SKILL_ROOTS) {
    const { files, errors } = discoverSkillFiles(path.join(ROOT, rel));
    if (files.length === 0) problems.push(`${rel}: no ${SKILL_FILE} files discovered`);
    problems.push(...errors);
  }
  assert.deepEqual(problems, []);
});

// Validates every discovered SKILL.md under the given roots and returns all failures, never stopping
// at the first one. Each failure is formatted with its relative path and line when known.
function collectSkillFailures(rootsAbs) {
  const failures = [];
  let checked = 0;
  for (const rootAbs of rootsAbs) {
    const { files } = discoverSkillFiles(rootAbs);
    for (const file of files) {
      checked += 1;
      const text = fs.readFileSync(file, 'utf8');
      for (const issue of validateSkillText(text)) failures.push(formatIssue(file, issue));
    }
  }
  return { checked, failures };
}

test('every discovered SKILL.md has valid YAML frontmatter with required fields', () => {
  const { checked, failures } = collectSkillFailures(SKILL_ROOTS.map((rel) => path.join(ROOT, rel)));
  assert.ok(checked > 0, 'expected at least one SKILL.md to validate');
  assert.deepEqual(failures, [], `${failures.length} skill frontmatter problem(s):\n${failures.join('\n')}`);
});

test('aggregation: two malformed skills are both reported with their paths', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-yaml-agg-'));
  tempDirs.push(base);
  const write = (dir, text) => {
    fs.mkdirSync(path.join(base, dir), { recursive: true });
    fs.writeFileSync(path.join(base, dir, SKILL_FILE), text);
  };
  write('alias-skill', '---\nname: x\ndescription: *missing\n---\n');
  write('dup-skill', '---\nname: a\nname: b\ndescription: x\n---\n');
  write('ok-skill', '---\nname: ok\ndescription: fine\n---\n');

  const { checked, failures } = collectSkillFailures([base]);
  assert.equal(checked, 3);
  assert.equal(failures.length, 2, `expected exactly two failures, got:\n${failures.join('\n')}`);
  // Paths outside the repo are shown relative to ROOT, so match on the skill folder suffix.
  assert.ok(failures.some((f) => /alias-skill\/SKILL\.md: YAML: cannot resolve value/.test(f)), failures.join('\n'));
  assert.ok(failures.some((f) => /dup-skill\/SKILL\.md:3: YAML: Map keys must be unique/.test(f)), failures.join('\n'));
});

test('negative fixtures: malformed frontmatter is rejected', () => {
  const cases = {
    'malformed YAML (nested colon)': '---\nname: x\ndescription: a: b\n---\nbody\n',
    'duplicate key': '---\nname: a\nname: b\ndescription: x\n---\n',
    'multiple YAML documents': '---\nname: a\ndescription: b\n...\nname: c\n---\n',
    'non-mapping (list)': '---\n- a\n- b\n---\n',
    'missing name': '---\ndescription: only a description\n---\n',
    'blank description': '---\nname: x\ndescription: "   "\n---\n',
    'non-string name': '---\nname: [1, 2]\ndescription: x\n---\n',
    'missing opening delimiter': 'name: x\ndescription: y\n---\n',
    'missing closing delimiter': '---\nname: x\ndescription: y\n',
    'unresolved alias': '---\nname: x\ndescription: *missing\n---\n',
  };
  for (const [label, text] of Object.entries(cases)) {
    const issues = validateSkillText(text);
    assert.ok(issues.length > 0, `expected rejection: ${label}`);
  }
});

test('negative fixtures: legitimate frontmatter is accepted', () => {
  const cases = {
    'CRLF line endings': '---\r\nname: x\r\ndescription: y\r\n---\r\nbody\r\n',
    'key order and extra keys': '---\ndescription: y\nversion: 1.0.0\nname: x\n---\n',
    'block scalar with colons': '---\nname: x\ndescription: >\n  Folded text: with a colon\n---\n',
    'double-quoted scalar with colon': '---\nname: x\ndescription: "Two-phase: generate, then review"\n---\n',
    'body with placeholders and colon lines': '---\nname: x\ndescription: y\n---\nUse {{PROJECT_NAME}} here.\nkey: value: not frontmatter\n',
    'BOM prefix': '﻿---\nname: x\ndescription: y\n---\n',
  };
  for (const [label, text] of Object.entries(cases)) {
    assert.deepEqual(validateSkillText(text), [], `expected acceptance: ${label}`);
  }
});

test('negative fixtures: discovery skips hidden dirs and rejects symlink escapes', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-yaml-'));
  tempDirs.push(base);
  const skillsRoot = path.join(base, 'skills');
  const outside = path.join(base, 'outside');
  fs.mkdirSync(path.join(skillsRoot, 'real'), { recursive: true });
  fs.mkdirSync(path.join(skillsRoot, '.git', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(outside, 'leak'), { recursive: true });
  fs.writeFileSync(path.join(skillsRoot, 'real', SKILL_FILE), '---\nname: x\ndescription: y\n---\n');
  fs.writeFileSync(path.join(skillsRoot, '.git', SKILL_FILE), 'hidden, must be skipped');
  fs.writeFileSync(path.join(outside, 'leak', SKILL_FILE), '---\nname: x\ndescription: y\n---\n');
  fs.symlinkSync(path.join(outside, 'leak'), path.join(skillsRoot, 'leak'));

  const { files, errors } = discoverSkillFiles(skillsRoot);
  assert.deepEqual(files, [path.join(skillsRoot, 'real', SKILL_FILE)]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /symlink escapes/);
});
