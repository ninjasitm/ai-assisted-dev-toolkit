const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const link = '../../../.claude/rules-snippets/subagent-workflow.md#split-before-dispatch';

for (const variant of ['repo', 'monorepo']) {
  test(`${variant} parallel-dispatch skills follow phase-level split guidance`, () => {
    const directory = path.join(root, 'src', variant, '.agents', 'skills');
    const dispatch = fs.readFileSync(path.join(directory, 'dispatching-parallel-agents', 'SKILL.md'), 'utf8');
    const development = fs.readFileSync(path.join(directory, 'subagent-driven-development', 'SKILL.md'), 'utf8');

    for (const contents of [dispatch, development]) {
      assert.ok(contents.includes(link));
    }
    assert.match(dispatch, /2\+ substantial implementation lanes with settled, independent inputs/);
    assert.match(dispatch, /shared read-only file or settled contract does not require waiting/);
    assert.match(dispatch, /unfinished output/);
    assert.match(dispatch, /conflicting file or shared mutable resource/);
    assert.match(development, /One broad planned task may use multiple scoped execution lanes/);
    assert.match(development, /original acceptance criteria/);
    assert.match(development, /provide its bounded task context directly at dispatch/);
    assert.doesNotMatch(development, /Dispatch multiple implementation subagents in parallel \(conflicts\)/);
    assert.doesNotMatch(development, /Move to next task while either review has open issues/);
    assert.match(development, /lane workers do not stage or commit; one coordinator owns integration and the index/);
    assert.match(development, /current uncommitted diff rather than relying only on `BASE_SHA\.\.HEAD_SHA`/);
    assert.match(development, /newly created untracked paths/);
    assert.match(development, /implements, tests, self-reviews; no staging or commits/);
    assert.doesNotMatch(development, /implements, tests, commits/);
    assert.doesNotMatch(development, /Get git SHAs, dispatch code quality reviewer/);
    assert.match(development, /Reconcile changed paths and the lane's uncommitted diff/);
  });
}
