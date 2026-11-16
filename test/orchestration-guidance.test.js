'use strict';

// Orchestration guidance: the shared contract in root AGENTS.md and both template AGENTS layouts, the
// canonical workflow in the subagent-workflow snippet (identical in both layouts), and the dispatch skill.
// Checks that the required rules exist and that the stale "Sequential (default)" wording is gone. It does
// not compare prose beyond key phrases.
// Run with: node --test test/orchestration-guidance.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const SNIPPET = '.claude/rules-snippets/subagent-workflow.md';
const SKILL = '.agents/skills/dispatching-parallel-agents/SKILL.md';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('orchestration: root AGENTS carries the shared contract and points to the canonical workflow', () => {
  const s = read('AGENTS.md');
  assert.match(s, /\*\*Delegate by default\*\*/);
  assert.match(s, /\*\*Batch by dependency\*\*/);
  assert.match(s, /\*\*Never end silently\*\*/);
  assert.match(s, /DONE, WAITING \(pending task handle and resume trigger\), or BLOCKED/);
  assert.match(s, /`\[P\]` markers are optional/);
  assert.match(s, /src\/repo\/\.claude\/rules-snippets\/subagent-workflow\.md/);
});

for (const file of ['AGENTS.md', 'src/repo/AGENTS.md', 'src/monorepo/AGENTS.md']) {
  test(`orchestration: ${file} identify-ambiguity blocks only the affected task`, () => {
    const s = read(file);
    assert.doesNotMatch(s, /Stop and ask if a task lacks clear acceptance criteria/);
    assert.match(s, /Ask a targeted question if a task lacks clear acceptance criteria, inputs, or expected outputs\. It blocks only that task and its dependents/);
  });

  test(`orchestration: ${file} carries autonomy-with-blockers: pause the task, not the batch`, () => {
    const s = read(file);
    assert.match(s, /\*\*Autonomy with blockers\*\*/);
    assert.match(s, /within the approved goal, scope, and permissions/);
    assert.match(s, /A blocker pauses only its task and dependents/);
    assert.match(s, /continue independent authorized work/);
    assert.match(s, /Stop for the user only when no authorized work remains or a mandatory gate applies/);
    assert.match(s, /native question tool when one exists/);
  });


  test(`orchestration: ${file} carries the never-silent end-state rule, scoped to active execution`, () => {
    const s = read(file);
    assert.match(s, /never end silently/i);
    assert.match(s, /During active multi-step execution, end each turn as DONE, WAITING \(pending task handle and resume trigger\), or BLOCKED \/ NEEDS-DECISION/);
    assert.match(s, /Dispatch or partial progress is not completion/);
    assert.match(s, /Spec and plan confirmations remain mandatory human steps; final approval, escalation, and merge behavior follow the job's `APPROVAL_MODE` and `MERGE_MODE`/);
    assert.match(s, /Delegation or autonomy alone never satisfies a gate/);
    assert.doesNotMatch(s, /Factory's mandatory approvals are never auto-executed/);
    assert.doesNotMatch(s, /Autonomous execution never passes|Autonomy alone never satisfies/);
    assert.doesNotMatch(s, /merges on an approver/);
  });
}

for (const layout of LAYOUTS) {
  test(`orchestration: ${layout} Factory paragraph requires independent goal-fit and blocks single-session switching`, () => {
    const s = read(`${layout}/AGENTS.md`);
    assert.match(s, /Spec and plan goal-fit must be confirmed by an independent Oracle or read-only reviewer/);
    assert.match(s, /Single-session role switching, including the Codex fallback, does not satisfy that and blocks these gates/);
    assert.match(s, /Spec and plan confirmations stay mandatory human steps in every approval mode/);
  });

  test(`orchestration: ${layout} AGENTS carries the shared contract`, () => {
    const s = read(`${layout}/AGENTS.md`);
    assert.match(s, /exclusive writable scopes/);
    assert.match(s, /Reconcile each (result|batch's results) before dispatching/);
    assert.doesNotMatch(s, /Do not run multiple implementation subagents in parallel/);
    assert.doesNotMatch(s, /\*\*Sequential\*\*: Tasks with dependencies are implemented one at a time\./);
  });

  test(`orchestration: ${layout} dispatch skill requires exclusive writable scopes`, () => {
    assert.match(read(`${layout}/${SKILL}`), /exclusive writable scopes/);
  });
}

test('orchestration: the snippet is identical across both layouts', () => {
  const [repo, monorepo] = LAYOUTS.map((layout) => read(`${layout}/${SNIPPET}`));
  assert.equal(repo, monorepo);
});

for (const layout of LAYOUTS) {
  test(`orchestration: ${layout} snippet drops the contradictory sequential default`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.doesNotMatch(s, /Sequential \(default\)/);
    assert.doesNotMatch(s, /Parallelization Analysis \(REQUIRED/);
    assert.match(s, /### Dependency Graph and Parallel Batches/);
    assert.match(s, /No `\[P\]` marker is required/);
    assert.match(s, /Exclusive writable scopes/);
    assert.match(s, /Two tasks that share any writable path are dependent/);
    assert.match(s, /Reconcile before dependents/);
    assert.match(s, /Track handles/);
    assert.match(s, /write set is unknown or undeclared runs serially/);
  });

  test(`orchestration: ${layout} snippet keeps the coordinator responsible and allows direct trivial work`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /Delegate by default/);
    assert.match(s, /The coordinator keeps outcome responsibility/);
    assert.match(s, /Work directly only/);
    assert.match(s, /No delegation capability/);
    assert.match(s, /Never self-review in place of an independent gate/);
  });

  test(`orchestration: ${layout} snippet defines DONE, WAITING, and BLOCKED endings`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /## Turn Completion and Waiting/);
    assert.match(s, /During active multi-step execution, never end a turn silently/);
    assert.match(s, /Informational answers need no status line/);
    assert.match(s, /\*\*DONE:\*\*/);
    assert.match(s, /\*\*WAITING:\*\*.*resume trigger/);
    assert.match(s, /\*\*BLOCKED \/ NEEDS-DECISION:\*\*.*exact next user action/);
  });

  test(`orchestration: ${layout} snippet handles host-dependent resume without polling or false claims`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /Do not busy-poll/);
    assert.match(s, /do not claim that it will/);
    assert.match(s, /continue with the next eligible batch/);
  });

  test(`orchestration: ${layout} snippet keeps independent work moving past a blocker`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /## Autonomous Execution and Blockers/);
    assert.match(s, /Autonomy grants no extra authority/);
    assert.match(s, /\*\*A blocker pauses only the affected task and its dependents\.\*\* Independent ready work within authority continues in the next batch\./);
    assert.match(s, /\*\*Defer non-global blockers\*\* as follow-up questions while work can safely advance\./);
  });

  test(`orchestration: ${layout} snippet records blockers visibly and never silently`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /\*\*Record each unresolved blocker immediately\*\*/);
    assert.match(s, /the affected task, what is needed and why, safe options or a targeted input, and the next action/);
    assert.match(s, /Keep it visible in progress updates and the final report\. Never drop it silently\./);
    assert.match(s, /Never\*\* silently choose a consequential scope or requirement change, bypass a required human approval, or mark a partially blocked task DONE\./);
  });

  test(`orchestration: ${layout} snippet's model-fallback blocker is scoped to the affected task`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.doesNotMatch(s, /stop, report the blocker, and ask the user which model to use/);
    assert.match(s, /the affected task is reported BLOCKED with the question of which model to use/);
    assert.match(s, /Its dependents stop; independent authorized work continues/);
  });

  test(`orchestration: ${layout} snippet's batch-continuation cross-references the blocker boundary`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /Do not wait for the user unless a mandatory gate applies or no authorized, unblocked work remains \(see Autonomous Execution and Blockers\)/);
    assert.doesNotMatch(s, /unless a gate or blocker requires it/);
  });

  test(`orchestration: ${layout} snippet stops for the user only at the right boundary`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /Stop for user input\*\* only when no authorized, unblocked work remains, or when a mandatory approval, security, or permission gate prevents the remaining work/);
    assert.match(s, /Agents still running are WAITING, not blocked/);
  });

  test(`orchestration: ${layout} snippet asks through the harness tool with a chat fallback and no invented tool name`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /native question or clarification tool when one is available/);
    assert.match(s, /Do not assume a tool name or support/);
    assert.match(s, /Without one, give numbered options or a fill-in block in chat/);
  });

  test(`orchestration: ${layout} snippet does not require a blocking prompt while independent work continues`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /\*\*Answers can arrive early\.\*\* Do not require a blocking tool prompt while independent work continues/);
  });

  test(`orchestration: ${layout} snippet has the long-session checkpoint rules`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /## Long-Session Checkpoint/);
    assert.match(s, /Use existing progress records only/);
    assert.match(s, /Never add fields to structured files such as Factory `job\.json`/);
    assert.match(s, /never rewrite accepted requirements or spec\/plan text/);
    assert.match(s, /Do not create new files for trivial work/);
    assert.match(s, /reread the accepted source/);
  });

  test(`orchestration: ${layout} snippet never routes Factory approvals through delegation`, () => {
    const s = read(`${layout}/${SNIPPET}`);
    assert.match(s, /## Factory Approvals/);
    assert.match(s, /Spec and plan confirmations remain mandatory human steps/);
    assert.match(s, /final approval, escalation, and merge behavior follow the job's `APPROVAL_MODE` and `MERGE_MODE`/);
    assert.match(s, /Delegation, batching, autonomy, and subagent sign-offs never satisfy spec or plan human confirmation, or human final approval when `APPROVAL_MODE=human`/);
    assert.match(s, /Mode-defined approver behavior is preserved/);
    assert.doesNotMatch(s, /reviewer sign-offs never satisfy a gate/);
    assert.doesNotMatch(s, /auto` merges|merges on an approver/);
  });
}

// Plan review propagation: roles, references, wrapper summary, reviewer tool grant, and AGENTS guidance.
// Each check is local to the layout it names. The repo and monorepo intentional differences are kept.
test('plan review propagation: reviewer agent grants no explicit Write in src/repo or src/monorepo', () => {
  for (const layout of LAYOUTS) {
    const agent = read(`${layout}/.claude/agents/reviewer.agent.md`);
    const tools = agent.match(/^tools:.*$/m);
    assert.ok(tools, `${layout} reviewer declares tools`);
    assert.doesNotMatch(tools[0], /"Write"/, `${layout} reviewer must not grant Write`);
    assert.match(tools[0], /"Read"/, `${layout} reviewer keeps Read`);
  }
});

test('plan review propagation: repo reviewer agent keeps its read-only snippet reference and other tools', () => {
  const agent = read('src/repo/.claude/agents/reviewer.agent.md');
  assert.match(agent, /tools: \["Read", "Grep", "Glob", "Bash\(\*\)"\]/);
  assert.match(agent, /\.\.\/agents-snippets\/reviewer\.md/);
});

test('plan review propagation: repo instructions wrapper summary names the consequential-plan exception only', () => {
  const s = read('src/repo/.github/instructions/subagent-workflow.instructions.md');
  assert.match(s, /use single agent only for focused single-file tasks without a consequential execution plan \(plan review applies to those\)/);
  assert.match(s, /Follow the rules defined in \[\.claude\/rules-snippets\/subagent-workflow\.md\]/);
});

for (const layout of LAYOUTS) {
  test(`plan review propagation: ${layout} AGENTS routes plan and spec changes through the planner and plan review`, () => {
    const s = read(`${layout}/AGENTS.md`);
    assert.match(s, /Plan and spec changes/);
    assert.match(s, /route through the planner and plan review, then any applicable confirmation, then resume/);
    assert.match(s, /see subagent-workflow Plan and Spec Changes/);
  });

  test(`plan review propagation: ${layout} planner snippet is the only author of plan revisions`, () => {
    const p = read(`${layout}/.claude/agents-snippets/planner.md`);
    assert.match(p, /You author every plan revision/);
    assert.match(p, /Reviewers and Oracle never author or edit plans/);
  });

  test(`plan review propagation: ${layout} feature builder shows plan review and gate before implement`, () => {
    const fb = read(`${layout}/.claude/agents-snippets/feature-builder.md`);
    assert.match(fb, /Plan review \(fit-review, Plan review\) and any applicable confirmation must pass before step 3/);
  });
}
