'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// Exercise the actual calculation block only, with git stubbed: no tags, pushes,
// GitHub API calls, or publishing. Collision tags can simulate a concurrent run.
const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/auto-patch-tag.yml'), 'utf8');
const block = workflow.match(/- name: Calculate next patch tag[\s\S]*?run: \|\n([\s\S]*?)\n      - name:/)[1]
  .replace(/^          /gm, '');

for (const [latest, version, collisions, expected] of [
  ['3.0.22', '4.0.0', [], '4.0.0'],
  ['3.0.22', '3.0.22', [], '3.0.23'],
  ['3.0.22', '3.0.23', [], '3.0.23'],
  ['4.0.0', '4.0.0', [], '4.0.1'],
  ['4.0.9', '3.0.22', [], '4.0.10'],
  ['3.0.22', '4.0.0', ['4.0.0', '4.0.1'], '4.0.2'],
  ['3.0.22', '3.0.22', ['3.0.23'], '3.0.24'],
  ['', '4.0.0', [], '4.0.0'],
  ['', '0.0.0', [], '0.0.1'],
  ['3.0.22', '4.0.0-beta.1', [], '3.0.23'],
]) {
  test(`release candidate: tag=${latest || '(none)'}, package=${version}, collisions=${collisions.join(',')}`, (t) => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-release-'));
    t.after(() => fs.rmSync(d, { recursive: true, force: true }));
    fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ version }));
    const output = path.join(d, 'output');
    const stub = `git() {
      if [[ "$1" == tag ]]; then printf '%s\\n' "$LATEST";
      elif [[ "$1" == rev-parse ]]; then
        local tag="\${4#refs/tags/}"
        [[ " $COLLISIONS " == *" $tag "* ]]
      else return 99; fi
    }\n`;
    const result = spawnSync('bash', ['-c', stub + block], {
      cwd: d, encoding: 'utf8',
      env: { ...process.env, LATEST: latest, COLLISIONS: collisions.join(' '), GITHUB_OUTPUT: output },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(output, 'utf8'), `latest=${latest || '0.0.0'}\nnext=${expected}\n`);
  });
}

const commitGuard = workflow.match(/^          if ! git diff --cached --quiet; then\n[\s\S]*?^          fi$/m)[0]
  .replace(/^          /gm, '');

for (const [diffStatus, commitStatus, expectedOutput] of [
  [0, 0, 'continued\n'],
  [1, 0, 'commit\ncontinued\n'],
  [1, 7, 'commit\n'],
]) {
  test(`release commit guard: diff=${diffStatus}, commit=${commitStatus}`, () => {
    const stub = `git() {
      if [[ "$*" == 'diff --cached --quiet' ]]; then return ${diffStatus};
      elif [[ "$1" == commit ]]; then printf 'commit\\n'; return ${commitStatus};
      else return 99; fi
    }\n`;
    const result = spawnSync('bash', ['-c', 'set -euo pipefail\nnext_tag=4.0.0\n' + stub + commitGuard + '\nprintf "continued\\n"'], {
      encoding: 'utf8',
    });
    assert.equal(result.status, commitStatus, result.stderr);
    assert.equal(result.stdout, expectedOutput);
  });
}
