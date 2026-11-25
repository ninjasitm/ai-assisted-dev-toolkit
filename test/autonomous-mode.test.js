'use strict';

// Static contract checks for the autonomous-mode skill and its wiring into /implement and /implement-feature.
// They read template text only: they show activation (trivial single task, multiple tasks, accepted input),
// gate placement and checkpoint positions, calling-flow authority, the canonical blocker classes, stable Oracle
// keys, parking, gated completion, both entry boundaries, mirror parity, and link integrity. They also check
// that no task, plan, or spec file is created. They do not prove runtime behavior.
// Run with: node --test test/autonomous-mode.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const SKILL = '.agents/skills/autonomous-mode/SKILL.md';
const IMPLEMENT = '.claude/prompt-snippets/implement.md';
const FEATURE = '.claude/prompt-snippets/implement-feature.md';
const SUBAGENT = '.claude/rules-snippets/subagent-workflow.md';

const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');

// Relative markdown links in a file, resolved against that file's directory.
function localLinks(layout, file) {
  const dir = path.dirname(path.join(ROOT, layout, file));
  return [...read(layout, file).matchAll(/\]\((\.\.?\/[^)#\s]+)(#[^)]*)?\)/g)]
    .map((m) => ({ target: m[1], anchor: m[2] || '', resolved: path.resolve(dir, m[1]) }));
}

// Mirror: the skill is identical in both layouts.
test('autonomous-mode: SKILL.md is identical in src/repo and src/monorepo', () => {
  assert.equal(read('src/repo', SKILL), read('src/monorepo', SKILL), 'autonomous-mode differs between layouts');
});

test('autonomous-mode: SKILL.md has the skill frontmatter with name autonomous-mode', () => {
  assert.match(read('src/repo', SKILL), /^---\nname: autonomous-mode\ndescription: .+\n---\n/);
});

for (const layout of LAYOUTS) {
  const text = read(layout, SKILL);

  // Activation: accepted input is required; a trivial single task waits for its first blocker.
  test(`autonomous-mode: ${layout} requires an accepted source before loading`, () => {
    assert.match(text, /^## Activation$/m);
    assert.match(text, /Load this skill only when an accepted source exists/);
    assert.match(text, /a supplied authorized task \(`\/implement`\)/);
    assert.match(text, /an accepted task list with its plan \(`\/implement-feature`\)/);
    assert.match(text, /a plan that has passed its human confirmation gate \(Factory's build stage\)/);
    assert.match(text, /Before an accepted source exists, do not load this skill/);
  });

  test(`autonomous-mode: ${layout} a trivial single task loads only at its first blocker`, () => {
    assert.match(text, /Trivial single task \(`\/implement`, one task, no dependencies\)/);
    assert.match(text, /do not load this skill up front/);
    assert.match(text, /Load this skill at the first blocker/);
  });

  test(`autonomous-mode: ${layout} multiple tasks load only after accepted input, and activation keeps C and D`, () => {
    assert.match(text, /\*\*Multiple tasks:\*\* load this skill only after the accepted input exists/);
    assert.match(text, /Activation never weakens C, D, or the `\/implement` supplied-task exception/);
  });

  // Gate placement: checkpoints control only their own places and are not reordered.
  test(`autonomous-mode: ${layout} checkpoints control only their existing places and are not reordered`, () => {
    assert.match(text, /Goal-fit checks and reviews do not gate loading/);
    assert.match(text, /\*\*Approach goal-fit check C\*\* gates each task's first build where C applies/);
    assert.match(text, /\*\*Implementation review D\*\* gates aggregate verification and review where D applies/);
    assert.match(text, /\*\*Post-build fit check\*\* gates the Factory review round/);
    assert.match(text, /none is reordered/);
    assert.match(text, /plan gate must be confirmed by the human/);
    assert.match(text, /grants no approval, no scope, and no checkpoint waiver/);
  });

  // Calling-flow authority: no widened permissions, lawful writes allowed, no guessed commands.
  test(`autonomous-mode: ${layout} does not widen calling-flow permissions and allows ordinary lawful writes`, () => {
    assert.match(text, /## Calling Flow Authority/);
    assert.match(text, /does not widen the calling flow's permissions/);
    assert.match(text, /Ordinary lawful writes the flow already defines are allowed/);
    assert.match(text, /builder edits, progress records, and ticking a task after its acceptance/);
    assert.doesNotMatch(text, /never (create|write|tick)/i, 'no blanket write ban');
  });

  test(`autonomous-mode: ${layout} only the calling flow selects resume and repair commands and nothing is guessed`, () => {
    assert.match(text, /Only the calling flow selects its authorized resume and repair commands/);
    assert.match(text, /Do not guess a command/);
    assert.match(text, /Do not invent a command/);
    assert.match(text, /Only the calling flow selects its resume and repair commands\. Do not guess one\./);
  });

  test(`autonomous-mode: ${layout} creates no plan, spec, or task file and adds no record field`, () => {
    assert.match(text, /Do not create plan, spec, or task files, and do not add record fields the flow does not define/);
    assert.doesNotMatch(text, /\b(Create|Write|Generate|Author)\s+(a|the|new)?\s*`?(tasks|plan|spec)\.md/);
  });

  // Boundaries for each entry command.
  test(`autonomous-mode: ${layout} /implement keeps the supplied-task exception and C`, () => {
    assert.match(text, /`\/implement` with a supplied authorized task:\*\* the supplied task is the authority/);
    assert.match(text, /supplied-task exception covers the missing spec, plan, and task files/);
    assert.match(text, /A supplied-only task skips C/);
  });

  test(`autonomous-mode: ${layout} /implement-feature keeps plan approval, alignment, and D`, () => {
    assert.match(text, /`\/implement-feature`:\*\* a supplied authorized feature or task list is the authority, and no spec or plan gate is invented for it/);
    assert.match(text, /Any approval or goal-fit check that already applies to the feature must be in place before dispatch/);
    assert.match(text, /Factory's separate human spec and plan confirmation is unchanged/);
    assert.match(text, /D runs before aggregate verification and review where it applies/);
    assert.match(text, /Autonomous mode does not replace D/);
  });

  test(`autonomous-mode: ${layout} Factory never gets gate confirmation or human-approval substitution from this skill`, () => {
    assert.match(text, /Factory \(post-plan only\)/);
    assert.match(text, /never confirms the spec or plan gate/);
    assert.match(text, /APPROVAL_MODE=human/);
  });

  // Grill-me is pre-approval; fit review is independent and read-only.
  test(`autonomous-mode: ${layout} separates pre-approval grill-me from independent fit review`, () => {
    assert.match(text, /Grill-me and Fit Review Are Different Steps/);
    assert.match(text, /pre-approval clarification of the user's own questions/);
    assert.match(text, /Do not run it during autonomous execution/);
    assert.match(text, /\*\*Goal-fit checks and reviews\*\* are independent and read-only/);
    assert.match(text, /never replace a human gate/);
  });

  // Scheduling.
  test(`autonomous-mode: ${layout} runs every eligible unit and pauses only the smallest blocked closure`, () => {
    assert.match(text, /Dependency Graph and Parallel Batches/);
    assert.match(text, /dependencies are accepted/);
    assert.match(text, /writable scope is disjoint/);
    assert.match(text, /undeclared write set runs serially/);
    assert.match(text, /Run every eligible unit/);
    assert.match(text, /Pause the smallest blocked closure/);
    assert.match(text, /transitive dependents/);
    assert.match(text, /Siblings and unrelated units keep running/);
    assert.match(text, /Stop only when nothing is eligible/);
  });

  // Canonical classification: one table with five distinct classes.
  test(`autonomous-mode: ${layout} classifies each blocker into exactly one canonical class`, () => {
    assert.match(text, /## Canonical Blocker Classification/);
    assert.match(text, /Every blocker gets exactly one class/);
    for (const cls of [
      /\| \*\*Technical-unknown\*\* \|/,
      /\| \*\*Requirement meaning\*\* \|/,
      /\| \*\*Role or permission\*\* \|/,
      /\| \*\*Undefined check command\*\* \|/,
      /\| \*\*Human approval or decision\*\* \|/,
    ]) {
      assert.match(text, cls);
    }
  });

  test(`autonomous-mode: ${layout} distinguishes unknown cause from missing answer and from role, command, and meaning`, () => {
    assert.match(text, /"Unknown" means the cause is not yet established/);
    assert.match(text, /does not mean the answer is missing from the user/);
    assert.match(text, /If only a user, role, or approver can answer, the class is never Technical-unknown/);
    assert.match(text, /A blocker that fits a human class and a technical class is human/);
    assert.match(text, /Oracle, once per stable key/);
    assert.match(text, /Human-only\. Ask for the command\. No Oracle, because Oracle may not invent one/);
  });

  test(`autonomous-mode: ${layout} no Oracle for ambiguity or human approvals, and discovered human-only is inconclusive`, () => {
    assert.match(text, /Requirement meaning[^\n]*Human-only\. Park\. No Oracle/);
    assert.match(text, /Role or permission[^\n]*No Oracle/);
    assert.match(text, /Human approval or decision[^\n]*No Oracle/);
    assert.match(text, /\*\*Scope of blocker consultations:\*\* Technical-unknown blockers only/);
    assert.match(text, /record that Oracle result as `inconclusive` and park the blocker in its human class/);
  });

  // Oracle semantics: stable key from the task and actual cited inputs.
  test(`autonomous-mode: ${layout} keys Oracle on task plus actual cited inputs, not global commit or worker activity`, () => {
    assert.match(text, /## Oracle Semantics/);
    assert.match(text, /\*\*Stable key:\*\* a consult is keyed by the blocker's task identity plus the actual cited relevant inputs/);
    assert.match(text, /the file paths with their content, the quoted acceptance criterion, and the check output the blocker cites/);
    assert.match(text, /The key is not the global commit, and it is not other workers' activity/);
    assert.match(text, /Unrelated commits or parallel work do not change it/);
  });

  test(`autonomous-mode: ${layout} one consult per key, parked when unchanged, and detected change is not approval`, () => {
    assert.match(text, /\*\*One consult per key\.\*\*/);
    assert.match(text, /The same key is never consulted twice/);
    assert.match(text, /\*\*Detected change, not approval\.\*\*/);
    assert.match(text, /A detected change is evidence to re-examine the blocker\. It is not scope approval, and it does not authorize new work/);
  });

  test(`autonomous-mode: ${layout} Oracle guidance is not authority and cannot expand scope`, () => {
    assert.match(text, /\*\*Guidance, not authority\.\*\* Oracle cannot change goals, scope, the plan, an acceptance criterion, or a check/);
    assert.match(text, /It cannot approve, accept, or review anything/);
    assert.match(text, /\*\*Expansion:\*\* guidance cannot expand scope/);
    assert.match(text, /not eligible work under this skill until the existing revision and approval steps are complete/);
    assert.doesNotMatch(text, /Its only path to new work/);
  });

  // Parking.
  test(`autonomous-mode: ${layout} parks blockers in an existing record with class and key, without a new file or schema`, () => {
    assert.match(text, /record it immediately in the existing progress record, or in the conversation/);
    assert.match(text, /Do not add a file or schema/);
    assert.match(text, /its class from the table above/);
    assert.match(text, /the Oracle consult key and its result \(or `inconclusive`\)/);
    assert.match(text, /the next action, and the resume trigger/);
    assert.match(text, /Never drop one silently/);
  });

  // Gated completion.
  test(`autonomous-mode: ${layout} never reports a task completed or ready while a mandatory item is parked`, () => {
    assert.match(text, /## Completion/);
    assert.match(text, /Queue human-only items as one batch/);
    assert.match(text, /Completed or ready means accepted/);
    assert.match(text, /The run is not DONE while any mandatory task is parked/);
  });

  test(`autonomous-mode: ${layout} ends each turn with exactly one turn state`, () => {
    assert.match(text, /exactly one state from/);
    assert.match(text, /Turn Completion and Waiting/);
    assert.match(text, /DONE only when nothing mandatory is parked/);
    assert.match(text, /WAITING when work is still pending/);
    assert.match(text, /BLOCKED or NEEDS-DECISION otherwise/);
  });

  test(`autonomous-mode: ${layout} a global gate stops dependents immediately and keeps unrelated units`, () => {
    assert.match(text, /\*\*Global gate exception\.\*\*/);
    assert.match(text, /stops dependent work immediately/);
    assert.match(text, /Keep running units that do not depend on it/);
  });

  test(`autonomous-mode: ${layout} references the shared blocker and turn rules by name`, () => {
    const subagent = read(layout, SUBAGENT);
    assert.match(subagent, /^## Autonomous Execution and Blockers$/m);
    assert.match(subagent, /^## Turn Completion and Waiting$/m);
    assert.match(text, /subagent-workflow\]\(\.\.\/\.\.\/\.\.\/\.claude\/rules-snippets\/subagent-workflow\.md\)/);
    assert.match(text, /Dependency Graph and Parallel Batches/);
    assert.match(text, /Turn Completion and Waiting/);
  });

  test(`autonomous-mode: ${layout} every relative link in the skill resolves`, () => {
    const links = localLinks(layout, SKILL);
    assert.ok(links.length >= 4, 'expected the fit-review, grill-me, and subagent-workflow links');
    for (const link of links) {
      assert.ok(fs.existsSync(link.resolved), `broken link: ${link.target}`);
    }
  });
}

// Wiring: each feature snippet links the skill and states its boundary inside the flow.
for (const layout of LAYOUTS) {
  test(`autonomous-mode: ${layout} implement.md wires the skill into the task loop with activation and authority`, () => {
    const content = read(layout, IMPLEMENT);
    assert.match(content, /\[autonomous-mode\]\(\.\.\/\.\.\/\.agents\/skills\/autonomous-mode\/SKILL\.md\)/);
    assert.match(content, /run every dependency-ready authorized task/);
    assert.match(content, /get read-only Oracle guidance once per technical-unknown blocker/);
    assert.match(content, /park only a blocked task and its dependents/);
    assert.match(content, /A single trivial task loads it only at its first blocker; multiple tasks load it once the supplied input is accepted/);
    assert.match(content, /The supplied task stays the authority/);
    assert.match(content, /approach goal-fit check C still gates each task's first build where C applies/);
    assert.match(content, /A run is not finished while a task has a parked mandatory item/);
  });

  test(`autonomous-mode: ${layout} implement-feature schedules after approval, keeps C and D, and gates aggregate review`, () => {
    const content = read(layout, FEATURE);
    assert.match(content, /\[autonomous-mode\]\(\.\.\/\.\.\/\.agents\/skills\/autonomous-mode\/SKILL\.md\)/);
    // Approval, when one already applies, must gate dispatch: it has to appear before the batch-dispatch rule.
    const approval = content.indexOf('If an approval gate already applies to this feature (for example a Factory spec or plan gate), it must be confirmed before any task is dispatched; honor it.');
    const dispatch = content.indexOf('Batch all ready lanes per [Split Before Dispatch]');
    assert.notEqual(approval, -1, 'approval-before-dispatch sentence missing');
    assert.notEqual(dispatch, -1, 'batch dispatch rule missing');
    assert.ok(approval < dispatch, 'an existing approval gate must come before any dispatch');
    assert.match(content, /This flow adds no new spec or plan approval requirement/);
    assert.doesNotMatch(content, /Once the task list and plan are approved/, 'no universal plan-approval prerequisite');
    assert.match(content, /Schedule with \[autonomous-mode\]/);
    assert.match(content, /Approach goal-fit check C still gates each task's first build where C applies, and implementation review D still runs before aggregate review where D applies/);
    assert.match(content, /a parked mandatory task is never ticked or reported complete/);
    assert.match(content, /start aggregate review only once every mandatory task is accepted/);
  });

  test(`autonomous-mode: ${layout} both wiring links resolve to the skill`, () => {
    for (const file of [IMPLEMENT, FEATURE]) {
      const links = localLinks(layout, file).filter((l) => l.target.includes('autonomous-mode'));
      assert.equal(links.length >= 1, true, `${file} must link the skill`);
      for (const link of links) {
        assert.ok(fs.existsSync(link.resolved), `${file}: broken link ${link.target}`);
      }
    }
  });

  test(`autonomous-mode: ${layout} implement.md still names no spec or plan file`, () => {
    assert.doesNotMatch(read(layout, IMPLEMENT), /\b(spec|plan)\.md\b/);
  });
}

test('autonomous-mode: the wiring lines are identical across layouts for implement and implement-feature', () => {
  const lines = (layout, file, token) => read(layout, file).split('\n').filter((l) => l.includes(token));
  for (const token of ['[autonomous-mode]', 'Autonomous mode: start aggregate review']) {
    for (const file of [IMPLEMENT, FEATURE]) {
      assert.deepEqual(lines('src/monorepo', file, token), lines('src/repo', file, token),
        `${file} differs for "${token}"`);
    }
  }
});
