'use strict';

// Unit tests for bin/relevance.js: the retirement list, project facts, relevance rules and the
// thin-wrapper audit. Run with: npm test (node --test). No network; git runs only in temp repos.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const relevance = require('../bin/relevance.js');
const cli = require('../bin/cli.js');

const SRC = path.join(__dirname, '..', 'src');

function tmp(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-relevance-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
}

// Runs fn with console output discarded (cmdInstall reports to the console).
function quiet(fn) {
  const log = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

function writeRetired(d, obj) {
  writeJson(path.join(d, '.nitm', 'retired.json'), obj);
}

const ENTRY = { path: '.agents/skills/using-superpowers', reason: 'not used here', date: '2026-10-27' };

// ---- retirement list ----

test('readRetired: an absent file retires nothing and leaves trackers to detection', (t) => {
  const d = tmp(t);
  assert.deepEqual(relevance.readRetired(d), { trackers: undefined, entries: [] });
});

test('readRetired: an invalid JSON file throws, so patch never falls back to re-adding files', (t) => {
  const d = tmp(t);
  fs.mkdirSync(path.join(d, '.nitm'));
  fs.writeFileSync(path.join(d, '.nitm', 'retired.json'), '{ "retired": [');
  assert.throws(() => relevance.readRetired(d), /not valid JSON/);
});

test('readRetired: each entry needs a relative path, a reason and a YYYY-MM-DD date', (t) => {
  const cases = [
    [{ path: '/etc/passwd', reason: 'x', date: '2026-10-27' }, /relative path/],
    [{ path: '../outside', reason: 'x', date: '2026-10-27' }, /relative path/],
    [{ path: '.', reason: 'x', date: '2026-10-27' }, /relative path/],
    [{ path: 'docs/a.md', date: '2026-10-27' }, /reason is required/],
    [{ path: 'docs/a.md', reason: '  ', date: '2026-10-27' }, /reason is required/],
    [{ path: 'docs/a.md', reason: 'x', date: '27/10/2026' }, /YYYY-MM-DD/],
    ['docs/a.md', /must be an object/],
  ];
  for (const [entry, pattern] of cases) {
    const d = tmp(t);
    writeRetired(d, { retired: [entry] });
    assert.throws(() => relevance.readRetired(d), pattern, JSON.stringify(entry));
  }
});

test('readRetired: normalises slashes and trailing slashes, rejects unknown trackers', (t) => {
  const d = tmp(t);
  writeRetired(d, { retired: [{ ...ENTRY, path: '.agents\\skills\\using-superpowers\\' }] });
  assert.equal(relevance.readRetired(d).entries[0].path, '.agents/skills/using-superpowers');
  writeRetired(d, { trackers: ['github', 'trello'] });
  assert.throws(() => relevance.readRetired(d), /"trackers" must be a list/);
});

test('retiredFor: a retired file or directory covers only its own paths, not similar names', () => {
  const entries = [{ ...ENTRY }];
  assert.ok(relevance.retiredFor('.agents/skills/using-superpowers', entries));
  assert.ok(relevance.retiredFor('.agents/skills/using-superpowers/SKILL.md', entries));
  assert.equal(relevance.retiredFor('.agents/skills/using-superpowers-extra/SKILL.md', entries), null);
  assert.equal(relevance.retiredFor('.agents/skills/superpowers/SKILL.md', entries), null);
});

test('readRetired: ./, doubled and inner-dot slashes are normalised to the canonical path', (t) => {
  const d = tmp(t);
  writeRetired(d, { retired: [
    { path: './AGENTS.md', reason: 'x', date: '2026-10-27' },
    { path: '.claude//commands/review-pr.md/', reason: 'x', date: '2026-10-27' },
    { path: 'a/./b.md', reason: 'x', date: '2026-10-27' },
  ] });
  assert.deepEqual(relevance.readRetired(d).entries.map((e) => e.path),
    ['AGENTS.md', '.claude/commands/review-pr.md', 'a/b.md']);
});

test('retiredFor: a retired path written in a non-canonical form still covers the template file', (t) => {
  const d = tmp(t);
  writeRetired(d, { retired: [
    { path: './AGENTS.md', reason: 'x', date: '2026-10-27' },
    { path: '.claude//commands', reason: 'x', date: '2026-10-27' },
  ] });
  const { entries } = relevance.readRetired(d);
  assert.ok(relevance.retiredFor('AGENTS.md', entries));
  assert.ok(relevance.retiredFor(path.join('.claude', 'commands', 'review-pr.md').split(path.sep).join('/'), entries));
});

test('readRetired: normalising never lets a path climb out of the project', (t) => {
  for (const bad of ['../x.md', 'a/../../x.md', 'a/../b.md', '/abs/x.md', './../x.md']) {
    const d = tmp(t);
    writeRetired(d, { retired: [{ path: bad, reason: 'x', date: '2026-10-27' }] });
    assert.throws(() => relevance.readRetired(d), /relative path/, bad);
  }
});

// ---- topics and relevance ----

test('topicOf: tracker skills, tool-named files, MCP templates and generic files', () => {
  assert.equal(relevance.topicOf('.agents/skills/gh-cli/SKILL.md'), 'tracker:github');
  assert.equal(relevance.topicOf('.agents/skills/linear-cli/SKILL.md'), 'tracker:linear');
  assert.equal(relevance.topicOf(path.join('.claude', 'commands', 'playwright-test.md')), 'playwright');
  assert.equal(relevance.topicOf('.github/prompts/playwright-test.prompt.md'), 'playwright');
  assert.equal(relevance.topicOf('.github/instructions/prisma-migrations.instructions.md'), 'prisma');
  assert.equal(relevance.topicOf('.github/instructions/component-structure.instructions.md'), 'ui');
  assert.equal(relevance.topicOf('.cursor/mcp.json'), 'mcp');
  assert.equal(relevance.topicOf('.mcp.json'), 'mcp');
  assert.equal(relevance.topicOf('.agents/skills/issue-tracker/SKILL.md'), null);
  assert.equal(relevance.topicOf('AGENTS.md'), null);
});

test('relevanceOf: a tracker skill applies only to the detected tracker', () => {
  const github = { trackers: ['github'], playwright: false, prisma: false, ui: false, stackKnown: true };
  assert.equal(relevance.relevanceOf('.agents/skills/gh-cli/SKILL.md', github).status, 'add');
  const linear = relevance.relevanceOf('.agents/skills/linear-cli/SKILL.md', github);
  assert.equal(linear.status, 'irrelevant');
  assert.equal(linear.reason, 'project tracker is github');
  const none = { ...github, trackers: [] };
  assert.equal(relevance.relevanceOf('.agents/skills/gh-cli/SKILL.md', none).status, 'irrelevant');
});

test('relevanceOf: an undetected tracker asks for a decision instead of guessing', () => {
  const facts = { trackers: null, playwright: false, prisma: false, ui: false, stackKnown: false };
  const r = relevance.relevanceOf('.agents/skills/acli/SKILL.md', facts);
  assert.equal(r.status, 'review');
  assert.match(r.reason, /set "trackers" in \.nitm\/retired\.json/);
});

test('relevanceOf: Playwright, Prisma and UI files follow the detected setup; generic files always apply', () => {
  const base = { trackers: [], playwright: false, prisma: false, ui: false, stackKnown: true };
  assert.equal(relevance.relevanceOf('.claude/commands/playwright-test.md', base).status, 'irrelevant');
  assert.equal(relevance.relevanceOf('.claude/commands/playwright-test.md', { ...base, playwright: true }).status, 'add');
  assert.equal(relevance.relevanceOf('.claude/rules/prisma-migrations.md', base).status, 'irrelevant');
  assert.equal(relevance.relevanceOf('.claude/rules/ui-accessibility.md', base).status, 'irrelevant');
  assert.equal(relevance.relevanceOf('.claude/rules/ui-accessibility.md', { ...base, ui: true }).status, 'add');
  assert.equal(relevance.relevanceOf('.claude/rules/ui-accessibility.md', { ...base, stackKnown: false }).status, 'review');
  assert.equal(relevance.relevanceOf('AGENTS.md', base).status, 'add');
  assert.equal(relevance.relevanceOf('.mcp.json', base).status, 'irrelevant');
});

// ---- project facts ----

test('detectProject: reads Playwright, Prisma and UI from package.json, including monorepo apps', (t) => {
  const d = tmp(t);
  writeJson(path.join(d, 'package.json'), { devDependencies: { '@playwright/test': '1', prisma: '5' } });
  writeJson(path.join(d, 'apps', 'web', 'package.json'), { dependencies: { next: '16' } });
  const facts = relevance.detectProject(d, { entries: [] });
  assert.equal(facts.playwright, true);
  assert.equal(facts.prisma, true);
  assert.equal(facts.ui, true);
  assert.equal(facts.stackKnown, true);
});

test('detectProject: an empty directory detects nothing and does not guess a tracker', (t) => {
  const d = tmp(t);
  const facts = relevance.detectProject(d, { entries: [] });
  assert.deepEqual(
    { playwright: facts.playwright, prisma: facts.prisma, ui: facts.ui, stackKnown: facts.stackKnown, trackers: facts.trackers },
    { playwright: false, prisma: false, ui: false, stackKnown: false, trackers: null },
  );
});

test('detectProject: the git origin host names the tracker; a configured list overrides it', (t) => {
  const d = tmp(t);
  const git = spawnSync('git', ['init', '-q'], { cwd: d });
  if (git.status !== 0) return t.skip('git is not available');
  spawnSync('git', ['remote', 'add', 'origin', 'git@github.com:acme/app.git'], { cwd: d });
  assert.deepEqual(relevance.detectProject(d, { entries: [] }).trackers, ['github']);
  assert.equal(relevance.detectProject(d, { entries: [] }).trackerSource, 'git origin');
  writeRetired(d, { trackers: ['linear'], retired: [] });
  const configured = relevance.detectProject(d, relevance.readRetired(d));
  assert.deepEqual(configured.trackers, ['linear']);
  assert.match(configured.trackerSource, /configured in/);
});

test('detectProject: an unknown git host is not guessed as a tracker', (t) => {
  const d = tmp(t);
  if (spawnSync('git', ['init', '-q'], { cwd: d }).status !== 0) return t.skip('git is not available');
  spawnSync('git', ['remote', 'add', 'origin', 'https://git.example.internal/acme/app.git'], { cwd: d });
  assert.equal(relevance.detectProject(d, { entries: [] }).trackers, null);
});

// ---- thin-wrapper audit ----

const TARGET = { rel: '.claude/rules-snippets/api-server.md', needle: 'rules-snippets/api-server.md' };
const SKILL = { rel: '.agents/skills/orient/SKILL.md', needle: '.agents/skills/orient/SKILL.md' };

test('auditWrapper: a link, a short summary and a few key points is thin', () => {
  const content = [
    '---', 'description: "API rules."', '---', '', '# API', '',
    'API and server-side standards.', '',
    'Follow the rules defined in [../rules-snippets/api-server.md](../rules-snippets/api-server.md).', '',
    'Key points:', '', '- one', '- two', '',
  ].join('\n');
  assert.deepEqual(relevance.auditWrapper(content, [TARGET]), { status: 'thin', reason: '' });
});

test('auditWrapper: policy prose, a table outside Agent Dispatch, or too many key points is inlined', () => {
  const prose = '---\n---\n\n# X\n\nFirst rule of policy here.\nSecond rule of policy here.\n\n'
    + 'Read and follow `.claude/rules-snippets/api-server.md` when these standards apply.\n';
  assert.equal(relevance.auditWrapper(prose, [TARGET]).status, 'inlined');
  const table = '---\n---\n\n# X\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n'
    + 'Read and follow `.claude/rules-snippets/api-server.md` before work.\n';
  assert.equal(relevance.auditWrapper(table, [TARGET]).status, 'inlined');
  const bullets = `---\n---\n\n# X\n\nRead and follow \`.claude/rules-snippets/api-server.md\`.\n\n${'- k\n'.repeat(relevance.MAX_KEY_POINTS + 1)}`;
  assert.match(relevance.auditWrapper(bullets, [TARGET]).reason, /key points/);
});

test('auditWrapper: an Agent Dispatch table and an Arguments section are activation metadata', () => {
  const content = '---\n---\n\n# X\n\n## Agent Dispatch\n| Agent | When |\n|---|---|\n| `reviewer` | always |\n\n'
    + '## Arguments\n\nSubcommands: start | status\n\n$ARGUMENTS\n\n'
    + 'Read and follow `.claude/rules-snippets/api-server.md` before executing this command.\n';
  assert.equal(relevance.auditWrapper(content, [TARGET]).status, 'thin');
});

test('auditWrapper: a wrapper that links no existing source is diverged', () => {
  const content = '---\n---\n\n# X\n\nRead and follow `.claude/rules-snippets/gone.md`.\n';
  assert.equal(relevance.auditWrapper(content, [TARGET]).status, 'diverged');
  assert.equal(relevance.auditWrapper(content, [SKILL]).status, 'diverged');
});

test('wrapperSources: a rule snippet, prompt snippet or agent snippet, with the same-named skill second', () => {
  assert.equal(relevance.wrapperSources('.cursor/rules/logging.mdc')[0].rel, '.claude/rules-snippets/logging.md');
  assert.equal(relevance.wrapperSources('.github/prompts/review.prompt.md')[0].rel, '.claude/prompt-snippets/review.md');
  assert.equal(relevance.wrapperSources('.github/agents/reviewer.agent.md')[0].rel, '.claude/agents-snippets/reviewer.md');
  assert.equal(relevance.wrapperSources('.opencode/rules/orient-to-recent-work.md')[1].rel,
    '.agents/skills/orient-to-recent-work/SKILL.md');
  assert.equal(relevance.wrapperSources('AGENTS.md'), null);
  assert.equal(relevance.wrapperSources('.claude/rules/nested/x.md'), null);
});

for (const layout of ['repo', 'monorepo']) {
  test(`templates: every harness wrapper in src/${layout} is a thin link to its snippet`, (t) => {
    const d = tmp(t);
    quiet(() => cli.cmdInstall(d, { [layout]: true }));
    const plan = cli.planFiles(layout, d, { mode: 'patch', selection: null });
    assert.deepEqual(relevance.auditWrappers(d, plan), []);
    const wrappers = plan.filter((e) => relevance.wrapperSources(e.rel));
    assert.ok(wrappers.length > 100, `${layout} ships wrappers (${wrappers.length})`);
    assert.ok(fs.existsSync(path.join(SRC, layout, '.claude', 'prompt-snippets', 'bootstrap.md')));
  });
}
