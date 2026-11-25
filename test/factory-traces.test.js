'use strict';

// Trace fixtures for two Factory job paths: a plan-only job, and an auto job under push-mr.
// Each fixture is an ordered list of steps the orchestrator takes. The tests check the trace
// against invariants and against the SKILL.md text in both layouts.
// Run with: node --test test/factory-traces.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const FIXTURES = path.join(__dirname, 'fixtures', 'factory-traces');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const skill = (layout) => read(`${layout}/.agents/skills/factory/SKILL.md`);
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));

// Lines of the section that starts at an exact `## ` or `### ` heading, up to the next heading of the same or higher level.
function section(content, heading) {
  const lines = content.split('\n');
  const start = lines.indexOf(heading);
  if (start === -1) return '';
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+) /);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

function allReads(events) {
  return events.flatMap((e) => [...(e.reads || []), ...(e.copies || [])]);
}

test('plan-only trace: the job starts at stage plan and never reads or copies spec.md', () => {
  const t = fixture('plan-only.json');
  const create = t.events.find((e) => e.step === 'create-job');
  assert.equal(create.stage, 'plan', 'a confirmed plan-only job starts at stage plan');
  assert.equal(create.spec_route, 'plan-only');
  assert.equal(t.events.findIndex((e) => e.step === 'create-job'), t.events.findIndex((e) => e.step === 'intake-gate') + 1, 'job is created right after the intake gate');
  for (const e of t.events) {
    assert.ok(!(e.stage === 'spec' || e.stage === 'awaiting-spec'), 'no spec stage in ' + e.step);
    assert.ok(!(e.writes || []).includes('spec.md'), 'no spec.md write in ' + e.step);
  }
  assert.ok(!allReads(t.events).some((p) => /spec\.md/.test(p)), 'spec.md is never read or copied');
  assert.ok(!t.events.some((e) => e.step === 'spec-gate'), 'no spec gate');
});

test('plan-only trace: the plan goal-fit check and the worktree copy run without spec.md, in both layouts', () => {
  const t = fixture('plan-only.json');
  const fit = t.events.find((e) => e.step === 'plan-gate-fit');
  assert.equal(fit.task, 'goal-fit check: plan');
  assert.deepEqual(fit.reads, ['intake.md', 'plan.md'], 'the plan goal-fit check reads only the intake and the plan');
  const copy = t.events.find((e) => e.step === 'build-location');
  assert.deepEqual(copy.copies, ['plan.md'], 'the worktree copy carries plan.md, not spec.md');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /`spec\.md` \(spec route only: a plan-only job has none, and never reads or copies one\)/, layout + ': worktree copy text');
    assert.match(text, /On a plan-only route, the plan goal-fit check, the worktree copy, and the publish procedure never read, copy, or require `spec\.md`\./, layout + ': plan section text');
    assert.match(text, /Write `job\.json` with stage `plan` when intake confirmed plan-only/, layout + ': start creates plan stage');
  }
});

test('auto push-mr trace: the request opens into the default branch, nothing merges locally, and the stage is awaiting-human', () => {
  const t = fixture('auto-push-mr.json');
  const base = t.config.DEFAULT_BRANCH;
  const cmds = t.events.map((e) => e.command || '').join('\n');
  for (const bad of t.forbidden) {
    assert.ok(!t.events.some((e) => JSON.stringify(e).includes(bad)), 'trace must not contain: ' + bad);
  }
  const mr = t.events.find((e) => e.step === 'open-request');
  assert.match(mr.command, new RegExp('--target-branch ' + base + '\\b'), 'MR targets the default branch');
  assert.ok(!/git .*merge/.test(cmds), 'no local git merge');
  const stage = t.events.find((e) => e.step === 'stage');
  assert.equal(stage.stage, 'awaiting-human');
  assert.equal(stage.mr, mr.mr, 'the stage records the request URL');
  assert.equal(t.job.approvalMode, 'auto');
  assert.equal(t.job.mr, null, 'job.mr is set only by the open-request step, not in the start state');
});

test('auto push-mr trace: the SKILL text keeps the forge merge human under auto, in both layouts', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    const push = section(text, '### Push and merge request (`push-mr`)');
    assert.ok(push.length > 0, layout + ': push-mr section exists');
    assert.match(push, /Under `auto`, the same message applies: the forge merge stays the human gate\./, layout + ': auto keeps forge merge human');
    assert.match(push, /`glab mr create --repo https:\/\/<verified> --source-branch factory\/<id> --target-branch \{\{DEFAULT_BRANCH\}\}/, layout + ': GitLab target is the default branch (R12-3 repo)');
    assert.match(push, /`gh pr create --repo <verified> --base \{\{DEFAULT_BRANCH\}\}/, layout + ': GitHub base is the default branch (R12-3 repo)');
    assert.ok(!/push-mr[^\n]*\bgit merge\b/.test(push), layout + ': push-mr section runs no local merge');
  }
});

test('mode selector: push-mr and the local merge are exclusive, and the push-mr trace runs no local merge step', () => {
  const t = fixture('auto-push-mr.json');
  assert.equal(t.config.MERGE_MODE, 'push-mr');
  const steps = t.events.map((e) => e.step);
  assert.ok(steps.includes('push') && steps.includes('open-request'), 'push-mr runs the push and request steps');
  assert.ok(!steps.some((s) => /local-merge|merge-local|merge/.test(s)), 'push-mr runs no local merge step');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    const procedure = section(text, '## Merge procedure', '### Local merge');
    assert.match(procedure, /Mode selector \(exclusive\): `\{\{MERGE_MODE\}\}` exactly `push-mr` runs the push-mr procedure below, and never the local merge\./, layout + ': exclusive selector');
    assert.match(procedure, /Any other value runs the local merge below, the default, which never pushes\./, layout + ': local for any other value');
    assert.ok(!/after the local merge below/.test(text), layout + ': push-mr is never described as after the local merge');
    const push = section(text, '### Push and merge request (`push-mr`)', '## Status');
    assert.match(push, /Runs in place of the local merge, when `\{\{MERGE_MODE\}\}` is `push-mr`/, layout + ': push-mr replaces the local merge');
  }
});

// Round 3: one preview state machine, retirement on rework, plan-only baseline guards, lens recovery.
const stateTableRows = (text) => text.split('\n').filter((l) => /^\| `[a-z-]+` \|/.test(l));
const reworkSection = (text) => section(text, '## Rework', '## Functional QA');

test('retire (P3, N3): an accepted rework clears the active preview in one write, keeps history, and the new round never resumes the old attempt', () => {
  const t = fixture('preview-retire.json');
  assert.equal(t.before.substate, 'preview');
  const rework = t.events.find((e) => e.step === 'rework');
  assert.equal(rework.single_write, true, 'retirement and the new round are one write');
  for (const key of ['substate', 'previewStep', 'previewRunning', 'previewStackName', 'previewStackUrl', 'previewFailure', 'previewRollback']) {
    assert.ok(rework.retire.includes(key), 'retires ' + key);
  }
  assert.equal(rework.append.history.round, t.before.round, 'history keeps the retired round');
  assert.equal(rework.round, t.before.round + 1, 'the rework starts a new round');
  assert.equal(rework.stage, 'build');
  const start = t.events.find((e) => e.step === 'start');
  assert.equal(start.resume, 'build', 'start resumes the new round as a build, not the retired preview');
  const approve = t.events.find((e) => e.step === 'approve-attempt');
  assert.equal(approve.allowed, false, 'approve cannot accept the retired attempt');
  assert.notEqual(t.before.previewRound, rework.round, 'the attempt round differs from the active round');
  for (const layout of LAYOUTS) {
    const r = reworkSection(skill(layout));
    assert.match(r, /retire the active preview attempt in the same write: clear `substate` and every `preview\*` field except `previewHistory` \(`previewCommit` included\)/, layout + ': rework text retires');
    assert.match(r, /append `\{round, previewCommit, previewRunning\}` to `previewHistory`/, layout + ': history appended');
  }
});

test('state table entry points (P3): eligibility re-checks from the pinned SHA and approve is refused there; ready is the only approvable step', () => {
  for (const layout of LAYOUTS) {
    const rows = stateTableRows(skill(layout));
    const elig = rows.find((l) => l.startsWith('| `eligibility` |'));
    assert.match(elig, /Fresh entry from an `APPROVE` only: re-run \(a\) to \(c\) from the pinned SHA, then the preparation check; a moved tip restarts reviews and eligibility\. An interrupted or failed attempt, including a collision refusal, stops and reports/, layout + ': eligibility runs only on fresh entry (R17-2)');
    assert.match(elig, /\| Refused \|/, layout + ': eligibility approve refused');
    const approvable = rows.filter((l) => /Pass \(Outcomes\)/.test(l));
    assert.equal(approvable.length, 1, layout + ': exactly one approvable step');
    assert.ok(approvable[0].startsWith('| `ready` |'), layout + ': the approvable step is ready');
  }
});

test('plan-only stale spec (P12): a plan-only job never offers or copies spec.md, even when a stale one is present', () => {
  const t = fixture('plan-only-stale-spec.json');
  assert.equal(t.job.spec_route, 'plan-only');
  assert.ok(t.feature_folder.some((f) => f.startsWith('spec.md')), 'the stale spec.md is present');
  const cand = t.events.find((e) => e.step === 'baseline-candidates');
  assert.ok(!cand.offered.includes('spec.md') && cand.excluded.includes('spec.md'), 'spec.md is not a baseline candidate');
  const sync = t.events.find((e) => e.step === 'rework-doc-sync');
  assert.ok(!sync.copies.includes('spec.md') && sync.copies_forbidden.includes('spec.md'), 'rework never copies spec.md');
  for (const e of t.events) {
    assert.ok(!(e.reads || []).includes('spec.md'), 'no step reads spec.md: ' + e.step);
  }
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /a plan-only job never offers `spec\.md`, even when a stale one is present/, layout + ': candidates guard');
    assert.match(text, /by `spec_route`, never by file existence/, layout + ': doc sync guard');
  }
});

test('missing lens (P1, S3): a malformed security reply twice is recorded BLOCKED; start reruns only security, keeps the valid code reply, and the approver waits for both', () => {
  const t = fixture('missing-lens.json');
  assert.equal(t.job.failed_stage, 'review');
  assert.equal(t.job.reviews.security, 'BLOCKED');
  assert.equal(t.job.reviews.code, 'PASS');
  const resume = t.events.find((e) => e.step === 'start');
  assert.deepEqual(resume.rerun, ['security'], 'only the missing lens reruns');
  assert.deepEqual(resume.keep, ['code'], 'the valid reply is kept');
  const gate = t.events.find((e) => e.step === 'approve-gate');
  assert.ok(gate.after.includes('review-security.md'), 'the approver runs after the lens is saved');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /record that lens as `BLOCKED` with its reason in `round-N\/review-<lens>\.md`/, layout + ': BLOCKED reason recorded');
    assert.match(text, /`failed_stage` `review`/, layout + ': failed_stage review');
  }
});

// Round 4: pinned review SHA, route retirement, pass classification, lens recovery, ordinary merge fields.
test('tip moved (K1, V9): lenses and approval stay bound to HEAD A; a moved tip never pins B, and the reviews rerun for B', () => {
  const t = fixture('tip-moved.json');
  const approve = t.events.find((e) => e.step === 'approve');
  assert.equal(approve.reviewedSha, t.job.reviewedSha, 'the decision is bound to the reviewed SHA');
  const entry = t.events.find((e) => e.step === 'preview-entry');
  assert.equal(entry.previewJobSha, approve.reviewedSha, 'preview copies the recorded SHA, not the tip');
  assert.equal(entry.matches, false);
  assert.equal(entry.preview, false, 'no merge while the tip differs');
  const again = t.events.find((e) => e.step === 'preview-entry-again');
  assert.equal(again.previewJobSha, again.branchTip, 'the rerun pins the new tip');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /At preview entry copy that recorded SHA to `previewJobSha`, not the current branch tip\./, layout + ': copy recorded SHA');
    assert.match(text, /If it is absent, or the tip differs, do not preview: rerun the applicable checks, lenses and approval for the new tip\./, layout + ': rerun on mismatch');
  }
});

test('route accepted from preview (K2, V5, W8): retirement is one write, round stays 1 through both plan gates, the interruption resumes the continuation, and round advances only on entering build', () => {
  const t = fixture('route-retire.json');
  const enter = t.events.find((e) => e.step === 'retire-and-enter-plan');
  assert.equal(enter.single_write, true, 'retire and enter plan in one write');
  assert.equal(enter.stage, 'plan');
  assert.equal(enter.round, t.before.round, 'round stays 1 on entering plan');
  assert.equal(enter.history.previewCommit, t.before.previewCommit, 'history keeps the retired merge');
  for (const e of t.events.filter((x) => ['plan-gate-confirm', 'interruption', 'start'].includes(x.step))) {
    assert.equal(e.round, t.before.round, 'round stays 1 at ' + e.step);
  }
  const start = t.events.find((e) => e.step === 'start');
  assert.equal(start.resume, 'routed continuation', 'resume the routed continuation, not the retired preview');
  const build = t.events.find((e) => e.step === 'enter-build');
  assert.equal(build.round, t.before.round + 1, 'round advances only on entering build');
  assert.equal(build.stage, 'build');
  const second = t.events.find((e) => e.step === 'merge-and-preview');
  assert.equal(second.previewBase, t.before.previewCommit, 'the next preview bases on the prior merge');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /When the operator accepts a spec or plan route from preview, save the old preview identity as history and retire its active state in the same job write that enters `spec` or `plan`./, layout + ': route acceptance retires');
  }
});

test('pass classification (K5, V3): a non-pass answer is a note, a bare approve on the same SHA writes the pass, and a crash after the pass reuses that block', () => {
  const t = fixture('preview-qa.json');
  const [first, second, , recovery] = t.events;
  assert.equal(first.classification, 'not a pass');
  assert.equal(first.writes_pass_block, false, 'the non-pass answer never writes the acceptance block');
  assert.equal(first.merged, false);
  assert.equal(second.classification, 'pass');
  assert.ok(second.written_before_merged, 'the pass block is written before merged');
  assert.equal(recovery.writes_new_block, false, 'recovery reuses the recorded pass');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /record the words under `## Preview QA note \(<previewRunning>\)`, which is never read as acceptance/, layout + ': note not acceptance');
    assert.match(text, /Reuse an existing block only if it contains a qualifying pass for this attempt and commit\./, layout + ': reuse only a qualifying pass');
  }
});

test('lens recovery (NEW1, V1): a rerun BLOCKED lens that returns CHANGES resumes at step 8; the approver runs only after every lens is PASS', () => {
  const t = fixture('lens-recovery.json');
  const verdicts = t.events.filter((e) => e.step === 'verdicts');
  assert.equal(verdicts[0].resume_at, 'step 8', 'CHANGES goes to the verdict gate');
  assert.equal(verdicts[0].approver_dispatched, false, 'the approver never runs on a CHANGES');
  assert.equal(verdicts[1].resume_at, 'step 9');
  assert.equal(verdicts[1].approver_dispatched, true, 'only an all-PASS round reaches the approver');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /resumes at Loop step 8\. Rerun only the approver when all lenses PASS and the decision is missing, invalid, or stale\./, layout + ': step 8 and approver rule');
  }
});

test('first-attempt ordinary conflict (K8): the parent and job tip are saved before the merge, the abort guard reads them, and mergeSha stays absent', () => {
  const t = fixture('merge-first-conflict.json');
  const idx = (step) => t.events.findIndex((e) => e.step === step);
  assert.ok(idx('save-before-merge') < idx('merge'), 'saved before the merge');
  const save = t.events[idx('save-before-merge')];
  assert.equal(t.events[idx('abort-guard')].checks.MERGE_HEAD, save.mergeJobTip, 'the guard compares MERGE_HEAD with the saved job tip');
  assert.equal(t.events[idx('abort-guard')].checks.HEAD, save.mergeParent, 'the guard compares HEAD with the saved parent');
  assert.equal(t.events[idx('state')].mergeSha, null, 'no mergeSha after a conflict');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /Persist `mergeParent` \(`PRE`\) and `mergeJobTip` \(the reviewed job SHA being merged\) in `job\.json` before the merge/, layout + ': saved before merge');
  }
});

// Round 5: missing lens with no decision (start and approve), bootstrap lifecycle baseline, batch resume, post-merge
// interruption, mechanical repair to D to preview, and the ready stack object.
test('missing lens and no decision (W1, G2): approve refuses and names the lens, start reruns only that lens, and the approver waits for all PASS', () => {
  const t = fixture('missing-lens-no-decision.json');
  const approve = t.events.find((e) => e.step === 'approve');
  assert.equal(approve.allowed, false);
  assert.deepEqual(approve.named, ['security'], 'approve names the missing lens first');
  assert.ok(approve.refused_for.includes('decision missing'), 'the missing decision is reported but not acted on');
  const start = t.events.find((e) => e.step === 'start');
  assert.deepEqual(start.rerun, ['security']);
  assert.deepEqual(start.keep, ['code']);
  assert.equal(start.approver_dispatched, false, 'no approver while a lens is unfinished');
  const approver = t.events.find((e) => e.step === 'approver');
  assert.equal(approver.dispatched, true, 'the approver runs once every lens is PASS');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Before any decision recovery or preview acceptance, refuse while a configured lens is missing or BLOCKED/, layout + ': approve names lenses first');
    assert.match(text, /Rerun only the approver when all lenses PASS and the decision is missing, invalid, or stale\./, layout + ': approver only after lenses');
  }
});

test('bootstrap lifecycle baseline (W5, NEW2): an unchanged command with a changed lifecycle script runs nothing until the operator approves', () => {
  const t = fixture('bootstrap-lifecycle.json');
  assert.equal(t.current.file_lines[0], t.baseline.file_lines[0], 'the command line is unchanged');
  assert.notEqual(t.current.lifecycle['package.json scripts.postinstall'], t.baseline.lifecycle['package.json scripts.postinstall']);
  const check = t.events.find((e) => e.step === 'rework-bootstrap-check');
  assert.equal(check.digest_match, false, 'the baseline digest changed');
  assert.deepEqual(check.runs, [], 'nothing runs before approval');
  const run = t.events.find((e) => e.step === 'bootstrap-run');
  assert.deepEqual(run.runs, ['npm ci']);
  const approved = t.events.findIndex((e) => e.step === 'operator-approval');
  assert.ok(approved < t.events.findIndex((e) => e.step === 'bootstrap-run'), 'approval precedes any run');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /If the baseline changed or cannot be determined, run nothing and stop for the operator's approval/, layout + ': stop on change');
    assert.match(text, /every project script, lifecycle hook, and lockfile those lines invoke/, layout + ': lifecycle covered');
  }
});



test('mechanical repair to D to eligible preview (G1): a repair runs D, and only the fresh PASS makes preview eligible, never a Skipped record', () => {
  const t = fixture('mechanical-repair.json');
  const d = t.events.find((e) => e.step === 'post-build-fit-check');
  assert.equal(d.checkpoint, 'D');
  assert.equal(d.verdict, 'PASS');
  const elig = t.events.find((e) => e.step === 'eligibility');
  assert.equal(elig.result, 'eligible');
  assert.equal(t.events.find((e) => e.step === 'preview-entry').merge, true);
  assert.equal(t.contrast[0].result, 'ineligible', 'a Skipped record is not eligible');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /run the post-build fit check for `U` before step 7 after every completed repair, mechanical ones included/, layout + ': D after every repair');
  }
});

test('ready write (G3): the ready write carries the verified stack as {name, url}, mirrored in the flat fields', () => {
  const t = fixture('ready-write.json');
  const w = t.write;
  assert.deepEqual(w.stack, { name: t.verified_target.name, url: t.verified_target.url }, 'stack is the verified target');
  assert.equal(w.previewStackName, w.stack.name);
  assert.equal(w.previewStackUrl, w.stack.url);
  assert.equal(w.previewRunning, t.verified_target.commit);
  assert.equal(w.previewStep, 'ready');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /`stack` `\{name, url\}` from the verified target \(mirrored as `previewStackName` and `previewStackUrl`\)/, layout + ': ready writes stack');
  }
});

// Round 6: moved tip before merge (Y1), batch rework refusal (Y4), ancestry before acceptance (Y5), ESCALATE on the
// ordinary and preview routes (Y6), pinned push-mr checkout (Y3), plan-only planner inputs (Y7), QA README (Y2).
test('moved tip before merge (Y1): no merge runs, both SHAs are reported, the attempt retires without changing a branch, and the new tip is checked again', () => {
  const t = fixture('moved-tip-before-merge.json');
  const pre = t.events.find((e) => e.step === 'merge-preconditions');
  assert.equal(pre.merge_run, false, 'no merge when the tip moved');
  assert.equal(pre.job_tip_equals_pinned, false);
  assert.deepEqual(t.events.find((e) => e.step === 'retire-attempt').branches_changed, [], 'neither branch changes');
  const rerun = t.events.find((e) => e.step === 'rerun-checks');
  assert.equal(rerun.previewJobSha, t.events.find((e) => e.step === 'tip-moved').job_tip, 'the new tip is checked, not the old one');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /If the tip moved, no merge runs: report both SHAs and restart reviews for the new tip\./, layout + ': moved tip: no merge, reviews restart');
    assert.match(text, /a moved tip restarts reviews and eligibility/, layout + ': no adoption of the old SHA');
  }
});

test('batch shared-step refusal (Y4, U7-1): rework and abandon of a member are refused while a shared step is pending or interrupted, and the verify, deploy, and health rows say so', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /While a shared merge, verify, deploy, health check, or rollback is pending or interrupted, refuse rework and abandon for every member and report the leader ID\./, layout + ': shared refusal');
    assert.match(text, /For a batch member, refuse while a shared merge, verify, deploy, health check, or rollback is pending \(see Batch\), before any stage write or cleanup, and report the leader ID\./, layout + ': abandon step 1');
    const rows = text.split('\n').filter((l) => /^\| `(verify|deploy|health)` \|/.test(l));
    assert.equal(rows.length, 3, layout + ': three shared-step rows');
    for (const r of rows) assert.match(r, /batch member: refused while a shared step is pending/, layout + ': rework cell refuses a batch member');
  }
});

test('ancestry before acceptance (Y5): a matching running SHA is refused when the default branch no longer reaches previewCommit; a later commit on top is accepted', () => {
  const t = fixture('pass-ancestry.json');
  const [reset, later] = t.cases;
  assert.equal(reset.running_matches, true, 'the running SHA matches');
  assert.equal(reset.is_ancestor, false);
  assert.equal(reset.accepted, false);
  assert.equal(reset.wrote.acceptance_block, false, 'no acceptance block');
  assert.equal(reset.wrote.merged, false, 'no merged write');
  assert.equal(reset.cleanup, false, 'refusal runs no cleanup');
  assert.equal(later.is_ancestor, true);
  assert.equal(later.accepted, true, 'later commits are allowed');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /verify ancestry: `git merge-base --is-ancestor <previewCommit> \{\{DEFAULT_BRANCH\}\}` must succeed \(later commits and later batch members are allowed\)/, layout + ': ancestry check');
  }
});

test('ESCALATE on the ordinary and preview routes (Y6): an explicit operator answer is accepted on the ordinary route after the gates, and refused on the preview route', () => {
  const t = fixture('escalate-accept.json');
  const ordinary = t.cases.find((c) => !c.preview);
  const preview = t.cases.find((c) => c.preview);
  assert.equal(ordinary.accepted, true, 'accepted on the ordinary route');
  assert.equal(ordinary.published, true);
  assert.equal(preview.accepted, false, 'refused on the preview route');
  assert.equal(preview.stage, 'needs-human');
  assert.equal(preview.merged, false);
  assert.match(preview.eligibility_failure, /CHANGES, not PASS/);
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /on the ordinary route, approve publishes only with that explicit answer once every other gate passes/, layout + ': ordinary ESCALATE rule');
    assert.match(text, /A preview refuses it, because preview eligibility requires every lens PASS/, layout + ': preview refuses');
    assert.match(text, /A completed `VERDICT: CHANGES` lens is not unavailable/, layout + ': CHANGES is not unavailable');
  }
});

test('push-mr pinned checkout (Y3): with HEAD at B and the branch and reviewedSha at A, neither MR creation nor MR update runs a test, pushes, or records green evidence', () => {
  const t = fixture('push-mr-pinned.json');
  assert.notEqual(t.build_location.HEAD, t.job.reviewedSha, 'the build location HEAD differs from reviewedSha');
  assert.equal(t.build_location.branch_tip, t.job.reviewedSha);
  for (const c of t.cases) {
    assert.equal(c.preconditions.HEAD_equals_reviewed, false);
    assert.equal(c.test_run, false, c.name + ': no test');
    assert.equal(c.push, false, c.name + ': no push');
    assert.equal(c.green_evidence, null, c.name + ': no green evidence');
  }
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /For both MR creation and MR update, first require the build location on `factory\/<id>`, its `HEAD` equal to `reviewedSha`, and its tracked tree and index clean\. Otherwise run no test, push nothing, and record no green evidence\./, layout + ': pinned checkout first');
    assert.match(skill(layout), /`HEAD` must still equal `reviewedSha` after the tests\./, layout + ': HEAD after the test');
  }
});

test('plan-only planner inputs (Y7): the planner dispatch omits spec.md and its brief reads only the plan, tasks, and intake, in both layouts', () => {
  const t = fixture('plan-only-stale-spec.json');
  const planner = t.events.find((e) => e.step === 'planner');
  assert.equal(planner.paths_block_spec_md, 'omitted', 'the dispatch omits spec.md');
  assert.ok(!planner.brief_inputs.includes('spec.md'), 'the brief does not list spec.md');
  assert.ok(!planner.reads.includes('spec.md'), 'the planner does not read spec.md');
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /On a plan-only route the paths block omits `spec\.md` even when a stale one exists, and the planner never reads it\./, layout + ': dispatch omits');
    const brief = read(`${layout}/.agents/skills/factory/roles/spec.md`);
    assert.match(brief, /on plan-only, an existing `spec\.md` is ignored and never read/, layout + ': brief ignores spec.md');
  }
});

test('QA README (Y2): outside preview, blocking Not verified items and failed checks print first; only the non-gating suggested checks use the suggested line', () => {
  for (const layout of LAYOUTS) {
    const readme = read(`${layout}/factory/README.md`);
    assert.match(readme, /Outside preview, the orchestrator prints blocking `Not verified` items and failed, not-run, or stale automated checks first\./, layout + ': blocking first');
    assert.match(readme, /Only `## Not covered by automated tests` items appear under `Suggested checks before \/factory approve — not a gate`\./, layout + ': suggested line limited');
    assert.match(readme, /At preview `ready`, use the per-job handoff instead\./, layout + ': preview handoff');
    assert.ok(!/reviewers' `Not verified` items under the line/.test(readme), layout + ': old sentence gone');
  }
});


test('MR finish target (U7-2, S7-3): one forge read carries the target branch; a missing or different target leaves the job unresolved with no cleanup or ticket transition', () => {
  const t = fixture('mr-finish-target.json');
  for (const c of t.cases.filter((x) => !x.verified)) {
    assert.equal(c.cleanup, false, c.name + ': no cleanup');
    assert.equal(c.ticket_done, false, c.name + ': no ticket transition');
    assert.equal(c.merged_written, false, c.name + ': no merged write');
    assert.equal(c.report, 'forge merged; Factory verification does not match');
  }
  const ok = t.cases.find((x) => x.verified);
  assert.equal(ok.read.baseRefName, t.default_branch, 'the proceeding case targets the default branch');
  assert.equal(ok.merged_written, true);
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /read the request's state in one forge read: `gh pr view <mr> --json state,headRefOid,baseRefName,mergeCommit`/, layout + ': one forge read');
    assert.match(text, /the target branch \(`baseRefName`, or GitLab `target_branch`\) to equal `\{\{DEFAULT_BRANCH\}\}`/, layout + ': target equals default');
    assert.match(text, /run no cleanup, make no ticket transition, and leave the job unresolved\./, layout + ': unresolved');
    assert.match(text, /Reuse that source SHA for the local branch cleanup check; do not query the PR again\./, layout + ': reuse SHA');
  }
});

test('push-mr test selection (C7-1): the monorepo selects changed paths from the default-branch diff to reviewedSha, runs the dependent workspace, and stops the push when the base cannot be resolved', () => {
  const t = fixture('push-mr-test-selection.json');
  const select = t.events.find((e) => e.step === 'select-paths');
  assert.equal(select.command, `git diff --name-only ${t.config.DEFAULT_BRANCH}...${t.job.reviewedSha}`);
  assert.equal(select.pre_used, false, 'PRE is never used under push-mr');
  const run = t.events.find((e) => e.step === 'run-tests');
  assert.ok(run.commands.includes(t.workspaces['apps/web'].test), 'the dependent workspace runs');
  assert.equal(run.root_test_run, false, 'no root test command in the fixture');
  const unresolved = t.unresolved_base.events.find((e) => e.step === 'push');
  assert.equal(unresolved.ran, false, 'an unresolved base pushes nothing');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /with the changed paths taken from `git diff --name-only \{\{DEFAULT_BRANCH\}\}\.\.\.<reviewedSha>` in place of `\$PRE HEAD`/, layout + ': base diff');
    assert.match(text, /If that base cannot be resolved, stop before any push\./, layout + ': unresolved stops push');
  }
});

test('rollback reset guard (S7-2): a pending operation, a dirty tree, or a restore collision restores nothing and keeps the backups; a failed reset is incomplete; the reset never uses --hard', () => {
  const t = fixture('batch-rollback-guard.json');
  for (const c of t.cases) {
    assert.equal(c.reset === true, false, c.name + ': no reset when the guard fails or the reset fails');
    assert.equal(c.restore, false, c.name + ': nothing restored');
    assert.equal(c.backups_kept, true, c.name + ': backups kept');
    assert.equal(c.previewRollback, 'incomplete', c.name + ': incomplete');
  }
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Reset with `git reset --keep <PRE_BATCH>` \(never `--hard`\) only when the default branch is checked out, no operation is in progress, the tracked tree and index are clean/, layout + ': keep not hard');
    assert.match(text, /otherwise stop and report\. \(3\) Restore the set-aside paths under the restore check\./, layout + ': stop and report, then the restore check');
  }
});

test('route-aware docs commit (FT7-1, R8-2, FT8-1): plan-only stages only intended plan and task paths with per-path adds, a keyed rename moves only plan and tasks, the MR diff excludes both spec paths, refusals keep the index, and a tracked tasks deletion is committed', () => {
  const t = fixture('plan-only-stale-spec.json');
  const docs = t.docs_commit;
  assert.deepEqual(docs.staged, ['docs/features/PROJ-9-export/plan.md'], 'a small plan stages only plan.md');
  assert.ok(!docs.staged.some((p) => /tasks\.md$/.test(p)), 'a never-created tasks.md is never named');
  assert.ok(docs.staged_commands.every((c) => /^git add -A -- /.test(c) || /^git add -- /.test(c)), 'per-path adds');
  assert.ok(docs.left_untouched.some((p) => p.startsWith('docs/features/PROJ-9-export/spec.md')), 'the stale spec is left untouched');
  assert.ok(!docs.mr_diff.some((p) => /spec\.md$/.test(p)), 'the MR diff excludes the spec');
  assert.equal(docs.commit, true);

  const k = t.keyed_rename;
  assert.equal(k.moves.length, 1, 'only plan.md moves');
  assert.equal(k.moves[0].from, 'docs/features/export/plan.md');
  assert.equal(k.moves[0].git, 'mv', 'per-file filesystem move in the main checkout (R11-1)');
  assert.ok(k.left_in_old_folder.includes('docs/features/export/spec.md'), 'the tracked stale spec stays in the old folder');
  assert.ok(!k.mr_diff.some((p) => /spec\.md$/.test(p)), 'the MR diff excludes the old spec path');
  assert.ok(!k.mr_diff.some((p) => /PROJ-9-export\/spec\.md$/.test(p)), 'the MR diff excludes the new spec path');

  const refused = t.refusals;
  assert.ok(refused.some((r) => r.already_staged.endsWith('/spec.md')), 'the same-folder spec case is covered');
  for (const r of refused) {
    assert.equal(r.refused, true, r.name);
    assert.equal(r.commit, false, r.name + ': nothing committed');
    assert.equal(r.index_preserved, true, r.name + ': index preserved');
    assert.equal(r.unstaged, false, r.name + ': never unstaged');
  }

  const rw = t.rework_tracked_tasks_removed;
  assert.equal(rw.intended_deletion, true);
  assert.ok(rw.staged.some((p) => /tasks\.md \(deletion\)$/.test(p)), 'the tracked tasks deletion is staged');
  assert.equal(rw.deletion_committed, true);

  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /stage each intended path with its own `git add -A -- <exact-path>`, only if it exists or is tracked with an intended deletion/, layout + ': per-path staging');
    assert.match(text, /never name a tasks\.md that was never created/, layout + ': no never-created tasks');
    assert.match(text, /A stale `spec\.md`, including one in the job's own folder or tracked, is never staged or removed\./, layout + ': spec never staged');
    assert.match(text, /on any other staged path, refuse, commit nothing, report the path, and never unstage it\./, layout + ': refuse unrelated');
    assert.match(text, /On plan-only, create the keyed folder and move only `plan\.md` and the job.s `tasks\.md` when present; leave `spec\.md` and every other path in the original folder\./, layout + ': per-file rename');
  }
});

// Round 9: recheck before commit (R9-1), spec keyed
// rename (R9-5), plan-only set-aside (R9-6), and the rework docs wording (R9-4).
test('docs commit recheck (R9-1): a path staged between the check and the commit stays staged and is absent from the commit; an empty changed set skips the commit', () => {
  const t = fixture('docs-commit-recheck.json');
  const recheck = t.events.find((e) => e.step === 'recheck-index');
  assert.equal(recheck.allowed_only, false, 'the recheck sees the unrelated path');
  assert.equal(recheck.action, 'refuse, commit nothing');
  const race = t.race_case;
  assert.deepEqual(t.commit_collect.changed_paths, race.changed_paths, 'the commit names only the changed doc paths');
  assert.ok(race.commit_contains.every((p) => race.changed_paths.includes(p)));
  for (const p of race.commit_absent) assert.ok(!race.commit_contains.includes(p), p + ' is absent from the commit');
  assert.deepEqual(race.staged_remaining, race.staged_between_check_and_commit, 'the path stays staged');
  assert.equal(t.empty_case.commit, false, 'an empty set skips the commit');
  assert.match(t.commit_collect.command, /^git --literal-pathspecs commit --only -m "docs: feature docs for 009-export" -- /, 'exact-pathspec commit');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /`git --literal-pathspecs commit --only -m "docs: feature docs for <id>" -- <changed-paths>`\. Skip when the set is empty\./, layout + ': only-commit');
    assert.match(text, /A path staged between the check and the commit stays staged and is absent from the commit\./, layout + ': race rule');
  }
});



test('spec-route keyed rename (R9-5): the staged deletions under the old folder and the old qa.md moved by Doc sync pass both index checks, and the commit includes them', () => {
  const t = fixture('spec-keyed-rename.json');
  assert.equal(t.route, 'spec');
  for (const c of t.index_checks) assert.equal(c.passed, true, c.name + ' passes');
  assert.ok(t.staged_for_commit.includes('docs/features/export/qa.md (deletion)'), 'the old qa.md deletion is staged');
  assert.ok(t.moves.some((m) => m.from === 'docs/features/export/qa.md' && m.by === 'Doc sync'), 'Doc sync moves the old qa.md');
  assert.equal(t.commit.changed_paths_include_old_qa, true);
  assert.equal(t.commit.committed, true);
  assert.match(t.commit.command, /^git --literal-pathspecs commit --only/, 'the spec route uses the exact-pathspec commit');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /allow paths under the current `<feature_dir>` and, for a recorded keyed rename, the corresponding staged deletions under the old folder, including the old `qa\.md` moved by Doc sync\./, layout + ': spec allowlist');
    assert.match(text, /Apply this same allowed set to both index checks\./, layout + ': same set both checks');
  }
});

test('plan-only set-aside (R9-6): P holds only the job plan and task paths, the folder is never a pathspec on plan-only, and spec.md stays in place', () => {
  const t = fixture('plan-only-stale-spec.json');
  const sa = t.setaside;
  assert.ok(sa.P.every((p) => /\/(plan|tasks)\.md$/.test(p)), 'P holds only plan and task paths');
  assert.equal(sa.pathspec_folder_on_plan_only, false, 'the folder is not a pathspec');
  assert.ok(sa.spec_left_in_place.startsWith('docs/features/PROJ-9-export/spec.md'), 'spec.md stays in place');
  assert.equal(sa.spec_moved, false);
  assert.equal(sa.spec_cleaned, false);
  assert.ok(sa.copies_to_main_copies.every((p) => !p.endsWith('spec.md')), 'no spec copy in main-copies');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /On plan-only, `P` contains only the exact main-checkout plan and task paths belonging to this job, including their old paths for a recorded rename\./, layout + ': P on plan-only');
    assert.match(text, /never pass either folder as a pathspec on plan-only\. Leave `spec\.md` and unrelated files in place\./, layout + ': no folder pathspec');
  }
});

test('rework docs wording (R9-4): rework hands the docs commit to its route-specific removal rule, and on plan-only the old folder and unmoved paths stay untouched', () => {
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /Then run Feature docs commit using its route-specific removal rule; on plan-only, leave the old folder and every unmoved path untouched\./, layout + ': rework route-specific');
  }
});

// Round 10: persisted-record recovery (R10-1), temp-repo set-aside and staged refusal (R10-2, S10-1), nonstandard
// doc rename (R10-3), and the flags on the merge and push commands (S10-2, S10-3).
const os = require('os');
const { spawnSync } = require('child_process');

function git(cwd, args) {
  return spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8' });
}
function write(dir, rel, body) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}

// Temp repo for the plan-only keyed rename: main holds the old plan and a stale spec; the job branch renamed the plan.
function renameRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r10-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, 'docs/features/export/plan.md', 'plan v1\n');
  write(dir, 'docs/features/export/spec.md', 'stale spec\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'main']);
  git(dir, ['switch', '-q', '-c', 'factory/001-export']);
  write(dir, 'docs/features/PROJ-9-export/plan.md', 'plan v1\n');
  git(dir, ['rm', '-q', 'docs/features/export/plan.md']);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'rename plan']);
  git(dir, ['switch', '-q', 'main']);
  return dir;
}

test('set-aside on a tracked keyed rename (R10-2): the default-branch plan is restored by its exact path, the stale spec is untouched, and a naive full-list checkout would fail', () => {
  const dir = renameRepo();
  // The main checkout holds an untracked copy of the job's keyed plan, as the feature docs sync leaves it.
  write(dir, 'docs/features/PROJ-9-export/plan.md', 'plan v2 (main copy)\n');
  const P = ['docs/features/PROJ-9-export/plan.md', 'docs/features/export/plan.md'];
  // Naive form: checkout of the full candidate list fails because the keyed path is not on the default branch.
  const naive = git(dir, ['checkout', '--', ...P]);
  assert.notEqual(naive.status, 0, 'the full-list checkout is refused');
  // Procedure: copy untracked copies, reset, clean, then restore only the exact default-branch paths.
  const untracked = git(dir, ['status', '--porcelain', '--untracked-files=all', '--', ...P]).stdout.split('\n').filter((l) => l.startsWith('?? ')).map((l) => l.slice(3));
  for (const u of untracked) {
    fs.mkdirSync(path.join(dir, 'factory/jobs/001-export/main-copies', path.dirname(u)), { recursive: true });
    fs.copyFileSync(path.join(dir, u), path.join(dir, 'factory/jobs/001-export/main-copies', u));
  }
  git(dir, ['reset', '-q', '--', ...P]);
  git(dir, ['clean', '-fdq', '--', ...P]);
  const listed = git(dir, ['ls-tree', '-r', '-z', '--name-only', 'main', '--', ...P]).stdout.split('\0').filter(Boolean);
  assert.deepEqual(listed, ['docs/features/export/plan.md'], 'only the default-branch path is listed');
  for (const p of listed) {
    const r = git(dir, ['--literal-pathspecs', 'checkout', '--', p]);
    assert.equal(r.status, 0, 'restore by exact path');
  }
  assert.equal(fs.readFileSync(path.join(dir, 'docs/features/export/plan.md'), 'utf8'), 'plan v1\n', 'the old plan is restored');
  assert.equal(fs.readFileSync(path.join(dir, 'docs/features/export/spec.md'), 'utf8'), 'stale spec\n', 'the stale spec is untouched');
  assert.equal(fs.existsSync(path.join(dir, 'docs/features/PROJ-9-export/plan.md')), false, 'the untracked keyed copy was moved aside');
  assert.equal(fs.readFileSync(path.join(dir, 'factory/jobs/001-export/main-copies/docs/features/PROJ-9-export/plan.md'), 'utf8'), 'plan v2 (main copy)\n', 'the copy is kept in main-copies');
  assert.equal(git(dir, ['status', '--porcelain', '--', 'docs/features/export/spec.md']).stdout.trim(), '', 'spec.md shows no change');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('staged-path refusal (S10-1): a path already staged under P refuses the set-aside, and the index and working tree stay as they were', () => {
  const dir = renameRepo();
  write(dir, 'docs/features/export/plan.md', 'plan edited by hand\n');
  git(dir, ['add', 'docs/features/export/plan.md']);
  const P = ['docs/features/PROJ-9-export/plan.md', 'docs/features/export/plan.md'];
  const staged = git(dir, ['diff', '--cached', '--name-only', '--', ...P]).stdout.split('\n').filter(Boolean);
  assert.ok(staged.length > 0, 'the gate sees a staged path under P');
  // The gate refuses: nothing is copied, reset, cleaned, or checked out.
  assert.equal(fs.readFileSync(path.join(dir, 'docs/features/export/plan.md'), 'utf8'), 'plan edited by hand\n', 'working tree untouched');
  assert.deepEqual(git(dir, ['diff', '--cached', '--name-only', '--', ...P]).stdout.split('\n').filter(Boolean), staged, 'index untouched');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('tracked nonstandard doc (R10-3): design.md with no keyed counterpart stops the docs commit and is named; the deletion is never committed without its counterpart', () => {
  const t = fixture('rename-nonstandard-doc.json');
  const check = t.counterpart_check;
  assert.equal(check.keyed_counterpart, null);
  assert.equal(check.result, 'stop');
  assert.equal(check.named, t.tracked_before.find((p) => p.endsWith('design.md')), 'the missing counterpart is named');
  assert.equal(check.deletion_committed, false, 'the deletion is not committed');
  assert.equal(check.commit, false);
  const fixed = t.counterpart_fixed;
  assert.equal(fixed.keyed_counterpart, fixed.copied_to, 'the copy becomes the keyed counterpart');
  assert.equal(fixed.deletion_committed, true);
  assert.equal(fixed.commit, true);
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /before removing the old unkeyed folder when the feature folder was renamed to its keyed name, verify every tracked old path has a keyed counterpart in the build location; copy renamed files or stop naming the missing counterpart; never commit that deletion\./, layout + ': counterpart check');
  }
});

test('flags on the merge and push commands (S10-2, S10-3): both merges refuse ignored-path overwrite, the push disables tags and submodules and names the one ref, and git accepts the merge flag', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /`git merge --no-ff --no-overwrite-ignore <previewJobSha> -m "Merge factory\/<id> \(preview\)"`/, layout + ': preview merge flags');
    assert.match(text, /4\. `git merge --no-ff --no-overwrite-ignore <reviewedSha> -m "Merge factory\/<id>"`/, layout + ': ordinary merge flags');
    assert.match(text, /An ignored-path collision stops the merge: preserve the file, report its path, and never clean and retry\./, layout + ': collision stops');
    assert.match(text, /push --no-follow-tags --recurse-submodules=no origin <reviewedSha>:refs\/heads\/factory\/<id>/, layout + ': push flags');
    assert.match(text, /Any other ref or repository needs separate authorization\./, layout + ': push scope');
  }
  const help = git(os.tmpdir(), ['merge', '-h']);
  assert.match(`${help.stdout}${help.stderr}`, /overwrite-ignore/, 'the installed git knows --no-overwrite-ignore');
});

// Round 11: the filesystem rename in the main checkout (R11-1), the pre-merge collision check and the in-place
// switch flag (R11-2), and the single push destination (R11-3).
test('tracked unkeyed rename (R11-1): a filesystem move in the main checkout leaves the index clean, the set-aside restores the default-branch plan, and a git mv control is refused', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /5\. \*\*Rename\.\*\* If the folder had no key, the destination is `<parent>\/<KEY>-<slug>\/`/, layout + ': rename step');
    assert.match(text, /Use filesystem `mv`, not `git mv`, in the main checkout so tracking leaves its index untouched\./, layout + ': filesystem move');
    assert.doesNotMatch(text, /Use `git mv` when git tracks the folder/, layout + ': old git mv wording gone');
  }
  const P = ['docs/features/PROJ-9-export/plan.md', 'docs/features/export/plan.md'];

  // Control: the old procedure's git mv stages both sides in the main index, so the set-aside gate refuses it.
  const control = renameRepo();
  fs.mkdirSync(path.join(control, 'docs/features/PROJ-9-export'), { recursive: true });
  git(control, ['mv', 'docs/features/export/plan.md', 'docs/features/PROJ-9-export/plan.md']);
  assert.notEqual(git(control, ['diff', '--cached', '--name-only', '--', ...P]).stdout.trim(), '', 'the git mv control stages a path under P');
  fs.rmSync(control, { recursive: true, force: true });

  const dir = renameRepo();
  const oldPlan = path.join(dir, 'docs/features/export/plan.md');
  const keyedPlan = path.join(dir, 'docs/features/PROJ-9-export/plan.md');
  // The rename as the procedure runs it: a filesystem move in the main checkout.
  fs.mkdirSync(path.dirname(keyedPlan), { recursive: true });
  fs.renameSync(oldPlan, keyedPlan);
  assert.equal(fs.existsSync(oldPlan), false, 'the old plan is actually absent before the set-aside');
  assert.equal(git(dir, ['diff', '--cached', '--name-only']).stdout, '', 'the main index is clean after the rename');

  // Set-aside: the gate passes, untracked copies go to main-copies, then the default-branch paths are restored by exact path.
  assert.equal(git(dir, ['diff', '--cached', '--name-only', '--', ...P]).stdout, '', 'the set-aside gate passes');
  const untracked = git(dir, ['status', '--porcelain', '--untracked-files=all', '--', ...P]).stdout.split('\n').filter((l) => l.startsWith('?? ')).map((l) => l.slice(3));
  assert.deepEqual(untracked, ['docs/features/PROJ-9-export/plan.md'], 'only the keyed plan is untracked');
  for (const u of untracked) {
    fs.mkdirSync(path.join(dir, 'factory/jobs/001-export/main-copies', path.dirname(u)), { recursive: true });
    fs.copyFileSync(path.join(dir, u), path.join(dir, 'factory/jobs/001-export/main-copies', u));
  }
  assert.equal(git(dir, ['reset', '-q', '--', ...P]).status, 0, 'reset succeeds');
  assert.equal(git(dir, ['clean', '-fdq', '--', ...P]).status, 0, 'clean succeeds');
  const listed = git(dir, ['ls-tree', '-r', '-z', '--name-only', 'main', '--', ...P]).stdout.split('\0').filter(Boolean);
  assert.deepEqual(listed, ['docs/features/export/plan.md'], 'only the default-branch path is listed');
  for (const p of listed) assert.equal(git(dir, ['--literal-pathspecs', 'checkout', '--', p]).status, 0, 'restore by exact path succeeds');
  assert.equal(fs.readFileSync(oldPlan, 'utf8'), 'plan v1\n', 'the default-branch plan is restored');
  assert.equal(fs.existsSync(keyedPlan), false, 'the keyed copy is moved aside');
  assert.equal(fs.readFileSync(path.join(dir, 'factory/jobs/001-export/main-copies/docs/features/PROJ-9-export/plan.md'), 'utf8'), 'plan v1\n', 'the copy is kept');

  // The ordinary merge of the job branch then runs on a clean index and carries the rename.
  const merge = git(dir, ['merge', '--no-ff', '--no-overwrite-ignore', 'factory/001-export', '-m', 'Merge factory/001-export']);
  assert.equal(merge.status, 0, merge.stderr);
  assert.equal(fs.readFileSync(keyedPlan, 'utf8'), 'plan v1\n', 'the job rename arrives');
  assert.equal(fs.existsSync(oldPlan), false, 'the merge removes the old plan');
  fs.rmSync(dir, { recursive: true, force: true });
});

// The pre-merge collision check from SKILL.md (Local merge). The merged tree comes from merge-tree; its changed paths
// against B and the ignored untracked files are read NUL-delimited, and their parent directories are compared in both
// directions under the checkout's name rule. A conflict, a non-zero exit, or any output other than one tree ID is
// indeterminate, never a pass.
//
// Name rule (R14-1): core.ignorecase true means folded. Otherwise the rule comes from the checkout directories that
// contain the compared components, never from the Git metadata directory. probe(absDir) returns 'fold', 'exact', or null
// (indeterminate). Tests inject probe; the real probe is probeDirectory.

// Exclusive creation of a unique entry in the checkout directory, then a lookup of its alternate-case spelling. A match
// of dev and ino folds; a confirmed not-found result is exact. Never truncates or removes a pre-existing entry: the
// 'wx' flag refuses an existing name, and only the entry this probe created is removed (after its identity is re-checked).
function probeDirectory(absDir) {
  let made = null;
  for (let attempt = 0; attempt < 5 && made === null; attempt += 1) {
    const name = '.factory-case-probe-' + crypto.randomBytes(8).toString('hex');
    const file = path.join(absDir, name);
    try {
      const fd = fs.openSync(file, 'wx');
      const st = fs.fstatSync(fd);
      fs.closeSync(fd);
      made = { name, file, dev: st.dev, ino: st.ino };
    } catch (err) {
      if (err.code !== 'EEXIST') return null;
    }
  }
  if (made === null) return null;
  const alt = [...made.name].map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())).join('');
  let verdict;
  try {
    const st = fs.statSync(path.join(absDir, alt));
    verdict = st.dev === made.dev && st.ino === made.ino ? 'fold' : null;
  } catch (err) {
    verdict = err.code === 'ENOENT' ? 'exact' : null;
  }
  try {
    const own = fs.lstatSync(made.file);
    if (own.dev !== made.dev || own.ino !== made.ino) return null;
    fs.unlinkSync(made.file);
  } catch {
    return null;
  }
  return verdict;
}

// The checkout's rule for the compared paths (R15-1). core.ignorecase true folds without probing. Otherwise every
// containing directory of every component is probed, from the checkout root down: the directory that holds each
// component, when it exists as a directory. A confirmed absence (ENOENT) ends that branch, since nothing sits below it;
// a file ends it too. Any other lookup error is indeterminate. Any folding directory makes the rule fold; any
// indeterminate probe makes the whole rule indeterminate (null).
function checkoutRule(dir, paths, probe) {
  const cfg = git(dir, ['config', '--get', 'core.ignorecase']);
  if (cfg.status === 0 && cfg.stdout.trim() === 'true') return 'fold';
  const kind = (d) => {
    try {
      return fs.statSync(d).isDirectory() ? 'dir' : 'file';
    } catch (err) {
      return err.code === 'ENOENT' ? 'absent' : 'error';
    }
  };
  const dirs = new Set([dir]);
  for (const p of paths) {
    const parts = p.split('/');
    let d = dir;
    for (let i = 0; i < parts.length; i += 1) {
      const k = kind(d);
      if (k === 'error') return null;
      if (k !== 'dir') break;
      dirs.add(d);
      d = path.join(d, parts[i]);
    }
  }
  let rule = 'exact';
  for (const d of dirs) {
    const verdict = probe(d);
    if (verdict === null) return null;
    if (verdict === 'fold') rule = 'fold';
  }
  return rule;
}

function collisionCheck(dir, base, sha, opts = {}) {
  const indeterminate = { ok: false, indeterminate: true, collisions: [] };
  const mt = git(dir, ['merge-tree', '--write-tree', base, sha]);
  const lines = mt.stdout.split('\n').filter(Boolean);
  if (mt.status !== 0 || lines.length !== 1 || !/^([0-9a-f]{40}|[0-9a-f]{64})$/.test(lines[0])) return indeterminate;
  const nul = (args) => {
    const r = git(dir, args);
    return r.status === 0 ? r.stdout.split('\0').filter(Boolean) : null;
  };
  const changed = nul(['diff-tree', '-r', '-z', '--no-renames', '--name-only', base, lines[0]]);
  const ignored = nul(['ls-files', '-z', '--others', '--ignored', '--exclude-standard']);
  if (!changed || !ignored) return indeterminate;
  const rule = checkoutRule(dir, [...changed, ...ignored], opts.probe || probeDirectory);
  if (rule === null) return indeterminate;
  const key = (p) => (rule === 'fold' ? p.toLowerCase() : p);
  const parents = (p) => {
    const out = [];
    for (let d = path.posix.dirname(p); d !== '.' && d !== '/'; d = path.posix.dirname(d)) out.push(d);
    return out;
  };
  const changedAndParents = new Set(changed.flatMap((p) => [p, ...parents(p)]).map(key));
  const ignoredParents = new Set(ignored.flatMap(parents).map(key));
  const collisions = [...new Set([
    ...ignored.filter((p) => changedAndParents.has(key(p))),
    ...changed.filter((p) => ignoredParents.has(key(p))),
  ])].sort();
  return { ok: collisions.length === 0, indeterminate: false, collisions, rule };
}

test('pre-merge collision check (R11-2): a divergent merge whose job tracks a path held by an ignored local file is refused before any merge; local bytes and HEAD stay unchanged', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /\*\*Pre-merge collision check\*\* \(local merge and preview merge\)/, layout + ': one shared check');
    assert.match(text, /git merge-tree --write-tree B S/, layout + ': merged tree (R12-2)');
    assert.match(text, /git diff-tree -r -z --no-renames --name-only B T/, layout + ': NUL-delimited changed paths (R12-1, R12-2)');
    assert.match(text, /git ls-files -z --others --ignored --exclude-standard/, layout + ': NUL-delimited ignored files (R12-1)');
    assert.match(text, /Split both lists on NUL and never parse quoted output\./, layout + ': NUL split (R12-1)');
    assert.match(text, /Any collision or indeterminate result: name the path, stop, and change nothing\./, layout + ': refuse and change nothing');
    assert.match(text, /`git merge --no-overwrite-ignore` does not stop an overwrite of an ignored file, so this check is required\./, layout + ': why the check exists');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r11-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, '.gitignore', 'config/local.json\n');
  write(dir, 'a.txt', 'base\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  git(dir, ['switch', '-q', '-c', 'factory/002-config']);
  write(dir, 'config/local.json', 'shared\n');
  git(dir, ['add', '-f', 'config/local.json']);
  git(dir, ['commit', '-q', '-m', 'job tracks config/local.json']);
  git(dir, ['switch', '-q', 'main']);
  // Main moves on, so the merge is a real three-way merge.
  write(dir, 'b.txt', 'main work\n');
  git(dir, ['add', 'b.txt']);
  git(dir, ['commit', '-q', '-m', 'B']);
  // The path the job tracks is occupied by an ignored local file.
  write(dir, 'config/local.json', 'LOCAL SECRET\n');
  const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();

  const check = collisionCheck(dir, 'main', 'factory/002-config');
  assert.equal(check.indeterminate, false, 'git answered');
  assert.equal(check.ok, false, 'the check detects the collision');
  assert.deepEqual(check.collisions, ['config/local.json']);
  // The procedure stops here, so no merge runs.
  assert.equal(fs.readFileSync(path.join(dir, 'config/local.json'), 'utf8'), 'LOCAL SECRET\n', 'local bytes unchanged');
  assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), headBefore, 'HEAD unchanged');

  // A divergent job with no collision passes the same check, so the check is not refusing everything.
  git(dir, ['switch', '-q', '-c', 'factory/003-docs', 'main']);
  write(dir, 'docs/notes.md', 'notes\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'docs']);
  git(dir, ['switch', '-q', 'main']);
  const clean = collisionCheck(dir, 'main', 'factory/003-docs');
  assert.equal(clean.ok, true, 'no collision passes');
  assert.deepEqual(clean.collisions, []);
  fs.rmSync(dir, { recursive: true, force: true });

  // Non-ASCII path (R12-1): default output quotes it, so the listing is NUL-delimited to read the parent as `local`.
  const utf = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r12-'));
  git(utf, ['init', '-q']);
  git(utf, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(utf, '.gitignore', 'local\n');
  write(utf, 'a.txt', 'base\n');
  git(utf, ['add', '-A']);
  git(utf, ['commit', '-q', '-m', 'A']);
  git(utf, ['switch', '-q', '-c', 'factory/005-utf']);
  write(utf, 'local/café.json', 'job\n');
  git(utf, ['add', '-f', 'local/café.json']);
  git(utf, ['commit', '-q', '-m', 'job adds local/café.json']);
  git(utf, ['switch', '-q', 'main']);
  write(utf, 'b.txt', 'main work\n');
  git(utf, ['add', 'b.txt']);
  git(utf, ['commit', '-q', '-m', 'B']);
  // An ignored regular file named `local` occupies the parent directory the job needs.
  write(utf, 'local', 'LOCAL SECRET\n');
  const utfHead = git(utf, ['rev-parse', 'HEAD']).stdout.trim();
  // Control: default output is one quoted string, so a newline-split parse would read the parent as `"local`.
  const quotedLine = git(utf, ['diff', '--no-renames', '--name-only', 'main...factory/005-utf']).stdout.trim();
  assert.ok(quotedLine.startsWith('"local/caf'), 'default output is quoted');
  const utfCheck = collisionCheck(utf, 'main', 'factory/005-utf');
  assert.equal(utfCheck.indeterminate, false, 'git answered');
  assert.equal(utfCheck.ok, false, 'the NUL-delimited check refuses the merge');
  assert.deepEqual(utfCheck.collisions, ['local']);
  // The merge is refused: the local bytes and HEAD stay unchanged.
  assert.equal(fs.readFileSync(path.join(utf, 'local'), 'utf8'), 'LOCAL SECRET\n', 'local bytes unchanged');
  assert.equal(git(utf, ['rev-parse', 'HEAD']).stdout.trim(), utfHead, 'HEAD unchanged');
  fs.rmSync(utf, { recursive: true, force: true });
});

test('directory-rename trace (R12-2): the check reads the merged tree, so a job file that lands under a renamed directory is seen, and an ignored file there is refused', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Run `git merge-tree --write-tree B S` \(Git 2\.38 or later\) under the repository's own configuration/, layout + ': merged tree');
    assert.match(text, /Exit status 0 with one tree ID gives `T`; any other result, including a conflict, is indeterminate\./, layout + ': conflict indeterminate');
    assert.match(text, /this includes a job file that the merge relocates under a renamed directory/, layout + ': relocated files');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r12-dir-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, '.gitignore', 'new/extra.json\n');
  for (const f of ['a', 'b', 'c']) write(dir, `old/${f}.txt`, `${f}\n`);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  git(dir, ['switch', '-q', '-c', 'factory/006-dir']);
  write(dir, 'old/extra.json', 'job\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'job adds old/extra.json']);
  git(dir, ['switch', '-q', 'main']);
  git(dir, ['mv', 'old', 'new']);
  git(dir, ['commit', '-q', '-m', 'B: rename old to new']);
  // Directory renames enabled for this repository, so the merge relocates the job file under new/.
  git(dir, ['config', 'merge.directoryRenames', 'true']);
  // An ignored local file sits at the relocated destination.
  write(dir, 'new/extra.json', 'LOCAL SECRET\n');
  const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  // Control: the job-path listing names only the old path, so it misses the destination.
  const oldListing = git(dir, ['diff', '--no-renames', '--name-only', 'main...factory/006-dir']).stdout.split('\n').filter(Boolean);
  assert.deepEqual(oldListing, ['old/extra.json'], 'the job-path listing misses new/');
  const check = collisionCheck(dir, 'main', 'factory/006-dir');
  assert.equal(check.indeterminate, false, 'the merged tree is read');
  assert.equal(check.ok, false, 'the relocated destination is refused');
  assert.deepEqual(check.collisions, ['new/extra.json']);
  assert.equal(fs.readFileSync(path.join(dir, 'new/extra.json'), 'utf8'), 'LOCAL SECRET\n', 'local bytes unchanged');
  assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), headBefore, 'HEAD unchanged');
  // Default configuration: the same merge is a directory-rename conflict, which is indeterminate and stops before merging.
  git(dir, ['config', '--unset', 'merge.directoryRenames']);
  const conflict = collisionCheck(dir, 'main', 'factory/006-dir');
  assert.equal(conflict.indeterminate, true, 'a conflict is indeterminate');
  assert.equal(conflict.ok, false, 'a conflict never passes');
  fs.rmSync(dir, { recursive: true, force: true });
});

// Round 13 (R13-1): name aliases. Each case puts an ignored local file and an incoming path under names that differ only
// in case, on a checkout whose name rule is case-insensitive (core.ignorecase true).
function aliasRepo(ignoredPath, incomingPath) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r13-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, '.gitignore', `${ignoredPath}\n`);
  write(dir, 'a.txt', 'base\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  git(dir, ['switch', '-q', '-c', 'factory/008-alias']);
  write(dir, incomingPath, 'job\n');
  git(dir, ['add', '-f', incomingPath]);
  git(dir, ['commit', '-q', '-m', 'job adds ' + incomingPath]);
  git(dir, ['switch', '-q', 'main']);
  write(dir, 'b.txt', 'main work\n');
  git(dir, ['add', 'b.txt']);
  git(dir, ['commit', '-q', '-m', 'B']);
  write(dir, ignoredPath, 'LOCAL SECRET\n');
  return dir;
}

test('case-variant aliases (R13-1): on a case-insensitive checkout a file alias, a parent-directory alias and a file-versus-directory alias are refused with the bytes and HEAD unchanged; on an exact checkout the same layout is not a collision', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Fold case when `core\.ignorecase` is true\./, layout + ': fold rule');
    assert.match(text, /create one uniquely named entry exclusively \(`wx`, never overwriting an existing entry\)/, layout + ': exclusive probe');
    assert.match(text, /only a confirmed not-found result is exact\./, layout + ': not-found is exact');
    assert.match(text, /Any other lookup, creation, or cleanup failure is indeterminate\./, layout + ': indeterminate');
  }
  const cases = [
    { name: 'file alias', ignored: 'config/local.json', incoming: 'config/Local.json', collisions: ['config/local.json'] },
    { name: 'parent-directory alias', ignored: 'Config/local.json', incoming: 'config/local.json', collisions: ['Config/local.json'] },
    { name: 'file-versus-directory alias', ignored: 'Local', incoming: 'local/x.json', collisions: ['Local'] },
  ];
  for (const c of cases) {
    const dir = aliasRepo(c.ignored, c.incoming);
    git(dir, ['config', 'core.ignorecase', 'true']);
    const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
    const folded = collisionCheck(dir, 'main', 'factory/008-alias');
    assert.equal(folded.indeterminate, false, c.name + ': git answered');
    assert.equal(folded.rule, 'fold', c.name + ': case-insensitive rule');
    assert.equal(folded.ok, false, c.name + ': refused');
    assert.deepEqual(folded.collisions, c.collisions, c.name + ': the ignored path is named');
    assert.equal(fs.readFileSync(path.join(dir, c.ignored), 'utf8'), 'LOCAL SECRET\n', c.name + ': ignored bytes unchanged');
    assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), headBefore, c.name + ': HEAD unchanged');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Round 14 (R14-2): the same aliases without core.ignorecase. The expectation is derived from the checkout's observed
// case behaviour, measured with the probe directly, so it holds on a case-sensitive checkout and on a case-insensitive one.
test('name rule without core.ignorecase (R14-2): the check refuses exactly when the checkout folds, and the probe leaves the checkout unchanged', () => {
  const cases = [
    { name: 'file alias', ignored: 'config/local.json', incoming: 'config/Local.json', collisions: ['config/local.json'] },
    { name: 'parent-directory alias', ignored: 'Config/local.json', incoming: 'config/local.json', collisions: ['Config/local.json'] },
    { name: 'file-versus-directory alias', ignored: 'Local', incoming: 'local/x.json', collisions: ['Local'] },
  ];
  for (const c of cases) {
    const dir = aliasRepo(c.ignored, c.incoming);
    git(dir, ['config', '--unset', 'core.ignorecase']);
    const before = fs.readdirSync(dir).sort();
    const observed = probeDirectory(dir);
    assert.notEqual(observed, null, c.name + ': this checkout answers the probe');
    assert.deepEqual(fs.readdirSync(dir).sort(), before, c.name + ': the probe leaves no entry behind');
    const folds = observed === 'fold';
    const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
    const check = collisionCheck(dir, 'main', 'factory/008-alias');
    assert.equal(check.indeterminate, false, c.name + ': git answered');
    assert.equal(check.rule, observed, c.name + ': the check uses the checkout rule');
    assert.equal(check.ok, !folds, c.name + ': refused exactly when the checkout folds');
    assert.deepEqual(check.collisions, folds ? c.collisions : [], c.name + ': collisions follow the observed rule');
    assert.equal(fs.readFileSync(path.join(dir, c.ignored), 'utf8'), 'LOCAL SECRET\n', c.name + ': ignored bytes unchanged');
    assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), headBefore, c.name + ': HEAD unchanged');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Round 14 (R14-2): injected rules, metadata against checkout, and an indeterminate rule. Deterministic on any filesystem.
test('name rule injection (R14-2): both rules, metadata versus checkout, and an indeterminate rule are decided as specified; the probe runs in the checkout and never in .git', () => {
  const dir = aliasRepo('config/local.json', 'config/Local.json');
  const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  const bytesBefore = fs.readFileSync(path.join(dir, 'config/local.json'), 'utf8');
  const probed = [];
  const probeSays = (verdict) => (d) => {
    probed.push(d);
    return verdict;
  };
  // 1. Metadata says exact, the checkout folds: the checkout decides, so the merge is refused.
  git(dir, ['config', 'core.ignorecase', 'false']);
  let r = collisionCheck(dir, 'main', 'factory/008-alias', { probe: probeSays('fold') });
  assert.equal(r.rule, 'fold', 'the checkout rule is fold');
  assert.equal(r.ok, false, 'refused');
  assert.deepEqual(r.collisions, ['config/local.json']);
  // 2. Metadata unset, the checkout is exact: accepted.
  git(dir, ['config', '--unset', 'core.ignorecase']);
  r = collisionCheck(dir, 'main', 'factory/008-alias', { probe: probeSays('exact') });
  assert.equal(r.rule, 'exact', 'the checkout rule is exact');
  assert.equal(r.ok, true, 'accepted');
  // 3. Metadata says folding: folded without probing, even though the injected checkout is exact.
  git(dir, ['config', 'core.ignorecase', 'true']);
  probed.length = 0;
  r = collisionCheck(dir, 'main', 'factory/008-alias', { probe: probeSays('exact') });
  assert.equal(r.rule, 'fold', 'core.ignorecase true folds');
  assert.equal(r.ok, false, 'refused');
  assert.equal(probed.length, 0, 'no probe runs when the metadata says fold');
  // 4. The checkout rule is indeterminate: the check stops, and nothing changes.
  git(dir, ['config', '--unset', 'core.ignorecase']);
  r = collisionCheck(dir, 'main', 'factory/008-alias', { probe: () => null });
  assert.equal(r.indeterminate, true, 'an indeterminate rule is reported');
  assert.equal(r.ok, false, 'an indeterminate rule never passes');
  assert.deepEqual(r.collisions, []);
  assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), headBefore, 'HEAD unchanged');
  assert.equal(fs.readFileSync(path.join(dir, 'config/local.json'), 'utf8'), bytesBefore, 'ignored bytes unchanged');
  // 5. Every probe ran inside the checkout, and never inside the Git metadata directory.
  probed.length = 0;
  collisionCheck(dir, 'main', 'factory/008-alias', { probe: probeSays('exact') });
  assert.ok(probed.length > 0, 'the checkout is probed');
  for (const d of probed) {
    const rel = path.relative(dir, d);
    assert.ok(rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)), d + ': inside the checkout');
    assert.ok(!rel.split(path.sep).includes('.git'), d + ': never the metadata directory');
  }
  // 6. The real probe is indeterminate where it cannot create its entry, and never leaves one behind.
  assert.equal(probeDirectory(path.join(dir, 'missing-dir')), null, 'a missing directory is indeterminate');
  fs.rmSync(dir, { recursive: true, force: true });
});

// Round 13 (R13-2): a refusal before preparation keeps the job on factory/<id> and retries from eligibility. Real git:
// the trace in test/fixtures/factory-traces/in-place-collision-retry.json.
test('in-place collision stops and reports; a fresh entry prepares and switches without a manual step (R13-2, R17-2)', () => {
  const t = fixture('in-place-collision-retry.json');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /set `previewStep` `eligibility` with `previewFailure` \{step `eligibility`, reason, blocking paths\}, keep stage `needs-human`, report that no preview merge occurred, and stop\./, layout + ': record the refusal');
    assert.match(text, /`\/factory start <id>` does not re-run eligibility: it reports the refusal, and rework retires the attempt\./, layout + ': start reports, does not re-run');
    assert.match(text, /Fresh entry from an `APPROVE` only/, layout + ': fresh entry only');
    assert.match(text, /persist `previewBase` \(the default-branch SHA\) and `previewStep` `prepare` in one write/, layout + ': base persisted before the switch');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r13-inplace-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, '.gitignore', 'new/extra.json\n');
  for (const f of ['a', 'b', 'c']) write(dir, `old/${f}.txt`, `${f}\n`);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  git(dir, ['switch', '-q', '-c', 'factory/007-cfg']);
  write(dir, 'old/extra.json', 'job\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'job adds old/extra.json']);
  git(dir, ['switch', '-q', 'main']);
  git(dir, ['mv', 'old', 'new']);
  git(dir, ['commit', '-q', '-m', 'B: rename old to new']);
  git(dir, ['config', 'merge.directoryRenames', 'true']);
  // In-place job: the main checkout sits on the job branch, and an ignored local file sits at the relocated destination.
  git(dir, ['switch', '-q', 'factory/007-cfg']);
  write(dir, 'new/extra.json', 'LOCAL SECRET\n');
  const state = () => ({
    branch: git(dir, ['branch', '--show-current']).stdout.trim(),
    head: git(dir, ['rev-parse', 'HEAD']).stdout.trim(),
    bytes: fs.existsSync(path.join(dir, 'new/extra.json')) ? fs.readFileSync(path.join(dir, 'new/extra.json'), 'utf8') : null,
  });

  // The first check runs before any switch or set-aside: it refuses, and the record says so.
  const first = collisionCheck(dir, 'main', 'factory/007-cfg');
  assert.equal(first.ok, false, 'the first check refuses');
  const rec = { previewStep: 'eligibility', previewFailure: { step: 'eligibility', reason: 'collision', blocking: first.collisions }, previewRollback: 'none', previewBase: null, stage: 'needs-human' };
  const e = t.expected.after_refusal;
  assert.equal(rec.previewStep, e.previewStep, 'the step is eligibility');
  assert.equal(rec.previewFailure.step, e.previewFailure_step, 'the failed step is eligibility');
  assert.equal(rec.previewBase, e.previewBase, 'no previewBase is persisted');
  assert.equal(rec.previewRollback, e.previewRollback);
  assert.equal(rec.stage, e.stage);
  assert.deepEqual(first.collisions, e.collisions);
  assert.equal(state().branch, e.checkout, 'the job stays on factory/<id>');
  assert.equal(state().bytes, e.local_bytes, 'the ignored bytes are untouched');

  // Start reports and does not resume: nothing changes.
  const before = state();
  const r = startFromRecord(rec);
  assert.equal(r.resumed, false, 'start does not re-run eligibility');
  assert.equal(r.report, true, 'start reports the refusal');
  assert.deepEqual(state(), before, 'start mutates nothing');

  // The operator clears the collision. Rework retires the attempt, and a fresh APPROVE enters eligibility and prepares.
  fs.rmSync(path.join(dir, 'new/extra.json'));
  const fresh = collisionCheck(dir, 'main', 'factory/007-cfg');
  assert.equal(fresh.ok, true, 'the cleared collision passes');
  const previewBase = git(dir, ['rev-parse', 'main']).stdout.trim();
  const sw = git(dir, ['switch', '--no-overwrite-ignore', '-q', 'main']);
  assert.equal(sw.status, 0, sw.stderr);
  assert.equal(state().branch, t.expected.after_retry.checkout, 'the fresh entry switched without a manual step');
  const beforeMerge = collisionCheck(dir, 'main', 'factory/007-cfg');
  assert.deepEqual(beforeMerge.collisions, t.expected.after_retry.collisions);
  const merge = git(dir, ['merge', '--no-ff', '--no-overwrite-ignore', 'factory/007-cfg', '-m', 'Merge factory/007-cfg (preview)']);
  assert.equal(merge.status, t.expected.after_retry.merge_status, merge.stderr);
  assert.equal(git(dir, ['rev-parse', 'HEAD^1']).stdout.trim(), previewBase, 'the merge parent is the persisted base');
  assert.equal(fs.readFileSync(path.join(dir, t.expected.after_retry.merged_file), 'utf8'), t.expected.after_retry.merged_content, 'the job file lands at the relocated path');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('in-place switch (R11-2): git switch --no-overwrite-ignore refuses an ignored collision and keeps the local bytes; every literal git switch in both layouts carries the flag', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.doesNotMatch(text, /git switch (?!--no-overwrite-ignore)/, layout + ': every git switch carries the flag');
    assert.match(text, /Then run `git switch --no-overwrite-ignore -c factory\/<id> \{\{DEFAULT_BRANCH\}\}`/, layout + ': create-branch switch');
    assert.match(text, /run `git switch --no-overwrite-ignore \{\{DEFAULT_BRANCH\}\}`\. The branch stays in place\./, layout + ': precondition switch');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r11-sw-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, '.gitignore', 'config/local.json\n');
  write(dir, 'a.txt', 'base\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  git(dir, ['switch', '-q', '-c', 'factory/004-config']);
  write(dir, 'config/local.json', 'shared\n');
  git(dir, ['add', '-f', 'config/local.json']);
  git(dir, ['commit', '-q', '-m', 'job tracks config/local.json']);
  git(dir, ['switch', '-q', 'main']);
  write(dir, 'config/local.json', 'LOCAL SECRET\n');
  const r = git(dir, ['switch', '--no-overwrite-ignore', '-q', 'factory/004-config']);
  assert.notEqual(r.status, 0, 'the switch is refused');
  assert.match(r.stderr, /would be overwritten/, 'git names the collision');
  assert.equal(git(dir, ['branch', '--show-current']).stdout.trim(), 'main', 'still on the default branch');
  assert.equal(fs.readFileSync(path.join(dir, 'config/local.json'), 'utf8'), 'LOCAL SECRET\n', 'local bytes unchanged');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('single push destination (R11-3): origin with two push URLs is refused before any push and neither bare repository gets the ref; one destination passes', () => {
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /Before each push, resolve `git -C <build location> remote get-url --push --all origin`\. Require exactly one effective push destination and verify that its host and repository are the authorized forge repository\. If missing, multiple, different, or unverifiable, push nothing and ask the operator\. Never print credentials embedded in a URL\./, layout + ': destination check');
  }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r11-push-'));
  const bare = (name) => {
    const p = path.join(work, name);
    git(work, ['init', '-q', '--bare', p]);
    return p;
  };
  // A build checkout on the job branch whose origin has the given push URLs.
  const build = (name, pushUrls) => {
    const dir = path.join(work, name);
    fs.mkdirSync(dir);
    git(dir, ['init', '-q']);
    git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/factory/004-push']);
    write(dir, 'x.txt', 'x\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-q', '-m', 'x']);
    git(dir, ['remote', 'add', 'origin', pushUrls[0]]);
    for (const u of pushUrls) git(dir, ['remote', 'set-url', '--add', '--push', 'origin', u]);
    return dir;
  };
  // The destination check from SKILL.md: exactly one effective push destination, and it is the authorized one.
  const destinationOk = (dir, authorized) => {
    const r = git(dir, ['remote', 'get-url', '--push', '--all', 'origin']);
    if (r.status !== 0) return false;
    const dests = r.stdout.split('\n').filter(Boolean);
    return dests.length === 1 && dests[0] === authorized;
  };
  const hasRef = (repo) => git(repo, ['rev-parse', '--verify', '-q', 'refs/heads/factory/004-push']).status === 0;

  const A = bare('a.git');
  const B = bare('b.git');
  const multi = build('multi', [A, B]);
  assert.deepEqual(git(multi, ['remote', 'get-url', '--push', '--all', 'origin']).stdout.split('\n').filter(Boolean), [A, B], 'two effective push URLs');
  assert.equal(destinationOk(multi, A), false, 'the check refuses');
  assert.equal(hasRef(A), false, 'no push: the first bare repository has no ref');
  assert.equal(hasRef(B), false, 'no push: the second bare repository has no ref');

  // Control: a plain push would reach both URLs, which is the hazard the check prevents.
  const naiveA = bare('a2.git');
  const naiveB = bare('b2.git');
  const naive = build('naive', [naiveA, naiveB]);
  assert.equal(git(naive, ['push', '-q', 'origin', 'factory/004-push']).status, 0, 'the plain push succeeds');
  assert.equal(hasRef(naiveA), true, 'the plain push reaches the first URL');
  assert.equal(hasRef(naiveB), true, 'the plain push reaches the second URL');

  // One authorized destination passes the check, and the push lands there.
  const single = build('single', [A]);
  assert.equal(destinationOk(single, A), true, 'one authorized destination passes');
  assert.equal(git(single, ['push', '-q', 'origin', 'factory/004-push']).status, 0, 'the push succeeds');
  assert.equal(hasRef(A), true, 'the ref lands in the authorized repository');
  fs.rmSync(work, { recursive: true, force: true });
});

// The request repository check from SKILL.md (push-mr step 4): a returned request URL is recorded only when it is on the
// verified HOST/OWNER/REPO, same host, path under /OWNER/REPO/, compared case-insensitively, over https.
function requestInRepo(url, verified) {
  const [host, ...repo] = verified.split('/');
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return u.protocol === 'https:' && u.host.toLowerCase() === host.toLowerCase()
    && u.pathname.toLowerCase().startsWith(`/${repo.join('/')}/`.toLowerCase());
}

test('request repository (R12-3): both forge commands take the verified repository with --repo, and a request URL outside it is never recorded', () => {
  for (const layout of LAYOUTS) {
    const push = section(skill(layout), '### Push and merge request (`push-mr`)');
    assert.match(push, /`<verified>` is the `HOST\/OWNER\/REPO` of the single push destination that step 3 verified, and it must be the repository that `git remote get-url origin` names\./, layout + ': verified repository');
    assert.match(push, /Pass it with `--repo` on both commands, so a fork's upstream or a `GH_REPO` override cannot redirect the request\./, layout + ': explicit --repo');
    assert.match(push, /GitLab's `--repo` takes a full URL, so it receives `https:\/\/<verified>`\./, layout + ': GitLab full URL');
    assert.match(push, /Record it only when it is on `<verified>`: the same host, and a path that starts with `\/OWNER\/REPO\/`, compared case-insensitively\./, layout + ': URL check before recording');
    assert.match(push, /Otherwise do not record it: set stage `needs-human`, report the URL so the operator can close the request on the forge, and run no forge read or cleanup\./, layout + ': refusal');
  }
  const gh = 'github.com/owner/repo';
  assert.equal(requestInRepo('https://github.com/owner/repo/pull/12', gh), true, 'the verified repository is accepted');
  assert.equal(requestInRepo('https://github.com/Owner/Repo/pull/9', gh), true, 'case-insensitive');
  assert.equal(requestInRepo('https://github.com/upstream/repo/pull/3', gh), false, 'a fork upstream is refused');
  assert.equal(requestInRepo('https://github.com/owner/repo-other/pull/1', gh), false, 'a longer repository name is refused');
  assert.equal(requestInRepo('https://ghe.example.com/owner/repo/pull/1', gh), false, 'another host is refused');
  assert.equal(requestInRepo('http://github.com/owner/repo/pull/1', gh), false, 'plain http is refused');
  assert.equal(requestInRepo('not a url', gh), false, 'a non-URL is refused');
  const gl = 'gitlab.example/group/sub/project';
  assert.equal(requestInRepo('https://gitlab.example/group/sub/project/-/merge_requests/3', gl), true, 'a GitLab subgroup path is accepted');
  assert.equal(requestInRepo('https://gitlab.example/group/project/-/merge_requests/3', gl), false, 'a sibling project is refused');
});

// Round 15 (R15-1, SEC15-1): the name rule walks every containing directory. A fold in one intermediate directory makes
// the rule fold, so the ignored file and the incoming path are refused. Both rules are injected, so this is deterministic.
test('intermediate directory alias (R15-1, SEC15-1): a fold in one intermediate directory refuses with the bytes and HEAD unchanged; the walk probes every containing directory; the control is exact', () => {
  const t = fixture('intermediate-alias-injected.json');
  for (const c of t.cases) {
    const dir = aliasRepo(c.ignored, c.incoming);
    git(dir, ['config', 'core.ignorecase', 'false']);
    const foldDir = path.join(dir, c.fold_dir);
    const probed = [];
    const probe = (d) => {
      probed.push(d);
      return d === foldDir ? 'fold' : 'exact';
    };
    const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
    const bytesBefore = fs.readFileSync(path.join(dir, c.ignored), 'utf8');
    const r = collisionCheck(dir, 'main', 'factory/008-alias', { probe });
    assert.equal(r.indeterminate, false, c.name + ': git answered');
    assert.equal(r.rule, c.expected.rule, c.name + ': the intermediate fold makes the rule fold');
    assert.equal(r.ok, !c.expected.refused, c.name + ': refused');
    assert.deepEqual(r.collisions, c.expected.collisions, c.name + ': the ignored path is named');
    assert.equal(probed.includes(dir), true, c.name + ': the checkout root is probed');
    assert.equal(probed.includes(foldDir), c.expected.probed_fold_dir, c.name + ': the intermediate directory is probed');
    for (const d of probed) {
      assert.ok(!path.relative(dir, d).split(path.sep).includes('.git'), c.name + ': never the metadata directory');
    }
    const headSame = git(dir, ['rev-parse', 'HEAD']).stdout.trim() === headBefore;
    assert.equal(headSame, t.after_refusal.head_unchanged, c.name + ': HEAD unchanged');
    assert.equal(fs.readFileSync(path.join(dir, c.ignored), 'utf8'), bytesBefore, c.name + ': ignored bytes unchanged');
    fs.rmSync(dir, { recursive: true, force: true });
  }
  // Control: every directory exact, so the same layout is not a collision.
  const dir = aliasRepo(t.cases[0].ignored, t.cases[0].incoming);
  git(dir, ['config', 'core.ignorecase', 'false']);
  const control = collisionCheck(dir, 'main', 'factory/008-alias', { probe: () => 'exact' });
  assert.equal(control.rule, t.control.expected.rule, 'the control rule is exact');
  assert.equal(control.ok, !t.control.expected.refused, 'the control is accepted');
  assert.deepEqual(control.collisions, t.control.expected.collisions);
  fs.rmSync(dir, { recursive: true, force: true });
});

// SEC15-2: a no-op preview merge (the reviewed job SHA is already an ancestor of the default branch) creates no commit, so
// its pre-existing HEAD must not be recorded as previewCommit.
test('no-op preview merge (SEC15-2): when the reviewed SHA is already an ancestor, no previewCommit is recorded, the pre-existing HEAD is untouched, and the merge reports no preview merge', () => {
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /Then persist `HEAD` as `previewCommit` only if the default branch is still checked out and `HEAD` has exactly the ordered parents `previewBase`, `previewJobSha` and the expected preview message\. Otherwise stop and report; if `HEAD` is unchanged, report that no preview merge was created\. Never revert that pre-existing HEAD\./, layout + ': SEC15-2 text');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r15-noop-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, 'a.txt', 'base\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  git(dir, ['switch', '-q', '-c', 'factory/012-noop']);
  write(dir, 'docs/z.md', 'job\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'job']);
  const J = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  git(dir, ['switch', '-q', 'main']);
  assert.equal(git(dir, ['merge', '--ff-only', 'factory/012-noop']).status, 0, 'main fast-forwards to the job');
  write(dir, 'b.txt', 'main work\n');
  git(dir, ['add', 'b.txt']);
  git(dir, ['commit', '-q', '-m', 'B']);
  const B = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  const rec = { previewBase: B, previewJobSha: J, previewCommit: null, previewStep: 'merge' };

  const merge = git(dir, ['merge', '--no-ff', '--no-overwrite-ignore', J, '-m', 'Merge factory/012-noop (preview)']);
  assert.equal(merge.status, 0, merge.stderr);
  const head = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  assert.equal(head, B, 'the no-op merge creates no commit');
  // The rule: persist only when the default branch is checked out and HEAD has the ordered parents previewBase and previewJobSha.
  const parents = git(dir, ['show', '-s', '--format=%P', 'HEAD']).stdout.trim().split(' ');
  const persist = git(dir, ['branch', '--show-current']).stdout.trim() === 'main'
    && parents.length === 2 && parents[0] === rec.previewBase && parents[1] === rec.previewJobSha;
  assert.equal(persist, false, 'the pre-existing HEAD is not persisted');
  assert.equal(rec.previewCommit, null, 'previewCommit stays absent');
  assert.equal(head === rec.previewBase, true, 'the report says no preview merge was created');
  assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), B, 'HEAD unchanged');
  fs.rmSync(dir, { recursive: true, force: true });
});

// A rollback repo: the default branch has docs/plan.md, the set-aside backup holds the local copy, and the tree is at PRE.
function rollbackRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r15-restore-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, 'docs/plan.md', 'plan v1\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  write(dir, 'factory/jobs/001-export/main-copies/docs/plan.md', 'plan local\n');
  return dir;
}

// Round 16 (SEC15-3): the restore check before abort or reset and before copy-back. A destination must be absent or hold
// the content it had at PRE, and neither it nor any ancestor may be a symlink. Any difference, symlink, or unreadable
// state copies nothing and keeps the backups.
function restoreCheck(dir, expectedRef, paths) {
  const conflicts = [];
  for (const p of paths) {
    const parts = p.split('/');
    let cur = dir;
    for (let i = 0; i < parts.length - 1; i += 1) {
      cur = path.join(cur, parts[i]);
      try {
        if (fs.lstatSync(cur).isSymbolicLink()) return { ok: false, indeterminate: false, conflicts: [p] };
      } catch (err) {
        if (err.code === 'ENOENT') break;
        return { ok: false, indeterminate: true, conflicts: [p] };
      }
    }
    const dest = path.join(dir, p);
    let st;
    try {
      st = fs.lstatSync(dest);
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      return { ok: false, indeterminate: true, conflicts: [p] };
    }
    if (st.isSymbolicLink()) {
      conflicts.push(p);
      continue;
    }
    const show = git(dir, ['show', `${expectedRef}:${p}`]);
    if (show.status !== 0) return { ok: false, indeterminate: true, conflicts: [p] };
    if (!fs.readFileSync(dest).equals(Buffer.from(show.stdout, 'utf8'))) conflicts.push(p);
  }
  return { ok: conflicts.length === 0, indeterminate: false, conflicts };
}

test('ordinary rollback guard (SEC15-3): the restore check refuses a destination that differs, sits under a symlink, or cannot be checked, copies nothing, and keeps the backups', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.equal(text.split('**Restore check.** Before abort or reset, and again before copy-back, check every restore destination.').length - 1, 1, layout + ': one restore check defined');
    assert.match(text, /It must be absent or hold the content it had at `PRE`, and neither it nor any ancestor may be a symlink\./, layout + ': expected state and symlinks');
    assert.match(text, /If any destination differs, is or sits under a symlink, or cannot be checked, copy nothing, keep the backups in `main-copies\/`, and report the paths\./, layout + ': refuse and report');
    assert.equal(text.split('apply the restore check').length - 1, 2, layout + ': both ordinary rollback paths apply it');
  }
  const backup = 'factory/jobs/001-export/main-copies/docs/plan.md';
  const copyBack = (dir) => fs.copyFileSync(path.join(dir, backup), path.join(dir, 'docs/plan.md'));

  // The destination matches the expected state (PRE, after the reset): the check passes and the copy proceeds.
  let dir = rollbackRepo();
  let c = restoreCheck(dir, 'main', ['docs/plan.md']);
  assert.equal(c.ok, true, 'the destination matches the expected state');
  copyBack(dir);
  assert.equal(fs.readFileSync(path.join(dir, 'docs/plan.md'), 'utf8'), 'plan local\n', 'the backup is restored');
  fs.rmSync(dir, { recursive: true, force: true });

  // Newer local content: refused; nothing is copied, the edit and the backup stay.
  dir = rollbackRepo();
  fs.writeFileSync(path.join(dir, 'docs/plan.md'), 'plan newer edits\n');
  c = restoreCheck(dir, 'main', ['docs/plan.md']);
  assert.equal(c.ok, false, 'newer local content is refused');
  assert.deepEqual(c.conflicts, ['docs/plan.md']);
  assert.equal(fs.readFileSync(path.join(dir, 'docs/plan.md'), 'utf8'), 'plan newer edits\n', 'the local edit is untouched');
  assert.equal(fs.existsSync(path.join(dir, backup)), true, 'the backup is retained');
  fs.rmSync(dir, { recursive: true, force: true });

  // Absent destination: nothing to overwrite, so the check passes.
  dir = rollbackRepo();
  fs.rmSync(path.join(dir, 'docs/plan.md'));
  assert.equal(restoreCheck(dir, 'main', ['docs/plan.md']).ok, true, 'an absent destination is not a conflict');
  fs.rmSync(dir, { recursive: true, force: true });

  // A symlink at the destination: refused, and the symlink target is not written through.
  dir = rollbackRepo();
  fs.writeFileSync(path.join(dir, 'elsewhere.md'), 'elsewhere\n');
  fs.rmSync(path.join(dir, 'docs/plan.md'));
  fs.symlinkSync(path.join(dir, 'elsewhere.md'), path.join(dir, 'docs/plan.md'));
  c = restoreCheck(dir, 'main', ['docs/plan.md']);
  assert.equal(c.ok, false, 'a symlink destination is refused');
  assert.deepEqual(c.conflicts, ['docs/plan.md']);
  assert.equal(fs.readFileSync(path.join(dir, 'elsewhere.md'), 'utf8'), 'elsewhere\n', 'the symlink target is untouched');
  fs.rmSync(dir, { recursive: true, force: true });

  // Indeterminate: the expected state cannot be read, so the check refuses and copies nothing.
  dir = rollbackRepo();
  c = restoreCheck(dir, 'no-such-ref', ['docs/plan.md']);
  assert.equal(c.indeterminate, true, 'an unreadable expected state is indeterminate');
  assert.equal(c.ok, false, 'an indeterminate check never passes');
  assert.equal(fs.readFileSync(path.join(dir, 'docs/plan.md'), 'utf8'), 'plan v1\n', 'the destination is untouched');
  assert.equal(fs.existsSync(path.join(dir, backup)), true, 'the backup is retained');
  fs.rmSync(dir, { recursive: true, force: true });
});

// Round 16 (items 4 and 5): an interrupted state stops and reports. The expected HEAD is previewCommit once it is recorded,
// otherwise previewBase, and the report says which. Rework is offered only where the state table permits it.
// Each step's rework column comes from the SKILL table: rework is offered only when the cell starts with "Allowed" and does
// not wait for the operator to restore a state first.
function reworkPermitted(step) {
  const row = stateTableRows(skill(LAYOUTS[0])).find((l) => l.startsWith('| `' + step + '` |'));
  const cell = row.split('|').map((c) => c.trim())[6];
  return /^Allowed(?! only after)/.test(cell);
}
function startFromRecord(rec) {
  // Eligibility is entered only fresh from an APPROVE; an interrupted or failed attempt is reported, never resumed.
  return { resumed: false, report: rec.previewStep === 'eligibility' && rec.previewFailure !== null };
}
function startPreview(dir, rec) {
  const branch = git(dir, ['branch', '--show-current']).stdout.trim();
  const head = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  const expectedHead = rec.previewCommit ?? rec.previewBase;
  const offerRework = reworkPermitted(rec.previewStep);
  return {
    result: 'stop',
    stayed: 'needs-human',
    report: {
      expected: { branch: 'main', head: expectedHead, source: rec.previewCommit ? 'previewCommit' : 'previewBase' },
      observed: { branch, head },
      recorded: { previewBase: rec.previewBase, previewJobSha: rec.previewJobSha, previewCommit: rec.previewCommit },
      affected: rec.affected,
      backups: 'factory/jobs/' + rec.jobId + '/main-copies/',
      offerRework,
      next: [
        'restore the listed state and paths by hand',
        '/factory start <id> reports again; it does not continue the attempt',
        offerRework ? '/factory rework <id> <note> retires the attempt' : 'restore the expected state first; rework is offered after it',
      ],
    },
  };
}

test('stop-and-report (R16, R17-4, R17-5): an interrupted preview state stops with no Git or filesystem mutation; the report names the expected HEAD by source and offers rework only where the table permits it', () => {
  const t = fixture('interrupted-preview-stop.json');
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /\*\*Stop-and-report rule\.\*\* Factory does not recover an interrupted or unexpected preview state\./, layout + ': the rule');
    assert.match(text, /For any of them Factory makes no Git or filesystem mutation\./, layout + ': no mutation');
    assert.match(text, /It reports the expected and observed state \(branch; the expected `HEAD` is `previewCommit` once it is recorded, otherwise `previewBase`; the observed `HEAD`; the recorded `previewJobSha`; and the affected paths\), names the backups kept in `factory\/jobs\/<id>\/main-copies\/`, and tells the operator which state or paths need manual restoration\./, layout + ': report contents');
    assert.match(text, /The job stays at `needs-human`\./, layout + ': stays at needs-human');
    assert.match(text, /For an interrupted step, `\/factory start <id>` reports again; it does not continue that attempt\./, layout + ': start reports again');
    assert.match(text, /To retire it, use `\/factory rework <id> <note>` when the state table permits\. At `prepare` or `merge`, restore the expected state first\./, layout + ': rework when permitted');
    assert.match(text, /If a shared batch operation is unresolved, report the leader ID instead of offering member rework\./, layout + ': batch leader');
    assert.match(text, /For a recorded failure, offer `\/factory start <id>` only for the retry allowed under Failure\./, layout + ': failure retry only');
  }
  for (const s of t.scenarios) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r16-stop-'));
    git(dir, ['init', '-q']);
    git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    write(dir, 'a.txt', 'base\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-q', '-m', 'A']);
    const previewBase = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
    git(dir, ['switch', '-q', '-c', 'factory/013-stop']);
    write(dir, 'docs/w.md', 'job\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-q', '-m', 'job']);
    const previewJobSha = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
    git(dir, ['switch', '-q', 'main']);
    const rec = { jobId: '013-stop', previewBase, previewJobSha, previewCommit: null, previewStep: s.step, affected: t.affected };
    if (s.step !== 'prepare') {
      // The merge ran; the interruption came before (merge) or after (verify) previewCommit was recorded.
      const m = git(dir, ['merge', '--no-ff', '--no-overwrite-ignore', previewJobSha, '-m', 'Merge factory/013-stop (preview)']);
      assert.equal(m.status, 0, m.stderr);
      if (s.step === 'verify') rec.previewCommit = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
    }
    const state = () => ({
      branch: git(dir, ['branch', '--show-current']).stdout.trim(),
      head: git(dir, ['rev-parse', 'HEAD']).stdout.trim(),
      status: git(dir, ['status', '--porcelain']).stdout,
      parents: git(dir, ['show', '-s', '--format=%P', 'HEAD']).stdout.trim().split(' ').length,
    });
    const before = state();
    assert.equal(before.parents, s.parents, s.name + ': the interrupted state has the expected parents');
    const r = startPreview(dir, rec);
    assert.deepEqual(state(), before, s.name + ': no Git or filesystem mutation');
    assert.equal(r.result, s.expected.result, s.name + ': stops');
    assert.equal(r.stayed, s.expected.stayed, s.name + ': stays at needs-human');
    assert.equal(r.report.observed.branch, s.expected.observed_branch, s.name + ': observed branch');
    assert.equal(r.report.observed.head, before.head, s.name + ': observed HEAD');
    const expectedHead = s.expected.expected_head === 'previewCommit' ? rec.previewCommit : previewBase;
    assert.equal(r.report.expected.head, expectedHead, s.name + ': expected HEAD');
    assert.equal(r.report.expected.source, s.expected.expected_head, s.name + ': the report says which of previewBase or previewCommit it expects');
    if (s.step === 'merge') assert.notEqual(r.report.expected.head, r.report.observed.head, s.name + ': the merged HEAD differs from the expected base');
    if (s.step === 'verify') assert.equal(r.report.expected.head, r.report.observed.head, s.name + ': the verified commit is the expected HEAD');
    assert.equal(r.report.offerRework, s.expected.rework_offered, s.name + ': rework offered as the table permits');
    assert.equal(reworkPermitted(s.step), s.expected.rework_offered, s.name + ': the table agrees');
    assert.equal(r.report.next[2].includes('retires the attempt'), s.expected.rework_offered, s.name + ': rework named only when permitted');
    assert.equal(r.report.recorded.previewJobSha, previewJobSha, s.name + ': recorded job SHA');
    assert.deepEqual(r.report.affected, t.affected, s.name + ': affected paths');
    assert.equal(r.report.backups, 'factory/jobs/013-stop/main-copies/', s.name + ': backups named');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Round 17 (item 1): the deploy gate. Immediately before every deploy, the checkout must be on the default branch at the
// verified SHA, the tracked tree must be clean, and the deploy inputs must still match previewFingerprint. A refusal
// deploys nothing and cleans nothing. The inputs are the deploy command and the tracked startup script. Real git.
function deployInputs(dir, command) {
  const script = fs.readFileSync(path.join(dir, 'scripts/start.sh'), 'utf8');
  return crypto.createHash('sha256').update(command + '\n' + script).digest('hex');
}
function deployGate(dir, rec, command) {
  const branch = git(dir, ['branch', '--show-current']).stdout.trim();
  const head = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  if (branch !== 'main' || head !== rec.verifiedSha) return { deploy: false, reason: 'checkout is not the default branch at the verified SHA' };
  if (git(dir, ['status', '--porcelain', '--untracked-files=no']).stdout.trim() !== '') return { deploy: false, reason: 'tracked tree is dirty' };
  if (deployInputs(dir, command) !== rec.previewFingerprint) return { deploy: false, reason: 'deploy inputs differ from previewFingerprint' };
  return { deploy: true };
}
function deployRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r17-deploy-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, 'scripts/start.sh', 'run v1\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  return dir;
}

test('deploy gate (R17-1): immediately before every deploy the checkout must be the verified SHA, clean, and match the fingerprint; an edited tracked startup script with HEAD unchanged is refused without deploying or cleaning', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /immediately before every deploy, require all of: the main checkout is on `\{\{DEFAULT_BRANCH\}\}` at the expected SHA for that deploy's purpose/, layout + ': gate before every deploy');
    assert.match(text, /the index and tracked tree are clean; and the effective deploy inputs \(the deploy command or brief, the health checks, the target, and the tracked setup, lifecycle, startup, and deploy scripts\) still match the fingerprint recorded for that SHA/, layout + ': clean tree and inputs');
    assert.match(text, /or on any mismatch, stop and report: do not deploy and do not clean\./, layout + ': refuse, no clean');
    assert.match(text, /and the step 5 deploy gate applies to that SHA\./, layout + ': batch deploys pass the gate');
  }
  const command = 'rebuild-app';
  let dir = deployRepo();
  let verifiedSha = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  let rec = { verifiedSha, previewFingerprint: deployInputs(dir, command) };
  let deploys = 0;
  const attempt = (c) => {
    const g = deployGate(dir, rec, c);
    if (g.deploy) deploys += 1;
    return g;
  };

  // Regression: an edited tracked startup script, HEAD unchanged. Refused; nothing is deployed or cleaned.
  fs.writeFileSync(path.join(dir, 'scripts/start.sh'), 'run v2 edited\n');
  const headBefore = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  const gate = attempt(command);
  assert.equal(gate.deploy, false, 'the edited startup script is refused');
  assert.equal(gate.reason, 'tracked tree is dirty', 'the reason names the dirty tree');
  assert.equal(deploys, 0, 'nothing is deployed');
  assert.equal(git(dir, ['rev-parse', 'HEAD']).stdout.trim(), headBefore, 'HEAD is unchanged');
  assert.equal(fs.readFileSync(path.join(dir, 'scripts/start.sh'), 'utf8'), 'run v2 edited\n', 'the edit is not cleaned');
  assert.match(git(dir, ['status', '--porcelain']).stdout, /^ M scripts\/start\.sh$/m, 'the working tree still shows the edit');
  fs.rmSync(dir, { recursive: true, force: true });

  // A committed edit moves HEAD off the verified SHA: refused.
  dir = deployRepo();
  rec = { verifiedSha: git(dir, ['rev-parse', 'HEAD']).stdout.trim(), previewFingerprint: deployInputs(dir, command) };
  write(dir, 'scripts/start.sh', 'run v2 committed\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'edit startup']);
  assert.equal(attempt(command).reason, 'checkout is not the default branch at the verified SHA', 'a moved HEAD is refused');
  assert.equal(deploys, 0, 'still nothing deployed');
  fs.rmSync(dir, { recursive: true, force: true });

  // A changed deploy command with a clean, unchanged checkout: refused on the fingerprint.
  dir = deployRepo();
  rec = { verifiedSha: git(dir, ['rev-parse', 'HEAD']).stdout.trim(), previewFingerprint: deployInputs(dir, command) };
  assert.equal(attempt('rebuild-app --migrate').reason, 'deploy inputs differ from previewFingerprint', 'a changed input is refused');
  assert.equal(deploys, 0, 'still nothing deployed');
  fs.rmSync(dir, { recursive: true, force: true });

  // Clean, at the verified SHA, inputs unchanged: the gate passes and the deploy runs once.
  dir = deployRepo();
  rec = { verifiedSha: git(dir, ['rev-parse', 'HEAD']).stdout.trim(), previewFingerprint: deployInputs(dir, command) };
  assert.equal(attempt(command).deploy, true, 'a matching checkout passes the gate');
  assert.equal(deploys, 1, 'the deploy runs once');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('rework and abandon check the preview state table before any write or cleanup (R17-3), for single jobs and batches', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /For a job with `substate` `preview`, also check its `previewStep` row in the Preview state table before any write or cleanup, and refuse unless the row allows rework; at `prepare` or `merge`, refuse unless the branch and `HEAD` already match the recorded expected state\./, layout + ': rework checks the table first');
    assert.match(text, /For a job with `substate` `preview`, check its `previewStep` row in the Preview state table before any stage write or cleanup, and refuse unless the row allows abandon\./, layout + ': abandon checks the table first');
  }
  assert.equal(reworkPermitted('eligibility'), true, 'eligibility allows rework');
  assert.equal(reworkPermitted('verify'), true, 'verify allows rework for a single job');
  assert.equal(reworkPermitted('prepare'), false, 'prepare waits for the expected state');
  assert.equal(reworkPermitted('merge'), false, 'merge waits for the expected state');
});

// Round 18 (item 1): a revert redeploy targets the revert commit's SHA, after its own preflight. The rejected preview SHA is
// never the redeploy target. Real git: the preview changes the startup script, the preview is reverted, and the redeploy
// is gated on the revert SHA's fingerprint.
test('revert redeploy (R18-1): the redeploy targets the revert commit SHA after its own preflight, never the rejected preview SHA; without that preflight it is refused', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /then redeploy at the revert commit's SHA: preflight that SHA, pass the deploy gate for it, and deploy only then, never at the rejected `previewCommit`\./, layout + ': revert redeploy at the revert SHA');
    assert.match(text, /for the revert redeploy in Outcomes \(a\), the revert commit's SHA/, layout + ': the gate names the revert SHA');
  }
  const command = 'rebuild-app';
  const dir = deployRepo();
  git(dir, ['switch', '-q', '-c', 'factory/018-revert']);
  write(dir, 'scripts/start.sh', 'run v2 preview\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'job changes the startup script']);
  git(dir, ['switch', '-q', 'main']);
  const merge = git(dir, ['merge', '--no-ff', '--no-overwrite-ignore', 'factory/018-revert', '-m', 'Merge factory/018-revert (preview)']);
  assert.equal(merge.status, 0, merge.stderr);
  const previewCommit = git(dir, ['rev-parse', 'HEAD']).stdout.trim();

  // The preview is rejected: git revert -m 1 <previewCommit> on the default branch.
  const revert = git(dir, ['revert', '--no-edit', '-m', '1', previewCommit]);
  assert.equal(revert.status, 0, revert.stderr);
  const revertSha = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  assert.notEqual(revertSha, previewCommit, 'the revert is a new commit');
  assert.equal(fs.readFileSync(path.join(dir, 'scripts/start.sh'), 'utf8'), 'run v1\n', 'the revert restores the startup script');

  // Preflight of the revert SHA records its fingerprint; the redeploy is gated on that SHA.
  const preflight = { verifiedSha: revertSha, previewFingerprint: deployInputs(dir, command) };
  const deployedAt = [];
  const redeploy = (rec, c) => {
    const g = deployGate(dir, rec, c);
    if (g.deploy) deployedAt.push(git(dir, ['rev-parse', 'HEAD']).stdout.trim());
    return g;
  };

  // The rejected preview SHA is not a valid redeploy target: the checkout is at the revert SHA.
  const rejected = redeploy({ verifiedSha: previewCommit, previewFingerprint: preflight.previewFingerprint }, command);
  assert.equal(rejected.deploy, false, 'the rejected preview SHA is refused');
  assert.equal(rejected.reason, 'checkout is not the default branch at the verified SHA');
  assert.deepEqual(deployedAt, [], 'nothing is deployed at the rejected SHA');

  // Without a preflight of the revert SHA, the redeploy is refused.
  const unpreflighted = redeploy({ verifiedSha: revertSha, previewFingerprint: undefined }, command);
  assert.equal(unpreflighted.deploy, false, 'no preflight of the revert SHA, no redeploy');
  assert.deepEqual(deployedAt, [], 'still nothing deployed');

  // The preflighted revert SHA passes the gate: the redeploy targets the revert commit.
  assert.equal(redeploy(preflight, command).deploy, true, 'the revert SHA passes its own gate');
  assert.deepEqual(deployedAt, [revertSha], 'the redeploy targets the revert commit SHA');
  assert.notEqual(deployedAt[0], previewCommit, 'not the rejected preview SHA');
  fs.rmSync(dir, { recursive: true, force: true });
});

// Round 18 (item 2): abandon reports whether the preview merge remains by asking the default branch, not previewCommit.
// Exit 0: it remains; exit 1: it does not; anything else: unknown. Real git.
function mergeRemains(dir, previewCommit) {
  const r = git(dir, ['merge-base', '--is-ancestor', previewCommit, 'main']);
  if (r.status === 0) return 'remains';
  if (r.status === 1) return 'does not remain';
  return 'unknown';
}

test('abandon reports the preview merge from the default branch (R18-2): the merge-base check decides whether the merge remains, and a previewCommit alone never says so', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /A job with `previewCommit` set may have its preview merge on the default branch: abandon leaves any such merge in place, never reverts it, and reports whether it remains/, layout + ': abandon intro');
    assert.match(text, /When `previewCommit` is set, report whether the preview merge remains: run `git merge-base --is-ancestor <previewCommit> \{\{DEFAULT_BRANCH\}\}` \(read-only\)\. Exit 0 means it remains on the default branch; exit 1 means it does not; any other result is reported as unknown, never inferred from `previewCommit` alone\./, layout + ': abandon report');
    const failureRow = text.split('\n').find((l) => l.startsWith('| `failure` |'));
    assert.match(failureRow, /Allowed once any rollback is `none` or `complete`, and no shared operation is unresolved/, layout + ': failure row lets a member abandon after rollback completes');
    assert.match(failureRow, /Refused; never clears `previewFailure`/, layout + ': failure row keeps its refusal');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-r18-abandon-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  write(dir, 'a.txt', 'base\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'A']);
  const base = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  git(dir, ['switch', '-q', '-c', 'factory/019-abandon']);
  write(dir, 'docs/x.md', 'job\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'job']);
  git(dir, ['switch', '-q', 'main']);
  git(dir, ['merge', '--no-ff', '--no-overwrite-ignore', 'factory/019-abandon', '-m', 'Merge factory/019-abandon (preview)']);
  const previewCommit = git(dir, ['rev-parse', 'HEAD']).stdout.trim();

  // The merge is on the default branch: it remains.
  assert.equal(mergeRemains(dir, previewCommit), 'remains', 'the preview merge is on the default branch');
  // A batch rollback resets the default branch to PRE: previewCommit is still a valid commit, but no longer on the branch.
  assert.equal(git(dir, ['reset', '--keep', base]).status, 0, 'the rollback reset');
  assert.equal(git(dir, ['cat-file', '-t', previewCommit]).stdout.trim(), 'commit', 'previewCommit still exists');
  assert.equal(mergeRemains(dir, previewCommit), 'does not remain', 'the default branch no longer reaches the merge');
  // An object Git cannot resolve is unknown, never inferred.
  assert.equal(mergeRemains(dir, '0'.repeat(40)), 'unknown', 'an unresolvable commit is unknown');
  fs.rmSync(dir, { recursive: true, force: true });
});

// Round 19 (item 2): the rollback restore's only target is the recorded prior running SHA. The stack ran A while the default
// branch was at B (PRE_BATCH). B passes the checkout gate for its own SHA, but restoring B does not restore A. Real git.
test('rollback restore (R19-2): the restore targets the prior running SHA only; PRE_BATCH is not a target, and any mismatch sets unverified without a deploy', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /for a rollback restore, only the recorded prior running SHA \(`previewPriorRunning`\), never `PRE_BATCH`\./, layout + ': step 5 restore target');
    assert.match(text, /\(4\) If deploy was attempted, the restore targets only the recorded prior running SHA \(`previewPriorRunning`\), never `PRE_BATCH`:/, layout + ': batch restore target');
    assert.match(text, /If the prior running SHA is absent or its deploy gate fails, set `previewRollback` `unverified`, do not deploy, and stop and report\. If identity or health read-back fails after the restore deploy, set `previewRollback` `unverified` and stop and report without another deploy\./, layout + ': unverified without deploy');
  }
  const command = 'rebuild-app';
  const dir = deployRepo(); // the stack ran A: scripts/start.sh 'run v1'
  const A = git(dir, ['rev-parse', 'HEAD']).stdout.trim();
  const fingerprintA = deployInputs(dir, command);
  write(dir, 'scripts/start.sh', 'run v2\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'B: the default branch moved on']);
  const B = git(dir, ['rev-parse', 'HEAD']).stdout.trim(); // PRE_BATCH
  const fingerprintB = deployInputs(dir, command);
  assert.notEqual(A, B);

  // The restore: its only target is the prior running SHA, gated on that SHA. Any mismatch is unverified; nothing deploys.
  const deployedAt = [];
  const restore = (prior) => {
    if (prior === null) return { restored: false, previewRollback: 'unverified', reason: 'prior running SHA absent' };
    const gate = deployGate(dir, { verifiedSha: prior.sha, previewFingerprint: prior.fingerprint }, command);
    if (!gate.deploy) return { restored: false, previewRollback: 'unverified', reason: gate.reason };
    deployedAt.push(git(dir, ['rev-parse', 'HEAD']).stdout.trim());
    return { restored: true, reason: null };
  };
  const priorA = { sha: A, fingerprint: fingerprintA };

  // The default branch at PRE_BATCH (B) would pass the checkout gate for its own SHA: that is why B must not be a target.
  assert.equal(deployGate(dir, { verifiedSha: B, previewFingerprint: fingerprintB }, command).deploy, true, 'B passes its own gate');
  // Restoring from B is refused, because the prior running SHA is A: the checkout is not at A.
  let r = restore(priorA);
  assert.equal(r.restored, false, 'the checkout at B does not meet the gate for A');
  assert.equal(r.previewRollback, 'unverified');
  assert.equal(r.reason, 'checkout is not the default branch at the verified SHA');
  assert.deepEqual(deployedAt, [], 'nothing is deployed from B');

  // The checkout at A, clean, with inputs matching A's fingerprint: the restore targets A and deploys.
  git(dir, ['reset', '--keep', A]);
  r = restore(priorA);
  assert.equal(r.restored, true, 'the restore passes at the prior running SHA');
  assert.deepEqual(deployedAt, [A], 'the restore deploys the prior running SHA');
  assert.notEqual(deployedAt[0], B, 'never PRE_BATCH');

  // A dirty tracked tree at A: unverified, nothing deploys, and the edit is not cleaned by the procedure.
  write(dir, 'scripts/start.sh', 'run v1 edited\n');
  r = restore(priorA);
  assert.equal(r.restored, false);
  assert.equal(r.previewRollback, 'unverified');
  assert.equal(r.reason, 'tracked tree is dirty');
  assert.deepEqual(deployedAt, [A], 'still one deploy in total');
  assert.equal(fs.readFileSync(path.join(dir, 'scripts/start.sh'), 'utf8'), 'run v1 edited\n', 'the edit is not cleaned');
  git(dir, ['checkout', '--', 'scripts/start.sh']); // the operator restores the file by hand

  // Inputs that do not match A's recorded fingerprint: unverified, nothing deploys.
  r = restore({ sha: A, fingerprint: fingerprintB });
  assert.equal(r.restored, false);
  assert.equal(r.previewRollback, 'unverified');
  assert.equal(r.reason, 'deploy inputs differ from previewFingerprint');
  assert.deepEqual(deployedAt, [A], 'no deploy on an input mismatch');

  // No recorded prior running SHA: unverified, nothing deploys.
  r = restore(null);
  assert.equal(r.restored, false);
  assert.equal(r.previewRollback, 'unverified');
  assert.deepEqual(deployedAt, [A], 'no deploy without a prior running SHA');
  fs.rmSync(dir, { recursive: true, force: true });
});
