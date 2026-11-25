'use strict';

// Static checks over every template in src/repo and src/monorepo, including the Factory skill. They read
// template text only. They show that (1) no sentence, clause, or role-table row gives Oracle review, approval,
// scope, publication, merge, or D authority, or assigns Oracle to a non-goal-fit role, (2) each letter A, B,
// C, D, and R keeps one meaning, and (3) the post-build record is named `post-build fit record` and saved as
// `round-<U>/post-build-fit-<j>.md`. The authority detector is checked against fixtures first, so the detector
// itself is tested. Factory failures can appear while the factory lane is still editing its text.
// Run with: node --test test/goal-fit-letters.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LAYOUTS = ['src/repo', 'src/monorepo'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(md|mdc)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const TEMPLATES = LAYOUTS.flatMap((layout) =>
  walk(path.join(ROOT, layout)).map((file) => ({
    rel: path.relative(ROOT, file),
    text: fs.readFileSync(file, 'utf8'),
  })),
);

// Sentence-ish units: split after sentence punctuation and at line breaks.
const sentences = (text) => text.split(/(?<=[.!?;])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

// Legacy mentions are the deliberate mapping from previous names (fit-review Legacy names, retro, patch note).
const LEGACY = /older install|old checkpoint|old letter|old "plan review"|previous names?|legacy|read as|read through|reads as|Read `/i;

// Case-insensitive: `oracle`, Oracle, and ORACLE all count.
const ORACLE = /\boracle\b/i;
// Authority: review, approval, scope, publication, merge, or D. Matching is case-insensitive.
const AUTHORITY = /\b(approves?|approved|accepts?|authorizes?|grants?|merges?(?!-)|merged(?!-)|publish(?:es|ed)?|pushes?|widens?|signs? off|decides?)\b|\bexpands? (?:the )?scope\b|\bruns? D\b|\bcode reviewers?\b|\bcode review\b|\bimplementation review\b|\bis the (?:code |implementation )?reviewer\b/gi;
// A negation binds to the authority verb only when it sits between Oracle (the subject) and that verb. "without"
// is not a negation: "Without consultation, Oracle approves" and "Oracle approves without consultation" both grant.
const NEGATION = /\b(never|not|no|nor|neither|cannot)\b|n't\b/i;
// Clauses split on semicolons and on "but", "while", and "whereas", so a negation in one clause does not excuse
// an authority verb in another.
const CLAUSE = /;|\s+but\s+|\s+while\s+|\s+whereas\s+/i;
// A table cell that starts with `oracle` names Oracle as the agent of that row.
const ORACLE_AGENT = /^`?oracle`?(?=$|[\s,.;:(])/i;
// Roles Oracle must never be assigned: review, approval, post-build, rework, build, repair, code, security, UI, D, R.
const ORACLE_BAD_ROLE = /approv|review|post-build|implementation|rework|merge|publish|builder|build|repair|code|security|\bux\b|\bui\b|\bD\b|\bR\b/i;
// Goal-fit roles (spec, plan, approach) are Oracle's roles.
const ORACLE_OK_ROLE = /goal-fit|checker/i;

// Returns the authority hits in a text. `forceOracle` makes Oracle the subject of every clause (Oracle's own row,
// or the agent column of a row whose agent is Oracle). Oracle is also the subject when named earlier in the same
// clause, or when a clause continues with "it" after an Oracle clause.
function authorityHits(text, forceOracle = false) {
  if (!forceOracle && !ORACLE.test(text)) return [];
  const hits = [];
  let seenOracle = false;
  for (const clause of text.split(CLAUSE)) {
    const carries = seenOracle && /^\s*(?:it|and it|it also)\b/i.test(clause);
    if (ORACLE.test(clause)) seenOracle = true;
    for (const m of clause.matchAll(AUTHORITY)) {
      let start = -1;
      if (forceOracle || carries) {
        start = 0;
      } else {
        const named = [...clause.slice(0, m.index).matchAll(new RegExp(ORACLE.source, 'gi'))].pop();
        // "never Oracle," names Oracle as a non-actor: a negation in the same comma-delimited segment excludes it.
        if (named) {
          const segment = clause.slice(clause.lastIndexOf(',', named.index) + 1, named.index);
          if (!NEGATION.test(segment)) start = named.index;
        }
      }
      if (start < 0) continue;
      // The predicate runs from the Oracle subject to the authority verb. A negation must sit inside it.
      // A negation governs only its own "and"-joined verb phrase: in "not consulted and approves", "not" governs
      // "consulted", so the last segment before "approves" has no negation.
      const predicate = clause.slice(start, m.index).split(/\s+and\s+/i).pop();
      if (!NEGATION.test(predicate)) hits.push(`[${m[0]}] ${clause.trim()}`);
    }
  }
  return hits;
}

// Role-table rows: the designated agent column (the second cell) decides whether Oracle is the agent. An Oracle
// agent must not hold a review, approval, build, D, or R role. An Oracle agent's authority is checked in the agent
// cell. Other cells are checked only where they name Oracle. A row whose first cell is Oracle is Oracle's own
// row, and every cell is checked.
function rowHits(line) {
  const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.length === 0) return [];
  const hits = [];
  const roleIsOracle = ORACLE.test(cells[0]);
  const oracleAgent = cells.length > 1 && ORACLE_AGENT.test(cells[1]);
  if (oracleAgent && ORACLE_BAD_ROLE.test(cells[0]) && !ORACLE_OK_ROLE.test(cells[0])) {
    hits.push(`[oracle assigned to "${cells[0]}"] ${line.trim()}`);
  }
  if (roleIsOracle) {
    for (const cell of cells) hits.push(...authorityHits(cell, true));
  } else if (oracleAgent) {
    hits.push(...authorityHits(cells[1], true));
    for (const cell of cells.slice(2)) hits.push(...authorityHits(cell));
  } else {
    for (const cell of cells) hits.push(...authorityHits(cell));
  }
  return hits;
}

// Whole-text scan: table rows, then sentences that mention Oracle.
function templateHits(text) {
  const hits = [];
  for (const line of text.split('\n')) {
    if (line.trim().startsWith('|')) {
      hits.push(...rowHits(line));
      continue;
    }
    for (const s of sentences(line)) {
      if (LEGACY.test(s)) continue;
      hits.push(...authorityHits(s));
    }
  }
  return hits;
}

// Fixture loader: sentences go through the sentence detector, rows through the row detector.
function fixtureHits(s) {
  return s.trim().startsWith('|') ? rowHits(s.trim()) : authorityHits(s);
}

for (const name of ['authority.json', 'roles.json']) {
  test(`detector: ${name} negative fixtures are flagged and prohibition fixtures pass`, () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/fixtures/goal-fit-letters', name), 'utf8'));
    for (const s of fixture.must_flag) {
      assert.ok(fixtureHits(s).length > 0, `must be flagged: ${s}`);
    }
    for (const s of fixture.must_pass) {
      assert.deepEqual(fixtureHits(s), [], `must pass: ${s}`);
    }
  });
}

test('authority: no template sentence or role-table row gives Oracle review, approval, scope, publication, merge, or D authority', () => {
  const violations = [];
  for (const t of TEMPLATES) {
    for (const hit of templateHits(t.text)) violations.push(`${t.rel}: ${hit.slice(0, 200)}`);
  }
  assert.deepEqual(violations, [], `Oracle authority without a predicate negation:\n${violations.join('\n')}`);
});

// Each letter: the sentences that refer to it, and the meaning keyword each one must carry.
const KEYWORD = {
  A: /\bspec\b/i,
  B: /\bplan\b/i,
  C: /approach|first build/i,
  D: /implementation|aggregate|reconcil/i,
  R: /rework|classif/i,
};
const REF = {
  A: /(?:\b(?:checkpoint|check|letter)s? \(?A\b|goal-fit check \(?A\b)/,
  B: /(?:\b(?:checkpoint|check|letter)s? \(?B\b|goal-fit check \(?B\b|\bB PASS\b)/,
  C: /(?:\b(?:checkpoint|check|letter)s? \(?C\b|goal-fit check \(?C\b|\bC PASS\b)/,
  D: /(?:\b(?:checkpoint|check|letter)s? \(?D\b|\bD runs\b|\bD, implementation\b|\*\*Implementation review D\*\*)/,
  R: /(?:\bclassification R\b|\bletter R\b|\(R\))/,
};
// Lists such as "checkpoints A to D" or "A, B, and C" name several letters at once; they are not one-letter refs.
const LIST = /\bA to D\b|\bA, B,? and C\b|\bA and B\b|\bA or B\b|\bA, B, C and D\b/;

for (const letter of Object.keys(KEYWORD)) {
  test(`letters: ${letter} is used with its own meaning only, in every template`, () => {
    const violations = [];
    for (const t of TEMPLATES) {
      for (const s of sentences(t.text)) {
        if (!REF[letter].test(s) || LEGACY.test(s) || LIST.test(s)) continue;
        if (KEYWORD[letter].test(s)) continue;
        // Only a true conflict counts: another letter's meaning is named and this letter's meaning is not.
        const other = Object.keys(KEYWORD).find((k) => k !== letter && KEYWORD[k].test(s));
        if (!other) continue;
        violations.push(`${t.rel} [${letter} used with ${other}'s meaning]: ${s.slice(0, 140)}`);
      }
    }
    assert.deepEqual(violations, [], violations.join('\n'));
  });
}

test('letters: B never means user-directed rework, and rework is classified by R only', () => {
  const bad = /(?:checkpoint|check|letter|goal-fit check) \(?B\)?,? (?:before|for|on) (?:a |the |user-directed )?rework|B, before user-directed rework|rework[^.\n]{0,40}\bcheckpoint B\b|checkpoint B classifies/i;
  const violations = [];
  for (const t of TEMPLATES) {
    for (const s of sentences(t.text)) {
      if (bad.test(s) && !LEGACY.test(s)) violations.push(`${t.rel}: ${s.slice(0, 160)}`);
    }
  }
  assert.deepEqual(violations, [], violations.join('\n'));
});

test('post-build fit record: fit-review names it and its file, and no template saves an alignment-letter record', () => {
  const brief = TEMPLATES.find((t) => t.rel === 'src/repo/.claude/rules-snippets/fit-review.md');
  assert.ok(brief, 'fit-review brief exists');
  assert.match(brief.text, /post-build fit record/);
  assert.match(brief.text, /round-<U>\/post-build-fit-<j>\.md/);
  const stale = [];
  for (const t of TEMPLATES) {
    for (const s of sentences(t.text)) {
      if (/alignment-[A-Z]\b|alignment-[A-Z]-|alignment checkpoint/i.test(s) && !LEGACY.test(s)) {
        stale.push(`${t.rel}: ${s.slice(0, 160)}`);
      }
    }
  }
  assert.deepEqual(stale, [], `stale alignment records or names outside legacy mappings:\n${stale.join('\n')}`);
});

test('post-build fit record: the retro skill reads post-build-fit records', () => {
  for (const layout of LAYOUTS) {
    const retro = fs.readFileSync(path.join(ROOT, layout, '.agents/skills/retro/SKILL.md'), 'utf8');
    assert.match(retro, /round-<R>\/post-build-fit-\*\.md/, `${layout} retro`);
  }
});

test('post-build fit record: the Factory skill names the record in both layouts (factory lane)', () => {
  for (const layout of LAYOUTS) {
    const skill = fs.readFileSync(path.join(ROOT, layout, '.agents/skills/factory/SKILL.md'), 'utf8');
    assert.match(skill, /post-build fit record/, `${layout} factory skill`);
  }
});
