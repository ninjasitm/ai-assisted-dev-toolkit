'use strict';

// Static contract checks for the post-build fit checks (A, B, C, D). They read template text only: they
// show that the instructions name each checkpoint, its gate, its no-scope-expansion and decision branches,
// its repair and rework ordering, its Oracle-or-reviewer fallback, its evidence freshness, its per-round and
// per-family file rules, its approve and resume blockers, its persistence ordering, its round recovery, its
// Tracking-before-sync and worktree or in-place handling, and that the repo and monorepo layouts agree.
// They do not prove how an agent behaves at runtime.
// Run with: node --test test/alignment-checkpoints.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const BRIEF = '.claude/rules-snippets/fit-review.md';
const IMPLEMENT = '.claude/prompt-snippets/implement.md';
const FEATURE = '.claude/prompt-snippets/implement-feature.md';
const FIXES = '.claude/prompt-snippets/implement-fixes.md';
const FACTORY = '.agents/skills/factory/SKILL.md';
const BUILD_ROLE = '.agents/skills/factory/roles/build.md';

const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');
const order = (text, first, second) => {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  assert.notEqual(a, -1, `missing: ${first}`);
  assert.notEqual(b, -1, `missing: ${second}`);
  assert.ok(a < b, `"${first}" must come before "${second}"`);
};
const section = (text, startHeading, endHeading) => {
  const start = text.indexOf(startHeading);
  const end = text.indexOf(endHeading, start + 1);
  assert.ok(start >= 0 && end > start, `section ${startHeading} bounded by ${endHeading}`);
  return text.slice(start, end);
};

// Source of truth: the shared brief and the implement loop are identical across layouts.
test('source of truth: brief and implement loop are identical across src/repo and src/monorepo', () => {
  assert.equal(read('src/repo', BRIEF), read('src/monorepo', BRIEF));
  assert.equal(read('src/repo', IMPLEMENT), read('src/monorepo', IMPLEMENT));
});

for (const layout of LAYOUTS) {
  test(`${layout}: brief defines checkpoints A, B, C and D with their trigger and users`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /## Letters \(one meaning each\)/);
    assert.match(brief, /\| \*\*A\*\* \| Spec goal-fit check/);
    assert.match(brief, /\| \*\*B\*\* \| Plan goal-fit check/);
    assert.match(brief, /\| \*\*C\*\* \| Approach goal-fit check/);
    assert.match(brief, /\| \*\*D\*\* \| Implementation review/);
  });

  test(`${layout}: brief requires the reply to name the checkpoint, the reviewed inputs, and B's classification`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /Checkpoint: <A\|B\|C\|D>/);
    assert.match(brief, /Reviewed inputs: <paths, commit, changed files, plan and sources, or approach note>/);
    assert.match(brief, /CLASSIFICATION: <repair\|plan change\|spec change>/);

  });

  test(`${layout}: brief forbids findings from authorizing scope and sends goal changes to the user`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /A reviewer finding alone never authorizes new scope/);
    assert.match(brief, /Oracle advice may recommend considering an in-goal expansion .* this advice is not permission to expand scope/);
    assert.match(brief, /Such a possibility is a planner revision request, not a direct edit/);
    assert.match(brief, /an accepted spec or plan still needs its existing human confirmation/);
    assert.match(brief, /A fallback reviewer \(not Oracle\) reports a possible expansion as a blocking finding marked `requires user decision; do not auto-repair`/);
    assert.match(brief, /A goal-changing, out-of-goal, or ambiguous expansion always requires a user decision/);
    assert.doesNotMatch(brief, /never authorizes new scope or plan expansion/, 'no absolute prohibition on every expansion');
    assert.match(brief, /a goal, spec, or plan change still needs the user's confirmation through the existing gate/);
    assert.match(brief, /Unrelated authorized work continues/);
  });

  test(`${layout}: brief lets any user decision win over repairable findings in the same verdict`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /\*\*Decision wins\.\*\* If any blocking finding requires a user decision, the whole verdict is a decision: stop and ask, and do not repair even the repairable findings\. Repair only when every blocking finding is repairable\./);
    order(brief, '**Decision wins.**', '**Repairs.**');
  });

  test(`${layout}: brief never reuses a PASS after a CHANGES`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /After any `CHANGES`, the check runs again on the changed inputs; reuse is never allowed after a `CHANGES`/);
    assert.match(brief, /Reuse is allowed only after an applicable `PASS`/);
    assert.match(brief, /a mechanical change \(wording, formatting, a fix that keeps the reviewed goals, files, and approach\) made after that PASS does not need a new check/);
  });

  test(`${layout}: brief judges freshness by content and records the PASS relied on by file`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /A `PASS` covers the inputs named in its reply/);
    assert.match(brief, /Judge relevance by what the change does to the goals, not by filenames or path lists alone/);
    assert.match(brief, /Run the check again when the inputs change in a goal-relevant way/);
    assert.match(brief, /The caller records the PASS it relies on, by file, and which case applied\./);
    assert.match(brief, /Every rework's R classification runs again on resume or rework/);
  });

  test(`${layout}: brief gives an Oracle-or-reviewer fallback and blocks progression without an independent reviewer`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /When Oracle is not available read-only, a fresh independent reviewer runs the goal-fit check/);
    assert.match(brief, /With no independent checker or reviewer, the caller reports `BLOCKED: no independent reviewer`/);
    assert.match(brief, /The affected acceptance and progression stop; unrelated authorized work continues/);
  });

  test(`${layout}: brief keeps the existing PASS and stop rules for alignment repairs`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /Stop as `BLOCKED` under the same rules as the goal-fit loop: a repair that changes nothing, or the same finding returning unchanged/);
    assert.match(brief, /A `requires user decision` finding stops the affected work and its dependents, and the caller asks the user/);
    assert.doesNotMatch(brief, /VERDICT: DECISION|`DECISION`/);
  });

  test(`${layout}: implement.md runs checkpoint C before the round-1 build, with an explicit PASS gate`, () => {
    const content = read(layout, IMPLEMENT);
    assert.ok(content.includes('**Approach goal-fit check C (before the first build of a task, where C applies; see fit-review Applicability):**'), 'checkpoint C missing');
    order(content, '**Approach goal-fit check C (before the first build of a task, where C applies; see fit-review Applicability):**', '**Round 1 (build):**');
    assert.match(content, /Run goal-fit check C with its brief \(read and follow \[fit-review\]\(\.\.\/rules-snippets\/fit-review\.md\)\)/);
    assert.match(content, /Dispatch the planner for a lightweight approach note only/);
    assert.match(content, /The planner writes no spec or plan file for this and makes no edits or build/);
    assert.match(content, /only the explicit `VERDICT: PASS` releases the round-1 build/);
    assert.match(content, /No independent checker \(Oracle or a fresh reviewer\): this task is `BLOCKED`, and independent tasks continue/);
  });

  test(`${layout}: implement.md checkpoint C lets a user decision win and never reuses after CHANGES`, () => {
    const content = read(layout, IMPLEMENT);
    assert.match(content, /A `CHANGES` with any finding marked `requires user decision; do not auto-repair` stops this task and its dependents as needs-decision, even when other findings are repairable/);
    assert.match(content, /A `CHANGES` where every finding is repairable: the planner revises the approach note/);
    order(content, 'stops this task and its dependents as needs-decision', 'where every finding is repairable');
    assert.match(content, /Later repair rounds reuse approach goal-fit check C only under the freshness rule in fit-review: after an applicable `PASS`, never after a `CHANGES`\./);
  });

  test(`${layout}: implement.md round 1 builds from the approved approach note`, () => {
    const content = read(layout, IMPLEMENT);
    order(content, 'only the explicit `VERDICT: PASS` releases the round-1 build', 'the approved approach note for its lane');
    assert.match(content, /after each ready task's C `VERDICT: PASS`/, 'round 1 must stay gated by checkpoint C');
  });

  test(`${layout}: Oracle role row names its checkpoint C reviewer duty and still forbids building`, () => {
    const content = read(layout, IMPLEMENT);
    const row = content.split('\n').find((line) => line.startsWith('| Oracle'));
    assert.ok(row, 'Oracle row exists');
    assert.match(row, /never builds/);
    assert.match(row, /goal-fit checks A, B, and C/);
    assert.match(row, /Its feedback is guidance\. It may recommend considering a justified in-goal expansion; that recommendation is a planner revision request under the Expansion rule in fit-review and never authorizes scope\./);
    assert.doesNotMatch(row, /may authorize/, 'the Oracle row must never grant expansion authority');
  });

  test(`${layout}: implement-feature runs checkpoint D after reconciliation and before aggregate verify and review`, () => {
    const content = read(layout, FEATURE);
    const aggregate = section(content, '5. **Feature Review**', '6. **Create Pull Request**');
    assert.ok(aggregate.includes('**Implementation review D** (before aggregate verification and review, where D applies; see fit-review Applicability)'), 'checkpoint D missing');
    order(aggregate, 'Restore the saved full-feature text', '**Implementation review D**');
    order(aggregate, '**Implementation review D**', 'Run implement.md steps 3, 4 and 5');
    assert.match(aggregate, /Only the explicit `VERDICT: PASS` releases aggregate verification and review/);
    assert.match(aggregate, /A `CHANGES` with any finding marked `requires user decision; do not auto-repair` stops the feature's aggregate acceptance until the user answers, even when other findings are repairable/);
    assert.match(aggregate, /A `CHANGES` where every finding is repairable goes to one root-cause owner per finding \(step 5, Route each ordinary repair finding once\), and D runs again on the changed inputs: reuse is never allowed after a `CHANGES`/);
    assert.doesNotMatch(aggregate, /(Repairs|goes) to the builder that owns each file/, 'the per-file repair routing must be gone');
    assert.match(aggregate, /With no fresh independent reviewer, aggregate acceptance is `BLOCKED`/);
    assert.match(aggregate, /including uncommitted and new files/);
  });

  test(`${layout}: implement-feature checkpoint D keeps the merge-base review scope`, () => {
    const content = read(layout, FEATURE);
    assert.match(content, /git merge-base/);
    assert.doesNotMatch(content, /git diff \{\{DEFAULT_BRANCH\}\}\.\.\.HEAD/);
  });

  test(`${layout}: implement-fixes skips C as a supplied-only task`, () => {
    const content = read(layout, FIXES);
    order(content, 'Determine whether C applies using', 'Dispatch one builder with the bug report');
    assert.doesNotMatch(content, /approach note is reviewed against the bug report/);
    assert.doesNotMatch(content, /approved approach note/);
  });

  test(`${layout}: factory runs post-build fit check after READY and before the upcoming review round`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /Valid `READY` → run the post-build fit check \(see Post-build fit check\), then step 7\./);
    order(content, 'run the post-build fit check (see Post-build fit check), then step 7.', '7. **Review round N.**');
    order(content, '### Repair', '### Post-build fit check');
    const a = section(content, '### Post-build fit check', '### Builder continuity');
    assert.match(a, /Runs before the upcoming review round `U` starts: after the first build \(`U` is `N`\), and after a review repair/);
  });

  test(`${layout}: factory post-build fit check persists round U and stage review before it dispatches, for normal callers only`, () => {
    const content = read(layout, FACTORY);
    const a = section(content, '### Post-build fit check', '### Builder continuity');
    order(a, '0. Normal callers only (the initial build and a review repair). Persist first: set `round` to `U` and stage `review` in `job.json` before any dispatch', '1. Dispatch a fresh, independent, read-only `reviewer`, never Oracle');
    assert.match(a, /so a blocked or interrupted `U` is visible/);
    assert.match(a, /Step 7 writes the same values again when reviews start; that write is idempotent\./);
    assert.match(content, /Resume also runs it, as a resume caller \(see Resume of build and review state\)\./);
    assert.match(a, /`VERDICT: PASS`: a normal caller continues to step 7 for `U`\. A resume caller continues with the captured action of Resume of build and review state, and step 7 runs only when that action is a review\./);
    assert.doesNotMatch(a, /`VERDICT: PASS`: continue to step 7\./, 'no unconditional step 7 after PASS');
  });

  test(`${layout}: factory step 8 sets the upcoming round before post-build fit check runs after a review repair`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /Then set `N` to `N \+ 1` \(the upcoming review round `U`\), run the post-build fit check for `U` \(see Repair\), and go to step 7\./);
    const repair = section(content, '### Repair', '### Post-build fit check');
    assert.match(repair, /Here `Round` is the round just reviewed \(`R`\)\. The upcoming review round is `U`/);
    assert.match(repair, /Classify the result with the Build status rules, as step 6 does\. A valid `READY`: run the post-build fit check for `U` before step 7 after every completed repair, mechanical ones included/);
    assert.match(repair, /a `Skipped:` record does not satisfy preview eligibility/);
    assert.match(repair, /Never reuse a PASS after a `CHANGES`\./);
    order(content, 'Then set `N` to `N + 1` (the upcoming review round `U`)', 'run the post-build fit check for `U` (see Repair)');
    assert.match(content, /round-<U>\/post-build-fit-<j>\.md/);
  });

  test(`${layout}: factory post-build fit check is reviewer-only, never Oracle, with per-round files, and blocks without a reviewer`, () => {
    const a = section(read(layout, FACTORY), '### Post-build fit check', '### Builder continuity');
    assert.match(a, /a fresh, independent, read-only `reviewer`, never Oracle/);
    assert.match(a, /The task line is `post-build fit check: round <U>`/);
    assert.doesNotMatch(a, /Dispatch `?oracle`?/i, 'the post-build fit check never dispatches Oracle');
    assert.match(a, /Save the reply, which starts `VERDICT:` and carries `Checkpoint: D`, as a new file `round-<U>\/post-build-fit-<j>\.md`, where `j` is the next free index in that folder\. Never overwrite an earlier reply\./);
    assert.match(a, /The current record for a round is its highest-`j` file\./);
    assert.match(a, /A skipped check is saved the same way with one line, `Skipped: mechanical change after the applicable PASS in round-<U'>\/post-build-fit-<j'>\.md`, naming the retained PASS it relies on\./);
    assert.match(a, /save a file whose first line is `BLOCKED: no independent reviewer`, stage `needs-human` with that reason, and do not start the review round/);
    assert.doesNotMatch(a, /alignment-A\.md`/, 'the single shared post-build-fit.md file must not return');
  });

  test(`${layout}: factory post-build fit check repairs stay non-expanding and a user decision wins`, () => {
    const a = section(read(layout, FACTORY), '### Post-build fit check', '### Builder continuity');
    assert.match(a, /Post-build fit repair findings \(reviewer findings, not operator requests, not goal authority\)/);
    assert.match(a, /Repeat until `PASS`, `needs-human`, or `BLOCKED`/);
    assert.match(a, /using the rules in Goal-fit checks for a repair that changes nothing or a finding that returns unchanged/);
    assert.match(a, /post-build fit repairs do not use the review-round budget/);
    assert.match(a, /`VERDICT: CHANGES` with any finding marked `requires user decision; do not auto-repair`: a user decision wins, even when other findings are repairable/);
    assert.match(a, /Stage `needs-human` with the reason `post-build fit decision: <finding>`/);
    assert.match(a, /`VERDICT: CHANGES` where every finding is repairable/);
    order(a, 'with any finding marked `requires user decision', 'where every finding is repairable');
    assert.match(a, /\/factory rework <id> <note>` \(rework classification classifies it\)/);
    assert.match(a, /Then run the post-build fit check for `U` again\. A `CHANGES` is always followed by a new check\./);
    assert.doesNotMatch(a, /round limit of|up to 3|3 rounds|three rounds/i);
  });

  test(`${layout}: factory resume pointer keeps post-build fit findings and points to the resume procedure`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /\*\*Resume\.\*\* A resumed job decides what runs next with the procedure in Resume of build and review state/);
    assert.match(content, /Pending post-build fit findings are never dropped on resume\./);
  });

  test(`${layout}: factory resume is one branch that captures the stage first and never adds 1 to round`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /Resume is one branch\. (?:A job with `previewStep` set resumes through Preview merge first, before any row below\. )?Otherwise it starts by capturing the persisted values: `R` = `round`, `S` = `stage`, and `failed_stage`\. Nothing is written until a branch below says so\./);
    assert.match(resume, /Never add 1 to `round` on resume, because `round` already holds the round in progress\./);
    assert.match(resume, /A resume caller runs post-build fit check without step 0: it keeps `round` and `stage` as persisted/);
  });

  test(`${layout}: decision table: stop conditions come first and never repair or run A`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    order(resume, '**Stop first.**', '**Then, by the captured stage:**');
    order(resume, '**Then, by the captured stage:**', 'Repair finished.');
    assert.match(resume, /a `Not verified:` item in any `round-R\/review-\*\.md`/);
    assert.match(resume, /`decision\.md` starts with `ESCALATE`/);
    assert.match(resume, /step 8's third-review-round rule applies to `R` \(`CHANGES` with the retries already used\)/);
    assert.match(resume, /the current post-build fit record for `R` is `CHANGES` with a user decision/);
    assert.match(resume, /print the reason and its remediation, and stop\. Do not repair, do not run the post-build fit check, and do not change `S`/);
  });

  test(`${layout}: decision table: an authorized repair is recovered only after the stop rules pass`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /\*\*Repair not finished\.\*\* The same `CHANGES` reviews, with no newer READY `build\.md`\. The stop rules above already passed, so the repair is authorized: rerun it with `Round` `R` \(step 8\), then the post-build fit check for `R \+ 1` as a normal caller\./);
    assert.match(resume, /\*\*Repair finished\.\*\* `round-R\/` holds a `review-\*\.md` with `VERDICT: CHANGES`/);
    assert.match(resume, /Set `round` to `R \+ 1` and stage `review` \(persist\), then run the post-build fit check for `U = R \+ 1` as a normal review-repair caller\. On PASS, step 7 runs for `U`\./);
  });

  test(`${layout}: decision table: needs-human is never converted into a repair on start`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /\*\*`needs-human` with `failed_stage` null\.\*\* A valid BLOCKED `build\.md` with parked records is the parked-task resume, not an? post-build fit stop/);
    assert.match(resume, /Any other reason prints its remediation and waits\. A `needs-human` stop is never converted into a repair on start\./);
    assert.doesNotMatch(resume, /needs-human[^\n]*rerun the repair/);
  });

  test(`${layout}: decision table: a resumed prior PASS gets a fresh post-build fit check and then the captured action`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /\*\*Reviews exist for `R`\.\*\* An explicit PASS is needed before any review or approval\. Run post-build fit check fresh for `R` as a resume caller, then:/);
    assert.match(resume, /`PASS`: resume the captured action\./);
  });

  test(`${layout}: decision table: a post-A approve is preserved and reruns only the approval`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /`approve` reruns the approval \(`reviewer` in approval mode, brief `roles\/approve\.md`\)/);
  });

  test(`${layout}: decision table: awaiting-human is preserved and reruns nothing`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /`awaiting-human` prints the handoff and the `\/factory approve` command, and reruns nothing\./);
  });

  test(`${layout}: decision table: repairs invalidate reviews, whatever the captured stage was`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /`CHANGES` with only repairable findings: restore its findings, repair with `Round` `R`, set `repaired` to yes/);
    assert.match(resume, /If `repaired` is yes, the code changed after the reviews, so the captured action becomes a rerun of the reviews for `R` \(step 7\), whatever `S` was\./);
  });

  test(`${layout}: decision table: BLOCKED recovery retries through start and never reruns reviews silently`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /`BLOCKED`: stage `needs-human` with the post-build fit reason\. Retry with `\/factory start <id>` after the cause is fixed\./);
    assert.match(resume, /A timed-out post-build fit reviewer is never re-dispatched\. Set `needs-human`, `failed_stage` `null`, and the reason `post-build fit reviewer timed out after <N> min; it may still be running`/);
    assert.match(resume, /The operator confirms it has stopped, then `\/factory start <id>` runs the resume above, which writes a new `j`\./);
  });

  test(`${layout}: factory resume of build state recognizes a finished READY build without rerunning the builder`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    assert.match(resume, /A valid `STATUS: READY` in `build\.md`, not superseded by a newer `rework-<r>\.md`: the builder finished this round\. Do not rerun it: go to step 6's READY path \(post-build fit check for `U = R`, then step 7\)/);
    order(resume, 'the builder finished this round', 'rework if a `rework-<r>.md` is newer than `build.md`');
  });

  test(`${layout}: factory resume table keeps review, approve, awaiting-human, and needs-human actions explicit`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /\| `review` \| Review and post-build fit state resume \(see Resume of build and review state below\)/);
    assert.match(content, /\| `approve` \| Review and post-build fit state resume \(see Resume of build and review state below\)\. Only after an explicit PASS, rerun the approval/);
    assert.match(content, /\| `awaiting-human` \| Print the approver's rationale, the QA record and any human handoff from `qa\.md` \(see QA guidance\)\. Check the current post-build fit record first: print the `\/factory approve` command only when it is an applicable PASS; otherwise print its remediation \(see Approve step 3\)/);
    assert.match(content, /Print the reason from `decision\.md`, `merge-conflict\.md`, `bootstrap\.md`, `build\.md`, or the current `round-<N>\/post-build-fit-<j>\.md`/);
  });

  test(`${layout}: factory approve refuses on missing, CHANGES, BLOCKED, or stale alignment in every mode`, () => {
    const approve = section(read(layout, FACTORY), '## Approve', '## Abandon');
    assert.match(approve, /Also refuse, in every mode and from `needs-human` too, unless the current post-build fit record passes/);
    assert.match(approve, /the highest-`j` `round-<round>\/post-build-fit-<j>\.md` for the job's `round` has first line `VERDICT: PASS`, or is a `Skipped:` line that names a `VERDICT: PASS` file/);
    assert.match(approve, /A `CHANGES` record, a `BLOCKED` record, a missing record, or a record made stale by a later change that needs a new post-build fit check under fit-review Freshness refuses/);
    assert.match(approve, /Remediation: a missing, stale, `BLOCKED`, or repairable `CHANGES` record is fixed with `\/factory start <job-id>`/);
    assert.match(approve, /A decision `CHANGES` is answered with `\/factory rework <job-id> <note>` or `\/factory abandon <job-id>`\./);
    assert.match(approve, /the current post-build fit record's blocker/);
  });

  test(`${layout}: factory rework runs rework classification R before any file is written and after the refusal check`, () => {
    const content = read(layout, FACTORY);
    const rework = section(content, '`/factory rework <job-id> <note>`:', '## Functional QA');
    order(rework, '1. Refuse unless stage is', '**Rework classification R (before any file is written).**');
    order(rework, '**Rework classification R (before any file is written).**', '2. `r` = the reserved index');
    assert.match(rework, /Reserve the next free index `b` of `rework-classification-<b>\.md`/);
    assert.match(rework, /Save the reply as `rework-classification-<b>\.md` with a header line `Note: <first line of the note>`, the reserved indices, and `Starts at round <N>`, where `N` = `round \+ 1` from `job\.json` as it is now/);
    assert.match(rework, /The gates never change `round`/);
    assert.match(rework, /Each family keeps its own index, and no existing file of any family is overwritten\./);
    assert.match(rework, /`CLASSIFICATION: repair`, with no finding marked `requires user decision`: continue with steps 2 to 4/);
    assert.match(rework, /A finding marked `requires user decision; do not auto-repair`, or any `plan change` or `spec change`: do not start the rework/);
    assert.match(rework, /No independent reviewer: stop with `BLOCKED: no independent reviewer`\. The stage stays where it was, and no rework starts\./);
    assert.match(rework, /It classifies the note as `repair`, `plan change`, or `spec change`, and it does not repair the note\./);
  });

  test(`${layout}: factory rework routes a spec change through spec then regenerated plan confirmation`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /\(1\) spec change: the spec gate, then the regenerated plan gate; \(2\) plan change: the plan gate; \(3\) leave the job as it is\. A spec change always takes choice 1\./);
    assert.match(rework, /Route `spec then plan`: write the note verbatim to the reserved `spec-<s>\.md`, set stage `spec`, rerun `planner` in spec mode, and show the spec gate\./);
    assert.match(rework, /Its Confirm reruns `planner` in plan mode, so the plan is regenerated from the confirmed spec\. The plan gate then shows the regenerated plan, and its Confirm is required again\./);
    assert.doesNotMatch(rework, /spec change[^\n]*route it through the plan gate only/i, 'a spec change must never take the plan-only route');
  });

  test(`${layout}: factory rework routes a plan change through plan confirmation alone`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /\(2\) plan change: the plan gate/);
    assert.match(rework, /Route `plan`: write the note verbatim to the reserved `plan-<p>\.md`, set stage `plan`, rerun `planner` in plan mode, and show the plan gate\./);
  });

  test(`${layout}: factory routed continuation is pending from the artifacts and ends when round is persisted`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /Continuation: a routed rework continues from the plan gate's Confirm\. It is pending while the newest `rework-classification-<b>\.md` has a `Route:` line and `job\.round` is lower than its `Starts at round` value/);
    assert.match(rework, /Its Confirm does not run Start's create or resume path, and it does not run the initial build-location setup/);
    assert.match(rework, /A routed job at `awaiting-spec` or `awaiting-plan` resumes at its gate, and its Confirm follows this procedure\./);
  });

  test(`${layout}: factory routed continuation runs Tracking before doc sync so keys and the rename are carried`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    order(rework, '1. **Tracking first**', '3. **Doc sync**');
    assert.match(rework, /write missing keys and rename the folder in the main checkout \(this updates `feature_dir`\)\. Only then sync the docs, so keys and the rename are carried\./);
    order(rework, '3. **Doc sync**', '4. **Round and note.**');
  });

  test(`${layout}: factory routed continuation validates worktree and in-place locations independently`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /2\. \*\*Validate the build location from `job\.json`\*\*, independently of the gate\./);
    assert.match(rework, /`worktree` `true`: `worktree_path` must be set to an existing worktree on `factory\/<id>`/);
    assert.match(rework, /`worktree` `false` \(in-place\): `worktree_path` must be `null` and the main checkout must be on `factory\/<id>`/);
    assert.match(rework, /the In-place dirty check must pass\. That check excludes the feature roots, so the new spec and plan do not trip it/);
    assert.match(rework, /Never run checkout, reset, stash, or clean to pass a check, so newly edited docs are never lost\./);
    assert.match(rework, /An in-place job's main checkout is its location, so only the Feature docs commit runs there/);
  });

  test(`${layout}: factory routed doc sync carries qa and optional tasks without broad deletion`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /if the worktree still has the old unkeyed folder, `git mv` its `qa\.md` into `feature_dir` when that folder has none; if both have one, stop and ask/);
    assert.match(rework, /Copy `spec\.md` on the spec route only \(by `spec_route`, never by file existence: a plan-only job copies no `spec\.md`, even a stale one\), and `plan\.md`, from the main checkout's `feature_dir` over the worktree's copies/);
    assert.match(rework, /Copy `tasks\.md` when the main checkout has it; when the main checkout lacks it and the worktree has one, remove only that worktree `tasks\.md`/);
    assert.match(rework, /Never copy, delete, or overwrite `qa\.md` or any other file\./);
    assert.match(rework, /Then run Feature docs commit using its route-specific removal rule; on plan-only, leave the old folder and every unmoved path untouched/);
    order(rework, 'if the worktree still has the old unkeyed folder', 'Then run Feature docs commit using its route-specific removal rule');
    assert.doesNotMatch(rework, /git rm -r[^\n]*feature_dir/, 'no broad deletion of the feature folder in the sync');
  });

  test(`${layout}: factory routed continuation takes N from job.round once and persists it before the builder`, () => {
    const rework = section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
    order(rework, '4. **Round and note.** Set `N` = `round + 1` from `job.json` now.', '5. Continue with Rework step 4 below.');
    assert.match(rework, /Compare it with `Starts at round` in `rework-classification-<b>\.md`; if they differ, stop and ask\./);
    assert.match(rework, /It persists `round` = `N` and stage `build`, which ends the pending state\./);
    assert.match(rework, /Steps 1 to 4 are idempotent, so a crash before that persist reruns them safely\./);
    const step4 = rework.slice(rework.indexOf('4. Set `round` to `N`, stage `build`'));
    assert.ok(step4.startsWith('4. Set `round` to `N`, stage `build`'), 'Rework step 4 persists round and stage');
    order(step4, 'Set `round` to `N`, stage `build`', 'Run the Build lanes procedure in rework mode');
  });

  test(`${layout}: factory layout lists per-round and per-family alignment files`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /round-<N>\/post-build-fit-<j>\.md {3}post-build fit records, one file each, never overwritten/);
    assert.match(content, /rework-classification-<b>\.md {5}you, the rework classification \(R\) of a user-directed rework note, with its reserved file indices/);
    assert.doesNotMatch(content, /round-<N>\/alignment-A\.md/);
  });

  test(`${layout}: factory alignment text keeps the fit-review link and does not add a fit-file pattern or request.md`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /\]\(\.\.\/\.\.\/\.\.\/\.claude\/rules-snippets\/fit-review\.md\)/);
    assert.doesNotMatch(content, /`fit-[^`]*\.md`/);
    assert.doesNotMatch(content, /request\.md/);
    assert.doesNotMatch(content, /sha256|content hash|fit hash/i);
  });

  test(`${layout}: build role treats post-build repair findings as CHANGES items and never expands scope`, () => {
    const content = read(layout, BUILD_ROLE);
    assert.match(content, /Post-build fit repair findings in the dispatch context are the same kind of item: fix them within the goals, and never expand scope to satisfy one\./);
  });

  test(`${layout}: no new round cap or third verdict word in the checkpoint text`, () => {
    // The Factory file keeps its existing three-review-round budget for review repairs, so it is checked
    // through the post-build fit check, resume, and rework sections only (see the tests above).
    for (const file of [BRIEF, IMPLEMENT, FEATURE, FIXES]) {
      const text = read(layout, file);
      assert.doesNotMatch(text, /VERDICT: DECISION|`DECISION`/, `${layout}/${file}`);
      assert.doesNotMatch(text, /round cap|three review rounds|max(imum)? 3 rounds/i, `${layout}/${file}`);
    }
  });
}


// Role boundary (user correction): the planner authors plans and approach notes; Oracle and reviewers are
// read-only guidance and feedback; the builder implements and repairs code and never authors plans.
for (const layout of LAYOUTS) {
  test(`${layout}: checkpoint C approach note is authored by the planner, not the builder or Oracle`, () => {
    const c = read(layout, IMPLEMENT);
    assert.match(c, /Dispatch the planner for a lightweight approach note only/);
    assert.doesNotMatch(c, /Dispatch the builder for an approach note/);
    assert.match(c, /The planner writes no spec or plan file for this and makes no edits or build\./);
    assert.match(c, /The supplied-task exception applies, so no spec or plan is required\./);
    assert.match(c, /the planner revises the approach note within the task's goals/);
    assert.doesNotMatch(c, /the builder revises the approach note/);
    assert.match(c, /The planner's self-review does not count\./);
  });

  test(`${layout}: role table: Oracle is read-only guidance, Planner authors plans, Builder never authors plans`, () => {
    const c = read(layout, IMPLEMENT);
    const oracle = c.split('\n').find((line) => line.startsWith('| Oracle'));
    assert.match(oracle, /Read-only steering only/);
    assert.match(oracle, /Never authors or edits a plan, approach note, or code, and never builds/);
    const planner = c.split('\n').find((line) => line.startsWith('| Planner'));
    assert.ok(planner, 'Planner row exists');
    assert.match(planner, /Authors and revises any plan or approach note/);
    assert.match(planner, /Never edits code/);
    const builder = c.split('\n').find((line) => line.startsWith('| Builder'));
    assert.match(builder, /Never authors a plan or approach note/);
  });

  test(`${layout}: brief: reviewers never author or edit, and planner revisions get review and user confirmation`, () => {
    const b = read(layout, BRIEF);
    assert.match(b, /Read-only guidance: the checker, Oracle included, never authors or edits a spec, plan, approach note, or code\. A planner authors any revision\./);
    assert.match(b, /Checker feedback is guidance; the Expansion rule is the only path to added work, and no checker changes a goal\./);
    assert.match(b, /Every dispatch also carries the overall work's summary and goals as context/);
    assert.match(b, /The verbatim original request and explicit amendments remain the authority, and the summary never replaces them\./);
    assert.match(b, /A planner revision made in response to a finding goes back through an independent read-only check/);
    assert.match(b, /the planner's read-only approach note against the supplied task/);
  });

  test(`${layout}: implement-fixes runs D right after the builder reports done, before verify and review`, () => {
    const content = read(layout, FIXES);
    order(content, 'Dispatch one builder with the bug report', 'Implementation review D: where D applies');
    order(content, 'Implementation review D: where D applies', '- Verify: rerun');
    order(content, '- Verify: rerun', '- Review: the independent read-only reviewer');
    assert.match(content, /run it immediately after the builder declares done, before verification and code review, and again after every repair/);
  });

  test(`${layout}: implement-fixes has no approach note: a fix skips C`, () => {
    const f = read(layout, FIXES);
    assert.doesNotMatch(f, /approach note is reviewed against the bug report/);
    assert.doesNotMatch(f, /builder's read-only approach note/);
  });

  test(`${layout}: factory fresh reviewer is read-only guidance and never a plan author`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /It reads and advises only: it never authors or edits a plan or code\./);
  });
}


// Expansion amendment: Oracle may only recommend a justified in-goal expansion; the planner's revision, an
// independent review, and any applicable confirmation authorize it. Fallback reviewers may not; the overall summary and goals travel with every dispatch.
for (const layout of LAYOUTS) {
  test(`${layout}: factory A routes a justified expansion through the plan gate, not a direct repair`, () => {
    const a = section(read(layout, FACTORY), '### Post-build fit check', '### Builder continuity');
    order(a, 'with a justified expansion (the fit-review Expansion rule) and no decision finding', '`VERDICT: CHANGES` where every finding is repairable');
    assert.match(a, /the expansion changes an accepted plan, so it is not applied directly/);
    assert.match(a, /Stage `needs-human` with the reason `post-build fit expansion: <finding>`/);
    assert.match(a, /rework classification classifies it as a plan change, and the plan gate confirms the planner's revision/);
  });

  test(`${layout}: implement-feature D routes an expansion to the planner and keeps the user confirmation for accepted artifacts`, () => {
    const aggregate = section(read(layout, FEATURE), '5. **Feature Review**', '6. **Create Pull Request**');
    assert.match(aggregate, /A justified expansion \(the fit-review Expansion rule\) is a planner revision request; if the feature has accepted spec or plan files it changes, the user confirms it before the work continues\./);
  });

  test(`${layout}: every alignment dispatch carries the overall summary and goals as context, not only the local task`, () => {
    const c = read(layout, IMPLEMENT);
    assert.match(c, /the overall work's summary and goals as context \(for a task inside a feature, the whole feature, not only the task\)/);
    const feature = read(layout, FEATURE);
    assert.match(feature, /Dispatch a fresh independent reviewer, never Oracle, with the saved full-feature text and every amendment, the feature's summary and goals as context,/);
    assert.match(feature, /Each task's goal-fit check C, where it applies, also receives the full-feature summary and goals as context, not only the task\./);
    const factory = read(layout, FACTORY);
    assert.match(factory, /the goal sources, the job's overall summary and goals as context, the accepted spec \(spec route\) or the plan's requirements sections \(plan-only\), the accepted plan, and the brief\./);
    assert.match(factory, /with the original request and every explicit amendment verbatim, the job's overall summary and goals as context, `spec\.md`/);
    assert.match(factory, /Pass them as text, not as paths alone, with the job's overall summary and goals as context \(never as authority\)/);
  });

  test(`${layout}: Oracle advice is not permission and fallback review remains independent`, () => {
    const b = read(layout, BRIEF);
    assert.match(b, /Oracle advice may recommend considering an in-goal expansion .* this advice is not permission to expand scope/);
    assert.match(b, /A fallback reviewer \(not Oracle\) reports a possible expansion as a blocking finding/);
    const factory = read(layout, FACTORY);
    assert.match(factory, /a fresh, independent, read-only `reviewer`, never Oracle: the post-build fit check is not a goal-fit check\. It reads and advises only: it never authors or edits a plan or code\./);
  });
}


// Regressions: a pending expansion is never a PASS; a historical ESCALATE does not block a newer authorized
// rework; a current ESCALATE still blocks.
for (const layout of LAYOUTS) {
  test(`${layout}: pending expansion is CHANGES, never PASS, until the planner revision is reviewed and human confirmations complete`, () => {
    const b = read(layout, BRIEF);
    assert.match(b, /A proposed expansion is never a PASS: its verdict is `VERDICT: CHANGES` with a blocking finding marked `pending expansion; planner revision required`/);
    assert.match(b, /Oracle's stated basis is not authority to implement an unrevised plan\./);
    assert.match(b, /The revised artifact must pass its applicable goal-fit check before it is offered for human confirmation\. Neither the proposed expansion nor the checker's PASS authorizes implementation; wait for the required human confirmation\./);
    const c = read(layout, IMPLEMENT);
    assert.match(c, /A pending expansion is a `CHANGES`, never a PASS, until the planner's revision is reviewed again\./);
  });

  test(`${layout}: resume: a historical ESCALATE does not block a newer authorized rework; a current one still blocks`, () => {
    const resume = section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
    const stop = resume.slice(resume.indexOf('- `decision.md` starts with `ESCALATE`'), resume.indexOf('- step 8', resume.indexOf('- `decision.md` starts with `ESCALATE`')));
    assert.match(stop, /belongs to the current cycle/);
    assert.match(stop, /Its round `N` is the one in its `Round: N` line or in `retries exhausted after round N`/);
    assert.match(stop, /It belongs to the current cycle when `N` is at least the cycle start: the `Starts at round` value of the latest `rework-<k>\.md`, or round 1 when there is none\./);
    assert.match(stop, /An earlier cycle's `ESCALATE` is historical: it does not stop a newer rework that has started, and it stays in `decision\.md` or its `decision-<R>\.md` copy/);
  });

  test(`${layout}: approver ESCALATE carries its round, and a rework keeps the old decision by copy, never deletion`, () => {
    const content = read(layout, FACTORY);
    assert.match(content, /Write the acceptance basis header under the first line, for both `APPROVE` and `ESCALATE`: line 2 `Round: <N>`/);
    const rework = section(content, '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /4\. Set `round` to `N`, stage `build`, and retire the active preview attempt[\s\S]*?copy `decision\.md` unchanged to `decision-<R>\.md`, where `R` is the round it names\. This is a copy, never a deletion, so the historical decision stays\./);
  });
}


// Plan review and routing contracts (approved propagation plan). Static text checks in both layouts.
const SUBWF = '.claude/rules-snippets/subagent-workflow.md';
const WRITING = '.agents/skills/writing-plans/SKILL.md';
const EXEC = '.agents/skills/executing-plans/SKILL.md';
const SDD = '.agents/skills/subagent-driven-development/SKILL.md';
const RCR = '.agents/skills/receiving-code-review/SKILL.md';
const SDD_IMPL = '.agents/skills/subagent-driven-development/implementer-prompt.md';
const SDD_SPEC = '.agents/skills/subagent-driven-development/spec-reviewer-prompt.md';
const SDD_QUAL = '.agents/skills/subagent-driven-development/code-quality-reviewer-prompt.md';
const PLANNER_SNIP = '.claude/agents-snippets/planner.md';
const REVIEWER_SNIP = '.claude/agents-snippets/reviewer.md';
const BUILDER_SNIP = '.claude/agents-snippets/feature-builder.md';

test('plan review: shared routing text is identical across src/repo and src/monorepo', () => {
  for (const rel of [SUBWF, EXEC, RCR, SDD_IMPL, SDD_SPEC, SDD_QUAL, PLANNER_SNIP, REVIEWER_SNIP, BUILDER_SNIP]) {
    assert.equal(read('src/repo', rel), read('src/monorepo', rel), rel);
  }
});

for (const layout of LAYOUTS) {
  test(`plan review: ${layout} brief names a plan review section before checkpoints A to D`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /## Plan goal-fit check \(B\)/);
    order(brief, '## Plan goal-fit check (B)', '## Checkpoints and dispatch');
    assert.match(brief, /It is letter B\. It is not a separate checkpoint\./);
  });

  test(`plan review: ${layout} brief lists what is excluded and resists evasion by format`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /It excludes bookkeeping-only in-session todos, single-task approach notes already covered by C, and trivial or focused single-file work with no consequential execution plan\./);
    assert.match(brief, /Substance decides, not format: a consequential scope, approach, requirement, or acceptance change cannot escape the check by being called a todo, note, or single-file edit\./);
  });

  test(`plan review: ${layout} brief fixes the exact reply labels for a plan review`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /the first line is `VERDICT: PASS` or `VERDICT: CHANGES`\. The second line is `Checkpoint: B`\. The third is `Reviewed inputs: <plan and authoritative sources>`/);
  });

  test(`plan review: ${layout} brief applies expansion, planner, independence, baseline, and human gates by reference`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /The expansion rule, planner authorship of revisions, independence, the baseline, and the human gates apply by reference\./);
    assert.match(brief, /A revised plan is checked again before PASS\./);
  });

  test(`plan review: ${layout} brief makes the coordinator own freshness and reuse, with no duplicate from the entry point`, () => {
    const brief = read(layout, BRIEF);
    assert.match(brief, /The coordinator owns freshness and reuse: it reuses an applicable PASS only as the Freshness rule allows, and a skill entry point alone never starts a second check\./);
  });

  test(`plan review: ${layout} subagent-workflow has one routing section and orders plan changes`, () => {
    const s = read(layout, SUBWF);
    assert.equal(s.split('## Plan and Spec Changes').length - 1, 1, 'one routing section');
    const sec = section(s, '## Plan and Spec Changes', '## Quality Gates');
    assert.match(sec, /An ordinary repair \(a fix inside the accepted plan and goals\) stays with the builder or specialist that owns the files/);
    assert.match(sec, /the planner authors the revision/);
    order(sec, 'the planner authors the revision', 'a plan goal-fit check (B) (fit-review)');
    order(sec, 'a plan goal-fit check (B) (fit-review)', 'applicable existing confirmation');
    order(sec, 'applicable existing confirmation', 'resume the affected work');
    assert.match(sec, /verbatim original request and explicit amendments/);
    assert.match(sec, /overall summary and goals as context/);
    assert.match(sec, /The summary is not authority/);
    assert.match(sec, /No new record schema or structured-file field is added/);
    assert.match(sec, /Oracle may recommend considering a justified in-goal expansion; this is advice, not authorization/);
    assert.doesNotMatch(sec, /Oracle may authorize/, 'Oracle must never be given expansion authority');
  });

  test(`plan review: ${layout} subagent-workflow gates plans and bypasses and follows the calling reviewer contract`, () => {
    const s = read(layout, SUBWF);
    assert.match(s, /Every plan must pass the plan goal-fit check \(B\) \(fit-review\) before implementation begins/);
    assert.match(s, /A standalone Planner-to-Implementer handoff is a bypass: it must get the plan gate and classify each feedback item/);
    assert.match(s, /A reviewer dispatched under a goal-fit check or review contract follows that contract's reply format, not the generic review summary/);
  });

  test(`plan review: ${layout} writing-plans gates execution-ready handoff on an explicit PASS`, () => {
    const w = read(layout, WRITING);
    order(w, '## Plan Review Before Handoff', '## Execution Handoff');
    assert.match(w, /The plan is execution-ready only after an explicit PASS and any applicable human confirmation/);
    assert.match(w, /A revised plan is checked again before it is handed off/);
  });

  test(`plan review: ${layout} executing-plans checks review evidence, classifies feedback, and reroutes partner plan updates`, () => {
    const e = read(layout, EXEC);
    assert.match(e, /check for applicable plan goal-fit evidence: an explicit B PASS for this plan \(fit-review\)/);
    assert.match(e, /Classify each feedback item first: an ordinary repair stays within the plan; a plan or spec change follows Plan and Spec Changes in subagent-workflow/);
    assert.doesNotMatch(e, /^- Partner updates the plan based on your feedback$/m, 'bare partner line must be rerouted');
    assert.match(e, /- Partner updates the plan based on your feedback: Planner revises it → plan goal-fit check \(B\) → applicable existing confirmation → resume the affected work\. The partner's amendment remains the authoritative goal input\./);
  });

  test(`plan review: ${layout} subagent-driven entry requires an explicit plan review PASS AND any applicable confirmation`, () => {
    const para = section(read(layout, SDD), '## Direct Entry and Plan Changes', '## The Process');
    assert.match(para, /starts only from a plan that has an explicit plan goal-fit check \(B\) PASS and any applicable existing confirmation/);
    assert.doesNotMatch(para, /explicit plan review PASS,? or from a plan the user has confirmed/, 'PASS-or-confirmation bypass');
    assert.doesNotMatch(para, /PASS or /, 'no alternative to the PASS');
  });

  test(`plan review: ${layout} subagent-driven process diagram classifies every finding before any implementer repair`, () => {
    const dot = read(layout, SDD).match(/```dot\s*\ndigraph process[\s\S]*?```/)[0];
    assert.match(dot, /"Implementer subagent implements, tests, self-reviews; no staging or commits" -> "Consequential change needed\?";/);
    assert.match(dot, /"Consequential change needed\?" -> "Exit: coordinator sends to planner \(revision, plan goal-fit check \(B\), confirmation\)" \[label="yes"\];/);
    assert.match(dot, /"Consequential change needed\?" -> "Dispatch spec reviewer with reconciled scoped changes, including relevant uncommitted and untracked paths" \[label="no"\];/);
    assert.match(dot, /"Spec reviewer subagent confirms code matches spec\?" -> "Implementer subagent fixes spec gaps" \[label="no: ordinary gap"\];/);
    assert.match(dot, /"Spec reviewer subagent confirms code matches spec\?" -> "Exit: [^"]*" \[label="no: consequential gap"\];/);
    assert.match(dot, /"Code quality reviewer subagent approves\?" -> "Implementer subagent fixes quality issues" \[label="no: ordinary issue"\];/);
    assert.match(dot, /"Code quality reviewer subagent approves\?" -> "Exit: [^"]*" \[label="no: consequential issue"\];/);
    // Bypass guard: no reviewer decision may reach implementer repair on an unlabelled "no" edge.
    assert.doesNotMatch(dot, /confirms code matches spec\?" -> "Implementer subagent fixes spec gaps" \[label="no"\]/);
    assert.doesNotMatch(dot, /approves\?" -> "Implementer subagent fixes quality issues" \[label="no"\]/);
    // Spec compliance still gates the quality review.
    assert.match(dot, /"Spec reviewer subagent confirms code matches spec\?" -> "Dispatch code quality reviewer with reconciled scoped changes, including relevant uncommitted and untracked paths" \[label="yes"\];/);
  });

  test(`plan review: ${layout} subagent-driven example runs the plan gate before extracting or dispatching`, () => {
    const ex = section(read(layout, SDD), '## Example Workflow', '## Advantages');
    order(ex, '[Check the explicit plan goal-fit check (B) PASS and any applicable confirmation first: stop if either is missing]', '[Extract all 5 tasks with full text and context]');
    order(ex, '[Extract all 5 tasks with full text and context]', '[Dispatch implementation subagent with full task text + context]');
  });

  test(`plan review: ${layout} subagent-driven repairs stay with the implementer for ordinary issues only`, () => {
    const s = read(layout, SDD);
    const repairs = section(s, '**If reviewer finds issues:**', '**If subagent fails task:**');
    assert.match(repairs, /fixes each ordinary issue\. A consequential finding \(scope, approach, requirement, or plan\) is not fixed here/);
    assert.match(s, /- Skip review loops \(reviewer found ordinary issues = implementer fixes = review again; consequential findings go to the coordinator\)/);
    assert.match(s, /Start code quality review before spec compliance is ✅/, 'spec-before-quality order preserved');
  });

  test(`plan review: ${layout} feature-builder handoff carries verbatim authority, summary context, and routing`, () => {
    const ht = section(read(layout, BUILDER_SNIP), '## Task Handoff Template', '## Completion');
    assert.match(ht, /5\. The overall goal summary of the whole work, as context only, and the verbatim original request with every explicit amendment, which are the authority\./);
    assert.match(ht, /6\. Routing: any needed scope, approach, requirement, or plan change is returned to the coordinator, not implemented/);
    assert.match(read(layout, BUILDER_SNIP), /dispatch the original specialist to fix every ordinary issue\./);
  });

  test(`plan review: ${layout} spec-reviewer template has the verbatim placeholder before the trust section and returns consequential findings`, () => {
    const block = read(layout, SDD_SPEC).split('```')[1];
    assert.match(block, /\[VERBATIM original request and every explicit amendment, pasted as text, not as paths\]/);
    order(block, '## Goal Context', '## Original Request and Amendments (authority)');
    order(block, '## Original Request and Amendments (authority)', '## What Implementer Claims They Built');
    assert.match(block, /Consequential findings \(missing or extra scope that changes goals, approach, requirements, or plan\): report them separately under their own heading and do not fix them\./);
  });

  test(`plan review: ${layout} code-quality template passes goal context, verbatim authority, and consequential routing`, () => {
    const block = read(layout, SDD_QUAL).split('```')[1];
    assert.match(block, /GOAL_CONTEXT: \[overall goal summary of the whole work, as context only\]/);
    assert.match(block, /ORIGINAL_REQUEST_AND_AMENDMENTS: \[VERBATIM original request and every explicit amendment, pasted as text; the authority\]/);
    assert.match(block, /CONSEQUENTIAL_FINDINGS: report separately and do not fix them\./);
    order(block, 'DESCRIPTION:', 'GOAL_CONTEXT:');
  });

  test(`plan review: ${layout} subagent prompts carry goal context and return proposed expansions`, () => {
    const impl = read(layout, SDD_IMPL);
    assert.match(impl, /overall goal summary/);
    assert.match(impl, /## Scope Changes/);
    assert.match(impl, /Return the proposed expansion to the coordinator/);
    assert.match(read(layout, SDD_SPEC), /## Goal Context/);
    assert.match(read(layout, SDD_QUAL), /follow that contract's reply format instead of that template/);
  });

  test(`plan review: ${layout} plan adaptation orders planner, plan review PASS, confirmation, then execution, with plan-specific repairs and freshness`, () => {
    const sec = section(read(layout, BRIEF), '## Plan goal-fit check (B)', '## Checkpoints and dispatch');
    const adapt = sec.slice(sec.indexOf("A plan's order is:"));
    assert.ok(adapt.length > 0, 'adaptation paragraph exists');
    order(adapt, 'planner revision', 'a B PASS');
    order(adapt, 'a B PASS', 'the applicable human confirmation');
    order(adapt, 'the applicable human confirmation', 'then execution.');
    assert.match(adapt, /A justified expansion is never executed on a B PASS alone: the revised plan must pass B and receive its applicable confirmation first\./);
    assert.match(adapt, /Repairs from B go to the planner, not the builder\./);
    assert.match(adapt, /The record of a B PASS is the conversation or the existing progress record, noting the plan version checked; no new file or schema is required/);
    assert.match(adapt, /the by-file record in Freshness does not apply to B\./);
  });

  test(`plan review: ${layout} checkpoints A to D keep their exact baseline bullets and order`, () => {
    const sec = section(read(layout, BRIEF), '## Checkpoints and dispatch', '## Rules');
    const bullets = [
      '- **A, spec goal-fit check:** the spec, before the spec gate, and again after any spec change.',
      '- **B, plan goal-fit check:** the written plan, before the plan gate or execution, and again after any plan change. See the section above.',
      '- **C, approach goal-fit check:** the planner\'s read-only approach note against the supplied task, before the task\'s first build. Applicability above governs it.',
      '- **D, implementation review:** runs immediately after the builder declares done (after reconciling multiple builders, if any), before verification and code review, and again after every repair. Applicability above governs it.',
    ];
    for (const b of bullets) assert.ok(sec.includes(b), `A-D bullet kept: ${b.slice(0, 40)}`);
    for (let i = 1; i < bullets.length; i++) order(sec, bullets[i - 1], bullets[i]);
  });

  test(`plan review: ${layout} receiving-code-review references classification only, with no new gate`, () => {
    const r = read(layout, RCR);
    assert.match(r, /## Plan and Spec Feedback/);
    order(r, '## Plan and Spec Feedback', '## Implementation Order');
    assert.match(r, /Classify feedback as an ordinary repair or a plan or spec change, and follow Plan and Spec Changes in subagent-workflow/);
    assert.doesNotMatch(r, /plan review PASS is required before any reply/i);
  });

  test(`plan review: ${layout} agent snippets: planner authors revisions, reviewer follows the calling contract, feature builder gates the bypass`, () => {
    assert.match(read(layout, PLANNER_SNIP), /You author every plan revision: revise only the listed findings within the goals and return the revised plan\. Reviewers and Oracle never author or edit plans\./);
    assert.match(read(layout, REVIEWER_SNIP), /When dispatched under a goal-fit check or review contract, follow that contract's reply format/);
    const fb = read(layout, BUILDER_SNIP);
    assert.match(fb, /A standalone Planner-to-Implementer handoff is a bypass: it needs the same plan gate and feedback classification/);
  });

  test(`plan review: ${layout} CHANGELOG and README extend the pending entries with plan review`, () => {
    assert.match(read('.', 'CHANGELOG.md'), /Plan review/);
    assert.match(read('.', 'README.md'), /Plan goal-fit check \(B\)/);
  });
}

test('parity: the checkpoint wording in implement-feature and implement-fixes matches across layouts', () => {
  for (const sentence of [
    'Only the explicit `VERDICT: PASS` releases aggregate verification and review.',
    'With no fresh independent reviewer, aggregate acceptance is `BLOCKED`.',
  ]) {
    for (const layout of LAYOUTS) assert.ok(read(layout, FEATURE).includes(sentence), `${layout} feature: ${sentence}`);
  }
  for (const layout of LAYOUTS) {
    assert.ok(read(layout, FIXES).includes('Determine whether C applies using'), `${layout} fixes`);
  }
});

test('parity: factory SKILL post-build fit check, repair, resume, approve, and rework blocks are identical across layouts', () => {
  const block = (layout) => section(read(layout, FACTORY), '### Repair', '### Builder continuity');
  assert.equal(block('src/repo'), block('src/monorepo'));
  const resume = (layout) => section(read(layout, FACTORY), '### Resume of build and review state', 'A rerun of a failed stage');
  assert.equal(resume('src/repo'), resume('src/monorepo'));
  const approve = (layout) => section(read(layout, FACTORY), '## Approve', '## Abandon');
  assert.equal(approve('src/repo'), approve('src/monorepo'));
  const rework = (layout) => section(read(layout, FACTORY), '`/factory rework <job-id> <note>`:', '## Functional QA');
  assert.equal(rework('src/repo'), rework('src/monorepo'));
});
