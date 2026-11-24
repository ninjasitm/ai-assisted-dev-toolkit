'use strict';

// Static contract checks for the clarification handoffs: the self-contained grill-me skill, its
// wiring into /specify and /plan on real ambiguity, the to-spec interface-decision rule in /specify,
// and the to-tickets preview-and-approve gate in /assign-tasks. They read template text only; they do
// not prove how an agent behaves at runtime. Link targets are checked here for the new skill link.
// Run with: node --test test/clarification-handoffs.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SHA = 'd65391149dbb5fe76478e76fa8d5122b2aa5a70e';
const LAYOUTS = ['src/repo', 'src/monorepo'];
const GRILL = '.agents/skills/grill-me/SKILL.md';
const SPECIFY = '.claude/prompt-snippets/specify.md';
const PLAN = '.claude/prompt-snippets/plan.md';
const ASSIGN = '.claude/prompt-snippets/assign-tasks.md';
const TASKS = '.claude/prompt-snippets/tasks.md';

const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');
const exists = (layout, file) => fs.existsSync(path.join(ROOT, layout, file));

test('grill-me is identical in both layouts and is a self-contained skill', () => {
  const repo = read('src/repo', GRILL);
  assert.equal(repo, read('src/monorepo', GRILL), 'grill-me differs between layouts');
  assert.match(repo, /^---\nname: grill-me\ndescription: .+\n---\n/);
  // Self-contained: no markdown links to other files, and no invocation of another skill.
  assert.doesNotMatch(repo, /\]\([^)]*\)/, 'grill-me must not link to other files');
  assert.doesNotMatch(repo, /Call the Skill tool|grilling skill|grill-with-docs/);
  // Read-only and never auto-confirms.
  assert.match(repo, /\*\*Read-only\.\*\*/);
  assert.match(repo, /\*\*Never auto-confirm\.\*\*/);
  // Focused on blocking ambiguity; a caller's cap wins over the default; existing approvals stand.
  assert.match(repo, /^description: Use to resolve blocking ambiguity/m);
  assert.doesNotMatch(repo, /stress-test a plan/);
  assert.match(repo, /\*\*Blocking only\.\*\*/);
  assert.match(repo, /A round cap set by the caller \(for example, Factory\) wins over the default/);
  assert.match(repo, /\*\*Existing approvals stand\.\*\*/);
  assert.match(repo, /\*\*Not a gate\.\*\*/);
});

test('grill-me attributes the adapted upstream grilling skill at the pinned commit', () => {
  for (const layout of LAYOUTS) {
    const text = read(layout, GRILL);
    assert.ok(text.includes(`mattpocock/skills (MIT), \`skills/productivity/grilling/SKILL.md\` at commit \`${SHA}\``),
      `${layout}: missing pinned grilling attribution`);
  }
});

for (const layout of LAYOUTS) {
  test(`${layout}: /specify runs grill-me only on real ambiguity, before the spec is written`, () => {
    const text = read(layout, SPECIFY);
    const clarify = text.search(/Clarify [Rr]eal [Aa]mbiguity/);
    const spec = text.search(/Generate Specification|Create the specification/);
    assert.notEqual(clarify, -1, 'missing clarify step');
    assert.ok(clarify < spec, 'clarify step must come before spec generation');
    assert.match(text, /Skip this step when the request is clear/);
    assert.match(text, /\(\.\.\/\.\.\/\.agents\/skills\/grill-me\/SKILL\.md\)/);
    assert.match(text, /\[NEEDS CLARIFICATION: question\]/);
  });

  test(`${layout}: /plan runs grill-me only when the request is unclear`, () => {
    const text = read(layout, PLAN);
    assert.match(text, /Ask targeted questions only when the request is unclear; do not require creating a specification first\./);
    assert.match(text, /When it is unclear, run a grill-me round/);
    assert.match(text, /On re-entry from plan-only, remove copied \*\*Requirements Source\*\* and \*\*Acceptance Criteria\*\* text that the approved specification supersedes; keep the original source link and the fit review and plan confirmation records\./);
    assert.match(text, /\(\.\.\/\.\.\/\.agents\/skills\/grill-me\/SKILL\.md\)/);
  });

  test(`${layout}: /specify borrows only the interface-decision rule from to-spec, with no publication`, () => {
    const text = read(layout, SPECIFY);
    assert.match(text, /Name a module boundary or interface only when it changes accepted behavior/);
    assert.match(text, /Leave implementation design to `\/plan`/);
    assert.doesNotMatch(text, /publish|ready-for-agent|issue tracker/i);
    assert.ok(text.includes(`skills/engineering/to-spec/SKILL.md\` at commit \`${SHA}\``));
  });

  test(`${layout}: /assign-tasks previews and gets approval before any tracker write`, () => {
    const text = read(layout, ASSIGN);
    const preview = text.indexOf('**Preview and Approve** (before any tracker write)');
    const create = text.indexOf('**Create Tickets**:');
    assert.notEqual(preview, -1, 'missing preview step');
    assert.ok(preview < create, 'preview must come before ticket creation');
    assert.match(text, /Create nothing in \{\{ISSUE_TRACKER\}\} until the user approves that exact breakdown/);
    assert.match(text, /Blocked by: <numbers\/titles>/);
    assert.ok(text.includes(`skills/engineering/to-tickets/SKILL.md\` at commit \`${SHA}\``));
    // Steps stay sequential 1..7 after the insertion.
    const start = text.indexOf('## Process');
    const end = text.indexOf('## API Rate Limiting');
    assert.ok(start !== -1 && end > start, 'missing Process section');
    const nums = [...text.slice(start, end).matchAll(/^(\d)\. \*\*/gm)].map((m) => Number(m[1]));
    assert.deepEqual(nums, [1, 2, 3, 4, 5, 6, 7]);
  });

  test(`${layout}: /tasks is unchanged by this work`, () => {
    assert.doesNotMatch(read(layout, TASKS), /grill-me|Preview and Approve|to-tickets|to-spec/);
  });

  test(`${layout}: grill-me links resolve from the prompt snippets`, () => {
    for (const file of [SPECIFY, PLAN]) {
      const target = path.resolve(ROOT, layout, path.dirname(file), '../../.agents/skills/grill-me/SKILL.md');
      assert.ok(fs.existsSync(target), `${layout}/${file}: unresolved grill-me link ${target}`);
    }
    assert.ok(exists(layout, GRILL));
  });
}

test('specify and plan carry one conditional prototype pointer and one domain pointer, with isolation and no-edit boundaries', () => {
  for (const layout of LAYOUTS) {
    for (const file of [SPECIFY, PLAN]) {
      const text = read(layout, file);
      assert.equal(text.split('Conditional: offer a disposable prototype only when').length - 1, 1, `${layout}/${file}: prototype pointer count`);
      assert.equal(text.split('Conditional: for a domain term that blocks requirements').length - 1, 1, `${layout}/${file}: domain pointer count`);
      assert.match(text, /discussion and examples cannot settle one blocking behavior, UI, or state question and a runnable demo can/);
      assert.match(text, /keep it isolated and synthetic, with no commits or external operations/);
      assert.match(text, /no automatic glossary or ADR edits/);
    }
  }
});

test('the three edited snippets carry the same handoff markers in both layouts', () => {
  const markers = [
    'grill-me/SKILL.md',
    'to-spec/SKILL.md',
    'to-tickets/SKILL.md',
    'Preview and Approve',
  ];
  for (const file of [SPECIFY, PLAN, ASSIGN]) {
    for (const marker of markers) {
      const counts = LAYOUTS.map((layout) => read(layout, file).split(marker).length - 1);
      assert.equal(counts[0] > 0, counts[1] > 0,
        `${file}: marker "${marker}" present in one layout only (counts ${counts.join(', ')})`);
    }
  }
});
