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
    const task = content.slice(content.indexOf('For each task, in dependency order:'),
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
    assert.ok(content.includes('**Blocked (exit):**'), 'blocked exit missing');
    assert.ok(content.includes('**Needs user decision (exit):**'), 'needs-decision exit missing');
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
