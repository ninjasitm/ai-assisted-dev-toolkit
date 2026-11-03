'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const COMMANDS = ['create-skill', 'constitution', 'plan'];
const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');

for (const layout of ['.', 'src/repo', 'src/monorepo']) {
  for (const command of COMMANDS) {
    const snippet = `.claude/prompt-snippets/${command}.md`;
    // Root sources are optional; do not invent commands in the toolkit itself.
    if (layout === '.' && !fs.existsSync(path.join(ROOT, snippet))) continue;

    test(`${layout}/${command}: independent artifact review gates acceptance`, () => {
      const text = read(layout, snippet);
      assert.match(text, /independent, read-only reviewer/);
      assert.match(text, /original request/);
      assert.match(text, /actual (?:files|artifact)/);
      assert.match(text, /`VERDICT: PASS` or `VERDICT: CHANGES`/);
      assert.match(text, /blocking findings/);
      assert.match(text, /[Rr]epair blocking findings/);
      assert.match(text, /repeat affected (?:validation|artifact) checks/);
      assert.match(text, /re-review the changed artifacts? independently/);
      assert.match(text, /Repeat until PASS or blocked/);
      assert.match(text, /orchestrator (?:verifies every requirement|accepts)/);
      assert.match(text, /evidence/);
      assert.match(text, /independent reviewer is unavailable, report BLOCKED/);
      assert.match(text, /self-review cannot substitute/);
      assert.match(text, /human.*approval.*separate/);

      if (command === 'create-skill') {
        assert.match(text, /naming\/frontmatter, structure, reference resolution/);
        assert.ok(text.indexOf('## Artifact Review and Acceptance') < text.indexOf('## Post-Creation'));
        assert.match(text, /skills-ref validate/);
      } else if (command === 'constitution') {
        assert.match(text, /Retain its original content for comparison/);
        assert.match(text, /contradictions, unintended policy changes, and requirements coverage/);
        assert.match(text, /amendment governance/);
      } else {
        assert.match(text, /completeness, dependencies\/order, actionability/);
        assert.match(text, /lightweight artifact review, not a code build loop/);
        assert.match(text, /do not implement the plan/);
        assert.match(text, /Report [Cc]ompletion.*only after artifact acceptance/);
        const prefix = layout === 'src/monorepo' ? 'apps/{{APP_NAME}}/' : '';
        assert.ok(text.includes(`${prefix}docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/plan.md`));
      }
    });

    if (command === 'plan') {
      test(`${layout}/plan: supplied requirement needs no prior specification`, () => {
        const text = read(layout, snippet);
        assert.match(text, /Use the supplied requirement as sufficient input/);
        assert.match(text, /Ask targeted questions only when the request is unclear/);
        assert.match(text, /do not require creating a specification first/);
        const specLines = text.split('\n').filter(line => /spec\.md/.test(line) && !line.startsWith('/plan '));
        assert.equal(specLines.length, 1);
        assert.match(specLines[0], /If an existing specification is available at .*spec\.md`.*optional context/);
        assert.doesNotMatch(text, /second step in the development lifecycle|Read (?:specification|the feature spec) from/);
      });
    }

    test(`${layout}/${command}: cross-harness wrappers stay thin and allow delegation`, () => {
      for (const [directory, suffix] of [
        ['.claude/commands', '.md'], ['.cursor/commands', '.md'],
        ['.github/prompts', '.prompt.md'], ['.opencode/commands', '.md'],
      ]) {
        const file = `${directory}/${command}${suffix}`;
        if (layout === '.' && !fs.existsSync(path.join(ROOT, file))) continue;
        const text = read(layout, file);
        assert.ok(text.includes(snippet), `${file} must reference the source of truth`);
        assert.doesNotMatch(text, /VERDICT:|Repair blocking findings/);
        if (directory === '.claude/commands') assert.match(text, /allowed-tools:.*\bTask\b/);
        if (directory === '.github/prompts') assert.match(text, /tools:.*"edit".*"agent"/);
        if (directory === '.opencode/commands') assert.ok(text.includes(`Read and follow \`${snippet}\``));
      }
    });
  }
}

for (const layout of ['src/repo', 'src/monorepo']) {
  test(`${layout}: governing documentation permits requirement-only planning without weakening other gates`, () => {
    const agents = read(layout, 'AGENTS.md');
    const documentation = read(layout, '.claude/rules-snippets/documentation.md');
    const exception = documentation.split('### Requirement-Only Planning Exception\n\n')[1]?.split('\n\n')[0];
    assert.ok(exception, 'documentation must define a separate planning exception');
    assert.ok(agents.includes(`**Requirement-only planning exception:** ${exception}`), 'AGENTS and documentation must agree on the exception');
    assert.match(exception, /For `\/plan` without an existing specification, preserve the original supplied requirements and acceptance criteria in `plan\.md` under \*\*Requirements Source\*\* and \*\*Acceptance Criteria\*\*; do not require or create `spec\.md`/);
    assert.match(exception, /`\/tasks` and `\/assign-tasks` consume that plan source when no specification exists/);
    assert.match(exception, /keep acceptance criteria out of the slim task checklist/);
    assert.match(exception, /overrides the spec prerequisite and mandatory spec-first sequence.*only for these planning artifacts/);
    assert.match(exception, /does not authorize implementation, replace artifact review, waive required human approvals, or change any other documentation duties/);
    assert.match(exception, /separate implementation-command supplied-task exception remains unchanged/);
    assert.match(documentation, /\*\*Required Files\*\* \(subject to the \[requirement-only planning exception\]\(#requirement-only-planning-exception\)/);
    assert.match(documentation, /For changes made by the `implement`, `implement-feature` and `implement-fixes` commands only/);
    assert.match(agents, /\*\*Supplied-task exception \(`implement`, `implement-feature`, `implement-fixes` only\):\*\*/);
    for (const text of [agents, documentation]) {
      assert.match(text, /mandatory before committing|Documentation MUST be written or updated BEFORE committing code/);
      assert.match(text, /CHANGELOG\.md/);
      assert.match(text, /docs\/api\//);
    }
    if (layout === 'src/repo') {
      assert.match(documentation, /exception.*takes precedence over the spec-first sequence below/);
      assert.match(agents, /spec\/plan docs \(subject to the requirement-only planning and supplied-task exceptions above\)/);
    }
  });

  test(`${layout}: requirement-only plan -> tasks -> ticket preserves acceptance criteria`, () => {
    const plan = read(layout, '.claude/prompt-snippets/plan.md');
    const tasks = read(layout, '.claude/prompt-snippets/tasks.md');
    const tickets = read(layout, '.claude/prompt-snippets/assign-tasks.md');
    const featurePath = `${layout === 'src/monorepo' ? 'apps/{{APP_NAME}}/' : ''}docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}`;

    // The plan must retain the chat/issue input, not merely point at a nonexistent spec.
    assert.match(plan, /Without an existing specification, persist the original supplied requirements and acceptance criteria verbatim in `plan\.md`/);
    assert.match(plan, /including the source path or issue key/);
    assert.match(plan, /Preserve constraints; label any derived criteria or assumptions separately/);
    assert.match(plan, /ask the user about unclear or missing criteria rather than inventing approval/);
    assert.match(plan, /durable requirements source for `\/tasks` and `\/assign-tasks`/);
    const template = plan.slice(plan.indexOf('## Plan Template'));
    for (const section of ['Requirements Source', 'Acceptance Criteria']) {
      assert.ok(template.includes(`## ${section}\n`), `plan template must persist ${section}`);
      for (const downstream of [tasks, tickets]) {
        assert.ok(downstream.includes(`**${section}**`), `downstream must read ${section}`);
      }
    }
    assert.ok(plan.includes(`${featurePath}/plan.md`));
    assert.ok(tasks.includes(`${featurePath}/plan.md`));
    assert.ok(tasks.includes(`${featurePath}/tasks.md`));

    // All consumers agree on source selection, including the existing spec-backed path.
    assert.match(plan, /With an existing specification, link to its requirements and acceptance criteria instead of duplicating them/);
    for (const downstream of [tasks, tickets]) {
      assert.match(downstream, /(?:Read|load) sibling `spec\.md` when present; otherwise (?:use|load sibling) `plan\.md`/);
      assert.match(downstream, /do not require creating a specification/);
      assert.doesNotMatch(downstream, /Read the specification in|Acceptance criteria live in `spec\.md`;/);
    }
    assert.match(tasks, /Cover every requirement and acceptance criterion in the deliverables without copying them into the checklist/);
    assert.match(tasks, /No file lists, effort, or acceptance criteria/);
    assert.match(tickets, /If the source or criteria are missing or unclear, ask the user before creating tickets/);
    assert.match(tickets, /Ticket description: the task summary plus the acceptance criteria from the selected requirements source for that deliverable \(`spec\.md` when present, otherwise `plan\.md` for a task checklist/);
    assert.match(tickets, /Preserve the original criteria and constraints; include a source path\/issue key and section reference/);
    assert.match(tickets, /Do not copy acceptance criteria into `tasks\.md`/);
    assert.doesNotMatch(tickets, /acceptance criteria from `spec\.md` for that deliverable|estimate from the scope in `spec\.md`/);
    assert.match(tickets, /For a requirement document supplied directly, use its requirements and acceptance criteria/);

    // Referenced skills must not turn artifact generation into implementation or self-acceptance.
    assert.match(plan, /override that skill's execution handoff, worktree and commit procedures/);
    assert.match(plan, /Stop after reporting the accepted artifacts/);
    assert.match(plan, /do not implement the plan/);
    assert.match(plan, /human approval separate from artifact acceptance/);
    assert.match(tasks, /shared delivery loop in `implement\.md`; only the orchestrator accepts and ticks/);
    assert.match(tasks, /This command only generates the checklist; do not dispatch implementation or bypass required human approval/);
    assert.doesNotMatch(tasks, /using `subagent-driven-development`|Implement it directly|third step in the development lifecycle/);
  });
}
