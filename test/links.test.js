'use strict';

// Link checks for the template sources and for a scoped install of every harness.
// Every relative markdown link and every whole-line `@path` import in .md/.mdc files must
// resolve to an existing file or directory. Fenced and inline code are ignored, and so are
// URLs, in-page anchors, absolute paths, targets still containing a {{PLACEHOLDER}}, and
// `templates/` (blank forms whose links name files the user creates later).
// Run with: npm test  (node --test). No network.

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cli.js');
const LAYOUTS = ['repo', 'monorepo'];
const ENVS = ['claude', 'codex', 'copilot', 'cursor', 'opencode'];

const LINK = /\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"\n]*")?\)/g;
const IMPORT = /^@(\S+)$/gm;

function markdownFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // `.nitm/BOOTSTRAP.md` is a generated handoff copied from a template, so its links are not ours.
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.nitm') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) markdownFiles(full, out);
    else if (/\.(md|mdc)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Prose only: fenced blocks (also when indented in a list) and inline code can show link syntax as an example.
function prose(content) {
  let inFence = false;
  return content.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return '';
    }
    return inFence ? '' : line.replace(/`[^`\n]*`/g, '');
  }).join('\n');
}

function linkTarget(raw) {
  const target = raw.replace(/^<|>$/g, '').replace(/[#?].*$/, '');
  if (!target || target.includes('{{') || target.startsWith('/')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  return target;
}

// Every broken link under `root` as { file, target }, with `file` relative to `root`.
function scanLinks(root) {
  const broken = [];
  for (const abs of markdownFiles(root)) {
    const file = path.relative(root, abs).split(path.sep).join('/');
    if (file.startsWith('templates/')) continue;
    const text = prose(fs.readFileSync(abs, 'utf8'));
    for (const [, raw] of text.matchAll(LINK)) {
      const target = linkTarget(raw);
      if (target && !fs.existsSync(path.resolve(path.dirname(abs), target))) {
        broken.push({ file, target: raw });
      }
    }
    // Whole-line imports (`@.claude/...`, `@AGENTS.md`) resolve from the project root they are installed into.
    for (const [, raw] of text.matchAll(IMPORT)) {
      const target = linkTarget(raw);
      if (target && !fs.existsSync(path.join(root, target))) {
        broken.push({ file, target: `@${raw}` });
      }
    }
  }
  return broken;
}

function describe(broken) {
  return broken.map(({ file, target }) => `  ${file} -> ${target}`).join('\n');
}

for (const layout of LAYOUTS) {
  test(`links: every relative link and @import in src/${layout} resolves`, () => {
    const broken = scanLinks(path.join(ROOT, 'src', layout));
    assert.deepEqual(broken, [], `broken links in src/${layout}:\n${describe(broken)}`);
  });
}

// Each scoped install is built once and shared by the dangling-link tests.
const installs = new Map();
function scopedInstall(layout, env) {
  const key = `${layout}/${env}`;
  if (!installs.has(key)) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-links-'));
    const run = spawnSync(process.execPath, [CLI, 'install', `--${layout}`, '--env', env],
      { cwd: dir, encoding: 'utf8' });
    installs.set(key, { dir, status: run.status, output: run.stderr || run.stdout });
  }
  return installs.get(key);
}
after(() => {
  for (const { dir } of installs.values()) fs.rmSync(dir, { recursive: true, force: true });
});

for (const layout of LAYOUTS) {
  for (const env of ENVS) {
    test(`links: scoped ${layout} install for --env ${env} has no dangling links`, () => {
      const install = scopedInstall(layout, env);
      assert.equal(install.status, 0, install.output);
      const broken = scanLinks(install.dir);
      assert.deepEqual(broken, [], `dangling links after --env ${env} ${layout} install:\n${describe(broken)}`);
    });
  }
}
