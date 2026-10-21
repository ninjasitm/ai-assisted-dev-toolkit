'use strict';

// OpenCode V2 does not expand `@path` imports, so every `.opencode/**` wrapper must name its
// snippet with the explicit-read form from bootstrap-upgrade.md. These checks walk the root
// `.opencode/` and both shipped layouts, fail on any bare `@.claude/` ref, and confirm each
// referenced `.claude/` path exists in the layout that installs the wrapper.
// Run with: node --test test/opencode-wrappers.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Each entry is a directory that is installed as a project root, so `.claude/` paths resolve from it.
const LAYOUTS = ['.', 'src/repo', 'src/monorepo'];
const BARE_REF = /@\.claude\//;
const EXPLICIT_READ = /^Read and follow `(\.claude\/(?:prompt|rules|agents)-snippets\/[^`\s]+\.md)` \S.*$/gm;

function opencodeMarkdown(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) opencodeMarkdown(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const wrappers = LAYOUTS.flatMap((layout) =>
  opencodeMarkdown(path.join(ROOT, layout, '.opencode')).map((file) => ({
    layout,
    file,
    rel: path.relative(ROOT, file).split(path.sep).join('/'),
  })));

test('opencode wrappers: found wrappers under root, src/repo and src/monorepo', () => {
  for (const layout of LAYOUTS) {
    assert.ok(wrappers.some((w) => w.layout === layout), `no .opencode wrappers under ${layout}`);
  }
});

for (const { rel, file, layout } of wrappers) {
  test(`opencode wrappers: ${rel} has no bare @.claude/ ref`, () => {
    const lines = fs.readFileSync(file, 'utf8').split('\n')
      .map((line, i) => ({ line, no: i + 1 }))
      .filter(({ line }) => BARE_REF.test(line));
    assert.deepEqual(lines.map(({ no, line }) => `${rel}:${no}: ${line}`), [],
      'use "Read and follow `.claude/<dir>/<name>.md` <purpose>." instead of @-imports');
  });

  test(`opencode wrappers: ${rel} references resolve to existing .claude/ snippets`, () => {
    const content = fs.readFileSync(file, 'utf8');
    const refs = [...content.matchAll(EXPLICIT_READ)].map((m) => m[1]);
    const missing = refs.filter((ref) => !fs.existsSync(path.join(ROOT, layout, ref)));
    assert.deepEqual(missing, [], `${rel} points at snippets missing from ${layout}`);
  });
}
