'use strict';

// Relevance-aware patch and doctor. This module decides; bin/cli.js plans and writes.
//   - .nitm/retired.json: paths the project retired (never re-added) and an optional tracker override
//   - detectProject(): trackers, Playwright, Prisma, UI and stack facts read from the project
//   - relevanceOf(): add | irrelevant | review for one template path
//   - auditWrapper(): whether a harness wrapper is thin (link to its snippet plus key points) or inlines policy

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RETIRED_FILE = path.join('.nitm', 'retired.json');
const TRACKERS = ['github', 'gitlab', 'bitbucket', 'jira', 'linear'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_KEY_POINTS = 5;
const MAX_SUMMARY_WORDS = 30;

// Tracker CLI skills ship only for the tracker they talk to. gh-cli also covers GitHub pull requests.
const TRACKER_SKILLS = { 'gh-cli': 'github', 'glab-cli': 'gitlab', 'bkt-cli': 'bitbucket', acli: 'jira', 'linear-cli': 'linear' };
// Files named after a tool or stack. They apply only when that tool or stack is detected.
const STEM_TOPICS = {
  'playwright-test': 'playwright',
  'prisma-migrations': 'prisma',
  'component-structure': 'ui',
  'ui-accessibility': 'ui',
};
const TOPIC_NOTES = {
  playwright: 'no Playwright setup detected',
  prisma: 'no Prisma setup detected',
  ui: 'no UI framework detected',
};
// Empty MCP templates ship no servers, so a missing copy adds nothing.
const MCP_TEMPLATES = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json'];

const HOST_TRACKERS = { 'github.com': 'github', 'gitlab.com': 'gitlab', 'bitbucket.org': 'bitbucket' };
const UI_DEPS = ['react', 'react-dom', 'react-native', 'expo', 'next', 'vue', 'nuxt', 'svelte', '@sveltejs/kit',
  '@angular/core', 'solid-js', 'astro', 'preact'];
const PLAYWRIGHT_DEPS = ['playwright', '@playwright/test'];
const PLAYWRIGHT_CONFIGS = ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs', 'playwright.config.cjs'];
const PRISMA_DEPS = ['prisma', '@prisma/client'];
const PRISMA_FILES = ['schema.prisma', path.join('prisma', 'schema.prisma')];
// Root manifests that prove a stack exists (for ui decisions) and that may name Playwright.
const STACK_MANIFESTS = ['package.json', 'pyproject.toml', 'requirements.txt', 'setup.py', 'composer.json',
  'go.mod', 'Cargo.toml', 'Gemfile', 'pom.xml', 'build.gradle', 'build.gradle.kts'];

// Harness wrappers and the shared source each one links to. Snippets hold the policy; a skill with the
// same name (orient-to-recent-work) is the source when no snippet exists.
const WRAPPER_KINDS = [
  { dir: '.claude/rules', snippets: 'rules-snippets' },
  { dir: '.claude/commands', snippets: 'prompt-snippets' },
  { dir: '.claude/agents', snippets: 'agents-snippets' },
  { dir: '.cursor/rules', snippets: 'rules-snippets' },
  { dir: '.cursor/commands', snippets: 'prompt-snippets' },
  { dir: '.cursor/agents', snippets: 'agents-snippets' },
  { dir: '.github/instructions', snippets: 'rules-snippets' },
  { dir: '.github/prompts', snippets: 'prompt-snippets' },
  { dir: '.github/agents', snippets: 'agents-snippets' },
  { dir: '.opencode/rules', snippets: 'rules-snippets' },
  { dir: '.opencode/commands', snippets: 'prompt-snippets' },
  { dir: '.opencode/agents', snippets: 'agents-snippets' },
];

function readJsonFile(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; }
}

// ---- retirement list ----

function safeRetiredPath(value, where) {
  const rel = typeof value === 'string' ? value.replace(/\\/g, '/').replace(/\/+$/, '') : '';
  const bad = !rel || rel === '.' || path.posix.isAbsolute(rel) || path.win32.isAbsolute(rel)
    || rel.split('/').includes('..');
  if (bad) throw new Error(`${where}.path must be a relative path inside the project (got ${JSON.stringify(value)})`);
  return rel;
}

function normalizeRetired(entry, index) {
  const where = `${RETIRED_FILE} retired[${index}]`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${where} must be an object with path, reason and date`);
  }
  const rel = safeRetiredPath(entry.path, where);
  if (typeof entry.reason !== 'string' || !entry.reason.trim()) {
    throw new Error(`${where}.reason is required: say why the file was retired`);
  }
  if (typeof entry.date !== 'string' || !DATE_RE.test(entry.date)) {
    throw new Error(`${where}.date is required as YYYY-MM-DD`);
  }
  return { path: rel, reason: entry.reason.trim(), date: entry.date };
}

// Reads .nitm/retired.json. Absent means nothing retired. A file that exists but is invalid throws, so
// patch never falls back to re-adding files the project retired.
function readRetired(cwd) {
  const p = path.join(cwd, RETIRED_FILE);
  if (!fs.existsSync(p)) return { trackers: undefined, entries: [] };
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (ex) {
    throw new Error(`${RETIRED_FILE} exists but is not valid JSON (${ex.message}). Fix or remove it; nothing was written.`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${RETIRED_FILE} must be a JSON object with "retired" and optional "trackers"`);
  }
  let trackers;
  if (data.trackers !== undefined && data.trackers !== null) {
    if (!Array.isArray(data.trackers) || data.trackers.some((t) => !TRACKERS.includes(t))) {
      throw new Error(`${RETIRED_FILE}: "trackers" must be a list drawn from ${TRACKERS.join(', ')} (use [] for none)`);
    }
    trackers = [...new Set(data.trackers)];
  }
  const list = data.retired === undefined ? [] : data.retired;
  if (!Array.isArray(list)) throw new Error(`${RETIRED_FILE}: "retired" must be a list`);
  return { trackers, entries: list.map(normalizeRetired) };
}

// The retirement entry covering a template path (exact file, or any file under a retired directory).
function retiredFor(key, entries) {
  return entries.find((e) => key === e.path || key.startsWith(e.path + '/')) || null;
}

// ---- project facts ----

// package.json at the root and one level down (apps/*, packages/*), so monorepo dependencies count.
function packageJsons(cwd) {
  const out = [];
  const pkg = readJsonFile(path.join(cwd, 'package.json'));
  if (pkg) out.push(pkg);
  for (const parent of ['apps', 'packages']) {
    let entries = [];
    try {
      entries = fs.readdirSync(path.join(cwd, parent), { withFileTypes: true });
    } catch (_) { continue; }
    for (const e of entries) {
      const child = readJsonFile(path.join(cwd, parent, e.name, 'package.json'));
      if (e.isDirectory() && child) out.push(child);
    }
  }
  return out;
}

function dependencyNames(cwd) {
  const names = new Set();
  for (const pkg of packageJsons(cwd)) {
    for (const name of [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})]) {
      names.add(name);
    }
  }
  return names;
}

// The tracker implied by the git origin host, or null when there is no origin or the host is unknown.
function remoteTrackers(cwd) {
  let url;
  try {
    url = execFileSync('git', ['-C', cwd, 'remote', 'get-url', 'origin'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim();
  } catch (_) {
    return null;
  }
  const match = url.match(/^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]+@)?([^/:]+)/i);
  const tracker = match && HOST_TRACKERS[match[1].toLowerCase()];
  return tracker ? [tracker] : null;
}

// Facts the relevance rules read. `trackers` is null when unknown (the rules then ask for a decision),
// an array otherwise (possibly empty when the project has no tracker).
function detectProject(cwd, retired) {
  const deps = dependencyNames(cwd);
  const rootManifests = STACK_MANIFESTS.map((f) => readText(path.join(cwd, f))).join('\n').toLowerCase();
  const configured = retired && retired.trackers !== undefined;
  const trackers = configured ? retired.trackers : remoteTrackers(cwd);
  const trackerSource = configured ? `configured in ${RETIRED_FILE}` : (trackers ? 'git origin' : 'not detected');
  return {
    trackers,
    trackerSource,
    playwright: PLAYWRIGHT_DEPS.some((d) => deps.has(d)) || /playwright/.test(rootManifests)
      || PLAYWRIGHT_CONFIGS.some((f) => fs.existsSync(path.join(cwd, f))),
    prisma: PRISMA_DEPS.some((d) => deps.has(d)) || PRISMA_FILES.some((f) => fs.existsSync(path.join(cwd, f))),
    ui: UI_DEPS.some((d) => deps.has(d)),
    stackKnown: STACK_MANIFESTS.some((f) => fs.existsSync(path.join(cwd, f))),
  };
}

// ---- relevance ----

// What a template path depends on: 'tracker:<name>', 'playwright', 'prisma', 'ui', 'mcp', or null (generic).
function topicOf(rel) {
  const n = rel.split(path.sep).join('/');
  if (MCP_TEMPLATES.includes(n)) return 'mcp';
  const skill = /^\.agents\/skills\/([^/]+)\//.exec(n);
  if (skill && TRACKER_SKILLS[skill[1]]) return `tracker:${TRACKER_SKILLS[skill[1]]}`;
  return STEM_TOPICS[path.posix.basename(n).split('.')[0]] || null;
}

// 'add' applies to the project; 'irrelevant' does not (never added); 'review' cannot be decided from the
// project yet (never added until someone decides).
function relevanceOf(rel, facts) {
  const topic = topicOf(rel);
  if (!topic) return { status: 'add', reason: '' };
  if (topic === 'mcp') return { status: 'irrelevant', reason: 'empty MCP template, no servers configured' };
  if (topic.startsWith('tracker:')) {
    const tracker = topic.slice('tracker:'.length);
    if (facts.trackers === null) {
      return { status: 'review', reason: `tracker not detected; set "trackers" in ${RETIRED_FILE}` };
    }
    if (facts.trackers.includes(tracker)) return { status: 'add', reason: '' };
    return { status: 'irrelevant', reason: `project tracker is ${facts.trackers.join(', ') || 'none'}` };
  }
  const detected = { playwright: facts.playwright, prisma: facts.prisma, ui: facts.ui }[topic];
  if (detected) return { status: 'add', reason: '' };
  if (topic === 'ui' && !facts.stackKnown) return { status: 'review', reason: 'no stack manifest found' };
  return { status: 'irrelevant', reason: TOPIC_NOTES[topic] };
}

// ---- thin wrappers ----

// The wrapper's kind and the sources it must link to: its snippet, then a same-named skill.
function wrapperSources(rel) {
  const n = rel.split(path.sep).join('/');
  const kind = WRAPPER_KINDS.find((k) => n.startsWith(k.dir + '/') && !n.slice(k.dir.length + 1).includes('/'));
  if (!kind) return null;
  const base = path.posix.basename(n);
  const name = base.replace(/\.(agent|instructions|prompt)\.md$/, '').replace(/\.mdc$/, '').replace(/\.md$/, '');
  const snippet = `.claude/${kind.snippets}/${name}.md`;
  const skill = `.agents/skills/${name}/SKILL.md`;
  return [{ rel: snippet, needle: `${kind.snippets}/${name}.md` }, { rel: skill, needle: skill }];
}

function bodyOf(content) {
  if (!content.startsWith('---\n')) return content;
  const end = content.indexOf('\n---', 3); // the closing delimiter; empty frontmatter ("---\n---") included
  return end < 0 ? content : content.slice(end + 4);
}

// `targets` are the sources that exist in the project, each as { rel, needle }.
// thin: links a source, with at most one short summary line, a few key points and no table or other policy
// text; inlined: more prose, a table or too many key points outside the link; diverged: links no existing source.
function auditWrapper(content, targets) {
  const linked = targets.find((t) => bodyOf(content).includes(t.needle));
  if (!linked) return { status: 'diverged', reason: `does not link ${targets.map((t) => t.rel).join(' or ')}` };
  const prose = [];
  let bullets = 0;
  // "Agent Dispatch" names the agent to activate and "Arguments" the command syntax: both are activation metadata.
  let metadata = false;
  for (const raw of bodyOf(content).split('\n')) {
    const line = raw.trim();
    if (/^#+\s/.test(line)) { metadata = /^#+\s+(agent dispatch|arguments)\b/i.test(line); continue; }
    if (metadata || line === '$ARGUMENTS') continue;
    if (!line || line.startsWith('>') || line.includes(linked.needle)) continue;
    if (/^([-*]|\d+\.)\s/.test(line)) { bullets++; continue; }
    if (/:$/.test(line) && line.split(/\s+/).length <= 3) continue; // a label such as "Key points:"
    prose.push(line);
  }
  const summaryOnly = prose.length === 1 && prose[0].split(/\s+/).length <= MAX_SUMMARY_WORDS;
  if (prose.length > 0 && !summaryOnly) {
    return { status: 'inlined', reason: `${prose.length} line(s) of policy text or table outside the link` };
  }
  if (bullets > MAX_KEY_POINTS) {
    return { status: 'inlined', reason: `${bullets} key points (max ${MAX_KEY_POINTS}); move the rest into the source` };
  }
  return { status: 'thin', reason: '' };
}

// Wrappers among the planned entries that exist in the project and are not thin. Read-only: the caller
// reports them and proposes moving the inlined content into the snippet.
function auditWrappers(cwd, plan) {
  const out = [];
  for (const e of plan) {
    if (e.action === 'retired') continue;
    const sources = wrapperSources(e.rel);
    const file = path.join(cwd, e.rel);
    if (!sources || !fs.existsSync(file)) continue;
    const targets = sources.filter((s) => fs.existsSync(path.join(cwd, s.rel)));
    const result = targets.length
      ? auditWrapper(fs.readFileSync(file, 'utf8'), targets)
      : { status: 'diverged', reason: `no ${sources[0].rel} or ${sources[1].rel} to link` };
    if (result.status !== 'thin') out.push({ rel: e.rel, status: result.status, reason: result.reason });
  }
  return out;
}

module.exports = {
  RETIRED_FILE,
  TRACKERS,
  MAX_KEY_POINTS,
  readRetired,
  retiredFor,
  detectProject,
  topicOf,
  relevanceOf,
  wrapperSources,
  auditWrapper,
  auditWrappers,
};
