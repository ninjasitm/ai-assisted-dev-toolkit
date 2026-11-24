'use strict';

// Static contract checks for the learn skill. They read template text only: they show that the skill is
// opt-in and runs only with verified merge evidence (a local commit or a merged, persisted MR identity) and
// a current APPROVE, that missing-report recovery writes only learn.md, that retro is used only when it
// provably matches, that manual use needs the same evidence, that it proposes one outcome and at most one
// candidate, that its single write is the job's learn.md, that memory entries carry source and recheck cues,
// that approval and commit stay separate, that the pinned upstream design references are cited, and that both
// layouts are byte-identical with resolvable links. They do not prove how an agent behaves at runtime.
// Run with: node --test test/learn.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];
const SKILL = '.agents/skills/learn/SKILL.md';

const read = (layout, file) => fs.readFileSync(path.join(ROOT, layout, file), 'utf8');

// Relative markdown links in a file, resolved against that file's directory.
function localLinks(layout, file) {
  const dir = path.dirname(path.join(ROOT, layout, file));
  return [...read(layout, file).matchAll(/\]\((\.\.?\/[^)#\s]+)(#[^)]*)?\)/g)]
    .map((m) => ({ target: m[1], resolved: path.resolve(dir, m[1]) }));
}

test('learn: SKILL.md is byte-identical in src/repo and src/monorepo', () => {
  const [repo, monorepo] = LAYOUTS.map((layout) => fs.readFileSync(path.join(ROOT, layout, SKILL)));
  assert.ok(repo.equals(monorepo), 'learn SKILL.md differs between layouts');
});

test('learn: SKILL.md has the skill frontmatter with name learn', () => {
  for (const layout of LAYOUTS) {
    assert.match(read(layout, SKILL), /^---\nname: learn\ndescription: .+\n---\n/, layout);
  }
});

for (const layout of LAYOUTS) {
  const text = read(layout, SKILL);

  test(`${layout}/learn: opt-in and Factory only`, () => {
    assert.match(text, /`"learn": true`/);
    assert.match(text, /Absent or any other value is off/);
  });

  test(`${layout}/learn: requires verified merge evidence; the merged stage alone is never proof`, () => {
    assert.match(text, /Verified merge required/);
    assert.match(text, /`merge` record must show a completed merge/);
    assert.match(text, /`mode: local` with `commit: <sha>`, the post-merge commit of the `--no-ff` merge/);
    assert.match(text, /`mode: push-mr` with `state: MERGED` and `merge\.mr` exactly equal to the job's recorded `mr` URL/);
    assert.match(text, /A Forge merge commit is optional and irrelevant there/);
    assert.match(text, /The stage `merged` alone is never proof/);
    assert.match(text, /It is never the identity of the reviewed work/);
  });

  test(`${layout}/learn: requires a current APPROVE; skips awaiting, abandoned, needs-human, and superseded decisions`, () => {
    assert.match(text, /The final `decision\.md` must be `APPROVE`/);
    assert.match(text, /Skip a job still awaiting approval or merge/);
    assert.match(text, /an `abandoned` job/);
    assert.match(text, /a job that needs a human/);
    assert.match(text, /current decision is `ESCALATE` or has been superseded/);
    assert.match(text, /later merge once that merge has a fresh verified `APPROVE`/);
  });

  test(`${layout}/learn: missing-report recovery writes only learn.md and redoes nothing`, () => {
    assert.match(text, /Missing report recovery/);
    assert.match(text, /no `learn\.md`/);
    assert.match(text, /write only that report/);
    assert.match(text, /does not redo the merge, fetch, run tests, reset, or change the worktree/);
    assert.match(text, /follows the current `decision\.md`, not an older one/);
  });

  test(`${layout}/learn: manual use needs the same evidence; naming or stage text is not proof`, () => {
    assert.match(text, /Manual use/);
    assert.match(text, /Naming a job is not proof/);
    assert.match(text, /needs the same verified merge record and current `APPROVE`/);
    assert.match(text, /Without them, skip/);
    assert.match(text, /Do not invent commands, checkouts, or paths/);
  });

  test(`${layout}/learn: retro is used only when it provably matches; otherwise omitted, never rerun`, () => {
    assert.match(text, /Retro: `round-<R>\/retro-<D>\.md` is used only when it provably matches the current acceptance basis/);
    assert.match(text, /first line names the decision type \(`APPROVE` or `ESCALATE`\) and round `R`/);
    assert.match(text, /its reviewed or tested input identity equals the identity the current `decision\.md` records for that same round and decision type/);
    assert.match(text, /Never use `merge\.commit`, or any merge commit, as retro identity/);
    assert.match(text, /With no matching acceptance basis, omit retro, say so in the report, and keep the narrower evidence/);
    assert.match(text, /Learn never reruns retro/);
    assert.match(text, /a missing or stale retro is not a reason to skip/);
  });

  test(`${layout}/learn: reads only the job's final evidence and relevant guidance`, () => {
    assert.match(text, /`job\.json`: the `merge` record/);
    assert.match(text, /`decision\.md`: the current `APPROVE`/);
    assert.match(text, /`qa\.md`/);
    assert.match(text, /The accepted artifacts/);
    assert.match(text, /only the source paths relevant to a candidate/);
    assert.match(text, /approved project memory/);
    assert.match(text, /Never read raw transcripts/);
    assert.match(text, /session logs, shell output, stdout/);
    assert.match(text, /environment files, credentials, global configuration, another project's data, or the tracker/);
    assert.match(text, /Make no network call\. Run no test, lint, build, git, or tracker command\. Do not publish\./);
  });

  test(`${layout}/learn: exposes exactly three outcomes: none, memory, diff`, () => {
    assert.match(text, /1\. \*\*`none`\*\*/);
    assert.match(text, /2\. \*\*`memory`\*\*/);
    assert.match(text, /3\. \*\*`diff`\*\*/);
    assert.match(text, /exactly one outcome and at most one candidate/);
  });

  test(`${layout}/learn: candidates need verified evidence and reject one-off, duplicate, or stale items`, () => {
    assert.match(text, /needs evidence the job itself verified/);
    assert.match(text, /Claims in the builder's prose alone are not evidence/);
    assert.match(text, /\*\*One-off:\*\*/);
    assert.match(text, /\*\*Duplicate:\*\*/);
    assert.match(text, /\*\*Stale:\*\*/);
    assert.match(text, /recurring verified pattern/);
    assert.match(text, /important verified durable convention/);
    assert.match(text, /Keep one candidate per run/);
  });

  test(`${layout}/learn: each candidate cites evidence, exact target, change, check, and counterexample`, () => {
    for (const field of ['Evidence:', 'Target:', 'Change:', 'Check:', 'Counterexample:', 'Status:']) {
      assert.ok(text.includes(field), `missing candidate field ${field}`);
    }
    assert.match(text, /Prefer the existing canonical guidance file/);
  });

  test(`${layout}/learn: output records merge evidence and retro status`, () => {
    assert.match(text, /^Merge: <local <merge\.commit> \| push-mr MERGED <merge\.mr>>$/m);
    assert.match(text, /^Retro: used \| omitted \(<reason>\)$/m);
    assert.match(text, /`factory\/jobs\/<id>\/learn\.md`/);
    assert.match(text, /ignored by git/);
    assert.match(text, /the only write, on the default path and in recovery/);
  });

  test(`${layout}/learn: writes nothing else, and no approval, merge, or global state is changed`, () => {
    assert.match(text, /Write nothing except `learn\.md` in the job folder/);
    assert.match(text, /never silently, even when the operator enabled Learn/);
    assert.match(text, /Create no other files/);
    assert.match(text, /Never edit `AGENTS\.md`, skills, docs, memory, `job\.json`, the merge/);
    assert.match(text, /global or user config/);
  });

  test(`${layout}/learn: the memory default is docs/agent-memory.md, created only on approval, with source and recheck cues`, () => {
    assert.match(text, /docs\/agent-memory\.md/);
    assert.match(text, /created only after the operator approves the exact patch/);
    assert.match(text, /never scaffolded in advance/);
    assert.match(text, /Source: <job id>\/<artifact>\. Recheck: <command or file/);
    assert.match(text, /not authority/);
    assert.match(text, /never overrides `AGENTS\.md`, a skill, or a rule/);
    assert.match(text, /only when that file exists/);
  });

  test(`${layout}/learn: approval is a separate later task; nothing commits, pushes, or publishes`, () => {
    assert.match(text, /never applies its own proposal/);
    assert.match(text, /separate, later task/);
    assert.match(text, /Approval covers only that exact text and target/);
    assert.match(text, /Commit and push are separate decisions/);
  });

  test(`${layout}/learn: redacts secrets, personal identity, and internal hosts`, () => {
    assert.match(text, /## Redaction/);
    assert.match(text, /\[redacted\]/);
    assert.match(text, /personal email address or name, and internal host/);
  });

  test(`${layout}/learn: needs no install, runtime, CLI, config, or dependency`, () => {
    assert.doesNotMatch(text, /\b(npm|pnpm|yarn|pip|brew) install\b/);
    assert.doesNotMatch(text, /\bnpx\b/);
    assert.doesNotMatch(text, /\bopencode\.jsonc\b/);
    assert.doesNotMatch(text, /\bmcp\.json\b/);
  });

  test(`${layout}/learn: cites the pinned upstream designs and no contingent license`, () => {
    assert.ok(text.includes('lee-to/ai-factory') && text.includes('647f47cd0fe64b1968e335dda1ce7ca4a46fe379'));
    assert.ok(text.includes('skills/aif-evolve/SKILL.md'));
    assert.ok(text.includes('pskoett') && text.includes('878b0e48bca74849c6219815882e75e60cfa2b72'));
    assert.ok(text.includes('skills/self-improvement/SKILL.md'));
    assert.match(text, /Design inspiration, not copied text/);
    assert.match(text, /no upstream license dependency/);
  });

  test(`${layout}/learn: has no unresolved {{PLACEHOLDER}} tokens`, () => {
    assert.doesNotMatch(text, /\{\{[A-Z_]+\}\}/);
  });

  test(`${layout}/learn: relative links resolve`, () => {
    const links = localLinks(layout, SKILL);
    assert.ok(links.length >= 1, 'expected the retro link');
    for (const link of links) {
      assert.ok(fs.existsSync(link.resolved), `broken link: ${link.target}`);
    }
  });
}
