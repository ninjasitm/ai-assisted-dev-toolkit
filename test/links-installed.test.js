'use strict';

// Link check on INSTALLED output. Every repo and monorepo shape is installed into a fresh temp
// directory (all harnesses, then each --env), and every relative Markdown link in the result must
// resolve to an existing file. A link with a #anchor must also resolve to an existing heading in the
// target (GitHub slug rules, duplicate headings numbered -1, -2, ...).
// Ignored: fenced code (``` and ~~~, closed only by the same fence character at least as long),
// inline code, URLs, absolute paths, and targets containing {{PLACEHOLDER}}. Every first-party installed
// Markdown file is scanned, including the generated `.nitm/BOOTSTRAP.md` handoff and `templates/`.
// Run with: node --test test/links-installed.test.js. No network.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cli.js');
const LAYOUTS = ['repo', 'monorepo'];
// undefined = no --env, so every harness directory is installed.
const ENVS = [undefined, 'claude', 'codex', 'copilot', 'cursor', 'opencode'];

const LINK = /\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"\n]*")?\)/g;
const IMPORT = /^@(\S+)$/gm;
const FENCE_OPEN = /^\s*(`{3,}|~{3,})(.*)$/;
const HEADING = /^ {0,3}#{1,6}(?:[ \t]+(.*?))?[ \t]*$/;

function markdownFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) markdownFiles(full, out);
    else if (/\.(md|mdc)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Lines outside fenced code. A fence closes only on the same character, at least as long as the
// opener, with nothing after it (CommonMark), so a ```` block may contain ``` examples.
function outsideFences(content) {
  let fence = null;
  return content.split('\n').map((line) => {
    const open = FENCE_OPEN.exec(line);
    if (fence) {
      const close = open && open[1][0] === fence[0] && open[1].length >= fence.length && open[2].trim() === '';
      if (close) fence = null;
      return '';
    }
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      fence = open[1];
      return '';
    }
    return line;
  });
}

// GitHub heading slug: link text only, lowercase, drop emoji (and their variation selectors) and
// punctuation except hyphen and underscore, spaces to hyphens.
function slugify(text) {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[^\p{L}\p{N}\p{M}_ -]/gu, '')
    .replace(/ /g, '-');
}

// Anchors a document exposes: heading slugs (with duplicate suffixes) and explicit id/name attributes.
function anchorsOf(content) {
  const anchors = new Set();
  const seen = new Map();
  for (const line of outsideFences(content)) {
    const heading = HEADING.exec(line);
    if (heading) {
      const text = (heading[1] || '').replace(/(^|[ \t]+)#+$/, '');
      const base = slugify(text);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      anchors.add(count ? `${base}-${count}` : base);
    }
    for (const [, id] of line.matchAll(/\b(?:id|name)="([^"]+)"/g)) anchors.add(id);
  }
  return anchors;
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// { path, anchor } for a relative target, or null for targets this check does not judge.
function relativeTarget(raw) {
  const cleaned = raw.replace(/^<|>$/g, '');
  if (!cleaned || cleaned.includes('{{') || cleaned.startsWith('/')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(cleaned)) return null;
  const hash = cleaned.indexOf('#');
  const pathPart = (hash === -1 ? cleaned : cleaned.slice(0, hash)).replace(/\?.*$/, '');
  const anchor = hash === -1 ? '' : cleaned.slice(hash + 1);
  return { path: decode(pathPart), anchor: decode(anchor) };
}

// Every broken link under `root` as { file, target, reason }, plus how many links were checked.
function scanLinks(root) {
  const broken = [];
  let checked = 0;
  const anchorCache = new Map();
  const anchorsFor = (abs) => {
    if (!anchorCache.has(abs)) anchorCache.set(abs, anchorsOf(fs.readFileSync(abs, 'utf8')));
    return anchorCache.get(abs);
  };

  for (const abs of markdownFiles(root)) {
    const file = path.relative(root, abs).split(path.sep).join('/');
    const text = outsideFences(fs.readFileSync(abs, 'utf8'))
      .map((line) => line.replace(/`[^`\n]*`/g, ''))
      .join('\n');

    for (const [, raw] of text.matchAll(LINK)) {
      const target = relativeTarget(raw);
      if (!target) continue;
      checked += 1;
      // An in-page `#anchor` names the current document.
      const dest = target.path ? path.resolve(path.dirname(abs), target.path) : abs;
      if (!fs.existsSync(dest)) {
        broken.push({ file, target: raw, reason: 'missing file' });
      } else if (target.anchor && /\.(md|mdc)$/.test(dest) && fs.statSync(dest).isFile()
        && !anchorsFor(dest).has(target.anchor)) {
        broken.push({ file, target: raw, reason: `missing anchor #${target.anchor}` });
      }
    }

    // Whole-line imports (`@.claude/...`, `@AGENTS.md`) resolve from the project root they are installed into.
    for (const [, raw] of text.matchAll(IMPORT)) {
      const target = relativeTarget(raw);
      if (!target) continue;
      checked += 1;
      if (!fs.existsSync(path.join(root, target.path))) {
        broken.push({ file, target: `@${raw}`, reason: 'missing import' });
      }
    }
  }
  return { broken, checked };
}

function describe(broken) {
  return broken.map(({ file, target, reason }) => `  ${file} -> ${target} (${reason})`).join('\n');
}

function installInto(dir, layout, env) {
  const args = [CLI, 'install', `--${layout}`];
  if (env) args.push('--env', env);
  const run = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8' });
  return { status: run.status, output: run.stderr || run.stdout };
}

test('installed links: slug rules and anchor detection behave as GitHub does', () => {
  assert.equal(slugify('Trust and Security Gate'), 'trust-and-security-gate');
  assert.equal(slugify('`Foo` Bar: baz!'), 'foo-bar-baz');
  assert.equal(slugify('See [Link Text](https://example.com/x) now'), 'see-link-text-now');
  assert.deepEqual([...anchorsOf('## Same\n\n```\n## Hidden\n```\n\n## Same\n')].sort(), ['same', 'same-1']);
});

test('installed links: a dead anchor and a dead file are both reported', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-installed-links-fixture-'));
  try {
    fs.writeFileSync(path.join(dir, 'target.md'), '# Real Heading\n');
    fs.writeFileSync(path.join(dir, 'doc.md'),
      '[ok](target.md#real-heading)\n[bad anchor](target.md#missing)\n[bad file](nope.md)\n' +
      '```\n[ignored](nope.md)\n```\n[placeholder]({{X}}/y.md)\n');
    const { broken, checked } = scanLinks(dir);
    assert.equal(checked, 3);
    assert.deepEqual(broken.map((b) => b.target), ['target.md#missing', 'nope.md']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

for (const layout of LAYOUTS) {
  for (const env of ENVS) {
    const label = `${layout} ${env ? `--env ${env}` : '(all harnesses)'}`;
    test(`installed links: ${label} has no dead links or anchors`, () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-installed-links-'));
      try {
        const install = installInto(dir, layout, env);
        assert.equal(install.status, 0, install.output);
        const { broken, checked } = scanLinks(dir);
        assert.ok(checked > 0, `no links were checked in the ${label} install`);
        assert.deepEqual(broken, [], `dead links after ${label} install:\n${describe(broken)}`);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  }
}

