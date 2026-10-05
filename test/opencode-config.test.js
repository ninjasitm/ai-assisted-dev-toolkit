const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// https://opencode.ai/v2/docs/migrate-v1: skills.paths -> skills, plugin -> plugins.
// https://opencode.ai/v2/docs/skills#sources: local sources are directories,
// not Markdown globs; discovery finds nested SKILL.md files within each source.
// Correct the old .agents/skills/**/*.md and .claude/skills/**/*.md accordingly.
const preservedSettings = {
  $schema: 'https://opencode.ai/config.json',
  instructions: [
    'AGENTS.md',
    '.opencode/rules/*.md',
    '.agents/skills/orient-to-recent-work/SKILL.md',
  ],
  lsp: true,
};
const skills = ['.agents/skills', '.claude/skills'];
const plugins = [
  'opencode-mem',
  '@tarquinen/opencode-dcp@latest',
  '@dietrichgebert/ponytail@4.12.0',
];

for (const [name, file, template] of [
  ['root', '.opencode/opencode.jsonc', false],
  ['repo', 'src/repo/.opencode/opencode.jsonc', true],
  ['monorepo', 'src/monorepo/.opencode/opencode.jsonc', true],
]) {
  test(`${name}: native V2 config preserves unrelated settings and plugin policy`, () => {
    // Strip only whole-line comments used by these bounded JSONC fixtures.
    const source = readFileSync(path.join(__dirname, '..', file), 'utf8');
    const config = JSON.parse(source.replace(/^\s*\/\/.*$/gm, ''));
    if (template) {
      assert.match(source, /\/\/ "opentmux": V1-only/);
      assert.doesNotMatch(source, /ponytail.*omitted|local V2 plugin owns/);
    }

    assert.ok(Array.isArray(config.skills), 'skills must use the native V2 array');
    assert.equal(Object.hasOwn(config, 'plugin'), false, 'legacy plugin key must be absent');
    if (!template) {
      // Root intentionally removed external plugin registration in commit 7750629.
      assert.equal(Object.hasOwn(config, 'plugins'), false, 'root must not register plugins');
    }
    assert.deepEqual(config, {
      ...preservedSettings,
      skills,
      ...(template ? { plugins } : {}),
    });
  });
}

for (const root of ['.opencode', 'src/repo/.opencode', 'src/monorepo/.opencode']) {
  for (const extension of ['js', 'mjs', 'ts']) {
    const file = path.join(__dirname, '..', root, 'plugins', `ponytail.${extension}`);
    test(`${root}: local ponytail plugin ${extension} copy is absent`, () => {
      assert.equal(existsSync(file), false, `${file} should be absent`);
    });
  }
}
