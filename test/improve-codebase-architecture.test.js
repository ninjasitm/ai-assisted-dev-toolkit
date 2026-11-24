'use strict';

// Structural checks for the improve-codebase-architecture skill: both layouts are byte-identical, the frontmatter
// carries only the portable name and description fields with the expected name, and the pinned upstream sources
// are credited by path and commit. Wording and behavior are not asserted; this is not a runtime test.
// Run with: node --test test/improve-codebase-architecture.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const SKILL = '.agents/skills/improve-codebase-architecture/SKILL.md';
const PIN = 'd65391149dbb5fe76478e76fa8d5122b2aa5a70e';
const UPSTREAM = [
  'skills/engineering/improve-codebase-architecture/SKILL.md',
  'skills/engineering/codebase-design/SKILL.md',
];

const read = (layout) => fs.readFileSync(path.join(ROOT, layout, SKILL), 'utf8');

test('improve-codebase-architecture: SKILL.md is byte-identical in src/repo and src/monorepo', () => {
  const [repo, monorepo] = LAYOUTS.map((layout) => fs.readFileSync(path.join(ROOT, layout, SKILL)));
  assert.ok(repo.equals(monorepo));
});

for (const layout of LAYOUTS) {
  test(`${layout}/improve-codebase-architecture: frontmatter has only the portable name and description fields`, () => {
    const match = read(layout).match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(match, 'frontmatter present');
    const keys = match[1].split('\n').map((line) => line.split(':')[0]);
    assert.deepEqual(keys, ['name', 'description']);
    assert.equal(match[1].split('\n')[0], 'name: improve-codebase-architecture');
  });

  test(`${layout}/improve-codebase-architecture: credits the pinned upstream source paths`, () => {
    const text = read(layout);
    for (const source of UPSTREAM) assert.ok(text.includes(source), source);
    assert.ok(text.includes(PIN), 'pinned commit');
  });
}
