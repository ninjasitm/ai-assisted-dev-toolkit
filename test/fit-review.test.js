'use strict';

// Static contract and parity checks for the goal-fit review. These tests read
// template text only. They show that the instructions name the gates, sources,
// verdicts, and stop rules. They do not prove how an agent behaves at runtime.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const BRIEF = '.claude/rules-snippets/fit-review.md';
const FACTORY = '.agents/skills/factory/SKILL.md';
const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');
const count = (text, pattern) => (text.match(pattern) || []).length;

for (const layout of LAYOUTS) {
  test(`${layout}: shared brief states sources, verdicts, and decision rules`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /^# Goal-Fit Brief/);
    assert.match(brief, /When Oracle is not available read-only, a fresh independent reviewer runs the goal-fit check/);
    assert.match(brief, /self-review/);
    assert.match(brief, /the caller reports `BLOCKED/);
    assert.match(brief, /Review the current artifacts from scratch on every run, including resumed runs/);
    assert.match(brief, /original user request, verbatim, and every explicit user amendment/);
    assert.match(brief, /passes them to you as text in the dispatch/);
    assert.match(brief, /Not goal sources: a slug, a ticket key, a ticket title, the existing spec alone/);
    assert.match(brief, /do not infer goals from the spec or the plan/);
    assert.match(brief, /Quote the original request/);
    assert.match(brief, /\*\*Forward:\*\*/);
    assert.match(brief, /\*\*Backward:\*\*/);
    assert.match(brief, /Do not demand that every mundane detail be an acceptance criterion/);
    assert.match(brief, /\*\*Ponytail:\*\*/);
    assert.match(brief, /SOLID and SRP, proportional/);
    assert.match(brief, /do not forbid a justified interface/);
    assert.match(brief, /A decision stays blocking until the user resolves it with an explicit amendment/);
    assert.match(brief, /You do not write repair notes or repair files/);
    assert.match(brief, /`VERDICT: PASS` means no blocking findings\./);
    assert.match(brief, /Absence of blocking findings is not a pass/);
    assert.match(brief, /The first line is exactly `VERDICT: PASS` or `VERDICT: CHANGES`/);
    assert.match(brief, /Report it as a blocking finding under `VERDICT: CHANGES`, marked `requires user decision; do not auto-repair`/);
    assert.match(brief, /Missing authoritative baseline: requires user decision; do not auto-repair/);
  });

  test(`${layout}: /plan extends the existing review gate without a second one`, () => {
    const plan = read(layout, '.claude/prompt-snippets/plan.md');
    assert.equal(count(plan, /The orchestrator runs the plan goal-fit check \(B\)/g), 1);
    assert.equal(count(plan, /\*\*Review and Accept Planning Artifacts\*\*/g), 1);
    assert.match(plan, /read and follow \[fit-review\]\(\.\.\/rules-snippets\/fit-review\.md\)/);
    assert.match(plan, /Use read-only Oracle for this goal-fit check; if Oracle is unavailable, use a fresh independent reviewer\. Report BLOCKED only when neither can run\./);
    assert.match(plan, /trace goals and plan items both ways/);
    assert.match(plan, /`VERDICT: PASS` or `VERDICT: CHANGES`/);
    assert.match(plan, /A finding that needs a user decision is blocking, marked `requires user decision; do not auto-repair`; stop and ask the user\./);
    assert.match(plan, /Repeat until PASS or blocked, or until the user decides\./);
    assert.match(plan, /Stop as BLOCKED with the reason when a repair changes nothing or the same finding returns unchanged/);
    assert.match(plan, /A goal change from the check is a user decision, not a repair\./);
    assert.match(plan, /Open decisions block PASS until the user resolves them\./);
    assert.doesNotMatch(plan, /round limit|3 rounds|three rounds/i);
  });

  test(`${layout}: /specify gains an accepted-spec gate before completion`, () => {
    const specify = read(layout, '.claude/prompt-snippets/specify.md');
    assert.equal(count(specify, /\*\*Review and Accept the Specification\*\*/g), 1);
    assert.match(specify, /read and follow \[fit-review\]\(\.\.\/rules-snippets\/fit-review\.md\)/);
    assert.match(specify, /original request \(verbatim, with any later user amendments\)/);
    assert.match(specify, /A finding that needs a user decision is blocking, marked `requires user decision; do not auto-repair`; stop and ask the user\./);
    assert.match(specify, /self-review cannot substitute for independent acceptance/);
    assert.match(specify, /Only the orchestrator presents the spec for human confirmation, and only after an explicit independent PASS/);
    assert.match(specify, /Stop as BLOCKED with the reason when a repair changes nothing/);
    assert.match(specify, /Open decisions block PASS until the user resolves them\./);
    assert.match(specify, /Acceptance is separate from human approval/);
    const gate = specify.indexOf('**Review and Accept the Specification**');
    const completion = specify.search(/\*\*(?:Report Completion|Output)\*\* \(?only after artifact acceptance/);
    assert.ok(gate > 0 && completion > gate, 'gate must precede completion, which is conditional on acceptance');
    assert.doesNotMatch(specify, /round limit|3 rounds|three rounds/i);
  });

  test(`${layout}: factory roles take goal sources from dispatch, not request.md or repair files`, () => {
    const spec = read(layout, '.agents/skills/factory/roles/spec.md');
    assert.match(spec, /the goal sources the orchestrator passes in your dispatch/);
    assert.match(spec, /The original request is the primary goal source/);
    assert.match(spec, /Goal-fit findings passed in your dispatch are reviewer findings\. They are not operator requests and not goal authority\./);
    assert.match(spec, /Do not drop or narrow a goal to satisfy a finding/);

    const review = read(layout, '.agents/skills/factory/roles/review-code.md');
    assert.match(review, /the goal sources in your dispatch \(the original request and explicit user amendments, verbatim\)/);
    assert.match(review, /\*\*Scope trace, both ways:\*\*/);
    assert.match(review, /trace to a user-authorized goal/);
    assert.match(review, /scope drift and a blocking item/);

    const approve = read(layout, '.agents/skills/factory/roles/approve.md');
    assert.match(approve, /`spec\.md` and `plan\.md` \(feature folder, paths block\)/);
    assert.match(approve, /the goal sources in your dispatch \(the original request, explicit amendments, and rework decisions, verbatim\)/);
    assert.match(approve, /any change that hits the untraced-change trigger in step 5 is an escalation/);
  });

  test(`${layout}: approve escalates untraced change instead of noting drift`, () => {
    const approve = read(layout, '.agents/skills/factory/roles/approve.md');
    const trigger = approve.match(/^\s*- Untraced change: (.*)$/m);
    assert.ok(trigger, 'approve has an untraced-change escalation trigger');
    assert.match(trigger[1], /traces to neither an explicit user amendment or rework decision in your dispatch/);
    assert.match(trigger[1], /nor an accepted spec requirement or plan step/);
    assert.match(trigger[1], /no justified necessary implementation detail recorded in the round reviews/);
    assert.match(trigger[1], /Drift is not a note: it escalates\./);
    assert.doesNotMatch(approve, /note in History checked any change the plan does not cover/);
  });

  test(`${layout}: factory baseline and goal sources cover legacy and key or slug starts`, () => {
    const skill = read(layout, FACTORY);
    assert.match(skill, /Check `intake\.md` for an `## Original request` section or a `## Baseline confirmed` section/);
    assert.match(skill, /a key or slug start, a legacy job, or a sparse one/);
    assert.match(skill, /the orchestrator promotes nothing/);
    assert.match(skill, /each labelled as a candidate and not a requirement/);
    assert.match(skill, /Until then the gate reports `NEEDS-DECISION: baseline missing`, and Confirm is not offered\./);
    assert.match(skill, /Slugs, keys, tracker titles, the existing spec on its own, and any reviewer finding are never goal sources|A slug, a key, a tracker title, the existing spec on its own, and any reviewer finding are never goal sources\./);
    assert.match(skill, /Pass them as text, not as paths alone/);
    assert.match(skill, /every explicit amendment \(the intake answers, and the operator's `spec-<k>\.md`, `plan-<k>\.md`, and `rework-<k>\.md`\)/);
    assert.match(skill, /6\. Write `intake\.md` \(see Intake\): when the request text was typed, the original request verbatim under `## Original request`/);
    assert.match(skill, /Add the questions and answers when intake asked\./);
    assert.match(skill, /add the questions as asked and the answers to `factory\/jobs\/<id>\/intake\.md`, verbatim/);
  });

  test(`${layout}: every factory dispatch receives goal sources generically`, () => {
    const skill = read(layout, FACTORY);
    const start = skill.indexOf('## Subagent dispatch');
    const end = skill.indexOf('\n## ', start + 1);
    assert.ok(start > 0 && end > start, 'Subagent dispatch section found');
    const section = skill.slice(start, end);
    assert.match(section, /Every dispatch of the planner, builder, reviewers, and approver also passes the goal sources as text, not as paths alone/);
    assert.match(section, /the confirmed original request and every explicit user amendment \(see Goal-fit checks: Baseline first and Goal sources\)/);
    assert.match(section, /This applies to first runs, reruns, repairs, rework, and resumes alike/);
    assert.match(section, /run the Baseline first procedure of Goal-fit checks before dispatching, and do not invent goals or omit these inputs/);
    assert.match(section, /Reviewer findings passed as dispatch context are never goal sources/);
  });

  test(`${layout}: reviewer repairs stay out of operator notes and have no round cap`, () => {
    const skill = read(layout, FACTORY);
    assert.match(skill, /pass the blocking findings to the planner as dispatch context under the heading `Fit repair findings \(reviewer findings, not operator requests, not goal authority\)`/);
    assert.match(skill, /Write no `spec-<k>\.md`, `plan-<k>\.md`, or fit file for them\./);
    assert.match(skill, /The loop has no round limit\./);
    assert.match(skill, /It repeats until `PASS`, `NEEDS-DECISION`, or `BLOCKED`\./);
    assert.match(skill, /`VERDICT: CHANGES` with a finding marked `requires user decision; do not auto-repair`: stop as `NEEDS-DECISION`/);
    assert.match(skill, /Stop as `BLOCKED` with the reason when a repair changes nothing, when the same blocking finding returns unchanged after a repair, or when the planner reports a finding it cannot address\./);
    assert.doesNotMatch(skill, /3 fit rounds|up to 3|third round|3 rounds|round limit of 3|Confirm-with-findings|confirm with findings/i);
    assert.doesNotMatch(skill, /`fit-[^`]*\.md`/);
    assert.match(read(layout, '.agents/skills/factory/roles/spec.md'), /write nothing else/);
  });

  test(`${layout}: confirm handlers require an explicit PASS, not absence of findings`, () => {
    const skill = read(layout, FACTORY);
    assert.match(skill, /1\. Confirm the spec\. Offered only when no `\[PRODUCT DECISION\]` item is open and the current goal-fit check is an explicit `VERDICT: PASS`\./);
    assert.match(skill, /1\. Confirm the plan\. Offered only when the current goal-fit check is an explicit `VERDICT: PASS`\./);
    assert.match(skill, /or the current goal-fit check is not an explicit `VERDICT: PASS`, do not continue/);
    assert.match(skill, /or the current goal-fit check is not an explicit `VERDICT: PASS`, ask again/);
    assert.match(skill, /Confirm is offered only when the reply on this gate visit starts with `VERDICT: PASS`\. The absence of blocking findings is not a PASS\./);
    assert.doesNotMatch(skill, /fit review has blocking findings, ask again|the fit review is `PASS`\./);
  });

  test(`${layout}: timeouts and failures are explicit BLOCKED or needs-human, never a bare stage hold`, () => {
    const skill = read(layout, FACTORY);
    assert.match(skill, /A timed-out goal-fit reviewer is never re-dispatched \(see Harness notes\)\./);
    assert.match(skill, /Set stage `needs-human`, `failed_stage` `spec` or `plan`, and the reason `goal-fit reviewer timed out after <N> min; it may still be running`/);
    assert.match(skill, /Confirm is not offered\./);
    assert.match(skill, /No valid first line: re-dispatch once\. If it still has none, set `needs-human` with `failed_stage` `spec` or `plan`/);
    assert.match(skill, /A `BLOCKED` gate \(baseline, independence, or an unproductive loop\) leaves the stage at `awaiting-spec` or `awaiting-plan`\. A failed agent or a timeout uses `needs-human`/);
    assert.doesNotMatch(skill, /timed out[^\n]*stage stays|stage stays[^\n]*timed out/);
  });

  test(`${layout}: factory resume paths and stage list cannot skip the fit review`, () => {
    const skill = read(layout, FACTORY);
    assert.match(skill, /\| `awaiting-spec` \| Show the spec gate \(it runs the goal-fit check first\) \|/);
    assert.match(skill, /\| `awaiting-plan` \| Show the plan gate \(it runs the goal-fit check first\) \|/);
    assert.doesNotMatch(skill, /\| `awaiting-(?:spec|plan)` \| Show the (?:spec|plan) gate \|/);
    assert.match(skill, /Later visits\.\*\* Once a `BLOCKED` or `needs-human` outcome is resolved/);
    assert.ok(skill.includes('Stages, in order: `spec` (spec-writer running), `awaiting-spec` (spec gate), `plan` (plan writer running), `awaiting-plan` (plan gate), `build`, `review`, `approve`, `awaiting-human`, `merged`, `needs-human` (with `substate` `preview` while a preview merge'), 'stage list unchanged');
  });

  test(`${layout}: no request.md, no hash tracking, and no new agent`, () => {
    const texts = [
      read(layout, FACTORY),
      read(layout, '.agents/skills/factory/roles/spec.md'),
      read(layout, '.agents/skills/factory/roles/review-code.md'),
      read(layout, '.agents/skills/factory/roles/approve.md'),
      read(layout, '.claude/prompt-snippets/plan.md'),
      read(layout, '.claude/prompt-snippets/specify.md'),
      read(layout, BRIEF),
    ];
    for (const text of texts) {
      assert.doesNotMatch(text, /request\.md/);
      assert.doesNotMatch(text, /sha256|content hash|fit hash|fit[_-]?review[_-]?(?:state|hash|status)/i);
    }
  });

  test(`${layout}: fit brief link resolves from each referencing file`, () => {
    const target = path.join(ROOT, layout, BRIEF);
    assert.ok(fs.existsSync(target));
    for (const file of ['.claude/prompt-snippets/plan.md', '.claude/prompt-snippets/specify.md', FACTORY]) {
      const match = read(layout, file).match(/\]\(([^)]*fit-review\.md)\)/);
      assert.ok(match, `${file} links the brief`);
      assert.equal(path.resolve(path.join(ROOT, layout, path.dirname(file)), match[1]), target, `${file} resolves the brief`);
    }
  });
}

test('fit brief is identical across src/repo and src/monorepo', () => {
  assert.equal(read('src/repo', BRIEF), read('src/monorepo', BRIEF));
});

test('lane keeps the PASS/CHANGES protocol only: no third reviewer verdict', () => {
  for (const layout of LAYOUTS) {
    for (const file of [BRIEF, '.claude/prompt-snippets/plan.md', '.claude/prompt-snippets/specify.md', FACTORY]) {
      const text = read(layout, file);
      assert.doesNotMatch(text, /VERDICT: DECISION/, `${layout}/${file}`);
      assert.doesNotMatch(text, /`DECISION`/, `${layout}/${file}`);
    }
  }
});

test('root has no counterpart for these flows, so nothing extra is required there', () => {
  assert.equal(fs.existsSync(path.join(ROOT, '.agents/skills/factory')), false);
  assert.equal(fs.existsSync(path.join(ROOT, '.claude/prompt-snippets/plan.md')), false);
  assert.equal(fs.existsSync(path.join(ROOT, '.claude/prompt-snippets/specify.md')), false);
});
