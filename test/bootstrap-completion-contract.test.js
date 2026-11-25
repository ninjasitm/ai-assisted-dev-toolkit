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
    assert.match(order, /The pinned CLI refresh \(Step 12\) runs second/);
    assert.match(order, /Each phase has its own independent review and human approval/);
    assert.match(order, /Scope, before any write \(read-only\)/);
    assert.match(order, /verified pinned source that supports both review-token preview and `--expect`/);
    assert.match(order, /pre-native preview, when available, is .* informational for planning only/);
    assert.match(order, /Review the native candidate set/);
    assert.match(order, /native-only path may continue only under its own required evidence, independent review, and human approval/);
    assert.match(order, /Approve and apply the native set/);
    assert.match(order, /Preview the actual post-native CLI set/);
    assert.match(order, /Independently review and approve the exact post-native CLI set/);
    assert.match(order, /Any changed write needs review and its own approval/);
    assert.match(order, /An earlier approval never covers a changed write/);
    assert.match(order, /A `--dry-run` executes no native operation and no CLI apply/);
    assert.match(order, /may run the read-only pre-native preview in step 1, then stops/);
    assert.match(order, /Category-level permission to inspect is not write approval/);
  });

  test(`${layout}/bootstrap-upgrade: the marker refresh drift-checks the CLI set and stops before any CLI write`, () => {
    const text = snippet(layout, 'bootstrap-upgrade');
    assert.doesNotMatch(text, /npx nitm-ai-dev-toolkit patch/, 'no unpinned npx patch shortcut');
    const s12 = step(text, 12);
    assert.match(s12, /phase 2 of the Migration order/);
    assert.match(s12, /same verified pinned source and exact invocation as `bootstrap-patch\.md` step 5/);
    assert.match(s12, /patch --<resolved-layout> --dry-run \[same selected flags\]/);
    assert.match(s12, /against the actual post-native state/);
    assert.match(s12, /explicit omissions, and a 64-hex review token/);
    assert.match(s12, /fresh independent review and separate human approval of the exact new post-native set/);
    assert.match(s12, /Do not download a second copy/);
    assert.match(s12, /\*\*STOP before CLI writes\*\*/);
    assert.match(s12, /protected v3 mutation \(any `update` or `overwrite` of an existing snippet, wrapper, or other v3 file\)/);
    assert.match(s12, /any overlap\/difference is not already understood and explicitly reviewed/);
    assert.match(s12, /Do not mint a replacement token and treat it as accepted/);
    assert.match(s12, /byte-for-byte equals the token reviewed and approved above/);
    assert.match(s12, /`\.toolkit-version` marker last among CLI writes/);
    assert.match(s12, /Patch creates no automatic handoff backup/);
    assert.match(s12, /`keep`, `skip`, and `unchanged` mean it remains byte-identical/);
    assert.match(s12, /Never write `\.toolkit-version` by hand/);
    assert.match(s12, /records the installed package version, never a hard-coded value/);
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
    assert.match(order, /pass the source gate in `bootstrap-patch\.md` step 1, or reuse the source already verified in this run/);
    assert.match(order, /If the source gate fails, run no CLI invocation at all/);
    assert.ok(order.indexOf('source gate') < order.indexOf('patch --<resolved-layout>'), 'gate precedes the preview');
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

test('README: patch preserves owned state and distinguishes install handoff backup behavior', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, /the CLI `patch` command only adds missing files/);
  assert.doesNotMatch(readme, /or `patch` to add only missing files/);
  assert.match(readme, /When the target supports reviewed patch behavior, normal `upgrade` follows it: adds a missing handoff, refreshes a proven toolkit-owned unchanged handoff, and keeps customized or ownership-unknown handoffs/);
  assert.match(readme, /When the target supports reviewed patch behavior, normal `upgrade` follows it/);
  assert.match(readme, /`upgrade --force` uses `install --force`, so it overwrites existing files; only the existing handoff has the handoff-specific backup behavior/);
  assert.match(readme, /Review-token flags \(`--skip-path` and `--expect`\) require an exact target-version pin/);
  assert.match(readme, /Plain patch detects all conflicts before writing/);
  assert.match(readme, /backs up that handoff under `\.nitm\/backups\/` before replacing it/);
  assert.match(readme, /This is not a general backup of forced template writes/);
  assert.match(readme, /historically this required target 5\.0\.1\+/);
});
