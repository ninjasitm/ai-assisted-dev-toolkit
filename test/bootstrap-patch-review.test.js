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
  const between = (from, to) => prompt.slice(prompt.indexOf(from), prompt.indexOf(to));
  const loadSection = between('## Load the Completion Contract', '## OpenCode version preflight');
  const fetch = between('1.  **Fetch Latest Templates**', '2.  **Inventory Current State**');
  const review = between('**Independent review loop', '5.  **Confirm and Apply**');
  const apply = between('5.  **Confirm and Apply**', '6.  **Post-Patch Validation and Acceptance**');
  const validation = between('6.  **Post-Patch Validation and Acceptance**', '7.  **Cleanup (terminal)**');
  const cleanup = between('7.  **Cleanup (terminal)**', '## Smart Merge Strategy');

  test(`${layout}: the completion checklist is loaded once, before any change, from the trusted sibling copy`, () => {
    assert.ok(prompt.indexOf('## Load the Completion Contract') < prompt.indexOf('## OpenCode version preflight'));
    assert.match(loadSection, /`## Completion Contract` section once from `bootstrap\.md`/);
    assert.match(loadSection, /hold that checklist unchanged through apply/);
    assert.match(loadSection, /same trusted install or copy as this guide/);
    assert.match(loadSection, /\.nitm\/BOOTSTRAP\.md/);
    assert.match(loadSection, /missing, mismatched, or its origin is uncertain, \*\*STOP\*\* and ask/);
    assert.match(loadSection, /manifest match, `\.toolkit-version`, or the target project alone is not proof of origin/);
    assert.match(loadSection, /Do not run a write to establish proof/);
    assert.match(loadSection, /templates and data, not the criteria for judging this work/);
  });

  test(`${layout}: source gate pins the exact npm archive or refs/tags/<version> tag, 5.2.0 minimum, identity reused on resume`, () => {
    assert.match(fetch, /Minimum\*\*: the target must be \*\*5\.2\.0 or later\*\*/);
    assert.match(fetch, /5\.0\.1 added the dry run and selection flags, but a 5\.0\.1 to 5\.1\.x patch ignores retirements/);
    assert.match(fetch, /direct the user to that release's own guidance/);
    assert.match(fetch, /npm pack "nitm-ai-dev-toolkit@<version>"/);
    assert.match(fetch, /"refs\/tags\/<version>:refs\/tags\/<version>"/);
    assert.match(fetch, /checkout --detach "refs\/tags\/<version>"/);
    assert.doesNotMatch(fetch, /--branch/, 'a same-named branch must never be checked out');
    assert.doesNotMatch(fetch, /v<version>/, 'git tags have no "v" prefix');
    assert.match(fetch, /Never fall back to another version, a default branch, or a hand-copied file/);
    assert.match(fetch, /Source availability gate:/);
    assert.match(fetch, /Source identity gate/);
    assert.match(fetch, /`name` must be `nitm-ai-dev-toolkit`/);
    assert.match(fetch, /dist\.integrity/);
    assert.match(fetch, /rev-parse "refs\/tags\/<version>\^\{commit\}"/);
    assert.match(fetch, /Keep the temp source until the terminal cleanup/);
    assert.match(fetch, /If it is missing on resume, fetch again and compare with the recorded identity/);
    assert.match(fetch, /removed only at the terminal step 7/);
    assert.match(fetch, /The verified source runs every CLI call/);
    assert.match(fetch, /Do not use `npx`/);
    assert.match(fetch, /fetched version must equal the target version exactly/i);
    assert.match(fetch, /major[^\n]*greater than or equal to[^\n]*installed[^\n]*\.toolkit-version/i);
    assert.match(fetch, /older than[^\n]*(?:installed|target)[^\n]*\.toolkit-version[^\n]*stop[^\n]*(?:without|before)[^\n]*(?:applying|merg)[^\n]*(?:marker|\.toolkit-version)/i);
    assert.match(fetch, /Never auto-downgrade, and never hard-code a major/);
  });

  test(`${layout}: layout is resolved as the CLI does, and one invocation serves preview and apply`, () => {
    assert.match(fetch, /Resolve the layout as step 5 defines it/);
    assert.match(fetch, /using the one invocation fixed in step 5/);
    assert.match(apply, /Invocation \(resolved once before the preview, then reused unchanged\)/);
    assert.match(apply, /an explicit flag first; otherwise a readable `package\.json` with a `workspaces` field, or both `apps\/` and `packages\/` at root, means monorepo; otherwise repo/);
    assert.match(apply, /`--env <env>` only when the user confirmed one/);
    assert.match(apply, /Otherwise pass neither, and both runs use the same saved `\.nitm\/toolkit\.json`\. Never pass both flags/);
    assert.match(apply, /Only `--dry-run` differs between the preview and the apply/);
    assert.match(fetch, /node "\$SOURCE_ROOT\/bin\/cli\.js" patch/);
    assert.doesNotMatch(prompt, /npx nitm-ai-dev-toolkit patch/, 'no unpinned second resolution');
    assert.doesNotMatch(prompt, /upgrade@<version>/, 'the CLI pin is `upgrade <version>` or `--version <version>`');
    assert.match(prompt, /`--category` narrows only the guided review and agent merge\. It never maps to the CLI's `--only`/);
  });

  test(`${layout}: planner, independent alignment and a builder/reviewer loop precede any write`, () => {
    assert.ok(prompt.indexOf('4.  **Generate Patch Report**') < prompt.indexOf('**Independent review loop'));
    assert.match(review, /before any write; a dry run stops after the report/);
    assert.match(review, /Write a short plan in chat/);
    assert.match(review, /No persistent plan file and no new artifact schema/);
    assert.match(review, /independent, read-only alignment reviewer/);
    assert.match(review, /Proceed only on `ALIGNED`/);
    assert.match(review, /do not start the builder/);
    assert.match(review, /The builder \(not the reviewer\)/);
    assert.match(review, /independent read-only reviewer checks the same write set/);
    assert.match(review, /`VERDICT: PASS` or `VERDICT: CHANGES`/);
    assert.match(review, /re-review until PASS/);
    assert.match(review, /two consecutive rounds return the same findings with no new evidence/);
    assert.match(review, /An unavailable reviewer or check is \*\*BLOCKED\*\*, never a pass/);
    assert.match(review, /With `--dry-run`, complete the report and the compiled write set from the verified source, then stop\. Do not ask to apply, and write nothing/);
    assert.match(review, /A reviewer PASS is not approval to write/);
  });

  test(`${layout}: one compiled write set covers CLI state, the handoff backup, manual changes, before-states and the bounded backup`, () => {
    assert.match(review, /Compile one write set/);
    assert.match(review, /`\.toolkit-version`, `\.nitm\/manifest\.json`, `\.nitm\/toolkit\.json` when a selection is saved, and `\.nitm\/BOOTSTRAP\.md`/);
    assert.match(review, /Record each path's before-state \(absent, or its sha256\)/);
    assert.match(review, /Handoff backup \(a separate operation\)/);
    assert.match(review, /replace \(old copy backed up\)`, not the path/);
    assert.match(review, /exactly one new `BOOTSTRAP\.\*\.md` must match that sha256/);
    assert.match(review, /`\.nitm\/retired\.json` record, and every reference, hook, or config change/);
    assert.match(review, /copy each affected existing file to `\.nitm\/backups\/patch-<UTC timestamp>\/` at its relative path/);
    assert.match(review, /names the directory and the source set, not a filename/);
    assert.match(review, /Never overwrite a backup/);
  });

  test(`${layout}: approval is separate from review; revalidation precedes ANY target write, including backups`, () => {
    assert.match(apply, /Ask for approval\*\* of the exact write set/);
    assert.match(apply, /answers to any unresolved required question/);
    assert.match(apply, /A widened category or selection needs a fresh preview and proposal review/);
    assert.match(apply, /A material change \(scope, criteria, or source\) needs planning, the Oracle alignment, and renewed user consent/);
    assert.match(apply, /Revalidate immediately before any target write, including backups/);
    assert.match(apply, /before-state of every listed input and target/);
    assert.match(apply, /return to the compiled write set and its review, and ask again/);
    assert.match(apply, /make the bounded backup from the write set first, then run the CLI apply, then verify the handoff backup against its recorded sha256, then do the manual writes/);
    assert.match(apply, /Do not run the apply while the dry run reports conflicts \(exit 1\)/);
    assert.match(apply, /On confirmation:/);
    assert.match(apply, /[Dd]o not copy template files by hand/);
    assert.match(apply, /Do not delete files to retire them/);
    assert.match(apply, /apply each proposed merge only after the operator approves that file/);
  });

  test(`${layout}: commit uses one rule: explicit request, baseline, empty index, content and mode checks, no broad staging`, () => {
    assert.match(apply, /Commit\*\* \(only on an explicit request, after the step 6 PASS/);
    assert.match(apply, /record a baseline with `git diff --cached --name-only` and `git status --porcelain`/);
    assert.match(apply, /dirty, staged, or an untracked file before the first write is not a commit candidate/);
    assert.match(apply, /The index must be empty now: `git diff --cached --name-only` prints nothing/);
    assert.match(apply, /Do not unstage, reset, or commit around it/);
    assert.match(apply, /Commit only approved paths that are not deletions/);
    assert.match(apply, /`git hash-object -- <path>`/);
    assert.match(apply, /`100644`, or `100755` for an approved executable hook/);
    assert.match(apply, /Never stage generated backups, local config, or state files outside the set/);
    assert.match(apply, /`git add -- <each approved path>`, by name only/);
    assert.match(apply, /each path's staged blob \(`git ls-files -s -- <path>`\) must equal `git hash-object -- <path>`/);
    assert.match(apply, /`git commit -m "<message>"`, with no pathspec/);
    assert.match(apply, /Never `git add -A`, `git add \.`, `git add -f`, `git reset`, `git restore --staged`/);
    assert.doesNotMatch(prompt, /^\s*git add -A\s*$/m);
  });

  test(`${layout}: validation resolves live placeholders by class, and protected ones are blocked, not deferred`, () => {
    assert.match(validation, /Verify the applied files against the write set and backups/);
    assert.match(validation, /run the applicable checks and report the commands and results, not assumed runtime validation/);
    assert.match(validation, /\*\*Live placeholders \(Completion Contract\)\.\*\*/);
    assert.match(validation, /Runtime variable, example, or intentional template text: leave it untouched/);
    assert.match(validation, /Required and ordinary, in a file this patch wrote: propose the exact repair in a follow-up write set/);
    assert.match(validation, /park the dependent work until answered/);
    assert.match(validation, /Follow-up repairs go through this same loop: review, approval, revalidation, write, and after-state evidence/);
    assert.match(validation, /Required, in a protected or customized file that this patch preserves: leave the file as it is and mark it \*\*blocked pending calibration\*\*/);
    assert.match(validation, /do not defer it silently to a later bootstrap/);
    assert.match(validation, /A follow-up write set is a new proposal\. It never extends the approved set without approval/);
    assert.match(validation, /Dispatch the same independent read-only reviewer on the actual applied outcome/);
    assert.match(validation, /Orchestrator verification failures are CHANGES in this same loop, not a new approval vote/);
    assert.match(validation, /repair only within the approved scope, rerun validation, and re-review until PASS/);
    assert.match(validation, /Any change outside the approved write set returns to step 4 and needs approval again/);
    assert.match(validation, /\*\*Applied\*\*: the write set as written, and anything \*\*pending\*\*/);
    assert.match(validation, /\*\*Reviewer-accepted\*\*: only when the current outcome has a review PASS and verified evidence/);
    assert.match(validation, /A missing reviewer or evidence is \*\*BLOCKED\*\*, never completion/);
    assert.match(validation, /For `--dry-run`, report only the reviewed preview: nothing was applied or post-apply verified/);
    assert.match(validation, /Reviewer acceptance does not authorize extra writes, deletions, or a commit, and it needs no separate final human vote/);
    assert.doesNotMatch(prompt, /ACCEPTED/);
  });

  test(`${layout}: cleanup is terminal only, and a resumed source is re-verified by identity`, () => {
    assert.match(cleanup, /Cleanup \(terminal\)/);
    assert.match(cleanup, /keep the temp source until final acceptance or the last rework has passed its scoped checks/);
    assert.match(cleanup, /rm -rf "\$TOOLKIT_TEMP"/);
    assert.match(cleanup, /fetch again and compare with the recorded identity/);
    assert.doesNotMatch(validation, /rm -rf/, 'validation never deletes the source it still needs');
  });

  test(`${layout}: approval, preservation and source/trust/version gates remain`, () => {
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
