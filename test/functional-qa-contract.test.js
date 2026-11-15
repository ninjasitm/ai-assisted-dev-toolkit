'use strict';

// Functional QA contract. The shared loop (implement.md and its inherited callers) and the Factory gates
// (SKILL.md, the role briefs, and factory/README.md) must state the same rules in both layouts. These checks
// cover the boundary conditions: what blocks acceptance, what stays pending, what is never a signoff, what
// Factory refuses on /factory approve, what counts as stale evidence, and where human answers are kept.
// They check the contract tokens that carry those rules, not every sentence. Every checked section must be
// non-empty, so a renamed heading cannot pass by being absent.
// Run with: node --test test/functional-qa-contract.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const FACTORY = (layout) => `${layout}/.agents/skills/factory`;
const IMPLEMENT = (layout) => `${layout}/.claude/prompt-snippets/implement.md`;

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Lines of the section that starts at an exact `## ` heading, up to the next `## ` heading.
function section(content, heading) {
  const lines = content.split('\n');
  const start = lines.indexOf(heading);
  if (start === -1) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

const sharedFiles = (layout) => [
  IMPLEMENT(layout),
  `${layout}/.claude/prompt-snippets/implement-feature.md`,
  `${layout}/.claude/prompt-snippets/implement-fixes.md`,
];

for (const layout of LAYOUTS) {
  test(`functional QA: ${layout} implement.md runs automated checks for every AC and adds human checks only where needed`, () => {
    const body = section(read(IMPLEMENT(layout)), '## Functional QA');
    assert.ok(body.length > 0, 'implement.md must have a "## Functional QA" section');
    for (const label of ['`local`', '`covered`', '`na`', '`human`']) {
      assert.ok(body.includes(label), `label ${label} missing`);
    }
    assert.match(body, /Every AC gets every feasible automated check\. A human check never replaces one\./);
    assert.match(body, /Add a `human` check to an AC when a person must judge it/);
    assert.match(body, /A process that starts, a page that loads, or a passing build is not evidence/);
  });

  test(`functional QA: ${layout} human answers need PASS and an explicit accept for the tested tree`, () => {
    const body = section(read(IMPLEMENT(layout)), '## Functional QA');
    assert.match(body, /needs both a `PASS` result and an explicit `accept` for the tree the handoff named/);
    assert.match(body, /`not run` with `accept` stays pending/);
    assert.match(body, /The absence of an answer is never signoff/);
    assert.match(body, /never signs off for the user/);
    assert.match(body, /QA-<n>: PASS \| FAIL \| not run/);
    assert.match(body, /Acceptance: accept \| reject \| defer/);
  });

  test(`functional QA: ${layout} unavailable evidence and human answers are needs-decision, not a repair loop`, () => {
    const content = read(IMPLEMENT(layout));
    assert.doesNotMatch(content, /An unmet requirement, a failing check, or a `not verified` result always loops back to repair/,
      'the unconditional repair rule must be gone');
    assert.match(content, /A `not verified` result loops back to repair only when the missing piece is code or test work the builder can do/);
    assert.match(content, /\*\*Needs user decision \(exit for the affected work\):\*\*[^\n]*awaiting human QA/);
    assert.ok(content.includes('NOT ACCEPTED: needs decision'), 'the existing needs-decision label must be reused');
    assert.doesNotMatch(content, /Pending human QA \(exit/, 'no new exit may be added');
    assert.doesNotMatch(content, /NOT ACCEPTED: awaiting human QA/, 'no new exit label may be added');
  });

  test(`functional QA: ${layout} pending QA blocks acceptance, completion, and merge without changing commit or push policy`, () => {
    const content = read(IMPLEMENT(layout));
    assert.doesNotMatch(content, /Only accepted work is committed/);
    assert.doesNotMatch(content, /not accepted, completed, merged, or pushed/, 'no categorical push prohibition');
    assert.doesNotMatch(content, /blocks acceptance, completion, merge, and push/, 'no categorical push prohibition');
    assert.match(content, /The calling command decides whether accepted work is committed/);
    assert.match(content, /It blocks acceptance, completion, and merge of the affected work/);
    assert.match(content, /neither grants nor removes a commit or push that the calling flow or an explicit checkpoint authorizes/);
    assert.match(content, /Commits and pushes follow the calling command's existing policy/);
  });

  test(`functional QA: ${layout} safety is stated for local processes the agent started`, () => {
    const body = section(read(IMPLEMENT(layout)), '## Functional QA');
    assert.match(body, /Start only the local processes a check needs/);
    assert.match(body, /Stop the ones the agent started/);
    assert.match(body, /leave existing servers running/);
    assert.doesNotMatch(body, /Start only the processes the agent started/);
  });

  test(`functional QA: ${layout} freshness uses the tree identity and the saved snapshot, not HEAD alone`, () => {
    const body = section(read(IMPLEMENT(layout)), '## Functional QA');
    // The baseline is taken before the build, so it cannot identify what QA ran against.
    assert.match(body, /its commit and, for uncommitted work, a QA-time snapshot/);
    assert.match(body, /The baseline \(step 1\) stays exactly as it was taken before the build/);
    assert.match(body, /It is not the QA identity/);
    // The snapshot is captured when QA runs and handed off, then referenced and compared on resume.
    assert.match(body, /At QA and handoff time, capture the current task-scoped diff and the contents of every new file/);
    assert.match(body, /Resume compares the current scope with the QA-time snapshot before reusing any evidence/);
    assert.ok(read(IMPLEMENT(layout)).includes('Take a baseline snapshot once, before any build.'),
      'the baseline must still be taken before the build');
  });

  test(`functional QA: ${layout} inherited feature and fix callers still reach the shared exits`, () => {
    for (const rel of sharedFiles(layout).slice(1)) {
      assert.doesNotMatch(read(rel), /NOT ACCEPTED: awaiting human QA/, `${rel} must not enumerate a new exit`);
    }
    assert.match(read(`${layout}/.claude/prompt-snippets/implement-fixes.md`), /NOT ACCEPTED: needs decision/);
  });

  test(`functional QA: ${layout} Factory SKILL.md gates through the existing verdicts and stages`, () => {
    const skill = read(`${FACTORY(layout)}/SKILL.md`);
    const body = section(skill, '## Functional QA');
    assert.ok(body.length > 0, 'SKILL.md must have a "## Functional QA" section');
    for (const token of [
      'Tested commit',
      'Not verified: functional QA <AC-n>: <reason>',
      'record-only edit to `qa.md`',
      'Approve step 6',
      'Resume restores the exact pending handoff',
      'Absence is never signoff.',
    ]) {
      assert.ok(body.includes(token), `SKILL.md Functional QA must include: ${token}`);
    }
    assert.ok(skill.includes('## Human QA answer'), 'the answer block heading must be named');
    const guidance = section(skill, '## QA guidance');
    assert.ok(guidance.includes('Suggested checks before /factory approve — not a gate'),
      'the optional line must stay for the checklist');
    assert.ok(guidance.includes('never sit under the optional line'),
      'mandatory items must be kept out of the optional heading');
    assert.doesNotMatch(skill, /QA guidance \(non-gating\)/);
    assert.doesNotMatch(skill, /`qa\.md` never affects a verdict/);
    assert.doesNotMatch(skill, /`qa\.md` is advisory and gates nothing/);
  });

  test(`functional QA: ${layout} /factory approve refuses failed, not-run, missing, or stale automated evidence`, () => {
    const skill = read(`${FACTORY(layout)}/SKILL.md`);
    assert.match(skill, /5\. \*\*Required QA evidence\.\*\* Refuse, in every mode and from `needs-human` too,/);
    assert.match(skill, /failed, not-run, or missing automated check or covered test, or stale evidence/);
    assert.match(skill, /Do not waive this with the approve command/);
    assert.match(skill, /6\. \*\*Human QA\.\*\*/);
    assert.match(skill, /every human check reads `PASS` with an explicit `accept` for that commit/);
  });

  test(`functional QA: ${layout} human answers are kept in build.md, not in a new file`, () => {
    const skill = read(`${FACTORY(layout)}/SKILL.md`);
    assert.doesNotMatch(skill, /human-qa-/, 'no new human-qa artifact may be introduced');
    assert.ok(skill.includes('appends the user\'s QA answer, verbatim, to `build.md`'));
    const build = read(`${FACTORY(layout)}/roles/build.md`);
    assert.match(build, /Keep every section of `build.md` you did not write this round, including the orchestrator's `## Human QA answer` blocks/);
  });

  test(`functional QA: ${layout} approver checks evidence freshness with the dirty-tree and record-only rules`, () => {
    const approve = read(`${FACTORY(layout)}/roles/approve.md`);
    assert.ok(approve.includes('git -C <worktree> status --porcelain'), 'dirty-tree check missing');
    assert.match(approve, /The only exempt change is a record-only edit to `qa.md`/);
    assert.ok(approve.includes('git -C <worktree> diff --name-only <Tested commit> factory/<id>'));
    assert.doesNotMatch(approve, /lists any path other than `qa\.md` and `tasks\.md`/,
      'no blanket qa.md or tasks.md exemption may remain');
    assert.match(approve, /The manual checklist in `qa.md` is not a gate/);
  });

  test(`functional QA: ${layout} review lenses keep the code lens as the QA gate`, () => {
    const review = read(`${FACTORY(layout)}/roles/review-code.md`);
    assert.match(review, /\*\*Functional QA:\*\* check the `## Functional QA` record/);
    assert.ok(review.includes('`Not verified: functional QA <AC-n>: <reason>`'));
    assert.match(review, /Each AC lists every feasible automated check with its label/);
    assert.match(review, /A `human` check is added on top where a person must judge\. It never replaces an automated check\./);
    assert.match(review, /Re-run each `local` command and each cited `covered` test in the table/);
    assert.match(review, /An automated QA row \(`local` or `covered`\) that fails on re-run is a blocking item/);
    assert.doesNotMatch(review, /Each AC has a class with a fitting reason/, 'labels are per check, not one exclusive class per AC');
    assert.match(read(`${FACTORY(layout)}/SKILL.md`), /re-runs each automated command from the table and each cited `covered` test/);
    for (const r of ['review-security', 'review-ux', 'review-ui']) {
      const brief = read(`${FACTORY(layout)}/roles/${r}.md`);
      assert.ok(brief.includes('The QA gate belongs to the code lens and the approver'), `${r} must not claim the QA gate`);
    }
  });

  test(`functional QA: ${layout} README states the human gate and keeps the checklist non-gating`, () => {
    const readme = read(`${layout}/factory/README.md`);
    const qa = section(readme, '## Functional QA (`qa.md`)');
    assert.ok(qa.length > 0, 'README must have a "## Functional QA (`qa.md`)" section');
    assert.match(qa, /The job waits at `awaiting-human`, even in `auto`/);
    assert.match(qa, /Optional checks\*\* are listed as limitations\. They never block/);
    assert.match(qa, /saves your answer in `build.md`/);
    assert.doesNotMatch(readme, /human-qa-/);
  });
}

test('functional QA: no new Factory stage, verdict, or QA state name is introduced', () => {
  const forbidden = /\b(awaiting-qa|qa-pending|needs-qa|awaiting-signoff|qa-blocked|qa-failed|NEEDS-QA|QA-ESCALATE)\b/i;
  for (const layout of LAYOUTS) {
    for (const rel of [
      `${FACTORY(layout)}/SKILL.md`,
      `${FACTORY(layout)}/roles/build.md`,
      `${FACTORY(layout)}/roles/review-code.md`,
      `${FACTORY(layout)}/roles/approve.md`,
      `${layout}/factory/README.md`,
      IMPLEMENT(layout),
    ]) {
      assert.doesNotMatch(read(rel), forbidden, `${rel} must not add a stage or verdict`);
    }
  }
});

test('functional QA: shared QA sections are identical across the repo and monorepo layouts', () => {
  const pairs = [
    [IMPLEMENT('src/repo'), IMPLEMENT('src/monorepo'), '## Functional QA'],
    [`${FACTORY('src/repo')}/SKILL.md`, `${FACTORY('src/monorepo')}/SKILL.md`, '## Functional QA'],
    [`${FACTORY('src/repo')}/SKILL.md`, `${FACTORY('src/monorepo')}/SKILL.md`, '## QA guidance'],
    ['src/repo/factory/README.md', 'src/monorepo/factory/README.md', '## Functional QA (`qa.md`)'],
  ];
  for (const [a, b, heading] of pairs) {
    const left = section(read(a), heading);
    assert.ok(left.length > 0, `${a}: "${heading}" must exist`);
    assert.equal(section(read(b), heading), left, `${a} and ${b} differ in "${heading}"`);
  }
  for (const brief of ['roles/build.md', 'roles/review-code.md', 'roles/approve.md']) {
    const qaLines = (layout) => read(`${FACTORY(layout)}/${brief}`).split('\n')
      .filter((line) => /QA|qa\.md/.test(line));
    assert.deepEqual(qaLines('src/monorepo'), qaLines('src/repo'), `${brief}: QA lines differ between layouts`);
    assert.ok(qaLines('src/repo').length > 0, `${brief}: no QA lines found`);
  }
});
