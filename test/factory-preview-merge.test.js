'use strict';

// Text-assertion tests for the Factory preview merge (local, opt-in). Recovery is one state table: these tests check
// its rows and columns, the preflight and pinning rules, the merge and abort preconditions, the batch rollback, the
// pass derivation, retirement on rework, the lens and approver recovery, the local and push-mr merge safety rules,
// the builder routing rule, mode independence, guided dispatch, checkpoint letters, entry points, the README, and
// placeholder tables. They check SKILL.md in both layouts and that shared sections are identical.
// Run with: node --test test/factory-preview-merge.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const skill = (layout) => read(`${layout}/.agents/skills/factory/SKILL.md`);

function section(content, heading, nextHeading) {
  const a = content.indexOf(heading);
  const b = content.indexOf(nextHeading, a + heading.length);
  if (a < 0 || b < 0) return '';
  return content.slice(a, b);
}
const preview = (text) => section(text, '## Preview merge (local, opt-in)', '## Merge procedure');
const stateTable = (text) => section(text, '### Preview state', '- **Config.**');
const routing = (text) => section(text, '## Subagent dispatch', '## Handoff summary');
const approve = (text) => section(text, '## Approve\n', '## Abandon');
const rowOf = (text, start) => text.split('\n').find((l) => l.startsWith('| ' + start)) || '';
const stateRow = (text, step) => text.split('\n').find((l) => l.startsWith('| `' + step + '` |')) || '';

test('preview: the section is shared text, identical across the repo and monorepo layouts', () => {
  const [repo, mono] = LAYOUTS.map((l) => preview(skill(l)));
  assert.ok(repo.length > 4000, 'preview section exists');
  assert.equal(repo, mono, 'preview section must match in both layouts');
});

test('preview: never pushes, never touches a remote or production, and runs no git push', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /It never pushes, never touches a remote or production, and never runs a migration, init, backfill, or reset\./, layout + ': never pushes');
    assert.match(p, /\*\*Stop-and-report rule\.\*\* Factory does not recover an interrupted or unexpected preview state\./, layout + ': stop-and-report rule');
    assert.ok(!/git push/.test(p), layout + ': no git push inside preview');
  }
});

test('state table: one row per previewStep, with the columns start, approve, rework, abandon, and the identity persisted before entry', () => {
  for (const layout of LAYOUTS) {
    const t = stateTable(skill(layout));
    assert.match(t, /\| `previewStep` \| Entered when \| Identity persisted before entry \| `\/factory start` \| `approve` \| `rework` \| `abandon` \|/, layout + ': header');
    for (const step of ['eligibility', 'prepare', 'merge', 'verify', 'deploy', 'health', 'ready', 'failure']) {
      assert.ok(stateRow(t, step), layout + ': row for ' + step);
    }
    assert.equal(t.split('\n').filter((l) => /^\| `[a-z-]+` \|/.test(l)).length, 8, layout + ': exactly eight steps');
    assert.equal(stateRow(t, 'batch-retry'), '', layout + ': no batch-retry row (the stop-and-report rule replaces it)');
  }
});

test('state table: approve is allowed only at ready, with a matching identity trio and no failure; start stops at every interrupted state', () => {
  for (const layout of LAYOUTS) {
    const t = stateTable(skill(layout));
    assert.match(stateRow(t, 'ready'), /Pass \(Outcomes\) only with a matching trio, `previewFailure` null, and `previewRound` = `round`/, layout + ': ready approve');
    for (const step of ['eligibility', 'prepare', 'merge', 'verify', 'deploy', 'health', 'failure']) {
      assert.match(stateRow(t, step), /\| Refused/, layout + ': approve refused at ' + step);
    }
    for (const step of ['prepare', 'merge', 'verify', 'deploy', 'health']) {
      assert.match(stateRow(t, step), /\| Stop and report \|/, layout + ': start stops at ' + step);
    }
  }
});

test('state table: rework retires the attempt everywhere it is allowed, and a merge in flight is never reworked over', () => {
  for (const layout of LAYOUTS) {
    const t = stateTable(skill(layout));
    assert.match(stateRow(t, 'merge'), /\| Refused \| Allowed only after the operator restores the expected state \| Refused until resolved \|/, layout + ': merge rework needs the expected state');
    assert.match(stateRow(t, 'ready'), /Allowed; attempt retired/, layout + ': ready rework retires');
    assert.match(stateRow(t, 'failure'), /Allowed; attempt retired \(batch member: refused while a shared step is pending\)/, layout + ': failure rework retires a single job');
    const rework = section(skill(layout), '## Rework', '## Functional QA');
    assert.match(rework, /retire the active preview attempt in the same write: clear `substate` and every `preview\*` field except `previewHistory` \(`previewCommit` included\), and append `\{round, previewCommit, previewRunning\}` to `previewHistory`/, layout + ': retirement in one write');
    assert.match(rework, /The retired attempt is never resumed\./, layout + ': never resumed');
  }
});

test('deploy target: verified local before any deploy or health command runs, and a changed command or brief stops the preview', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /Before any deploy or health command runs, the orchestrator establishes the effective target/, layout + ': target first');
    assert.match(p, /the stack's host and port must resolve to a loopback or other local address \(`localhost`, `127\.0\.0\.1`, `::1`/, layout + ': loopback');
    assert.match(p, /An unknown or non-local target stops the preview\./, layout + ': unknown target stops');
    assert.match(p, /If the job's diff changes that brief, the deploy command, the stack configuration, `factory\/worktree-bootstrap\.md`/, layout + ': changed command or brief stops');
    assert.match(p, /Health checks are read-only: GET requests or documented read-only commands against the local target only\./, layout + ': read-only health');
  }
});

test('activation: only the config decides whether preview is active, and a failed check or step never falls through', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /Only the config decides whether preview is active\./, layout + ': config only');
    assert.match(p, /a failed check or step never falls through to the ordinary route: it stops at `needs-human` in the matching state, and approve cannot bypass it\./, layout + ': no fall-through');
    assert.match(skill(layout), /eligibility failures stop the job at `needs-human`, never at the publish procedure/, layout + ': APPROVE routing stops at needs-human');
  }
});

test('preflight: runs on the exact SHA it inspects, before the first command, and every other SHA needs its own preflight', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    const pre = p.indexOf('- **Preflight.**');
    const elig = p.indexOf('- **Eligibility.**');
    assert.ok(pre > 0 && elig > pre, layout + ': preflight is declared before eligibility');
    assert.match(p, /Before any install, test, or deploy command, run preflight on the exact SHA that command will use: `previewJobSha` for the eligibility checkout, then `previewCommit` for single-job verification and deployment or the final combined SHA for batch verification and deployment\. A passing eligibility preflight does not cover the merged tree\./, layout + ': exact SHA per command');
    assert.match(p, /Any other SHA, including the rollback target, needs its own preflight\./, layout + ': other SHA own preflight');
    assert.match(p, /not only file names: setup scripts, package lifecycle hooks/, layout + ': executable behaviour, not names');
    assert.match(p, /the isolated checkout holds no `\.env` or credential files/, layout + ': no env in the isolated checkout');
    assert.match(p, /If any of these cannot be established, stop for the operator\./, layout + ': stop when unestablished');
    assert.match(p, /It records `previewFingerprint`; any repair, rework, or input change invalidates it\./, layout + ': fingerprint recorded and invalidated');
    assert.match(p, /\(b\) Preflight passes, and the full test suite is green on the job HEAD/, layout + ': test gate after preflight');
  }
});

test('isolation (X5): the job-tip gate runs in an isolated clean checkout on disposable storage, never in the build location or main checkout', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /run in an isolated clean checkout \(a temporary `git worktree add --detach <tmp> <previewJobSha>`\)/, layout + ': isolated checkout');
    assert.match(p, /against disposable storage, with no shared-stack or production credentials\./, layout + ': disposable storage');
    assert.match(p, /Never in the build location or the main checkout, which may hold copied `\.env` files/, layout + ': never in build location or main checkout');
    assert.match(p, /An isolation check runs before any setup or test: no `\.env` or credential files, and disposable storage\. If it cannot pass, stop and ask\./, layout + ': isolation check');
    assert.match(p, /under the same isolation rules as \(b\)/, layout + ': clean verify uses the same rules');
  }
});

test('eligibility (c): the data-safety scan reads file contents, and a hit stops and names the step', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /Scan the contents of the diff \(`git diff <DEFAULT_BRANCH>\.\.\.<previewJobSha>`\), not only its file names/, layout + ': contents scan');
    assert.match(p, /Preview merge never implies database approval\./, layout + ': no implied DB approval');
    assert.match(p, /On any hit, stop, name it, and ask the operator\./, layout + ': stop and ask');
  }
});

test('pinning (N2): the job tip is pinned before eligibility, and the merge uses the pinned SHA, never the branch name', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /After an `APPROVE` \(Loop step 9\)\. Record the exact job SHA used for this round's lens reviews and approval \(`reviewedSha`, Loop step 7\)\. At preview entry copy that recorded SHA to `previewJobSha`, not the current branch tip\./, layout + ': pinned first');
    assert.match(p, /then `git merge --no-ff --no-overwrite-ignore <previewJobSha> -m "Merge factory\/<id> \(preview\)"`/, layout + ': merge of the pinned SHA');
    assert.match(p, /The pinned SHA is merged, never the branch name, and the message is fixed \(only the validated job id, `\^\\d\{3,\}-\[a-z0-9-\]\+\$`, is interpolated\)/, layout + ': validated id only');
    assert.ok(!/<feature>/.test(p), layout + ': feature title is not interpolated in preview');
  }
});

test('abort rule (N1, X10): a merge is aborted only when the default branch, the pre-conflict parent, and MERGE_HEAD all match', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(preview(text), /Abort rule: before any `git merge --abort`, the default branch must be checked out, `HEAD` must be the recorded pre-conflict parent \(`previewBase` or `mergeParent`\), and `MERGE_HEAD` must be the pinned job SHA; otherwise stop and report\./, layout + ': preview abort rule');
    assert.match(text, /On conflict, run `git merge --abort` only under the abort rule \(`HEAD` is `mergeParent`, `MERGE_HEAD` is `mergeJobTip`, and the default branch is checked out; otherwise leave the repository untouched and stop\)/, layout + ': ordinary merge abort rule');
  }
});

test('ordinary local merge (X10): a failed test reset is guarded by the restore check, and set-aside files return only after the reset', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Persist `mergeParent` \(`PRE`\) and `mergeJobTip` \(the reviewed job SHA being merged\) in `job\.json` before the merge, and `mergeSha` \(the new `HEAD`\) only after a clean merge, before step 5\./, layout + ': parent and merge SHA recorded');
    assert.match(text, /On failure, reset only when the default branch is checked out, `HEAD` is `mergeSha`, and `mergeSha`'s parent is `mergeParent`: apply the restore check, then run `git reset --keep \$PRE`, and only after it succeeds and the restore check passes again, copy the `main-copies\/` files back to their paths\. Otherwise preserve the merge, copy nothing back, and report the state/, layout + ': guarded reset with restore check');
  }
});

test('merge messages (X9): ordinary and preview merges use fixed messages, and forge titles are literal arguments', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /4\. `git merge --no-ff --no-overwrite-ignore <reviewedSha> -m "Merge factory\/<id>"`, where `<id>` is the validated job id/, layout + ': ordinary merge fixed message');
    assert.match(text, /--title <the feature title, as one literal argument> --body-file/, layout + ': GitHub title literal');
    assert.match(text, /--title <the feature title, as one literal argument> --description-file/, layout + ': GitLab title literal');
  }
});

test('steps (X8, P5): each step persists its state before it runs, the base and job tip are captured, and the ready write carries the identity trio (P11)', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /Each step persists its state before it runs\./, layout + ': persist before run');
    assert.match(p, /1\. `eligibility`: before any eligibility check, atomically persist `stage: needs-human`, `substate: preview`, `previewStep: eligibility`, `previewRound` and `previewJobSha`\./, layout + ': eligibility persisted');
    assert.match(p, /2\. `prepare`: run the pre-merge collision check \(see Local merge\) without switching branches\./, layout + ': prepare runs the check first');
    assert.match(p, /persist `previewBase` \(the default-branch SHA\) and `previewStep` `prepare` in one write, then run local merge steps 1 and 3/, layout + ': base persisted before the switch');
    assert.match(p, /Then persist `HEAD` as `previewCommit` only if the default branch is still checked out and `HEAD` has exactly the ordered parents `previewBase`, `previewJobSha` and the expected preview message\. Otherwise stop and report; if `HEAD` is unchanged, report that no preview merge was created\. Never revert that pre-existing HEAD\./, layout + ': merge identity only with the parent check (SEC15-2)');
    assert.match(p, /`ready`: in one job\.json write, persist `previewRunning` \(the commit verified on the stack\), `stack` `\{name, url\}` from the verified target/, layout + ': identity trio at ready');
    assert.match(p, /capture the stack's reported identity as `previewPriorRunning` \(or `null`\) and persist it/, layout + ': prior running captured before deploy');
  }
});

test('verify and clean-up: the temporary worktree is removed on success or failure, only the log is kept, and a failed step records failure', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /a temporary `git worktree add --detach <tmp> <previewCommit>`/, layout + ': temp worktree');
    assert.match(p, /Apply the cleanup rule of Eligibility \(b\) on every exit \(`git worktree remove --force <tmp>`, then `git worktree prune`\); only the log is kept\./, layout + ': removal');
    assert.match(p, /The output goes to `factory\/jobs\/<id>\/preview-<n>\.log`\./, layout + ': log kept in the job folder');
    assert.match(p, /A failed step sets `previewStep` `failure` with `previewFailure` \{step, reason, output path\} and `previewRollback` `none`/, layout + ': failed step sets failure');
    assert.match(p, /Report whether the preview merge occurred and whether it remains on the default branch\./, layout + ': report merge state');
    assert.doesNotMatch(p, /The merge stays on the default branch, unpushed, and is reported\./, layout + ': old sentence gone');
  }
});

test('failure (X3): a failed step never enters ordinary publish; approve refuses and never clears previewFailure; only a fresh ready preview clears it', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(preview(text), /A failed step never enters ordinary publish\./, layout + ': no ordinary publish');
    assert.match(stateRow(stateTable(text), 'failure'), /Refused; never clears `previewFailure`/, layout + ': approve refused on failure');
    assert.match(preview(text), /Only a fresh preview that reaches `ready` clears `previewFailure`\./, layout + ': only fresh ready clears');
    assert.match(approve(text), /For an active preview, use the Preview state table\./, layout + ': approve handled by table');
    assert.match(text, /\| `needs-human`, `substate` `preview` \| Preview state table: resume by `previewStep`/, layout + ': start row points to the table');
  }
});

test('batch rollback (X3, X10, security X3): a conflict or failed combined step rolls back under the rules, resets only on the exact chain, and ends in failure with stop-and-report', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /A conflict in job `k`, or a failed combined step, triggers the batch rollback\./, layout + ': triggers');
    assert.match(p, /\(1\) Abort a conflicted merge under the abort rule\./, layout + ': abort first');
    assert.match(p, /\(2\) Reset with `git reset --keep <PRE_BATCH>` \(never `--hard`\) only when the default branch is checked out, no operation is in progress, the tracked tree and index are clean, and the chain `PRE_BATCH`, merge 1, \.\.\. merge N is intact with `HEAD` at its tip; otherwise stop and report\./, layout + ': exact chain guard');
    assert.match(p, /\(3\) Restore the set-aside paths under the restore check\./, layout + ': restore check');
    assert.match(p, /the restore targets only the recorded prior running SHA \(`previewPriorRunning`\), never `PRE_BATCH`: preflight that exact SHA, pass the deploy gate for it, then restore the captured prior deployment and read the identity and health back\. If the prior running SHA is absent or its deploy gate fails, set `previewRollback` `unverified`, do not deploy, and stop and report\. If identity or health read-back fails after the restore deploy, set `previewRollback` `unverified` and stop and report without another deploy\./, layout + ': unverified stops');
    assert.match(p, /With the rollback complete, set `previewRollback` `complete` and `failure` on every member, naming the cause and job `k`\./, layout + ': complete ends in failure');
    assert.ok(!/git reset --keep \$PRE/.test(p), layout + ': no unguarded reset in preview');
    assert.ok(!/batch-retry|dissolv|pending dissolution/.test(p), layout + ': no dissolution machinery');
  }
});

test('QA answer and pass (X2, P2, N4): the pass derives from the words, failure words are never a pass, and the answer is written before the merged write', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    const pass = p.indexOf('  - **Pass**');
    const problem = p.indexOf('  - **Problem**');
    const seg = p.slice(pass, problem);
    const check = seg.indexOf('Repeat the blob-match check against the `previewRunning` and `previewStackUrl` pair');
    const append = seg.indexOf('For a pass, append the exact command under `## Preview QA answer (<previewRunning>)` before marking merged');
    const merged = seg.indexOf('records `merge`');
    assert.ok(pass > 0 && problem > pass, layout + ': pass outcome present');
    assert.ok(check > 0 && append > check && merged > append, layout + ': check, then append, then merged');
    assert.match(seg, /Reuse an existing block only if it contains a qualifying pass for this attempt and commit/, layout + ': idempotent recovery');
    assert.match(seg, /A pass is a bare command, or an answer that passes every listed row\./, layout + ': bare command and full pass');
    assert.match(seg, /For failure, rejection, deferral, an untested row, or ambiguity, do not write a pass block or mark merged/, layout + ': failure words not a pass (N4)');
    assert.match(seg, /which is never read as acceptance,/, layout + ': ambiguous not a pass');
    assert.match(seg, /If the running identity differs or cannot be read, suppress the QA prompt and refuse acceptance/, layout + ': mismatch records nothing');
    assert.match(seg, /so there is no second merge\./, layout + ': no second merge');
    assert.match(seg, /clears `substate` and `previewStep`/, layout + ': clears active state on pass');
    assert.match(p, /\(`\/factory approve <id> \[QA answer\]`, at `ready` only\)/, layout + ': approve precondition');
    assert.match(skill(layout), /\| `\/factory approve <job-id> \[QA answer\]` \|/, layout + ': invocation shows the answer');
  }
});

test('preview outcomes: the problem outcome names approach (b) as the default and approach (a) as required after a push', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /\*\*\(b\), recommended for local-only dev:\*\*/, layout + ': (b) recommended');
    assert.match(p, /\*\*\(a\), required when the default branch has been pushed/, layout + ': (a) required');
    assert.match(p, /`git revert -m 1 <previewCommit>` on the default branch/, layout + ': revert form');
  }
});

test('message: actionable, names the single QA answer, and is never status-only', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /For each job, run `\/factory approve <id>` if every listed check passes on the displayed running commit, or `\/factory rework <id> <failed row and observation>` otherwise\. This is your QA answer; no second approval is required\./, layout + ': single QA answer');
    assert.match(p, /Never send a status-only line such as "waiting for your checks"\./, layout + ': no status-only line');
  }
});

test('config: disabled restores today\'s flow with no message, and push-mr never previews', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /`enabled` `false` restores today's flow exactly, with no message\./, layout + ': disabled is unchanged');
    assert.match(p, /Enabled but not active: say once in chat, `Preview inactive: <reason>`/, layout + ': one inactive line');
    assert.match(p, /Preview is active only when `MERGE_MODE` is `local`/, layout + ': local only');
    assert.match(p, /`push-mr` never previews\./, layout + ': push-mr off');
  }
});

test('approval mode (P9): both modes merge and deploy first and wait for the QA answer; the job never enters merged without that pass', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    const p = preview(text);
    assert.match(p, /When preview is active and eligible, both modes run the local merge and deploy first, then wait at `needs-human` with `substate` `preview` for the QA answer\./, layout + ': both modes merge then wait');
    assert.match(p, /The job never enters stage `merged` without that pass\./, layout + ': never merged without pass');
    assert.match(text, /`APPROVE` and preview is active \(see Preview merge\) → run Preview merge\./, layout + ': routing before auto');
  }
});

test('approve (X1): publishing needs a saved current-round approver decision, a missing one resumes the approver, and a missing role refuses', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    const a = approve(text);
    assert.match(a, /never writes a synthetic `APPROVE` into `decision\.md`/, layout + ': no synthetic APPROVE');
    assert.match(a, /Publishing needs a saved approver decision for the current round: `decision\.md` starts with `APPROVE` or `ESCALATE`, and its `Round:` line equals `round`\./, layout + ': current-round decision');
    assert.match(a, /A missing, invalid, or stale decision refuses, and its remedy is `\/factory start <id>`, which reruns only the approver/, layout + ': approver rerun remedy');
    assert.match(a, /A real `ESCALATE` is answered by the operator/, layout + ': real ESCALATE human answer');
    assert.match(a, /Also refuse while any required independent role is unavailable/, layout + ': missing role refuses');
    assert.match(a, /a `NEEDS-DECISION` or `BLOCKED` gate, or a rework classification with a route still pending/, layout + ': outstanding goal-fit checks');
    assert.match(text, /stage `needs-human` with `failed_stage` `approve`\. An invalid or missing reply saves no decision\./, layout + ': approver twice');
    assert.match(text, /\| `needs-human`, `failed_stage` `review` or `approve` \| Recovery for an unavailable independent role/, layout + ': recovery row');
    assert.match(text, /Without the operator's confirmation in this request that an independent session is available, print the remedy and stop\./, layout + ': confirmation gate');
  }
});

test('lens recovery (P1, S3): a malformed lens twice records BLOCKED with its reason and failed_stage review; start reruns only that lens and keeps the valid replies', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /If it still fails, record that lens as `BLOCKED` with its reason in `round-N\/review-<lens>\.md`, stage `needs-human`, and set `failed_stage` `review`\. The other lenses' valid replies are kept\./, layout + ': malformed twice');
    assert.match(text, /First name every missing or BLOCKED lens\. After the operator confirms independent review is available, `\/factory start <id>` reruns only those lenses, retains valid replies for the reviewed SHA, and resumes at Loop step 8\./, layout + ': only that lens');
    assert.match(text, /Rerun only the approver when all lenses PASS and the decision is missing, invalid, or stale\./, layout + ': approver after lenses');
    assert.match(text, /`reviews` values are `pending`, `PASS`, `CHANGES`, or `BLOCKED`/, layout + ': BLOCKED in schema');
  }
});

test('lens gate: a missing independent review is BLOCKED on its lens with failed_stage review, not a decision', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /save `round-N\/review-<lens>\.md` whose first line is `BLOCKED: no independent reviewer`, set that lens's `reviews` value to `BLOCKED`, stage `needs-human`, and set `failed_stage` `review`/, layout + ': BLOCKED recorded per lens');
    assert.match(text, /Rerun that lens only after the operator confirms an independent reviewer is available\. Approve refuses until then\./, layout + ': stop first remedy');
  }
});

test('mode selector: push-mr and the local merge are exclusive', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Mode selector \(exclusive\): `\{\{MERGE_MODE\}\}` exactly `push-mr` runs the push-mr procedure below, and never the local merge\./, layout + ': exclusive selector');
    assert.ok(!/after the local merge below/.test(text), layout + ': no "after the local merge" wording');
  }
});

test('push-mr cleanup (X11): the local branch is deleted only when the forge source SHA equals pushedSha and the local tip', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /persist it as `pushedSha` in `job\.json`/, layout + ': pushedSha recorded');
    assert.match(text, /delete the local branch with `git branch -D factory\/<id>` only when the merged source SHA saved from step 6's single forge read equals both `pushedSha` and the local tip `git rev-parse factory\/<id>`/, layout + ': deletion guard');
    assert.match(text, /If they differ, or either is missing, retain the branch and report both SHAs\./, layout + ': retain otherwise');
  }
});

test('auto: the wording names the publish procedure, keeps the forge merge and the QA pass human, and matches the README', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(rowOf(text, 'APPROVAL_MODE'), /`auto` runs the publish procedure on an agent `APPROVE`/, layout + ': placeholder wording');
    assert.ok(!/merges on `APPROVE`/.test(text), layout + ': no "merges on APPROVE"');
    assert.match(text, /the forge merge stays the human gate/, layout + ': forge merge stays human');
    const readme = read(`${layout}/factory/README.md`);
    assert.match(readme, /After an agent `APPROVE`, the job runs the publish procedure without the human step before publishing/, layout + ': README auto wording');
    assert.ok(!/An approved job merges automatically/.test(readme), layout + ': README no longer says merges automatically');
  }
});

test('legacy resume: the effective round is derived first, a newer rework beats a READY, and a current READY is not rerun', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    const legacy = section(text, '**Legacy resume (no batch record).**', '- **`needs-human` with `failed_stage` null.**');
    assert.match(legacy, /First derive the effective round, `R_eff`/, layout + ': derive round first');
    assert.match(legacy, /\(1\) a `rework-<k>\.md` newer than `build\.md` supersedes any earlier status, so the builder runs in rework mode/, layout + ': newer rework supersedes READY');
    assert.match(legacy, /\(2\) otherwise a valid `STATUS: READY` in `build\.md` is final for `R_eff`, and the builder is not rerun/, layout + ': READY is final');
    assert.match(legacy, /Test cases: an old READY followed by a newer rework runs the rework; a current READY with no rework is not rerun\./, layout + ': both test cases stated');
    assert.match(legacy, /A count mismatch alone is never a stop\./, layout + ': no stop on counts');
  }
});

test('post-build fit check is checkpoint D, its record starts VERDICT then Checkpoint: D, and R carries no letter and needs a baseline', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /### Post-build fit check \(checkpoint D\)/, layout + ': heading is checkpoint D');
    assert.match(text, /Save the reply, which starts `VERDICT:` and carries `Checkpoint: D`, as a new file `round-<U>\/post-build-fit-<j>\.md`/, layout + ': record name and header');
    assert.match(text, /this reply is exempt from the `VERDICT:`-first template and carries no checkpoint letter\./, layout + ': R has no letter');
    assert.match(text, /report `BLOCKED: missing authoritative baseline`, obtain the original request from the operator, and retry R\./, layout + ': R missing baseline');
    assert.match(text, /do not dispatch and do not save a classification/, layout + ': no classification without baseline');
    const t = routing(text);
    assert.match(rowOf(t, 'Post-build fit check'), /fresh `reviewer` only; never `oracle`/, layout + ': D never oracle');
    assert.match(rowOf(t, 'Rework classification'), /fresh `reviewer` only; never `oracle`/, layout + ': R never oracle');
    assert.match(rowOf(t, 'Rework classification'), /`CLASSIFICATION:` first line/, layout + ': R first line');
    assert.match(rowOf(t, 'Approach goal-fit check (C)'), /not dispatched by Factory/, layout + ': C pointer to canonical caller (P13)');
  }
});

test('goal-fit checks: A and B use Oracle first, fall back to a fresh reviewer, block only when neither runs, and never confirm; a check is not a review', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /## Goal-fit checks \(spec and plan gates\)/, layout + ': heading');
    const reviewer = text.split('\n').find((l) => l.startsWith('- **Reviewer.** A goal-fit check ends in a PASS or CHANGES direction verdict')) || '';
    assert.match(reviewer, /Dispatch `oracle` when the harness has it configured read-only; otherwise dispatch a fresh independent `reviewer`\. `BLOCKED` only when neither can run\./, layout + ': Oracle first, fallback, BLOCKED');
    assert.match(reviewer, /An explicit PASS lets the orchestrator present the artifact for human confirmation, and never confirms it\./, layout + ': PASS never confirms');
    assert.match(rowOf(routing(text), 'Spec goal-fit check (A) or plan goal-fit check (B)'), /`BLOCKED` only when neither can run/, layout + ': table agrees');
    assert.match(text, /No goal-fit check runs without the original request\./, layout + ': goal-fit wording (P13)');
    assert.ok(!/Fit review|goal-fit review(?!er)|plan review(?!er)|No review runs/.test(text), layout + ': no bare "review" wording for checks');
  }
});

test('oracle scope (X15): Oracle\'s Factory checking role is the read-only goal-fit checks (A and B); blocker consultation is separate and authorizes nothing', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /`oracle`'s only Factory checking role is the read-only goal-fit checks \(A and B; C is not a Factory dispatch\)\. Read-only blocker consultation in the autonomous pass stays allowed and never authorizes anything/, layout + ': distinction');
    const readme = read(`${layout}/factory/README.md`);
    assert.match(readme, /Read-only blocker consultation in the autonomous pass stays allowed and never authorizes anything/, layout + ': README distinction');
  }
});

test('baseline (P12): a plan-only job never offers a stale spec.md as a candidate, and rework copies spec.md by spec_route', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /the existing `spec\.md` on the spec route only; a plan-only job never offers `spec\.md`, even when a stale one is present/, layout + ': baseline candidates');
    assert.match(text, /Copy `spec\.md` on the spec route only \(by `spec_route`, never by file existence: a plan-only job copies no `spec\.md`, even a stale one\)/, layout + ': doc sync by route');
  }
});

// Routing answers, read from the Subagent dispatch role table and its routing rule.
test('routing rule: builder choice happens before any split, with the stated precedence, and guided selects once from the whole dispatch', () => {
  for (const layout of LAYOUTS) {
    const text = routing(skill(layout));
    assert.match(text, /\*\*Routing rule\.\*\* Choose the builder before splitting work\. Initial build: `implementer`\./, layout + ': rule opens');
    assert.match(text, /security findings take precedence and keep the whole round on `implementer`; code-only work goes to `implementer`;/, layout + ': security precedence');
    assert.match(text, /UI-only fixes go to an edit-enabled `designer` \(fallback: `frontend-developer`, then `implementer`\);/, layout + ': UI-only chain');
    assert.match(text, /combined UI\/UX work or mixed UI and code goes wholly to an edit-enabled `frontend-developer` \(fallback: `implementer`\)\. Do not split a mixed repair\./, layout + ': mixed whole round');
    assert.match(text, /For `guided`, select the agent once from the entire dispatch, including the complete set of parked items selected, by these same rules; `guided`, `auto`, and `human` do not select an agent\./, layout + ': guided selects once');
  }
});

test('routing (a)-(d): initial build implementer; security or code-only repair implementer; visual-only designer chain; mixed frontend-developer whole round', () => {
  for (const layout of LAYOUTS) {
    const t = routing(skill(layout));
    assert.match(rowOf(t, 'Builder: initial build'), /\| `implementer` \| no \| `build` task/, layout + ': (a)');
    assert.match(rowOf(t, 'Builder: repair, rework, or guided, with security or code-only findings'), /\| `implementer` \|/, layout + ': (b)');
    const c = rowOf(t, 'UI builder: repair, rework, or guided, with visual-only fixes');
    assert.match(c, /`designer` \(edit-enabled\); fallback `frontend-developer`, then `implementer`/, layout + ': (c) chain');
    assert.match(c, /visual-only fixes \(regardless of which lens reported them; no interaction-flow, code-lens, or security finding\)/, layout + ': (c) scope');
    const d = rowOf(t, 'UI builder: repair, rework, or guided, with combined UI/UX work or mixed UI and code');
    assert.match(d, /`frontend-developer` \(edit-enabled\); fallback `implementer`; never split/, layout + ': (d)');
  }
});

test('routing: no table row maps a mode to an agent, and mode-independence is stated', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Routing depends on the work in each dispatch or build lane, not on the approval or autonomy mode/, layout + ': mode independence');
    assert.match(text, /Build lanes inherit the round's agent\. A round is split into lanes only under the Build lanes procedure/, layout + ': lanes inherit');
    const rows = routing(text).split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Role'));
    assert.ok(rows.length >= 12, layout + ': role table rows present');
    for (const r of rows) {
      assert.doesNotMatch(r, /\bautonomous\b|\bauto\b|\bhuman\b|APPROVAL_MODE|autonomy/, layout + ': no mode word in a row: ' + r.slice(0, 60));
    }
  }
});

test('guided: the builder dispatch is guided, not autonomous, and every guided dispatch routes by content', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Run the Build lanes procedure in `guided` mode/, layout + ': guided re-dispatch');
    assert.match(text, /The builder runs only in guided mode, through the Build lanes procedure/, layout + ': guided only');
    assert.match(text, /build, repair, rework, or guided for the builder/, layout + ': task line lists guided');
    assert.ok(!/in `autonomous` mode|in autonomous mode|or autonomous for the builder/.test(text), layout + ': no autonomous builder mode');
    const brief = read(`${layout}/.agents/skills/factory/roles/build.md`);
    assert.match(brief, /- \*\*Guided:\*\* finish only the newly eligible items/, layout + ': brief guided mode');
    assert.ok(!/\*\*Autonomous:\*\*/.test(brief), layout + ': brief has no autonomous mode');
  }
});

test('UI work (X13): visual fixes are direct, the mockup rule is referenced, the answer never selects the builder, and the initial build is implementer', () => {
  for (const layout of LAYOUTS) {
    const text = routing(skill(layout));
    assert.match(text, /\*\*UI work\.\*\* Simple visual fixes are implemented directly by the UI builder with no question\./, layout + ': simple direct');
    assert.match(text, /The mockup question follows the canonical rule in \[subagent-workflow\]\(\.\.\/\.\.\/\.\.\/\.claude\/rules-snippets\/subagent-workflow\.md#ui-work-routing\) \(UI Work Routing\)/, layout + ': canonical link');
    assert.match(text, /this skill stores only the answer, in `job\.json` `mockups` \(`true` or `false`\)/, layout + ': storage only');
    assert.match(text, /The mockup answer never selects the builder, and the initial build is always `implementer`\./, layout + ': answer never selects builder');
    assert.match(text, /If no answer is recorded when the affected dispatch is due, obtain it before that dispatch, and the UI repair waits\./, layout + ': waits');
  }
  const canonical = read('src/repo/.claude/rules-snippets/subagent-workflow.md');
  assert.match(canonical, /### UI Work Routing/, 'canonical UI Work Routing heading exists');
});

test('entry points (X12): the builder row names two destinations, and routing is not restated, in all four harnesses', () => {
  const files = ['.claude/commands/factory.md', '.opencode/commands/factory.md', '.github/prompts/factory.prompt.md', '.cursor/commands/factory.md'];
  for (const layout of LAYOUTS) {
    for (const f of files) {
      const text = read(`${layout}/${f}`);
      const row = text.split('\n').find((l) => l.startsWith('| `implementer`, `designer`, or `frontend-developer`')) || '';
      assert.match(row, /Builder\. The agent for each dispatch is chosen by the routing rule in the factory skill's Subagent dispatch table/, layout + ' ' + f + ': canonical pointer');
      assert.match(row, /Writes `build\.md` in the job folder, `qa\.md` in the build location's feature folder, and code in the build location, using the paths block\./, layout + ' ' + f + ': two destinations');
      assert.ok(!/`build\.md` and `qa\.md` in the job folder/.test(row), layout + ' ' + f + ': qa.md is not in the job folder');
      assert.ok(!/combined UI\/UX|mixed ui\/code|mixed UI and code/i.test(text), layout + ' ' + f + ': routing not restated');
    }
  }
});

test('README: one PREVIEW_MERGE row, the preview handoff paragraph before the approval-mode bullets, and the in-place rule (P9, P10)', () => {
  for (const layout of LAYOUTS) {
    const readme = read(`${layout}/factory/README.md`);
    const rows = readme.split('\n').filter((l) => l.startsWith('| PREVIEW_MERGE |'));
    assert.equal(rows.length, 1, layout + ': one PREVIEW_MERGE row');
    const approval = readme.indexOf('## Approval modes');
    const handoff = readme.indexOf('When local preview is active and eligible, both modes merge and deploy locally first');
    const human = readme.indexOf('- **`human`** (default).');
    assert.ok(approval > 0 && handoff > approval && human > handoff, layout + ': paragraph before the bullets');
    assert.match(readme, /The job never enters stage `merged` without that pass\./, layout + ': never merged without pass');
    assert.match(readme, /Use `\/factory approve <id>` to pass the displayed checks, or `\/factory rework <id> <failed row and observation>` to report a problem\./, layout + ': both destinations');
    assert.match(readme, /except during a local merge or preview: then it is on the default branch and stays there through preview QA and any stop-and-report state/, layout + ': in-place rule (P10)');
  }
});

test('placeholders: PREVIEW_MERGE is in the skill, the factory README, the root README, and both bootstrap placeholder tables', () => {
  for (const layout of LAYOUTS) {
    assert.match(skill(layout), /\| PREVIEW_MERGE \| Local preview settings, a JSON object/, layout + ': skill placeholder row');
    assert.match(skill(layout), /`\{"enabled": true, "stack": null, "deployCommand": null, "deployAgent": null, "healthChecks": \[\]\}`/, layout + ': default value');
    assert.match(read(`${layout}/factory/README.md`), /\| PREVIEW_MERGE \|/, layout + ': factory README placeholder row');
    assert.match(read(`${layout}/.claude/prompt-snippets/bootstrap.md`), /\{\{PREVIEW_MERGE\}\}/, layout + ': bootstrap placeholder');
  }
  assert.match(read('README.md'), /\{\{PREVIEW_MERGE\}\}/, 'root README placeholder');
});

// Round 4 text checks: batch deployment record, pinned persistence, cleanup, bootstrap digest, push-mr precondition, health probe.
test('round 4 (K3, V8): the combined batch record is persisted before the deploy, and a batch rollback restores the prior stack with read-back', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /Before the deploy, persist the combined SHA, its fingerprint, and the prior stack identity in the leader's `previewBatch\.record`/, layout + ': shared record');
    assert.match(p, /preflight that exact SHA, pass the deploy gate for it, then restore the captured prior deployment and read the identity and health back\./, layout + ': restore with read-back');
  }
});

test('round 4 (K6, V2): step 1 persists the eligibility state atomically before any check, and the state is retained on a stop', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /before any eligibility check, atomically persist `stage: needs-human`, `substate: preview`, `previewStep: eligibility`, `previewRound` and `previewJobSha`/, layout + ': atomic persist');
    assert.match(p, /On an eligibility stop, retain that step, record the failed check and remedy, and report that no merge occurred\./, layout + ': retained stop');
    assert.match(p, /Any active `previewStep` excludes the ordinary publish procedure\./, layout + ': excludes publish');
    assert.match(p, /the index and tracked tree are clean/, layout + ': clean before the merge');
  }
});

test('round 4 (K7, V6): every temporary checkout is removed on every exit, the eligibility run reports a leftover path, and the verify step uses the same rule', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /On success, failure, or an isolation stop, remove the temporary worktree created for this eligibility run and prune its registration\./, layout + ': eligibility cleanup');
    assert.match(p, /If removal fails, report its exact path before retrying\./, layout + ': leftover path reported');
    assert.match(p, /Apply the cleanup rule of Eligibility \(b\) on every exit/, layout + ': verify uses the same rule');
  }
});

test('round 4 (NEW2): a reused worktree reruns the bootstrap only when the approved digest still matches, and the owned bootstrap file says so', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /It reruns only if the operator-approved baseline still matches: `bootstrapDigest` in `job\.json` is a SHA-256 digest of the file's non-comment, non-blank lines plus every project script, lifecycle hook, and lockfile those lines invoke/, layout + ': digest gate');
    assert.match(text, /If the baseline changed or cannot be determined, run nothing and stop for the operator's approval: write `bootstrap\.md` with the changed items, stage `needs-human`; then record the new digest and run\./, layout + ': stop before executing');
    assert.match(text, /- `bootstrapDigest`: the approved SHA-256 digest of `factory\/worktree-bootstrap\.md`/, layout + ': job.json field');
    assert.match(read(`${layout}/factory/worktree-bootstrap.md`), /Rework stops for the operator's approval if this file, or any script, lifecycle hook, or lockfile its steps invoke, changed since the last approved run/, layout + ': bootstrap file rule');
  }
});

test('round 4 (NEW3): push-mr finish sets files aside only after the main checkout is on the default branch with no operation in progress and a clean tracked tree', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Then, only if the main checkout is on `\{\{DEFAULT_BRANCH\}\}`, no merge, rebase, cherry-pick, or other operation is in progress, and its tracked tree is clean, set the main checkout's feature copies aside with local merge step 3 \(otherwise leave every file untouched and report it\)/, layout + ': finish precondition');
  }
});

test('round 4 (NEW4, V10): before ready, an independent identity probe must match the expected commit; absent, unavailable, or mismatched stops before ready, and HTTP success alone is not identity', () => {
  for (const layout of LAYOUTS) {
    const p = preview(skill(layout));
    assert.match(p, /use the project's documented read-only running-version or blob-identity probe and compare its result with the expected single or combined commit/, layout + ': probe');
    assert.match(p, /An absent probe, an unavailable result, or a mismatch stops before `ready`; an empty health-check list or HTTP success alone does not prove identity\./, layout + ': stop before ready');
    assert.match(p, /The probe is read from the running stack, never from the deploy command's output\./, layout + ': independent of deploy output');
    assert.match(p, /`stack` \(`null`, or `\{name, url\}` for the local stack; locality is validated against `url`\)/, layout + ': stack shape');
  }
});

test('round 4 (V1, V4): approve and status name the lens reruns, the preview skips ordinary human QA and publish, and the preview merge uses ordinary steps 1-3 only', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /First name every missing or BLOCKED lens\./, layout + ': names lenses');
    assert.match(text, /Rerun only the approver when all lenses PASS and the decision is missing, invalid, or stale\./, layout + ': approver only all PASS');
    assert.match(text, /Do not offer approve while a prerequisite is missing/, layout + ': no approve offered');
    assert.match(text, /For `failed_stage` `review` or `approve`, the Resume recovery row names the lenses to rerun\./, layout + ': status points to recovery');
    assert.match(text, /At `ready`, apply steps 3–5, then Preview Outcomes exclusively; skip step 6 and step 8/, layout + ': preview skips ordinary QA and publish');
    assert.match(text, /Preview uses ordinary local merge steps 1–3 only; Preview Procedure and Outcomes own its merge, acceptance and cleanup\./, layout + ': steps 1-3 only');
  }
});

// Round 5 text checks: pinned publication (W3), MR finish verification (W4), QA prompt on a displaced stack (W10),
// QA prompt staging (W7), step counts (W11), and builder continuity by content (G4).
test('round 5 (W3, S5-1): ordinary publication requires the job tip to equal reviewedSha; local merge and push-mr publish that pinned SHA', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /8\. Before publishing, require the job tip to equal `reviewedSha`; otherwise restart review \(Loop step 7\) and publish nothing\./, layout + ': approve step 8 pin');
    assert.match(text, /4\. `git merge --no-ff --no-overwrite-ignore <reviewedSha> -m "Merge factory\/<id>"`/, layout + ': local merge pinned SHA');
    assert.match(text, /Require the job tip to equal `reviewedSha`; otherwise restart review and push nothing\. Then `git -C <build location> push --no-follow-tags --recurse-submodules=no origin <reviewedSha>:refs\/heads\/factory\/<id>`/, layout + ': push explicit SHA to the job ref');
    assert.match(text, /Run steps 2 and 3 to update it only when the job tip equals `reviewedSha` \(otherwise restart review\)/, layout + ': MR update pinned');
  }
});

test('round 5 (W4, S5-2): the MR finish writes merged only when the forge source SHA equals reviewedSha and pushedSha; a mismatch keeps evidence and resolves nothing', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /require the merged source SHA \(`headRefOid`, or GitLab `sha`\) to equal `reviewedSha` and `pushedSha`/, layout + ': forge SHA check');
    assert.match(text, /report `forge merged; Factory verification does not match`, keep the evidence and the branch, write nothing to `merge`, run no cleanup, make no ticket transition, and leave the job unresolved/, layout + ': mismatch report and unresolved');
  }
});

test('round 5 (W10): a displaced ready stack suppresses the QA prompt, refuses acceptance, and never adopts the observed SHA', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    const stale = 'If the running identity differs or cannot be read, suppress the QA prompt and refuse acceptance.';
    assert.equal(text.split(stale).length - 1, 2, layout + ': both sites carry the instruction');
    assert.match(text, /Ask the operator to restore the recorded deployment through the project's safe local deploy procedure, then run `\/factory start <id>` to repeat the read-only identity and health checks\./, layout + ': restore then repeat');
    assert.match(text, /never adopt the observed SHA as the tested commit/, layout + ': never adopt');
  }
});

test('round 5 (W7): for any active previewStep the Preview state table replaces the ordinary QA guidance, and only a qualifying pass writes the acceptance block', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /For any active `previewStep`, use the Preview state table instead of the ordinary QA guidance below\./, layout + ': state table replaces QA guidance');
    assert.match(text, /At `ready`, print the Preview message only\./, layout + ': ready prints message only');
    assert.match(text, /only a qualifying pass gets a `## Preview QA answer` block; other answers get a `## Preview QA note`\./, layout + ': only pass gets acceptance block');
  }
});

test('round 5 (W11): the preview intro cites the local merge preparation and merge, and the abandon note qualifies commits already on the default branch', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /It is the local merge's preparation and merge, a preflight/, layout + ': preparation and merge');
    assert.match(text, /its commits already reached the default branch through a merge or a preview merge, which the `U` count then reflects/, layout + ': abandon qualified');
  }
});

test('round 5 (G4): builder continuity selects the repair agent by content first and resumes a child only when it is that agent', () => {
  for (const layout of LAYOUTS) {
    const text = skill(layout);
    assert.match(text, /Select the repair agent by content first \(Subagent dispatch\)\. Resume the previous child only if it is that same agent and the harness supports it \(Claude\); otherwise dispatch the selected agent with the existing build brief and artifacts\./, layout + ': continuity by content');
  }
});
