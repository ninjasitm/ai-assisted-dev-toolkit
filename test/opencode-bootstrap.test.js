const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const assertToolkitV4 = (version) => assert.match(version, /^4\./, 'supported toolkit major is 4.x');

// Check agent instructions and their ordering, not installed OpenCode runtime behavior.
for (const [variant, flow, mutation] of [
  ['repo', 'bootstrap', /^### Step 4: Template Customization/m],
  ['monorepo', 'bootstrap', /^7\. \*\*Update Template Files\*\*/m],
  ['repo', 'bootstrap-patch', /^5\.\s+\*\*Confirm and Apply\*\*/m],
  ['monorepo', 'bootstrap-patch', /^5\.\s+\*\*Confirm and Apply\*\*/m],
  ['repo', 'bootstrap-upgrade', /^### 2\. Create Snippet Directories/m],
  ['monorepo', 'bootstrap-upgrade', /^### Step 2: Create Snippet Directories/m],
]) {
  test(`${variant}/${flow}: fail-closed OpenCode preflight precedes mutation`, () => {
    const source = read(`src/${variant}/.claude/prompt-snippets/${flow}.md`);
    const preflight = source.match(/^## OpenCode version preflight[^\n]*\n([\s\S]*?)(?=^## )/m);
    const firstMutation = source.match(mutation);
    assert.ok(preflight, 'explicit preflight section is required');
    assert.ok(firstMutation, 'mutation stage must remain identifiable');
    assert.ok(preflight.index < firstMutation.index, 'gate must precede the first mutation stage');

    const gate = preflight[1];
    assert.match(gate, /session\/runtime evidence[\s\S]*directory presence alone is not proof/i);
    assert.match(gate, /only other harnesses[\s\S]*skip this preflight and all OpenCode steps/i);
    assert.match(gate, /`opencode --version` before any project writes/);
    assert.match(gate, /optional leading `v`[\s\S]*`major >= 2`/);
    assert.match(gate, /OpenCode V1[^\n]*`major < 2`[^\n]*STOP[^\n]*OpenCode files[^\n]*\.toolkit-version[^\n]*4\.0\.0/);
    assert.match(gate, /upgrade OpenCode to V2 or remain on toolkit 3\.x/);
    assert.match(gate, /CLI is missing[^\n]*unparseable[^\n]*STOP OpenCode steps[^\n]*version marker unchanged/);
    assert.match(gate, /confirm\/install[^\n]*rerun[^\n]*Never assume V2/);
    assert.match(gate, /oh-my-opencode-slim >=3\.0\.0[^\n]*OpenCode >=2\.0\.7[^\n]*STOP[^\n]*before changes/);
    assert.match(source.slice(firstMutation.index), /\.toolkit-version[\s\S]*4\.0\.0/);
  });
}

test('toolkit package stays on supported 4.x and READMEs require OpenCode V2', () => {
  assertToolkitV4(JSON.parse(read('package.json')).version);
  for (const file of ['README.md', 'src/repo/README.md', 'src/monorepo/README.md']) {
    assert.match(read(file), /Toolkit v4 requires \*\*OpenCode V2/);
  }
});

test('toolkit 4.x assertion accepts 4.0.1 and rejects 3.x', () => {
  assertToolkitV4('4.0.1');
  assert.throws(() => assertToolkitV4('3.0.22'), assert.AssertionError);
});

// These are migration instruction contracts, not executable version enforcement.
for (const variant of ['repo', 'monorepo']) {
  test(`${variant}/bootstrap-upgrade: doc contract routes v3 past legacy rewriting and v4 to patch`, () => {
    const source = read(`src/${variant}/.claude/prompt-snippets/bootstrap-upgrade.md`);
    const routing = source.match(/^## Toolkit version routing[^\n]*\n([\s\S]*?)(?=^## )/m);
    assert.ok(routing, 'version routing must precede legacy mutation stages');
    const firstLegacyStage = source.search(/^### (?:Step )?2[.:] Create Snippet Directories/m);
    assert.ok(firstLegacyStage > routing.index + routing[0].length);
    const v4 = routing[1].match(/^.*>=\s*4\.0\.0.*$/m)?.[0];
    assert.ok(v4, 'already-v4 routing is required');
    assert.match(v4, /(?:stop|exit|return)/i);
    assert.match(v4, /bootstrap-patch/);
    const v3 = routing[1].match(/^.*(?:v3|3\.x).*$/im)?.[0];
    assert.ok(v3, 'v3 routing is required');
    assert.match(v3, /preserv[^\n]*snippet[^\n]*(?:bodies|frontmatter)/i,
      'v3 snippet bodies must be preserved explicitly');
    assert.match(v3, /skip[^\n]*steps?\s*2\s*[–—-]\s*6/i,
      'v3 must skip legacy extraction and wrapper rewriting');
  });

  test(`${variant}/bootstrap-upgrade: doc contract removes only verified duplicate skills`, () => {
    const source = read(`src/${variant}/.claude/prompt-snippets/bootstrap-upgrade.md`);
    assert.doesNotMatch(source, /\bfind\b[^\n]*-exec\s+rm\s+-rf\b|remove all subdirectories/i,
      'blanket skill-directory deletion is unsafe');
    const cleanup = source.match(/^### (?:Step )?10[.:] Clean Up Duplicate Skills\n([\s\S]*?)(?=^### )/m);
    assert.ok(cleanup, 'duplicate cleanup must remain identifiable');
    assert.match(cleanup[1], /remov[^\n]*only[^\n]*canonical[^\n]*\.agents\/skills\/[^\n]*compar[^\n]*identical/i,
      'removal requires an identical canonical copy, not just a matching name');
    assert.match(cleanup[1], /(?:backup|back[ -]?up)[^\n]*approv[^\n]*before remov/i,
      'backup and approval are required before removal');
    assert.match(cleanup[1], /preserv[^\n]*(?:custom|project-specific)[^\n]*skills?/i);
  });

  test(`${variant}/bootstrap-patch: doc contract pins and checks the fetched v4 source before merge`, () => {
    const source = read(`src/${variant}/.claude/prompt-snippets/bootstrap-patch.md`);
    const fetch = source.match(/^\s*1\.\s+\*\*Fetch Latest Templates\*\*[^\n]*\n([\s\S]*?)(?=^\s*2\.\s+\*\*Inventory Current State)/m);
    assert.ok(fetch, 'source checks must precede inventory and merge');
    const clones = [...fetch[1].matchAll(/\bgit clone[^\n]*/g)];
    assert.ok(clones.length > 0, 'fetch must include the clone command');
    for (const [clone] of clones) assert.match(clone, /--branch\s+v4\.x\b/);
    assert.match(fetch[1], /(?:unavailable|fail(?:s|ed|ure)?)[^\n]*(?:stop|abort|exit)/i);
    assert.match(fetch[1], /(?:no|never|do not)[^\n]*(?:fallback|fall back)/i);
    assert.match(fetch[1], /package\.json/);
    assert.match(fetch[1], /major[^\n]*(?:is not|!=)\s*`?4\b`?[^\n]*stop/i,
      'read package.json and accept fetched major 4 only');
    assert.match(fetch[1], /older than[^\n]*(?:installed|target)[^\n]*\.toolkit-version[^\n]*stop[^\n]*(?:without|before)[^\n]*(?:applying|merg)[^\n]*(?:marker|\.toolkit-version)/i,
      'a downgrade must stop before merge or version marking');
  });
}
