'use strict';

// Tests for the nitm-ai-dev-toolkit CLI.
// Run with: npm test  (node --test)
// No network: exercises the pure logic + local file scaffolding only.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cli = require('../bin/cli.js');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-cli-'));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
}
function captureOutput(fn) {
  const lines = [];
  const log = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = log;
  }
  return lines.join('\n');
}

function assertOpenCodeReferences(d, type) {
  // Each local wrapper's shared source must be readable in the installed tree.
  for (const dir of ['agents', 'commands', 'rules']) {
    const wrappers = cli.templateFiles(type).filter((rel) =>
      rel.startsWith(path.join('.opencode', dir) + path.sep) && rel.endsWith('.md'));
    assert.ok(wrappers.length > 0, `${dir} wrappers present`);
    let linkedSources = 0;
    for (const rel of wrappers) {
      const content = fs.readFileSync(path.join(d, rel), 'utf8');
      // OpenCode V2 does not expand `@path` imports: wrappers use the explicit "Read and follow" form.
      assert.doesNotMatch(content, /@\.claude\//, `${rel}: bare @.claude/ import`);
      const refs = [...content.matchAll(/Read and follow `(\.claude\/[^`\s]+)`/g)];
      linkedSources += refs.length;
      for (const [, target] of refs) {
        assert.ok(fs.readFileSync(path.join(d, target), 'utf8').length > 0, `${rel}: ${target} readable`);
      }
    }
    assert.ok(linkedSources > 0, `${dir} shared sources checked`);
  }
  for (const rel of ['.agents/skills/ponytail/SKILL.md',
    '.agents/skills/orient-to-recent-work/SKILL.md', 'hooks/ponytail-config.js',
    'hooks/ponytail-instructions.js']) {
    assert.ok(fs.readFileSync(path.join(d, rel), 'utf8').length > 0, `${rel} readable`);
  }
  const config = JSON.parse(fs.readFileSync(path.join(d, '.opencode/opencode.jsonc'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.plugins.some((plugin) => plugin.includes('ponytail')), false,
    'Ponytail is installed globally by the operator, not registered in the template');
  for (const extension of ['js', 'mjs', 'ts']) {
    assert.equal(fs.existsSync(path.join(d, '.opencode/plugins', `ponytail.${extension}`)), false);
  }
  const instructions = path.join(d, '.github', 'instructions');
  for (const file of fs.readdirSync(instructions)) {
    const content = fs.readFileSync(path.join(instructions, file), 'utf8');
    const links = [...content.matchAll(/\]\(([^)]+\.claude\/rules-snippets\/[^)]+)\)/g)];
    assert.ok(links.length > 0, `${file} links to shared standards`);
    for (const [, target] of links) {
      assert.ok(fs.readFileSync(path.resolve(instructions, target), 'utf8').length > 0);
    }
  }
}

test('detectType: defaults to repo', () => {
  const d = tmp();
  assert.equal(cli.detectType(d, {}), 'repo');
});

test('detectType: --monorepo flag forces monorepo', () => {
  const d = tmp();
  assert.equal(cli.detectType(d, { monorepo: true }), 'monorepo');
});

test('detectType: --repo flag overrides workspaces', () => {
  const d = tmp();
  writeJson(path.join(d, 'package.json'), { workspaces: ['packages/*'] });
  assert.equal(cli.detectType(d, { repo: true }), 'repo');
});

test('detectType: workspaces package.json => monorepo', () => {
  const d = tmp();
  writeJson(path.join(d, 'package.json'), { workspaces: ['packages/*'] });
  assert.equal(cli.detectType(d, {}), 'monorepo');
});

test('detectType: apps + packages dirs => monorepo', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, 'apps'));
  fs.mkdirSync(path.join(d, 'packages'));
  assert.equal(cli.detectType(d, {}), 'monorepo');
});

test('scopeFiles: no env returns every file', () => {
  const files = ['AGENTS.md', '.claude/a.md', '.cursor/a.md', '.github/a.md', '.opencode/a.md', 'docs/x.md'];
  assert.equal(cli.scopeFiles(files, undefined).length, files.length);
});

test('scopeFiles: cursor env keeps only .cursor + shared', () => {
  const files = ['AGENTS.md', '.claude/a.md', '.cursor/a.md', '.github/a.md', '.opencode/a.md', 'docs/x.md'];
  const scoped = cli.scopeFiles(files, 'cursor');
  assert.ok(scoped.includes('.cursor/a.md'), 'keeps .cursor');
  assert.ok(scoped.includes('AGENTS.md'), 'keeps shared AGENTS.md');
  assert.ok(!scoped.includes('.claude/a.md'), 'drops .claude');
  assert.ok(!scoped.includes('.github/a.md'), 'drops .github');
  assert.ok(!scoped.includes('.opencode/a.md'), 'drops .opencode');
});

test('scopeFiles: unknown env returns every file', () => {
  const files = ['.claude/a.md', '.cursor/a.md'];
  assert.equal(cli.scopeFiles(files, 'bogus').length, files.length);
});

test('install: scaffolds repo template', () => {
  const d = tmp();
  const r1 = cli.cmdInstall(d, {});
  assert.ok(r1.copied > 0, 'should copy files');
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')), 'AGENTS.md present');
  assert.ok(fs.existsSync(path.join(d, '.claude')), '.claude present');
  assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')), 'handoff written');
});

test('install: aborts when files already exist without --force', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  assert.throws(() => cli.cmdInstall(d, {}), /conflicting files/);
});

test('conflicts: reports existing scaffold files', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const cf = cli.conflicts('repo', d, undefined);
  assert.ok(cf.length > 0, 'detects installed files');
  assert.ok(cf.includes('AGENTS.md'), 'includes AGENTS.md');
});

test('install: --env cursor scaffolds only cursor + shared', () => {
  const d = tmp();
  cli.cmdInstall(d, { env: 'cursor' });
  assert.ok(fs.existsSync(path.join(d, '.cursor')), '.cursor present');
  assert.ok(!fs.existsSync(path.join(d, '.claude', 'agents')), '.claude/agents absent');
  assert.ok(!fs.existsSync(path.join(d, '.claude', 'commands')), '.claude/commands absent');
  assert.ok(fs.existsSync(path.join(d, '.claude', 'agents-snippets')), 'shared .claude/agents-snippets present');
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')), 'shared AGENTS.md present');
});

for (const type of ['repo', 'monorepo']) {
  for (const env of ['copilot', 'cursor', 'opencode', 'codex']) {
    test(`install: --env ${env} ${type} copies the shared factory skill and agent snippets`, () => {
      const d = tmp();
      cli.cmdInstall(d, { [type]: true, env });
      for (const rel of [
        path.join('.agents', 'skills', 'factory', 'SKILL.md'),
        ...['spec', 'build', 'review-code', 'review-security', 'review-ux', 'review-ui', 'approve']
          .map(role => path.join('.agents', 'skills', 'factory', 'roles', `${role}.md`)),
        path.join('.claude', 'prompt-snippets', 'factory.md'),
      ]) {
        assert.ok(fs.existsSync(path.join(d, rel)), `${rel} present`);
      }
      assert.equal(cli.cmdDoctor(d, { [type]: true, env }).missingFiles.length, 0);
    });
  }
}

test('install: --env cursor copies the shared factory/ folder', () => {
  const d = tmp();
  cli.cmdInstall(d, { env: 'cursor' });
  assert.ok(fs.existsSync(path.join(d, 'factory', 'README.md')), 'factory README present');
  assert.ok(fs.existsSync(path.join(d, 'factory', '.gitignore')), 'factory .gitignore present');
});

test('install: --force overwrites modified files', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const f = path.join(d, 'AGENTS.md');
  fs.writeFileSync(f, 'changed-by-user');
  const r = cli.cmdInstall(d, { force: true });
  assert.ok(r.copied > 0, 'force re-copies');
  assert.notEqual(fs.readFileSync(f, 'utf8'), 'changed-by-user', 'file restored');
});

test('doctor: no missing files right after install', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const res = cli.cmdDoctor(d, {});
  assert.equal(res.missingFiles.length, 0, 'nothing missing');
});

test('doctor: detects a removed template file', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  fs.rmSync(path.join(d, 'AGENTS.md'));
  const res = cli.cmdDoctor(d, {});
  assert.ok(res.missingFiles.includes('AGENTS.md'), 'reports missing AGENTS.md');
});

test('scanPlaceholders: finds unresolved placeholders', () => {
  const d = tmp();
  const f = path.join(d, 'sample.md');
  fs.writeFileSync(f, 'Project: {{PROJECT_NAME}}');
  assert.deepEqual(cli.scanPlaceholders(d, ['sample.md']), ['sample.md']);
});

test('scanPlaceholders: ignores resolved text', () => {
  const d = tmp();
  const f = path.join(d, 'sample.md');
  fs.writeFileSync(f, 'Project: MyApp');
  assert.equal(cli.scanPlaceholders(d, ['sample.md']).length, 0);
});

test('doctor: reports unresolved placeholders', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const f = path.join(d, 'AGENTS.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8') + '\nProject: {{PROJECT_NAME}}\n');
  const res = cli.cmdDoctor(d, {});
  assert.ok(res.placeholders.includes('AGENTS.md'), 'flags placeholder');
});

test('patch: ensures files present and re-emits handoff', () => {
  const d = tmp();
  const r = cli.cmdPatch(d, {});
  assert.ok(r.copied > 0, 'copied files');
  assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')), 'handoff present');
});

test('upgrade: default args use patch (add-missing only), never install --force', () => {
  assert.deepEqual(cli.upgradeArgs({}, '5.0.1'), ['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'patch']);
  assert.deepEqual(cli.upgradeArgs({ env: 'cursor' }, '5.0.1'),
    ['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'patch', '--env', 'cursor']);
});

test('upgrade: only an explicit --force reaches install --force', () => {
  assert.deepEqual(cli.upgradeArgs({ force: true }, '5.0.1'),
    ['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'install', '--force']);
  assert.deepEqual(cli.upgradeArgs({ force: true, env: 'opencode' }, '5.0.1'),
    ['--yes', 'nitm-ai-dev-toolkit@5.0.1', 'install', '--force', '--env', 'opencode']);
});

test('upgrade: never runs an unpinned package spec', () => {
  assert.throws(() => cli.upgradeArgs({}), /pinned version/);
  assert.ok(!cli.upgradeArgs({ force: true, dryRun: true }, '5.0.1').some((a) => a.includes('@latest')));
});

test('scanPlaceholders: matches digits in names', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'sample.md'), 'Host: {{DB2_HOST}}');
  assert.deepEqual(cli.scanPlaceholders(d, ['sample.md']), ['sample.md']);
});

test('scanPlaceholders: runtime-only placeholders are not unresolved bootstrap values', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'sample.md'), 'Issue {{ISSUE_KEY}} / {{ISSUE_ID}}: {{FEATURE_NAME}} {{NAME}}');
  assert.deepEqual(cli.scanPlaceholders(d, ['sample.md']), []);
});

test('scanPlaceholders: templates/ blanks keep their placeholders by design', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, 'templates'));
  fs.writeFileSync(path.join(d, 'templates', 'feature-spec.template.md'), '# {{PROJECT_NAME}}');
  assert.deepEqual(cli.scanPlaceholders(d, [path.join('templates', 'feature-spec.template.md')]), []);
});

test('doctor: templates/ blanks keep placeholders but are never listed as unresolved', () => {
  const d = tmp();
  cli.cmdInstall(d, { env: 'claude' });
  const blanks = fs.readdirSync(path.join(d, 'templates'))
    .filter((f) => /\{\{[A-Z]/.test(fs.readFileSync(path.join(d, 'templates', f), 'utf8')));
  assert.ok(blanks.length > 0, 'templates/ ships placeholders');
  const res = cli.cmdDoctor(d, { env: 'claude' });
  assert.ok(res.placeholders.every((f) => !f.startsWith('templates' + path.sep)), 'templates/ excluded');
});

test('install: --env cursor copies the shared rules-snippets that cursor rules link to', () => {
  const d = tmp();
  cli.cmdInstall(d, { env: 'cursor' });
  assert.ok(fs.existsSync(path.join(d, '.claude', 'rules-snippets')), 'rules-snippets present');
});

test('patch: never overwrites existing files', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const f = path.join(d, 'AGENTS.md');
  fs.writeFileSync(f, 'changed-by-user');
  cli.cmdPatch(d, { force: true });
  assert.equal(fs.readFileSync(f, 'utf8'), 'changed-by-user');
});

test('factory: install --force refreshes factory files (no user-owned exceptions)', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  const readme = path.join(d, 'factory', 'README.md');
  fs.writeFileSync(readme, 'changed-by-user');
  cli.cmdInstall(d, { force: true });
  assert.notEqual(fs.readFileSync(readme, 'utf8'), 'changed-by-user', 'factory README refreshed');
});

test('factory: .gitignore is installed under its real name (npm drops .gitignore from packages)', () => {
  const d = tmp();
  cli.cmdInstall(d, { env: 'claude' });
  assert.equal(cli.installName(path.join('factory', '_gitignore')), path.join('factory', '.gitignore'));
  assert.equal(cli.installName(path.join('factory', '.gitignore')), path.join('factory', '.gitignore'));
  assert.equal(cli.installName('AGENTS.md'), 'AGENTS.md');
  assert.match(fs.readFileSync(path.join(d, 'factory', '.gitignore'), 'utf8'), /jobs\//);
  assert.equal(cli.cmdDoctor(d, { env: 'claude' }).missingFiles.length, 0);
});

test('factory: doctor reports a missing factory file as a warning list, not a throw', () => {
  const d = tmp();
  cli.cmdInstall(d, {});
  fs.rmSync(path.join(d, 'factory', 'README.md'));
  const res = cli.cmdDoctor(d, {});
  assert.deepEqual(res.missingFiles, [path.join('factory', 'README.md')]);
});

test('parseFlags: parses env, monorepo, force, positional', () => {
  const f = cli.parseFlags(['install', '--env', 'cursor', '--monorepo', '--force']);
  assert.equal(f._[0], 'install');
  assert.equal(f.env, 'cursor');
  assert.equal(f.monorepo, true);
  assert.equal(f.force, true);
});

test('parseFlags: supports --env=val form', () => {
  const f = cli.parseFlags(['doctor', '--env=opencode']);
  assert.equal(f.env, 'opencode');
});

test('envHeader: generic includes Codex and directs agents to the handoff file', () => {
  const h = cli.envHeader('repo', undefined);
  assert.match(h, /OpenAI Codex/);
  assert.match(h, /read and follow `\.nitm\/BOOTSTRAP\.md`/);
  assert.match(h, /no native `\/bootstrap` command is provided/);
  assert.doesNotMatch(h, /auto-detects your harness/);
});

test('envHeader: tailored when env given', () => {
  const h = cli.envHeader('repo', 'claude');
  assert.match(h, /Claude Code/);
});

test('scopeFiles: Codex keeps bounded shared standards without changing other scopes', () => {
  const files = ['AGENTS.md', 'docs/x.md', '.codex/config.toml', '.agents/skills/a.md',
    path.join('.github', 'instructions', 'patterns.instructions.md'),
    path.join('.claude', 'rules-snippets', 'patterns.md'),
    '.claude/a.md', '.cursor/a.md', '.github/a.md', '.vscode/a.json', '.opencode/a.md'];
  assert.deepEqual(cli.ENV_DIRS.codex, ['.codex', '.agents', path.join('.github', 'instructions')]);
  assert.deepEqual(cli.scopeFiles(files, 'codex'), files.slice(0, 6));
  assert.deepEqual(cli.SHARED_DIRS, ['docs', 'templates', 'hooks', 'factory', path.join('.agents', 'skills'),
    path.join('.claude', 'agents-snippets'), path.join('.claude', 'prompt-snippets'),
    path.join('.claude', 'rules-snippets')]);
  assert.deepEqual(cli.ENV_DIRS.claude, ['.claude', '.agents']);
  assert.deepEqual(cli.ENV_DIRS.copilot, ['.github', '.vscode']);
  assert.deepEqual(cli.ENV_DIRS.cursor, ['.cursor']);
  assert.deepEqual(cli.ENV_DIRS.opencode, ['.opencode', path.join('.agents', 'skills'),
    path.join('.claude', 'agents-snippets'), path.join('.claude', 'prompt-snippets'),
    path.join('.github', 'instructions')]);
  for (const env of ['claude', 'copilot', 'cursor', 'opencode']) {
    assert.ok(!cli.scopeFiles(files, env).includes('.codex/config.toml'));
  }
  // rules-snippets are linked from every harness, so every scope keeps them.
  for (const env of ['claude', 'copilot', 'cursor', 'opencode', 'codex']) {
    assert.ok(cli.scopeFiles(files, env).includes(files[5]), `${env} keeps shared rules-snippets`);
  }
  // `.github/instructions` belongs to copilot and to the shared codex/opencode standards.
  assert.ok(!cli.scopeFiles(files, 'claude').includes(files[4]));
  assert.ok(cli.scopeFiles(files, 'copilot').includes(files[4]));
  assert.ok(!cli.scopeFiles(files, 'cursor').includes(files[4]));
});

test('scopeFiles: nested Codex standards match normalized directory boundaries only', () => {
  const kept = [path.join('.github', 'instructions', 'nested', 'x.md'),
    path.join('.claude', 'rules-snippets', 'patterns.md'),
    '.github//instructions//patterns.instructions.md'];
  const excluded = [path.join('.github', 'instructions-extra', 'x.md'),
    path.join('.claude', 'rules-snippets-extra', 'x.md'),
    path.join('.github', 'instructions.md'), path.join('.claude', 'rules-snippets.md'),
    path.join('.github', 'instructions', '..', 'prompts', 'x.md'),
    path.join('.claude', 'rules-snippets', '..', 'commands', 'x.md')];
  assert.deepEqual(cli.scopeFiles([...kept, ...excluded], 'codex'), kept);
});

test('scopeFiles: OpenCode reference dependencies stay within exact directory boundaries', () => {
  const kept = ['.opencode/opencode.jsonc', '.agents/skills/x/SKILL.md',
    '.claude/agents-snippets/x.md', '.claude/prompt-snippets/x.md',
    '.claude/rules-snippets/x.md', '.github/instructions/x.instructions.md', 'hooks/ponytail-config.js'];
  const excluded = ['.agents/other.md', '.agents/skills-extra/x.md', '.agents/rules/ponytail.md', '.claude/settings.json',
    '.claude/agents/x.md', '.claude/commands/x.md', '.claude/rules/x.md',
    '.claude/agents-snippets-extra/x.md', '.claude/prompt-snippets/../commands/x.md',
    '.github/agents/x.md', '.github/instructions-extra/x.md', '.codex/config.toml'];
  assert.deepEqual(cli.scopeFiles([...kept, ...excluded], 'opencode'), kept);
});

for (const type of ['repo', 'monorepo']) {
  test(`install: default ${type} includes Codex and all other harnesses`, () => {
    const d = tmp();
    const output = captureOutput(() => cli.cmdInstall(d, { [type]: true }));
    assert.ok(fs.existsSync(path.join(d, '.codex', 'config.toml')));
    for (const dir of ['.agents', '.claude', '.github', '.vscode', '.cursor', '.opencode']) {
      assert.ok(fs.existsSync(path.join(d, dir)), `${dir} present`);
    }
    assert.match(output, /OpenAI Codex/);
    assert.match(output, /read and follow `\.nitm\/BOOTSTRAP\.md`/);
    assert.doesNotMatch(output, /auto-detects your harness/);
    assertOpenCodeReferences(d, type);
  });

  test(`install: scoped OpenCode ${type} has reference closure without other active harness configs`, () => {
    const d = tmp();
    const flags = { [type]: true, env: 'opencode' };
    captureOutput(() => cli.cmdInstall(d, flags));
    assertOpenCodeReferences(d, type);
    assert.deepEqual(fs.readdirSync(path.join(d, '.claude')).sort(),
      ['agents-snippets', 'prompt-snippets', 'rules-snippets']);
    assert.deepEqual(fs.readdirSync(path.join(d, '.github')), ['instructions']);
    assert.deepEqual(fs.readdirSync(path.join(d, '.agents')), ['skills']);
    for (const rel of ['.claude/settings.json', '.claude/config', '.claude/agents',
      '.claude/commands', '.claude/rules', '.claude/skills', '.github/agents',
      '.github/copilot-instructions.md', '.github/prompts', '.codex', '.cursor', '.vscode']) {
      assert.ok(!fs.existsSync(path.join(d, rel)), `${rel} absent`);
    }
    let doctor;
    captureOutput(() => { doctor = cli.cmdDoctor(d, flags); });
    assert.deepEqual(doctor.missingFiles, []);
  });

  test(`install: existing-project OpenCode ${type} retains plugins and hands off gated cleanup`, async (t) => {
    const d = tmp();
    t.after(() => fs.rmSync(d, { recursive: true, force: true }));
    const pluginDir = path.join(d, '.opencode', 'plugins');
    fs.mkdirSync(pluginDir, { recursive: true });
    const plugins = { 'ponytail.mjs': '// Obsolete toolkit-local Ponytail copy\n',
      'custom.mjs': 'export default () => {};\n' };
    for (const [file, content] of Object.entries(plugins)) {
      fs.writeFileSync(path.join(pluginDir, file), content);
    }
    captureOutput(() => cli.cmdInstall(d, { [type]: true, force: true, env: 'opencode' }));
    const config = JSON.parse(fs.readFileSync(path.join(d, '.opencode/opencode.jsonc'), 'utf8')
      .replace(/^\s*\/\/.*$/gm, ''));
    assert.equal(config.plugins.some((plugin) => plugin.includes('ponytail')), false,
      'install must not add Ponytail to project config');
    for (const [file, content] of Object.entries(plugins)) {
      assert.equal(fs.readFileSync(path.join(pluginDir, file), 'utf8'), content,
        `${file} must not be deleted automatically by install --force`);
    }

    // The CLI emits instructions; it does not perform the approved migration itself.
    await t.test('handoff doc contract: approved in-flow cleanup precedes activation', () => {
      const handoff = fs.readFileSync(path.join(d, '.nitm', 'BOOTSTRAP.md'), 'utf8');
      const cleanup = handoff.match(/\*\*Ponytail pre-activation cleanup[^\n]*\n([\s\S]*?)(?=\s*\*\*Create Toolkit Version File)/);
      assert.ok(cleanup, 'Ponytail cleanup must be in this bootstrap flow');
      assert.match(cleanup[1], /in this bootstrap flow/i);
      for (const extension of ['js', 'mjs', 'ts']) {
        assert.ok(cleanup[1].includes(`.opencode/plugins/ponytail.${extension}`));
      }
      assert.match(cleanup[1], /verif[^\n]*obsolete toolkit ownership[^\n]*(?:contents|provenance)[^\n]*not filename alone/i);
      assert.match(cleanup[1], /(?:backup|back[ -]?up)[^\n]*local config[^\n]*approv[^\n]*remov[^\n]*only/i);
      assert.match(cleanup[1], /preserv[^\n]*(?:custom|unrelated)[^\n]*plugins/i);
      assert.doesNotMatch(cleanup[1], /(?:use|defer)[^\n]*bootstrap-(?:patch|upgrade)[^\n]*remov/i,
        'cleanup may not be deferred exclusively to another task');
      assert.match(cleanup[1], /safe removal[^\n]*unverified[^\n]*approval[^\n]*denied[^\n]*stop[^\n]*activat/i,
        'unsafe or declined cleanup must block activation');
      assert.match(cleanup[1], /\.toolkit-version[^\n]*unchanged/i);
      const removal = cleanup[1].search(/then remove ONLY/i);
      const activation = cleanup[1].search(/(?:proceed|restart)[^\n]*only after[^\n]*gate passes/i);
      assert.ok(removal >= 0 && activation > removal, 'approved cleanup must precede activation');
    });
  });

  for (const force of [false, true]) {
    test(`patch: scoped OpenCode ${type} restores reference closure without clobber (force=${force})`, () => {
      const d = tmp();
      const flags = { [type]: true, env: 'opencode', force };
      captureOutput(() => cli.cmdInstall(d, flags));
      const preserved = ['.opencode/opencode.jsonc', '.claude/agents-snippets/reviewer.md',
        '.claude/prompt-snippets/bootstrap.md', '.claude/rules-snippets/patterns.md',
        '.github/instructions/patterns.instructions.md', '.agents/skills/ponytail/SKILL.md',
        'hooks/ponytail-config.js'];
      for (const rel of preserved) fs.writeFileSync(path.join(d, rel), `custom: ${rel}\n`);
      const missing = ['.claude/rules-snippets/testing.md', 'hooks/ponytail-instructions.js',
        '.agents/skills/orient-to-recent-work/SKILL.md'];
      for (const rel of missing) fs.rmSync(path.join(d, rel));
      let patched;
      captureOutput(() => { patched = cli.cmdPatch(d, flags); });
      assert.equal(patched.copied, missing.length);
      for (const rel of preserved) assert.equal(fs.readFileSync(path.join(d, rel), 'utf8'), `custom: ${rel}\n`);
      for (const rel of missing) assert.ok(fs.readFileSync(path.join(d, rel), 'utf8').length > 0);
      assert.deepEqual(fs.readdirSync(path.join(d, '.claude')).sort(),
        ['agents-snippets', 'prompt-snippets', 'rules-snippets']);
      assert.deepEqual(fs.readdirSync(path.join(d, '.github')), ['instructions']);
    });
  }

  test(`install: scoped Codex ${type} has readable linked standards and no unrelated harness content`, () => {
    const d = tmp();
    const flags = { [type]: true, env: 'codex' };
    const output = captureOutput(() => cli.cmdInstall(d, flags));
    for (const rel of ['AGENTS.md', '.agents', '.codex/config.toml', '.nitm/BOOTSTRAP.md']) {
      assert.ok(fs.existsSync(path.join(d, rel)), `${rel} present`);
    }
    assert.deepEqual(fs.readdirSync(path.join(d, '.github')), ['instructions']);
    assert.deepEqual(fs.readdirSync(path.join(d, '.claude')).sort(),
      ['agents-snippets', 'prompt-snippets', 'rules-snippets']);
    for (const dir of ['.vscode', '.cursor', '.opencode']) {
      assert.ok(!fs.existsSync(path.join(d, dir)), `${dir} absent`);
    }
    const instructions = path.join(d, '.github', 'instructions');
    let linkedStandards = 0;
    for (const file of fs.readdirSync(instructions)) {
      const wrapper = fs.readFileSync(path.join(instructions, file), 'utf8');
      for (const match of wrapper.matchAll(/\]\(([^)]+\.claude\/rules-snippets\/[^)]+)\)/g)) {
        const target = path.resolve(instructions, match[1]);
        assert.ok(target.startsWith(path.join(d, '.claude', 'rules-snippets') + path.sep));
        assert.ok(fs.readFileSync(target, 'utf8').length > 0, `${file} links to readable standards`);
        linkedStandards++;
      }
    }
    assert.equal(linkedStandards, fs.readdirSync(instructions).length, 'all instruction wrappers have readable snippet targets');
    const header = fs.readFileSync(path.join(d, '.nitm', 'BOOTSTRAP.md'), 'utf8');
    assert.ok(header.startsWith(cli.envHeader(type, 'codex')));
    assert.match(output, /tailored to OpenAI Codex/);
    assert.match(output, /read and follow \.nitm\/BOOTSTRAP\.md/);
    assert.match(output, /doctor --env codex/);
    assert.doesNotMatch(output, /\/bootstrap|auto-detects|Unknown --env/);
    assert.equal(cli.cmdDoctor(d, flags).missingFiles.length, 0);
    fs.rmSync(path.join(d, '.codex', 'config.toml'));
    let result;
    const doctorOutput = captureOutput(() => { result = cli.cmdDoctor(d, flags); });
    assert.deepEqual(result.missingFiles, [path.join('.codex', 'config.toml')]);
    assert.match(doctorOutput, /\.codex[\\/]config\.toml/);
  });

  test(`patch: scoped Codex ${type} adds missing files and preserves custom config with --force`, () => {
    const d = tmp();
    const flags = { [type]: true, env: 'codex', force: true };
    const first = cli.cmdPatch(d, flags);
    assert.ok(first.copied > 0);
    const config = path.join(d, '.codex', 'config.toml');
    assert.ok(fs.existsSync(config));
    const custom = '# User customization\nmodel = "user-selected-model"\n';
    fs.writeFileSync(config, custom);
    fs.rmSync(path.join(d, 'AGENTS.md'));
    fs.rmSync(path.join(d, '.nitm', 'BOOTSTRAP.md'));
    const patched = cli.cmdPatch(d, flags);
    assert.equal(patched.copied, 1);
    assert.equal(fs.readFileSync(config, 'utf8'), custom);
    assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(d, '.nitm', 'BOOTSTRAP.md')));
    assert.equal(cli.cmdDoctor(d, flags).missingFiles.length, 0);
  });

  for (const force of [false, true]) {
    test(`patch: scoped Codex ${type} restores missing standards without overwriting snippets (force=${force})`, () => {
      const d = tmp();
      const flags = { [type]: true, env: 'codex', force };
      cli.cmdInstall(d, flags);
      const snippet = path.join('.claude', 'rules-snippets', 'patterns.md');
      const instruction = path.join('.github', 'instructions', 'patterns.instructions.md');
      const missingSnippet = path.join('.claude', 'rules-snippets', 'testing.md');
      const custom = '# Customized standards\nKeep user conventions.\n';
      fs.writeFileSync(path.join(d, snippet), custom);
      for (const rel of [instruction, missingSnippet]) fs.rmSync(path.join(d, rel));
      assert.deepEqual(cli.cmdDoctor(d, flags).missingFiles.sort(), [instruction, missingSnippet].sort());
      const result = cli.cmdPatch(d, flags);
      assert.equal(result.copied, 2);
      assert.equal(fs.readFileSync(path.join(d, snippet), 'utf8'), custom);
      for (const rel of [instruction, missingSnippet]) {
        assert.ok(fs.readFileSync(path.join(d, rel), 'utf8').length > 0, `${rel} restored`);
      }
      assert.equal(cli.cmdDoctor(d, flags).missingFiles.length, 0);
    });
  }
}

test('parseFlags: supports Codex in both env forms', () => {
  assert.equal(cli.parseFlags(['install', '--env', 'codex']).env, 'codex');
  assert.equal(cli.parseFlags(['doctor', '--env=codex']).env, 'codex');
});

test('envHeader: Codex reads the handoff file and uses scoped doctor', () => {
  const h = cli.envHeader('repo', 'codex');
  assert.match(h, /environment: OpenAI Codex/);
  assert.match(h, /read and follow \.nitm\/BOOTSTRAP\.md/);
  assert.match(h, /doctor --env codex/);
  assert.doesNotMatch(h, /\/bootstrap|auto-detects/);
});

test('help: lists Codex and truthful default and bootstrap instructions', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'cli.js'), '--help'],
    { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /claude\|codex\|copilot\|cursor\|opencode/);
  assert.match(r.stdout, /ALL environments, including OpenAI Codex/);
  assert.match(r.stdout, /read and follow \.nitm\/BOOTSTRAP\.md/);
  assert.match(r.stdout, /no native \/bootstrap command is provided/);
  assert.doesNotMatch(r.stdout, /auto-detects your harness/);
});
