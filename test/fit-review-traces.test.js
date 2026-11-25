'use strict';

// Static trace checks. Each fixture under test/fixtures/fit-traces/ lists the expected step sequence of one
// flow, and the template text that must support each step in both layouts. The checks read template text
// only; they do not prove runtime behavior. Also checks the UI routing and autonomous routing rules.
// Run with: node --test test/fit-review-traces.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const FIXTURES = path.join(__dirname, 'fixtures', 'fit-traces');

const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');

for (const name of fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.json')).sort()) {
  const trace = JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));

  test(`trace ${trace.trace} (${name}): ${trace.title}`, () => {
    assert.deepEqual(
      trace.steps.map((s) => s.id),
      trace.expected_sequence,
      'the fixture steps follow its expected sequence',
    );
    for (const layout of LAYOUTS) {
      for (const step of trace.steps) {
        const text = read(layout, step.file);
        for (const re of step.must || []) {
          assert.match(text, new RegExp(re), `${layout} ${step.id} must: ${re}`);
        }
        for (const re of step.must_not || []) {
          assert.doesNotMatch(text, new RegExp(re), `${layout} ${step.id} must not: ${re}`);
        }
        for (const [first, second] of step.after || []) {
          const a = text.indexOf(first);
          const b = text.indexOf(second);
          assert.notEqual(a, -1, `${layout} ${step.id} missing: ${first}`);
          assert.notEqual(b, -1, `${layout} ${step.id} missing: ${second}`);
          assert.ok(a < b, `${layout} ${step.id}: "${first}" must come before "${second}"`);
        }
      }
    }
  });
}

for (const layout of LAYOUTS) {
  test(`UI routing: ${layout} defines simple and beyond-simple UI work once, and the feature and plan prompts only reference it`, () => {
    const subagent = read(layout, '.claude/rules-snippets/subagent-workflow.md');
    assert.match(subagent, /### UI Work Routing/);
    assert.match(subagent, /\*\*Simple UI fixes\*\* .*are implemented directly by the UI builder above, with no question about mockups\./);
    assert.match(subagent, /\*\*UI-only fixes\*\* \(visual-only fixes, regardless of which lens reported them; no interaction-flow, code-lens, or security finding\) go to an edit-enabled `designer`\. Fallback: `frontend-developer`, then `implementer`\./);
    assert.match(subagent, /\*\*Combined UI\/UX work, or mixed UI and code,\*\* goes wholly to an edit-enabled `frontend-developer`\. Fallback: `implementer`\. Never split a mixed task between agents\./);
    assert.match(subagent, /\*\*Security findings\*\* stay on `implementer`, even when UI is involved\./);
    assert.match(subagent, /If mockups are requested, the designer produces them before implementation\. The mockup answer does not select the builder\./);
    assert.match(subagent, /\*\*Work beyond simple\*\* .*asks the user once, at spec or plan time, whether they want mockups first/);
    assert.match(subagent, /Record the answer in the spec or plan; Factory stores it as `mockups` in `job\.json`/);
    assert.match(subagent, /If no answer is recorded when the affected dispatch is due, obtain it before that dispatch/);
    assert.match(subagent, /Only the user answers the mockup question\. Goal-fit checks and Oracle never decide it\./);
    for (const file of ['.claude/prompt-snippets/implement-feature.md', '.claude/prompt-snippets/plan.md']) {
      const text = read(layout, file);
      assert.match(text, /UI Work Routing section of \[subagent-workflow\]/, `${layout} ${file} references the section`);
      assert.doesNotMatch(text, /asks the user once/, `${layout} ${file} does not restate the rule`);
    }
  });

  test(`autonomous routing: ${layout} says autonomous mode never picks an agent, and subagent routing references it`, () => {
    const autonomous = read(layout, '.agents/skills/autonomous-mode/SKILL.md');
    assert.match(autonomous, /Autonomous mode never picks an agent: each task routes to its specialist by its content, exactly as it does outside autonomous mode/);
    assert.doesNotMatch(autonomous, /default(s)? to (the )?implementer/i);
    const subagent = read(layout, '.claude/rules-snippets/subagent-workflow.md');
    assert.match(subagent, /Autonomous runs use this same routing and never default to one agent/);
  });
}
