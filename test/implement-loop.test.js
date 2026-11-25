'use strict';

// Regression checks for the implement commands. The shared loop lives in prompt-snippets/implement.md:
// the orchestrator sets checks, a builder builds, a read-only reviewer returns a verdict, and the
// orchestrator decides. These checks pin the loop's structure and contract tokens, the wiring from each
// harness wrapper to its snippet, the order of review before commit, and the tool grants that let the
// orchestrator dispatch a builder and a reviewer. They do not compare prose.
// Run with: node --test test/implement-loop.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const COMMANDS = ['implement', 'implement-feature', 'implement-fixes'];

// Wrapper path (relative to a layout) for each harness.
const WRAPPER = {
  claude: (name) => `.claude/commands/${name}.md`,
  cursor: (name) => `.cursor/commands/${name}.md`,
  opencode: (name) => `.opencode/commands/${name}.md`,
  copilot: (name) => `.github/prompts/${name}.prompt.md`,
};

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function frontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

function assertOrder(content, first, second) {
  const a = content.indexOf(first);
  const b = content.indexOf(second);
  assert.notEqual(a, -1, `missing: ${first}`);
  assert.notEqual(b, -1, `missing: ${second}`);
  assert.ok(a < b, `"${first}" must come before "${second}"`);
}

for (const layout of LAYOUTS) {
  for (const name of COMMANDS) {
    for (const [harness, wrapper] of Object.entries(WRAPPER)) {
      test(`implement loop: ${layout} ${harness} ${name} wrapper reaches its own snippet`, () => {
        const rel = `${layout}/${wrapper(name)}`;
        assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing wrapper ${rel}`);
        assert.ok(read(rel).includes(`prompt-snippets/${name}.md`),
          `${rel} must name prompt-snippets/${name}.md`);
      });
    }

    test(`implement loop: ${layout} ${name} Claude command allows Task so the orchestrator can dispatch`, () => {
      const rel = `${layout}/.claude/commands/${name}.md`;
      assert.match(frontmatter(read(rel)), /^allowed-tools:.*\bTask\b/m, `${rel} must allow Task`);
    });

    test(`implement loop: ${layout} ${name} Copilot prompt grants agent when it restricts tools`, () => {
      // A prompt without a tools line uses the harness default, which already allows dispatch.
      const rel = `${layout}/.github/prompts/${name}.prompt.md`;
      const tools = frontmatter(read(rel)).match(/^tools:.*$/m);
      if (tools) assert.match(tools[0], /"agent"/, `${rel} restricts tools without "agent"`);
    });
  }

  test(`implement loop: ${layout} implement.md has the five loop steps in order and the verdict contract`, () => {
    const content = read(`${layout}/.claude/prompt-snippets/implement.md`);
    const steps = [...content.matchAll(/^### ([1-5])\. /gm)].map((m) => m[1]);
    assert.deepEqual(steps, ['1', '2', '3', '4', '5']);
    assert.ok(content.includes('`VERDICT: PASS`'), 'PASS verdict token missing');
    assert.ok(content.includes('`VERDICT: CHANGES`'), 'CHANGES verdict token missing');
    assertOrder(content, '### 2. Build', '### 4. Review');
    assertOrder(content, '### 4. Review', '### 5. Decide');
  });

  test(`implement loop: ${layout} builder snippet leaves acceptance to the orchestrator`, () => {
    const content = read(`${layout}/.claude/agents-snippets/implementer.md`);
    assert.match(content, /orchestrator[^\n]*accept|accept[^\n]*orchestrator/i,
      'the builder guidance must say the orchestrator accepts');
  });

  for (const name of ['implement-feature', 'implement-fixes']) {
    test(`implement loop: ${layout} ${name} links the shared loop and reviews before committing`, () => {
      const content = read(`${layout}/.claude/prompt-snippets/${name}.md`);
      assert.ok(content.includes('(implement.md)'), 'must link to the shared loop');
      assertOrder(content, '(implement.md)', 'git commit -m');
    });
  }

  test(`implement loop: ${layout} implement-feature ticks tasks only after the commit`, () => {
    assertOrder(read(`${layout}/.claude/prompt-snippets/implement-feature.md`),
      'git commit -m', 'Mark Task Complete');
  });

  test(`implement loop: ${layout} feature binds task-local inputs before each task loop`, () => {
    const content = read(`${layout}/.claude/prompt-snippets/implement-feature.md`);
    const task = content.slice(content.indexOf('For each dependent task, in dependency order'),
      content.indexOf('5. **Feature Review**'));
    assert.match(task, /bind the current task's original text unchanged, task-local acceptance criteria, and applicable real checks/);
    assert.match(task, /implement\.md step 1/);
    assert.match(task, /Do not use another task's criteria or require later tasks to pass/);
    assert.match(task, /Keep the saved baseline unchanged/);
    assertOrder(task, 'bind the current task', 'c. **Delivery loop for the task**');
  });

  test(`implement loop: ${layout} feature preserves and restores full-feature inputs for aggregate review`, () => {
    const content = read(`${layout}/.claude/prompt-snippets/implement-feature.md`);
    const setup = content.slice(0, content.indexOf('2. **Parallelization Analysis**'));
    const aggregate = content.slice(content.indexOf('5. **Feature Review**'),
      content.indexOf('6. **Create Pull Request**'));
    assert.match(setup, /Preserve the original full-feature text, acceptance criteria, and real checks separately/);
    assert.match(aggregate, /Restore the saved full-feature text, acceptance criteria, and real checks/);
    assertOrder(aggregate, 'Restore the saved full-feature', 'Run implement.md steps 3, 4 and 5');
    assert.match(aggregate, /against every requirement from step 1, not only the last task/);
  });

  test(`implement loop: ${layout} implement-fixes pushes only after acceptance`, () => {
    assertOrder(read(`${layout}/.claude/prompt-snippets/implement-fixes.md`),
      '(implement.md)', 'git push -u origin');
  });
}

// Evidence freshness, integrated final checks, unknown write sets, ad-hoc routing, user amendments, and the
// prompt-gate disclaimer. Each check pins one safeguard's wording in both layouts.
for (const layout of LAYOUTS) {
  const implement = `${layout}/.claude/prompt-snippets/implement.md`;
  const feature = `${layout}/.claude/prompt-snippets/implement-feature.md`;

  test(`implement loop: ${layout} acceptance evidence must match the accepted tree and invalidation is scoped`, () => {
    const content = read(implement);
    assert.match(content, /\*\*Evidence freshness\.\*\*/);
    assert.match(content, /invalidates the evidence it affects: rerun the checks covering those ACs and re-review the changed diff/);
    assert.match(content, /Reuse evidence that the edit cannot affect/);
    assert.match(content, /If unsure whether an edit affects a check, treat it as affected/);
    assert.match(content, /Do not rerun everything for an unrelated edit/);
  });

  test(`implement loop: ${layout} integrated final regression checks run once and never invent commands`, () => {
    const content = read(implement);
    assert.match(content, /Checks are scoped: each repair and each task runs the checks for its own ACs/);
    assert.match(content, /After all writers are reconciled, run the project's full required regression checks once/);
    assert.match(content, /Use only commands the project defines; do not invent them/);
    assert.match(content, /A failed required check is a repair/);
    assert.match(content, /cannot run is BLOCKED/);
    assert.match(read(feature), /once on the final integrated tree/);
    assert.match(read(feature), /Any edit after this run requires revalidation/);
  });

  test(`implement loop: ${layout} unknown or undeclared write sets run serially in both loop and feature`, () => {
    assert.match(read(implement), /write set is unknown or undeclared runs serially/);
    assert.match(read(feature), /Tasks with an unknown or undeclared write set → keep sequential/);
  });

  test(`implement loop: ${layout} nontrivial ad-hoc changes route through the loop, direct work needs an independent reviewer`, () => {
    const content = read(implement);
    assert.match(content, /Nontrivial ad-hoc code changes outside these commands follow the same loop/);
    assert.match(content, /Context-heavy nontrivial work may be built directly, but acceptance still needs an independent reviewer; without one it is BLOCKED/);
    assert.match(content, /Trivial changes \(typos, one-line edits\) stay outside this loop/);
    assert.doesNotMatch(content, /Trivial or context-heavy work/);
  });

  test(`implement loop: ${layout} user amendments join the requirement; goals are not "task text only"`, () => {
    const content = read(implement);
    assert.match(content, /Explicit user amendments and answers given during the loop are part of the requirement/);
    assert.match(content, /record each one as a dated entry beside the original text \(do not rewrite it\)/);
    assert.match(content, /Goals are the original supplied task plus the user amendments recorded in step 1/);
    assert.doesNotMatch(content, /Goals are the supplied task text only/);
  });

  test(`implement loop: ${layout} clarification is task-scoped; only a whole-request gap stops the run`, () => {
    const content = read(implement);
    assert.doesNotMatch(content, /and wait\./, 'blocking "ask and wait" wording must be gone');
    assert.match(content, /Ask one targeted question with its options/);
    assert.match(content, /A task-scoped question blocks only that task and its dependents/);
    assert.match(content, /independent tasks with clear requirements continue/);
    assert.match(content, /If the whole request is unclear, stop and ask before any build/);
    assert.match(content, /Autonomous Execution and Blockers/);
  });

  test(`implement loop: ${layout} missing check, decision, and reviewer gaps scope to the affected work, not an unconditional stop`, () => {
    const content = read(implement);
    for (const stale of [
      /Stop and ask the user for the command/,
      /Stop, report `BLOCKED` with the blocker/,
      /Stop, report `NOT ACCEPTED: needs decision`/,
      /Report `BLOCKED`, and stop\./,
    ]) {
      assert.doesNotMatch(content, stale, `unconditional stop must be gone: ${stale}`);
    }
    assert.match(content, /It blocks acceptance of the affected task and of any aggregate run that needs it/);
    assert.match(content, /Ask the user for the command as one targeted question/);
    assert.match(content, /Independent tasks whose checks do not depend on the gap continue/);
    assert.match(content, /Work that depends on it stops; independent authorized work with its own checks and reviewer continues/);
    assert.match(content, /Stop work on that task and its dependents, report `NOT ACCEPTED: needs decision`/);
  });

  test(`implement loop: ${layout} missing reviewer blocks acceptance only, never all discovery or build`, () => {
    const content = read(implement);
    assert.match(content, /No independent reviewer means nothing is accepted/);
    assert.match(content, /Without an independent reviewer nothing is accepted/);
    assert.match(content, /discovery and builds that do not need acceptance may continue and be reported as awaiting review/);
    assert.match(content, /Do not treat all work as blocked when independent discovery or build can proceed/);
    assert.match(content, /Never mark blocked work accepted/);
  });

  test(`implement loop: ${layout} the run stops only when no authorized work remains or a mandatory gate applies`, () => {
    const content = read(implement);
    assert.match(content, /Stop the run only when no authorized work remains or a mandatory approval, security, or permission gate applies/);
    assert.match(content, /Mandatory approval, security, and permission gates are never bypassed/);
    assert.match(content, /apply to the affected work, or to the whole run when the gate is global/);
    assert.match(content, /A review PASS alone never accepts/);
    assert.match(content, /an independent reviewer produced the verdict/);
  });

  test(`implement loop: ${layout} prompt gates are instructions, with no automatic-resume guarantee`, () => {
    const content = read(implement);
    assert.match(content, /prompt instructions, not host enforcement/);
    assert.match(content, /does not guarantee automatic resume/);
  });
}

// No mandatory pre-build planning gate: the supplied task is the requirement. Spec and plan files are
// optional context, so the shared loop and the feature snippet must not require them before a build.
for (const layout of LAYOUTS) {
  test(`implement loop: ${layout} implement.md does not gate the build on spec or plan files`, () => {
    assert.doesNotMatch(read(`${layout}/.claude/prompt-snippets/implement.md`), /\b(spec|plan)\.md\b/);
  });

  test(`implement loop: ${layout} implement-feature does not require spec or plan reads before building`, () => {
    const content = read(`${layout}/.claude/prompt-snippets/implement-feature.md`);
    assert.doesNotMatch(content, /^\s*-\s*Read (specification|implementation plan) from/m);
  });
}

// The loop repeats: repair loops back to the build step, and acceptance, a blocker, or a user decision are the only exits.
for (const layout of LAYOUTS) {
  test(`implement loop: ${layout} implement.md repair loops back to the build step and exits are explicit`, () => {
    const content = read(`${layout}/.claude/prompt-snippets/implement.md`);
    assert.ok(content.includes('**Repair (back to step 2):**'), 'repair must loop back to step 2');
    assertOrder(content, '**Repair (back to step 2):**', '**Accept (exit):**');
    assert.ok(content.includes('**Blocked (exit for the affected work):**'), 'blocked exit missing');
    assert.ok(content.includes('**Needs user decision (exit for the affected work):**'), 'needs-decision exit missing');
  });
}

// Bypass regressions found by independent review. Each check pins one way the loop could accept work it should not.
for (const layout of LAYOUTS) {
  const implement = `${layout}/.claude/prompt-snippets/implement.md`;
  const feature = `${layout}/.claude/prompt-snippets/implement-feature.md`;
  const fixes = `${layout}/.claude/prompt-snippets/implement-fixes.md`;

  test(`implement loop: ${layout} no round cap: the loop ends only at accept, blocked or a user decision`, () => {
    for (const rel of [implement, feature, fixes]) {
      assert.doesNotMatch(read(rel), /round cap|three review rounds|\bmax(imum)? (3|three) (review )?rounds/i, rel);
    }
  });

  test(`implement loop: ${layout} missing independent reviewer is BLOCKED, never self-review acceptance`, () => {
    const content = read(implement);
    assert.match(content, /no independent reviewer[^\n]*BLOCKED/i);
    assert.doesNotMatch(content, /accept[^\n]*self-review|self-review[^\n]*accept/i);
  });

  test(`implement loop: ${layout} review covers preexisting baseline and untracked files without staging`, () => {
    const content = read(implement);
    for (const token of ['git status --porcelain', 'git diff --binary HEAD', 'baseline/files/',
      'read each one in full']) {
      assert.ok(content.includes(token), `implement.md must include: ${token}`);
    }
    assert.doesNotMatch(content, /pre\.patch|minus the preexisting patch/, 'the review must compare content, not subtract patches');
  });

  test(`implement loop: ${layout} accepting only reports; commits happen only where the calling flow asks`, () => {
    const content = read(implement);
    assert.doesNotMatch(content, /Then commit, and report|The orchestrator commits|orchestrator commits and ticks/);
    assert.ok(content.includes('The loop never commits by itself'), 'the loop must state it does not commit');
    assert.doesNotMatch(content, /^\s*git add -A\s*$/m, 'no blanket staging');
    const agent = read(`${layout}/.claude/agents-snippets/implementer.md`);
    assert.doesNotMatch(agent, /The orchestrator commits/, 'the builder guidance must not imply an automatic commit');
  });

  for (const name of ['implement-feature', 'implement-fixes']) {
    test(`implement loop: ${layout} ${name} commits only accepted paths and skips empty commits`, () => {
      const content = read(`${layout}/.claude/prompt-snippets/${name}.md`);
      assert.ok(content.includes('Skip the commit when nothing is staged'), 'empty commits must be skipped');
      assert.doesNotMatch(content, /^\s*git add -A\s*$/m, 'no blanket staging');
    });
  }

  test(`implement loop: ${layout} supplied-task exception covers the spec and plan prerequisites narrowly`, () => {
    for (const rel of [`${layout}/AGENTS.md`, `${layout}/.claude/rules-snippets/documentation.md`]) {
      const content = read(rel);
      assert.match(content, /supplied-task exception/i, `${rel} must state the exception`);
      assert.match(content, /implement-fixes|implement-feature/, `${rel} must name the commands it covers`);
    }
  });

  test(`implement loop: ${layout} no subagent-driven-development dispatch in generic or feature prompts`, () => {
    for (const rel of [implement, feature]) {
      assert.doesNotMatch(read(rel), /subagent-driven-development/, rel);
    }
  });

  test(`implement loop: ${layout} no fixed AC count and no "one to three" limit`, () => {
    assert.doesNotMatch(read(implement), /one to three|\bmax(imum)? (\d+|one|two|three|four|five) (AC|criteria)/i);
  });

  test(`implement loop: ${layout} feature review diffs against the merge-base, not the stale branch range`, () => {
    const content = read(feature);
    assert.match(content, /git merge-base/);
    assert.doesNotMatch(content, /git diff \{\{DEFAULT_BRANCH\}\}\.\.\.HEAD/);
    assert.ok(content.includes('implement.md steps 3, 4 and 5'), 'feature review must run verify, review and decide');
  });

  test(`implement loop: ${layout} fixes initialize branch and baseline before reproduction or build`, () => {
    const content = read(fixes);
    assertOrder(content, 'Load Fix Context', 'git checkout -b fix/');
    assertOrder(content, 'git checkout -b fix/', 'Reproduce and Build');
    assertOrder(content, 'Reproduce and Build', 'Verify, Review and Decide');
  });

  test(`implement loop: ${layout} fixes use one builder, not a single-agent inline fix`, () => {
    const content = read(fixes);
    assert.doesNotMatch(content, /single-agent/i);
    assert.match(content, /one builder/i);
  });
}

// Parallel lanes: split before dispatch, lane batching per command, and repairs stay with the same owner.
for (const layout of LAYOUTS) {
  const implement = `${layout}/.claude/prompt-snippets/implement.md`;
  const feature = `${layout}/.claude/prompt-snippets/implement-feature.md`;
  const fixes = `${layout}/.claude/prompt-snippets/implement-fixes.md`;

  test(`implement dispatch: ${layout} links the canonical Split Before Dispatch rule`, () => {
    assert.ok(read(`${layout}/.claude/rules-snippets/subagent-workflow.md`).includes('### Split Before Dispatch'));
    for (const rel of [implement, feature, fixes]) {
      assert.ok(read(rel).includes('subagent-workflow.md#split-before-dispatch'), `${rel} must link the rule`);
    }
  });

  test(`implement dispatch: ${layout} checkpoint C records focused lanes or a one-builder reason and adds no gate`, () => {
    const content = read(implement);
    assert.match(content, /either the focused lanes[\s\S]*or a concrete one-builder reason/);
    assert.match(content, /adds no acceptance criteria, approval stage, or plan file/);
  });

  test(`implement dispatch: ${layout} after checkpoint C PASS, ready disjoint lanes dispatch together; serial hosts run in order`, () => {
    const content = read(implement);
    assertOrder(content, 'checkpoint C `VERDICT: PASS`', 'dispatches every ready lane whose writable scope is disjoint, together');
    assert.match(content, /Nested delegation is not required/);
    assert.match(content, /A serial host runs the lanes in order/);
    assert.match(content, /A host with no dispatch keeps each independent gate pending/);
  });

  test(`implement dispatch: ${layout} lane repairs keep the same owner until the prior owner stops`, () => {
    const content = read(implement);
    assert.match(content, /send the open items back to the same root-cause owner for the lane/);
    assert.match(content, /Do not assign a new owner until the prior owner is done or stopped/);
    assert.match(content, /Reconcile each repair's changed paths and check evidence before any dependent repair, the whole-task review, or the final regression checks run/);
    assert.match(content, /Repair adds no escalation and does not change whole-task QA/);
  });

  test(`implement dispatch: ${layout} feature batches all ready lanes with integration constraints and keeps gates C and D`, () => {
    const content = read(feature);
    assert.match(content, /Batch all ready lanes per \[Split Before Dispatch\]/);
    assert.match(content, /Check whole-feature and integration constraints/);
    assert.match(content, /Checkpoint C still gates each task's first build, and checkpoint D still runs before aggregate review/);
    assert.doesNotMatch(content, /completing tasks sequentially/);
    assert.doesNotMatch(content, /3\+ independent tasks/);
    assert.equal((content.match(/Batch all ready lanes/g) || []).length, 1, 'batch rule must appear once');
  });

  test(`implement dispatch: ${layout} fixes keep one defect with one owner; unrelated bugs batch`, () => {
    const content = read(fixes);
    assert.match(content, /Same bug, same root cause: one builder and one owner for the whole fix/);
    assert.match(content, /genuinely separate defects \(their own root cause, with disjoint files\) may run as parallel ready batches/);
    assert.match(content, /no new gate is added/);
    assert.doesNotMatch(content, /run one loop per bug, each with its own builder, batched per/);
  });
}

// Reconciliation: [P] is an optional hint, round-1 context is scoped, resume uses the existing progress record,
// and feature and fixes batching stay consistent with the single-builder rule for one root cause.
for (const layout of LAYOUTS) {
  const implement = `${layout}/.claude/prompt-snippets/implement.md`;
  const feature = `${layout}/.claude/prompt-snippets/implement-feature.md`;

  test(`implement reconcile: ${layout} [P] markers are optional hints, never a reason to serialize`, () => {
    const content = read(implement);
    assert.match(content, /`\[P\]` markers, when present, are optional hints/);
    assert.match(content, /their absence never makes a task sequential/);
    assert.doesNotMatch(content, /Dispatch `\[P\]` tasks in parallel only when/);
  });

  test(`implement reconcile: ${layout} round 1 gives scoped context; the original task is context only`, () => {
    const content = read(implement);
    assert.match(content, /exact assigned writable paths/);
    assert.match(content, /applicable lane criteria by AC id/);
    assert.match(content, /the original task text verbatim as context only/);
    assert.match(content, /do not give every builder the whole AC suite/);
    assert.match(content, /Route each lane by domain at the coordinator/);
    assert.match(content, /Whole-task verification and review \(steps 3 and 4\) still run after every lane is reconciled/);
    assert.match(content, /one owner/);
  });

  test(`implement reconcile: ${layout} resume records lanes in the existing progress record and does not re-dispatch early`, () => {
    const content = read(implement);
    assert.match(content, /Save each dispatched lane's handle, writable paths, and status in the existing progress record/);
    assert.match(content, /with no new record format/);
    assert.match(content, /do not re-dispatch a lane's writer until the prior writer is known stopped or done/);
  });

  test(`implement reconcile: ${layout} feature wording has no sequential-only framing`, () => {
    const content = read(feature);
    assert.match(content, /Scan the task list for independent tasks/);
    assert.match(content, /For each dependent task, in dependency order/);
  });
}

// Integration ownership: the coordinator alone stages, commits and ticks; workers never do; repair scopes batch only when independent.
for (const layout of LAYOUTS) {
  const implement = `${layout}/.claude/prompt-snippets/implement.md`;
  const feature = `${layout}/.claude/prompt-snippets/implement-feature.md`;

  test(`implement integration: ${layout} coordinator is the sole index, commit and tick owner; workers never stage`, () => {
    const content = read(implement);
    assert.match(content, /The coordinator is the sole owner of the index, the commits, and the task ticks\. Workers never stage, commit, or tick\./);
    assert.match(content, /Collect the changed paths from the reconciled lane reports for the task, not from a single builder's list/);
    assert.match(content, /a commit needs the calling flow's authorization and an accepted task/);
    const f = read(feature);
    assert.match(f, /Commit the Task\*\* \(coordinator only,/);
    assert.match(f, /Mark Task Complete\*\* \(coordinator only,/);
    assert.match(f, /Workers never stage or commit/);
  });

  test(`implement integration: ${layout} round 1 gives a bounded baseline handoff and lane-only AC and QA reporting`, () => {
    const content = read(implement);
    assert.match(content, /preexisting changed paths from the baseline's `status\.txt`, as a bounded prior contract/);
    assert.match(content, /Report each applicable lane AC \(only the AC ids given to it\)/);
    assert.match(content, /for its applicable lane ACs only/);
  });

  test(`implement integration: ${layout} feature order applies to dependent work; approval gates honored, none added`, () => {
    const f = read(feature);
    assert.match(f, /For each dependent task, in dependency order \(independent ready lanes run as a batch per step 2/);
    assert.match(f, /honor it\. This flow adds no new spec or plan approval requirement/);
  });

  test(`implement integration: ${layout} later repairs and decide step use the same root-cause owner; batch only independent scopes`, () => {
    const content = read(implement);
    assert.match(content, /Batch repairs only when their scopes are genuinely independent/);
    assert.match(content, /Send the open items back to the same root-cause owner \(step 2, Later rounds\)/);
    assert.doesNotMatch(content, /dispatch the same builder again/);
  });
}

// Index guard and single-owner repair routing: the coordinator never commits a foreign staged path, and each ordinary finding has one owner.
for (const layout of LAYOUTS) {
  const implement = `${layout}/.claude/prompt-snippets/implement.md`;
  const feature = `${layout}/.claude/prompt-snippets/implement-feature.md`;
  const fixes = `${layout}/.claude/prompt-snippets/implement-fixes.md`;

  test(`index guard: ${layout} implement commit requires an empty index and an exact staged-set check before commit`, () => {
    const content = read(implement);
    assert.match(content, /the index must be empty: `git diff --cached --name-only` exits 0 and prints nothing/);
    assert.match(content, /Check each git command's exit status first/);
    assert.match(content, /it is never read as an empty index or an empty staged set/);
    assert.match(content, /park the commit as blocked and report those foreign paths/);
    assert.match(content, /Do not clear, unstage, or restage them/);
    assert.match(content, /must list exactly the accepted paths, and `git diff --cached --binary` must contain only the accepted changes/);
    assert.match(content, /so a preexisting hunk in a shared file is caught/);
    assert.match(content, /Commit only after both checks pass/);
    assert.doesNotMatch(content, /^\s*git add -A\s*$/m);
  });

  test(`index guard: ${layout} feature commit checks the staged set before the unrestricted commit and keeps the flow's authorization`, () => {
    const content = read(feature);
    assertOrder(content, 'git diff --cached --name-only` exits 0 and prints nothing', 'git commit -m');
    assertOrder(content, 'must list exactly those paths, and `git diff --cached --binary` must contain only the accepted changes', 'git commit -m');
    assert.match(content, /only when there are accepted changes and the flow authorizes commits/);
    assert.match(content, /follow the Commit rule in \[implement\.md\]\(implement\.md\)/);
  });

  test(`index guard: ${layout} fixes honor the shared commit rule with one link before its commit`, () => {
    const content = read(fixes);
    assert.ok(content.includes('(implement.md)'), 'fixes must link the shared loop');
    assert.match(content, /coordinator only; workers never touch the index/);
    assertOrder(content, 'the cached diff must match the accepted changes exactly', 'git commit -m');
  });

  test(`index guard: ${layout} aggregate repairs route each ordinary finding once to a root-cause owner`, () => {
    const content = read(feature);
    assert.match(content, /Route each ordinary repair finding once, to one root-cause owner/);
    assert.match(content, /not the builder that owns each file/);
    assert.match(content, /first stop the prior writers \(each confirmed done or stopped\)/);
    assert.match(content, /Checkpoint D runs again on the changed inputs/);
    assert.doesNotMatch(content, /Repairs go to the builder that owns each file/);
  });
}

// Single-owner repair wording and index guard: the obsolete per-file routing phrase is gone from every implement snippet.
for (const layout of LAYOUTS) {
  test(`index guard: ${layout} no snippet routes repairs to the builder that owns each file`, () => {
    for (const name of ['implement', 'implement-feature', 'implement-fixes']) {
      assert.doesNotMatch(read(`${layout}/.claude/prompt-snippets/${name}.md`), /(Repairs|goes) to the builder that owns each file/, `${layout} ${name}`);
    }
  });

  test(`index guard: ${layout} checkpoint D routes each repairable finding to one root-cause owner`, () => {
    assert.match(read(`${layout}/.claude/prompt-snippets/implement-feature.md`),
      /goes to one root-cause owner per finding \(step 5, Route each ordinary repair finding once\)/);
  });
}
