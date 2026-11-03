'use strict';

// Model capacity fallback guidance in the subagent workflow snippet, for both layouts. Checks that the
// section exists, that the two layouts carry the same text (source parity), and that the rules keep the
// agent fixed, change only the model, bound the attempts, and disclose the switch. It does not compare prose.
// Run with: node --test test/model-capacity-fallback.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const REL = '.claude/rules-snippets/subagent-workflow.md';
const HEADING = '## Model Capacity Fallback';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// The section runs from its heading to the next level-2 heading (or end of file).
function section(content) {
  const start = content.indexOf(HEADING);
  if (start === -1) return '';
  const next = content.indexOf('\n## ', start + HEADING.length);
  return (next === -1 ? content.slice(start) : content.slice(start, next)).trim();
}

function assertOrder(content, first, second) {
  const a = content.indexOf(first);
  const b = content.indexOf(second);
  assert.notEqual(a, -1, `missing: ${first}`);
  assert.notEqual(b, -1, `missing: ${second}`);
  assert.ok(a < b, `"${first}" must come before "${second}"`);
}

for (const layout of LAYOUTS) {
  test(`model fallback: ${layout} subagent-workflow has the capacity fallback section`, () => {
    assert.notEqual(section(read(`${layout}/${REL}`)), '', 'section missing');
  });
}

test('model fallback: both layouts carry the same section text', () => {
  const [repo, monorepo] = LAYOUTS.map((layout) => section(read(`${layout}/${REL}`)));
  assert.equal(repo, monorepo);
});

test('model fallback: the agent stays fixed and only the model changes', () => {
  const s = section(read(`src/repo/${REL}`));
  assert.match(s, /same agent/i);
  assert.match(s, /do not substitute an equivalent agent/i);
  assert.match(s, /switch its \*\*model\*\* and keep its \*\*agent\*\*/);
});

test('model fallback: configured order comes before the harness default, then a blocker', () => {
  const s = section(read(`src/repo/${REL}`));
  assertOrder(s, 'configured fallback order', 'harness\'s known available default');
  assertOrder(s, 'harness\'s known available default', 'Blocker when nothing is left');
});

test('model fallback: attempts are bounded and the same model is never retried or waited on', () => {
  const s = section(read(`src/repo/${REL}`));
  assert.match(s, /one attempt each/i);
  assert.match(s, /do not cycle back/i);
  assert.match(s, /never\*\* retry the same unavailable model/i);
  assert.match(s, /never wait blindly for a quota reset/i);
});

test('model fallback: no invented model IDs, no persistent config or account edits, no Slim-specific fields', () => {
  const s = section(read(`src/repo/${REL}`));
  assert.match(s, /do not invent model IDs/i);
  assert.match(s, /do not edit persistent or global config, accounts, or billing/i);
  assert.doesNotMatch(s, /slim/i);
});

test('model fallback: the work is inspected before resume and review stays independent', () => {
  const s = section(read(`src/repo/${REL}`));
  assertOrder(s, 'Inspect before resuming', 'Never run two writers');
  assert.match(s, /reviewer stays a separate agent from the builder/i);
});

test('model fallback: the switch is disclosed in the final report', () => {
  const s = section(read(`src/repo/${REL}`));
  assert.match(s, /Disclose\.\*\* The final report names the original model, each fallback attempted/);
});
