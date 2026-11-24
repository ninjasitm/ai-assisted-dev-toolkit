'use strict';

// Prompt-contract regression checks for the bootstrap completion checklist, the guided upgrade
// route, the handoff and the README. Text-based and read-only: no live harness, and no project
// writes outside a tmp dir. Run: node --test test/bootstrap-completion-contract.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cli = require('../bin/cli.js');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const LAYOUTS = ['repo', 'monorepo'];
const snippet = (layout, name) => read(`src/${layout}/.claude/prompt-snippets/${name}.md`);

// The section from its heading up to the next level-2 heading.
function section(text, heading) {
  const start = text.indexOf(`## ${heading}\n`);
  if (start < 0) return null;
  const rest = text.slice(start + 1);
  const next = rest.search(/^## /m);
  return text.slice(start, next < 0 ? undefined : start + 1 + next);
}

// The text from a `### 12.` / `### Step 12:` heading up to the next `### 13` / `### Step 13` heading.
function step(text, n) {
  const start = text.search(new RegExp(`^### (?:Step )?${n}[.:]`, 'm'));
  const end = text.search(new RegExp(`^### (?:Step )?${n + 1}[.:]`, 'm'));
  assert.ok(start >= 0 && end > start, `step ${n} present`);
  return text.slice(start, end);
}

test('completion contract: one short canonical section per template, identical across both layouts', () => {
  const sections = LAYOUTS.map((layout) => {
    const text = snippet(layout, 'bootstrap');
    assert.equal(text.split('## Completion Contract').length - 1, 1, `${layout}: exactly one section`);
    const body = section(text, 'Completion Contract');
    assert.ok(body, `${layout}: section present`);
    assert.ok(body.split('\n').length <= 30, `${layout}: short (${body.split('\n').length} lines)`);
    return body;
  });
  assert.equal(sections[0], sections[1], 'the two layouts carry the same checklist text');
  const [body] = sections;
  for (const needle of [
    'Cite before you fill',
    'No guessed required facts',
    'Ask, then park',
    'Omit unsupported optional blocks',
    'Verify what you changed',
    'the active files they link to or affect',
    '**Statuses.** *Applied* means written',
    '*Reviewer-accepted* means an independent reviewer returned PASS',
    'Human approvals given during bootstrap are established',
    'Removals need explicit approval',
    'Retirement is not removal',
    '`npx nitm-ai-dev-toolkit doctor` is advisory',
  ]) assert.ok(body.includes(needle), `checklist item: ${needle}`);
  assert.match(body, /Guided patch and upgrade load it once, before any change/);
});

test('completion contract: the handoff written to .nitm/BOOTSTRAP.md inlines the checklist', () => {
  const origLog = console.log;
  console.log = () => {};
  try {
    for (const flags of [{ repo: true }, { monorepo: true }]) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-contract-'));
      cli.cmdInstall(dir, flags);
      const handoff = fs.readFileSync(path.join(dir, cli.HANDOFF_FILE), 'utf8');
      assert.equal(handoff.split('## Completion Contract').length - 1, 1, JSON.stringify(flags));
    }
  } finally {
    console.log = origLog;
  }
});

test('bootstrap steps no longer fill required facts from defaults that the contract forbids', () => {
  for (const layout of LAYOUTS) {
    const text = snippet(layout, 'bootstrap');
    assert.doesNotMatch(text, /else `main`/, `${layout}: default branch is asked, not assumed`);
    assert.match(text, /otherwise ask \(never assume `main`\)/, layout);
    assert.doesNotMatch(text, /Scripts, config, or framework default|Config or framework defaults\b/, layout);
    assert.doesNotMatch(text, /All placeholders replaced \(list any remaining\)/, `${layout}: no all-placeholders claim`);
    assert.match(text, /No required `\{\{PLACEHOLDER\}\}` left live in changed files/, layout);
    assert.match(text, /a question, not a default; park the work that depends on it/, layout);
    // Factory review lenses are asked or omitted, never defaulted to code, security.
    assert.doesNotMatch(text, /Default `code, security`/, `${layout}: no imposed Factory lens default`);
    assert.match(text, /Ask which review lenses to run .*If none is chosen, omit the setting; no default is assumed/, layout);
    // Completion wording is for after verification only: no premature "Complete" headings.
    assert.doesNotMatch(text, /Bootstrap Complete!/, `${layout}: no premature completion heading`);
    assert.match(text, /write only after (?:Step 10 verification passes|final verification)/, layout);
  }
});

test('statuses: the completion report is written only after verification, and no final human vote is required', () => {
  for (const layout of LAYOUTS) {
    const text = snippet(layout, 'bootstrap');
    assert.match(text, /Guided patch and upgrade need the user's approval to write and answers to unresolved required questions, but no final human acceptance vote/, layout);
  }
});

for (const layout of LAYOUTS) {
  test(`${layout}/bootstrap-upgrade: native migration runs first, then one separately approved marker refresh`, () => {
    const text = snippet(layout, 'bootstrap-upgrade');
    const order = section(text, 'Migration order and approvals (v3 and legacy routes)');
    assert.ok(order, 'migration order section present');
    assert.ok(text.indexOf('## Migration order and approvals') < text.indexOf('## OpenCode migration guardrails'));
    assert.match(order, /The native migration \(Steps 2–11, for the selected route\) runs first/);
    assert.match(order, /The pinned CLI refresh of the version marker \(Step 12\) runs second/);
    assert.match(order, /Each phase has its own approval/);
    assert.match(order, /Scope, before any write \(read-only\)/);
    assert.match(order, /`node "\$SOURCE_ROOT\/bin\/cli\.js" patch --dry-run`/);
    assert.match(order, /name each known difference with the native change that causes it/);
    assert.match(order, /Review both candidate sets/);
    assert.match(order, /If the CLI path is barred, the independently approved structural path still proceeds/);
    assert.match(order, /Approve and apply the native set/);
    assert.match(order, /Check the CLI set against the actual state/);
    assert.match(order, /Approve and apply the refresh/);
    assert.match(order, /Alignment is not repeated when the scope is unchanged/);
    assert.match(order, /An earlier approval never covers a changed write/);
    assert.match(order, /A `--dry-run` executes no native operation and no CLI apply/);
    assert.match(order, /Category-level permission to inspect is not write approval/);
  });

  test(`${layout}/bootstrap-upgrade: the marker refresh drift-checks the CLI set and stops before any CLI write`, () => {
    const text = snippet(layout, 'bootstrap-upgrade');
    assert.doesNotMatch(text, /npx nitm-ai-dev-toolkit patch/, 'no unpinned npx patch shortcut');
    const s12 = step(text, 12);
    assert.match(s12, /phase 2 of the Migration order/);
    assert.match(s12, /same verified source and the same invocation as `bootstrap-patch\.md` step 5/);
    assert.match(s12, /node "\$SOURCE_ROOT\/bin\/cli\.js" patch --dry-run/);
    assert.match(s12, /compare it with the reviewed expected CLI set and before-state for this phase, not with the earlier pre-native output/);
    assert.match(s12, /Do not download a second copy/);
    assert.match(s12, /\*\*STOP\*\* before any CLI write/);
    assert.match(s12, /protected v3 mutation \(any `update` or `overwrite` of an existing snippet, wrapper, or other v3 file\)/);
    assert.match(s12, /or any difference, overlap, or conflict that was not reviewed and approved/);
    assert.match(s12, /Re-enter planning, review, and consent for the changed set, or leave the refresh pending/);
    assert.match(s12, /Never write `\.toolkit-version` by hand/);
    assert.match(s12, /Keep the `\.toolkit-version` value the CLI writes \(the installed package version, 4\.0\.0 or later; never hard-coded\)/);
    assert.match(s12, /Handoff backup \(recorded action\):\*\*/);
    assert.match(s12, /`create`, `replace \(old copy backed up\)`, or `no change`/);
    assert.match(s12, /exactly one new `BOOTSTRAP\.<UTC stamp>\[-N\]\.md` must appear/);
    assert.match(s12, /zero new automatic handoff backups must appear/);
    assert.match(s12, /Report the native and marker outcomes separately/);
    assert.match(s12, /Never mark the migration complete from the marker alone/);
  });

  test(`${layout}/bootstrap-upgrade: hooks are made executable only at exact copied paths, with no wildcard chmod`, () => {
    const text = snippet(layout, 'bootstrap-upgrade');
    assert.doesNotMatch(text, /chmod \+x hooks\/\*/, 'no wildcard chmod');
    assert.match(text, /make executable only the exact `\.js` paths this step copied/);
  });

  test(`${layout}/bootstrap-upgrade: the commit rule is the one in bootstrap-patch.md, and the upgrade never stages broadly`, () => {
    const text = snippet(layout, 'bootstrap-upgrade');
    const s15 = text.slice(text.search(/^### (?:Step )?15[.:]/m));
    assert.match(s15, /Only on an explicit request, after the Step 13 acceptance/);
    assert.match(s15, /Apply the commit rule in `bootstrap-patch\.md` step 5f/);
    assert.match(s15, /`git add -f`/);
    assert.match(s15, /`chore: upgrade AI instructions to toolkit <version>`/);
    assert.doesNotMatch(text, /^\s*git add -A\s*$/m, 'no executed blanket staging in the upgrade');
    assert.doesNotMatch(text, /^git add \.$/m);
    assert.doesNotMatch(text, /git add -- /, 'the staging procedure lives only in bootstrap-patch.md');
    assert.match(text, /independent review PASS of the exact candidate/);
    assert.match(text, /Retiring a skill in `\.nitm\/retired\.json` is never removal/);
  });

  test(`${layout}/bootstrap-upgrade: the v4 route still hands off to the guided patch`, () => {
    const routing = section(snippet(layout, 'bootstrap-upgrade'), 'Toolkit version routing (before parallel dispatch)');
    assert.ok(routing, 'routing section present');
    assert.match(routing, /Completion checklist \(every route\)/);
    assert.match(routing, /\*\*>=4\.0\.0\*\*: Use bootstrap-patch/);
  });
}

for (const layout of LAYOUTS) {
  test(`${layout}/bootstrap-upgrade: source gate precedes any CLI preview; the reviewer covers the actual outcome; reports stay in chat`, () => {
    const text = snippet(layout, 'bootstrap-upgrade');
    const order = section(text, 'Migration order and approvals (v3 and legacy routes)');
    assert.match(order, /first pass the source gate in `bootstrap-patch\.md` step 1, or reuse the source already verified in this run \(minimum 5\.2\.0\)/);
    assert.match(order, /If the gate fails, run no CLI invocation at all/);
    assert.ok(order.indexOf('source gate') < order.indexOf('patch --dry-run'), 'gate precedes the preview');
    const s13 = text.slice(text.search(/^### (?:Step )?13[.:]/m), text.search(/^### (?:Step )?14[.:]/m));
    assert.match(s13, /\*\*Independent review of the actual outcome\.\*\*/);
    assert.match(s13, /the native set alone when the refresh was barred/);
    assert.match(s13, /post-apply loop in `bootstrap-patch\.md` step 6/);
    assert.match(s13, /blocked pending calibration/);
    assert.match(s13, /Report \*\*reviewer-accepted\*\* only for a current, scoped outcome/);
    assert.match(s13, /A preview is never reported as applied/);
    assert.match(s13, /No commit is implied/);
    assert.doesNotMatch(text, /docs\/upgrade-report/, 'the upgrade report is chat or stdout only');
    assert.match(text, /Output the report to chat\/stdout only|Include only operations\/checks actually performed/);
  });
}

test('README: the touched paragraphs describe template changes, state files and the handoff backup', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, /the CLI `patch` command only adds missing files/);
  assert.doesNotMatch(readme, /or `patch` to add only missing files/);
  assert.match(readme, /The CLI `patch` command adds missing files, updates files you never changed, and writes its state files/);
  assert.match(readme, /It never overwrites a template file you changed; the handoff is backed up before it is replaced/);
  assert.match(readme, /`\.nitm\/backups\/BOOTSTRAP\.<UTC timestamp>\.md`/);
  assert.match(readme, /A new `--only` or `--exclude` selection is saved to `\.nitm\/toolkit\.json`/);
});
