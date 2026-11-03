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
