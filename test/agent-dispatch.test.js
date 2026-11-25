const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

for (const layout of ['repo', 'monorepo']) {
  const snippets = path.join(__dirname, '..', 'src', layout, '.claude', 'agents-snippets');
  const featureBuilder = readFileSync(path.join(snippets, 'feature-builder.md'), 'utf8');
  const implementer = readFileSync(path.join(snippets, 'implementer.md'), 'utf8');

  test(`${layout}: Feature Builder parallelizes ready work per phase`, () => {
    assert.match(featureBuilder, /At the start of research, planning, implementation, review, and verification, and after reconciling each batch/);
    assert.match(featureBuilder, /Dispatch every lane that can proceed independently in one parallel batch/);
    assert.match(featureBuilder, /\[split-before-dispatch workflow\]\(\.\.\/rules-snippets\/subagent-workflow\.md#split-before-dispatch\)/);
    assert.match(featureBuilder, /examine every broad implementation unit, even a single task/);
    assert.match(featureBuilder, /When dispatched as a scoped lane itself, work only within assigned files and settled contracts/);
    assert.match(featureBuilder, /independent review gates for each affected lane and its dependents, and the overall review/);
    assert.doesNotMatch(featureBuilder, /Every implementation must pass review before moving to the next task/);
    assert.match(featureBuilder, /Keep dependent work and shared writable scopes in dependency order/);
    assert.match(featureBuilder, /The coordinator owns integration and aggregate QA/);
  });

  test(`${layout}: Implementer honors its leaf scope and focused check`, () => {
    assert.match(implementer, /When dispatched as a lane, work only in the assigned files and within settled contracts/);
    assert.match(implementer, /\[split-before-dispatch workflow\]\(\.\.\/rules-snippets\/subagent-workflow\.md#split-before-dispatch\)/);
    assert.match(implementer, /run the exact focused check in the handoff/);
    assert.match(implementer, /Do not broaden scope or assume nested delegation/);
    assert.match(implementer, /Integration and aggregate QA belong to the coordinator/);
    assert.match(implementer, /does not alter an explicitly assigned Factory integrator role/);
    assert.match(implementer, /You build; you do not accept/);
  });
}
