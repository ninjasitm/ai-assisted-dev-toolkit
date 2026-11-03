'use strict';

// Prompt-contract regression checks, not a live harness or destructive patch run.
// Run: node --test test/bootstrap-patch-review.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const wrappers = [
  '.claude/commands/bootstrap-patch.md',
  '.cursor/commands/bootstrap-patch.md',
  '.github/prompts/bootstrap-patch.prompt.md',
  '.opencode/commands/bootstrap-patch.md',
];

for (const layout of ['repo', 'monorepo']) {
  const root = `src/${layout}`;
  const prompt = read(`${root}/.claude/prompt-snippets/bootstrap-patch.md`);
  const review = prompt.slice(prompt.indexOf('**Independent review loop'), prompt.indexOf('5.  **Confirm and Apply**'));
  const apply = prompt.slice(prompt.indexOf('5.  **Confirm and Apply**'), prompt.indexOf('6.  **Cleanup**'));
  const validation = prompt.slice(prompt.indexOf('7.  **Post-Patch Validation**'), prompt.indexOf('## Smart Merge Strategy'));

  test(`${layout}: independent proposal review, repair and orchestrator acceptance precede user approval`, () => {
    assert.ok(prompt.indexOf('4.  **Generate Patch Report**') < prompt.indexOf('**Independent review loop'));
    assert.match(review, /before approval\/apply, including dry-run/);
    assert.match(review, /orchestrator derives acceptance checks/);
    assert.match(review, /independent read-only `reviewer`/);
    assert.match(review, /not the patch author or its self-review/);
    assert.match(review, /original request, target\/source version evidence, current project files, proposed diffs\/report/);
    assert.match(review, /VERDICT: PASS.*VERDICT: CHANGES/);
    assert.match(review, /repair the proposal, verify it, and re-review/);
    assert.match(review, /Repeat until PASS or BLOCKED/);
    assert.match(review, /Only the orchestrator accepts.*evidence for every acceptance check/);
    assert.match(review, /never replaces user approval/);
    assert.match(review, /reviewer or required evidence\/check is unavailable.*BLOCKED.*do not apply or claim completion/);
    assert.match(review, /no new spec, plan, persistent state, or configuration/);
    assert.doesNotMatch(prompt, /Read and follow.*implement\.md|git add -A|git commit -m/);
  });

  test(`${layout}: approval, backup, preservation and source/trust/version gates remain`, () => {
    for (const gate of [
      'OpenCode version preflight (before any changes)',
      'Source availability gate:',
      'Source version gate (before diff/apply/version marking):',
      'Never auto-downgrade',
      'loaded only after explicit user trust',
      '**Never overwrite** project-specific values',
      '**Preserve custom agents/skills**',
      '**retired**: listed in `.nitm/retired.json`; never added, updated or overwritten',
    ]) assert.ok(prompt.includes(gate), `missing safeguard: ${gate}`);
    assert.match(apply, /--dry-run.*without making changes/);
    assert.match(apply, /reviewed report.*user to confirm/);
    assert.match(apply, /Before writes, back up affected existing files\/config/);
    assert.match(apply, /if they changed, regenerate and repeat review and user approval/);
    assert.match(apply, /On confirmation:/);
    assert.match(apply, /do not copy template files by hand/);
    assert.match(apply, /Do not delete files to retire them/);
    assert.match(apply, /apply it only after the operator approves that file/);
    assert.match(apply, /Do not auto-commit.*user explicitly requests.*after Step 7 acceptance/);
    assert.match(apply, /never stage unrelated changes/);
  });

  test(`${layout}: applied outcome is verified, independently re-reviewed and accepted only with evidence`, () => {
    assert.match(validation, /Verify no `\{\{PLACEHOLDER\}\}`/);
    assert.match(validation, /Inspect the actual applied diff\/files against the approved proposal and backups/);
    assert.match(validation, /syntax\/frontmatter checks.*commands\/results/);
    assert.match(validation, /independent read-only reviewer on the actual applied outcome/);
    assert.match(validation, /repair only within the approved scope, rerun validation, and re-review/);
    assert.match(validation, /new\/unapproved change must return through proposal review and user approval before writes/);
    assert.match(validation, /Only the orchestrator reports \*\*ACCEPTED\*\*.*review PASS and verified evidence for every acceptance check/);
    assert.match(validation, /Missing reviewer\/evidence means \*\*BLOCKED\*\*, never completion/);
    assert.match(validation, /dry-run.*nothing was applied or post-apply verified/);
    assert.match(validation, /never authorizes extra writes, deletions, or a commit/);
  });

  for (const file of wrappers) {
    test(`${layout}: ${file} links shared policy and supports reviewer dispatch`, () => {
      const wrapper = read(`${root}/${file}`);
      assert.match(wrapper, /prompt-snippets\/bootstrap-patch\.md/);
      assert.match(wrapper, /`reviewer`.*Independent read-only review/);
      assert.doesNotMatch(wrapper, /`planner`/);
      const frontmatter = wrapper.match(/^---\n([\s\S]*?)\n---/)[1];
      if (file.startsWith('.claude/')) assert.match(frontmatter, /allowed-tools:.*\bTask\b/);
      const tools = frontmatter.match(/^tools:.*$/m);
      if (tools) assert.match(tools[0], /"agent"/);
    });
  }
}
