#!/usr/bin/env node
'use strict';

// nitm-ai-dev-toolkit CLI
// Scaffolds AI agent config into a target repo, then hands off to an AI agent
// to run the bootstrap flow (replace {{PLACEHOLDER}}s, calibrate agent tools).
// Use --env to tailor the scaffold + handoff to the user's harness.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const factory = require('./factory-watch.js');
const factoryArchive = require('./factory-archive.js');
const factoryPrune = require('./factory-prune.js');

const PKG_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');
const PKG_NAME = 'nitm-ai-dev-toolkit';

// Platform config dirs per harness. Claude and Codex share `.agents` (universal skills).
const ENV_DIRS = {
  claude: ['.claude', '.agents'],
  codex: ['.codex', '.agents', path.join('.github', 'instructions')],
  copilot: ['.github', '.vscode'],
  cursor: ['.cursor'],
  // Shared reference sources, not other harnesses' active config/agent wrappers.
  opencode: ['.opencode', path.join('.agents', 'skills'),
    path.join('.claude', 'agents-snippets'), path.join('.claude', 'prompt-snippets'),
    path.join('.github', 'instructions')],
};
const ENV_INFO = {
  claude: { name: 'Claude Code', command: '/bootstrap (Claude Code command in .claude/commands/)' },
  codex: { name: 'OpenAI Codex', command: 'read and follow .nitm/BOOTSTRAP.md' },
  copilot: { name: 'GitHub Copilot', command: '/bootstrap (Copilot prompt in .github/prompts/bootstrap.prompt.md)' },
  cursor: { name: 'Cursor', command: '/bootstrap (Cursor command in .cursor/commands/)' },
  opencode: { name: 'OpenCode', command: 'the bootstrap command in .opencode/commands/' },
};
// Files/dirs copied for every environment (shared across harnesses).
const SHARED_ROOT = ['AGENTS.md', 'README.md', 'CLAUDE.md', '.mcp.json'];
// `factory` is the job queue every harness reads and writes, so it is shared.
// Agent/skill bodies and prompt snippets are referenced by wrappers in every harness
// (e.g. `.claude/agents-snippets/*` from Cursor and Copilot agents), so they are shared too.
// `.claude/rules-snippets` is linked the same way from every harness's rules and instructions.
// Only `.agents/skills` is shared: `.agents/rules` is Claude/Codex ambient config.
const SHARED_DIRS = ['docs', 'templates', 'hooks', 'factory', path.join('.agents', 'skills'),
  path.join('.claude', 'agents-snippets'), path.join('.claude', 'prompt-snippets'),
  path.join('.claude', 'rules-snippets')];
// npm drops `.gitignore` files from packages, so templates ship them as `_gitignore`
// and install them under the real name.
const TEMPLATE_RENAMES = { '_gitignore': '.gitignore' };

// Files the CLI writes in the target repo besides template files.
const VERSION_FILE = '.toolkit-version';
const NITM_DIR = '.nitm';
const HANDOFF_FILE = path.join(NITM_DIR, 'BOOTSTRAP.md');
const CONFIG_FILE = path.join(NITM_DIR, 'toolkit.json');
const MANIFEST_FILE = path.join(NITM_DIR, 'manifest.json');
const BACKUP_DIR = path.join(NITM_DIR, 'backups');

// Groups for --exclude / --only. Explicit closed lists: nothing is detected from the stack.
const HARNESS_GROUPS = Object.keys(ENV_DIRS);
const FEATURE_GROUPS = ['factory', 'prisma', 'bkt-cli', 'gh-cli', 'glab-cli', 'acli', 'linear-cli'];
const SELECTABLE_GROUPS = [...HARNESS_GROUPS, ...FEATURE_GROUPS];
// Top-level dirs owned by one harness. SHARED_ROOT, SHARED_DIRS, `.agents/*` and
// `.github/instructions` are shared, so they carry no harness group.
const HARNESS_OWNED = {
  '.codex': 'codex', '.cursor': 'cursor', '.vscode': 'copilot', '.github': 'copilot',
  '.opencode': 'opencode', '.claude': 'claude',
};

// Known historical template hashes (sha256 of the installed file), by target path.
// Doctor and patch report stale copies that match; they never delete anything.
// `.opencode/plugins/ponytail.mjs`: the src/repo and src/monorepo template copy shipped
// through 3.0.23 (git 3.0.23:src/repo/.opencode/plugins/ponytail.mjs), removed in 4.0.0 (f57f44d).
// test/data/ponytail-3.0.23.mjs.fixture holds that exact content.
const KNOWN_HISTORICAL = {
  '.opencode/plugins/ponytail.mjs': ['3ca6fe6e560da71109af7e40ed04ca47aa22219e4c9edf674bf895acadce8605'],
  // factory-* agents and their snippets, removed in 5.1.0 (repo and monorepo versions of each file).
  // The .opencode/agents entries also carry the 5.0.0 hash (5.0.1 changed them).
  '.claude/agents/factory-spec-writer.agent.md': ['7d12cd197d71cd52d31d4e17f756abd984c012c786cff8c23465b637e2c1cb30'],
  '.cursor/agents/factory-spec-writer.agent.md': ['03c70de3a9b570972ff14e5dcd946b22948fb216e075452df46ccd4f4bd457cf'],
  '.github/agents/factory-spec-writer.agent.md': ['76f87fe65a7a552f4645d67b375c464943fe2d92bcbfac4a91d8880cb726b4b2'],
  '.opencode/agents/factory-spec-writer.md': ['591ba39990f2037f0093b2aaf5a178c269c5b4d723a8dcf61a6a3cbb350ce1cc', '2c778565cbe80f0d610e886f2c150ad9a6478a60c8e7653eb7ece8fe1b7d85d7'],
  '.claude/agents-snippets/factory-spec-writer.md': ['cdb34e0195981008c0962df78bcdbe2c53e04ef930e0d1d456e02162d4553528', '4644730e83f4ae5eb7b5b8b78021cb9cd9db81bdbc32fcfb745251a8326343b0'],
  '.claude/agents/factory-builder.agent.md': ['8cc3434f6ee7e1a24098f15428f0810bfe0421288992b1bf4783d4304e0ee999'],
  '.cursor/agents/factory-builder.agent.md': ['4e14b4588baf99bc98437bf85ce3fc67bf94a30fa0243c7e7cf67c716e75a852'],
  '.github/agents/factory-builder.agent.md': ['1f7998713df8f5163ea231ce37103cd8be5f757ffa8b8145888dbc889a202807'],
  '.opencode/agents/factory-builder.md': ['d35fde702d4e8f3876f5f3bbe3b1dd5c16b0f20b375a9b6c6ad0508e0a8b773e', '87e2d9bcc4b4bb387782e202c8b26a8c0a5ca63d86a3f1f0b018698f7fc56a6c'],
  '.claude/agents-snippets/factory-builder.md': ['08b757399ebb72b57df279cd47a9a681e285e9615151bc6354b58ceab12f45a3', '5526e25aee44ebcce73c868a65ad61221b63575466eb25f05c1f98cce5c1c36b'],
  '.claude/agents/factory-reviewer-code.agent.md': ['b61ff8ec33b5f0fc9890046e15d6e0886d45e9a472602e75d362537a4ef8f181'],
  '.cursor/agents/factory-reviewer-code.agent.md': ['303e314cdeb6637e6d76adc257a65095a14ff7b578f7dc8e653ccb804ce1c4ea'],
  '.github/agents/factory-reviewer-code.agent.md': ['cd729889637f543d79d4daf9e09df07633ff66835c0412dddb5443a729bdd278'],
  '.opencode/agents/factory-reviewer-code.md': ['bbe16860782736a8389dfb94647dfc4fb0cae1ad46617d34f4e896df29d73489', '681c93ed0432c93898f8f53f9ff78b13e6bb618f9bf8c3f0e6fb2b9083afa05e'],
  '.claude/agents-snippets/factory-reviewer-code.md': ['92a1726bdec0d94222b08654fa8db481e1710163fd06f439019ab737bdae55c8', '44097bf782912e34eb1d0946cb9ed42be8753fea13036db8edcbb9524b7be8b2'],
  '.claude/agents/factory-reviewer-security.agent.md': ['7685bb4a2433c7069bdf6f48b7264f46febfe905cd0a8315dd7cefeae2d77add'],
  '.cursor/agents/factory-reviewer-security.agent.md': ['8bfce3dfbaab8d4a9d7d2b9ec2fd067214028bd8578a53af3ae0933898b0cb2e'],
  '.github/agents/factory-reviewer-security.agent.md': ['96f0e8697dabb0567b67426214809de870e06df30c1058a4753ac3bf13cff456'],
  '.opencode/agents/factory-reviewer-security.md': ['55895e193aec20ffcb42a7c12553116f777c91db97e107f240ab15db0d85a7c0', '9302937a79f89c703c6fdb60cfbd65985cd00e52e580786d3be0a4fe8e8ae213'],
  '.claude/agents-snippets/factory-reviewer-security.md': ['8a4c5a411e47d5b1e50b18d40d177e931cc6bf20a96dfb4286a39719f863b37d'],
  '.claude/agents/factory-reviewer-ux.agent.md': ['4ff8769a04fcfee2214243b5f1099e69f8fefc8760261321c1cbeb9ab796cb85'],
  '.cursor/agents/factory-reviewer-ux.agent.md': ['00155aabea522cfa0f20a2c03d194e374958130ec8fc8bb88210ab6f2185fcfa'],
  '.github/agents/factory-reviewer-ux.agent.md': ['2965a81ebf7d455e07c9270fc5066480e34c8168c552d0fab6602b826caaed8d'],
  '.opencode/agents/factory-reviewer-ux.md': ['7175b4b5ca713a8b15c0909c84eb2bb6e29630ffeb90157f9e2df9b6a62a6649', 'c192cc5f1dffcfa8879a3d9ede7270e1098fa25dcd2f989627b217edc4b9446d'],
  '.claude/agents-snippets/factory-reviewer-ux.md': ['a16b188d275f3fba1527b3ef510f61ea3bada11594488720146a8560b17efb98', '6e114305e5d18b284d7f9ececa6b64d6f06c5a272ec2651dcdaea74e81e95554'],
  '.claude/agents/factory-reviewer-ui.agent.md': ['1107289a1429c795a7c9a8c16426692ca62593483c0ff8b6863a96de166f1cfc'],
  '.cursor/agents/factory-reviewer-ui.agent.md': ['388b66c8368d642ccbdcb35c55a0c994d510d85b9c04b3f926806d0c1bf824de'],
  '.github/agents/factory-reviewer-ui.agent.md': ['97aed62c6716fa96834985704dc0e34850842cbd92ceaa987acd70f42769e3dc'],
  '.opencode/agents/factory-reviewer-ui.md': ['b1e1a5544df1cdd54fedf0a65fd54007600e29ec54a423055858780b363c6d60', 'f93c2410ac2a9d3b358ac21085dd1804e111981b8d24495c411ba06dd6aa5495'],
  '.claude/agents-snippets/factory-reviewer-ui.md': ['7399863904241ab875cfb7862c683b1135eb4f8027a4a422e377b016007f7bf5', '0142ec37dc2306320d613b58505c31852c02f502b80c6070ff72b5eb77d8b2e1'],
  '.claude/agents/factory-approver.agent.md': ['2de2420de55a72268f24672a92a4df0d78e133b14a9ccf62ab4e2b0b8f1c090c'],
  '.cursor/agents/factory-approver.agent.md': ['5bc3df10f0784804bcd54fe4a3de60c6116c55d34eb85bc5be0f1417613bc25c'],
  '.github/agents/factory-approver.agent.md': ['2a061b34802eb9b5396b76d139bbea5dd21dd89b3e5af06cf09c53c7f6897d94'],
  '.opencode/agents/factory-approver.md': ['62dbfb689025bf79a2e8f86f7a5afb52a73e07e677ff384d26301d494c3ba21f', '35b3b45950ae1a36ebd8e8b7d46d8499ed427a138d422457a72de2f98c891b0c'],
  '.claude/agents-snippets/factory-approver.md': ['cacf515a661d25120824d38a81ef2a5753c3bfc5fce8732728cbdd394dda6857'],
};

// First release with --dry-run, --exclude and --only. `upgrade` refuses a dry run below it (older
// releases would write), and refuses a selection below it (older releases would ignore it).
const DRY_RUN_UPGRADE_MIN = '5.0.1';
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const C = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};
function info(m) { console.log(`${C.cyan}•${C.reset} ${m}`); }
function ok(m) { console.log(`${C.green}✓${C.reset} ${m}`); }
function warn(m) { console.log(`${C.yellow}!${C.reset} ${m}`); }
function err(m) { console.log(`${C.red}✗${C.reset} ${m}`); }

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function fileHash(p) { return sha256(fs.readFileSync(p)); }
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}
function packageVersion() {
  return JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')).version;
}
function writeText(cwd, rel, text) {
  const to = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, text);
}
// 'unchanged' when the file already holds exactly `text`, otherwise 'write'.
function writeState(p, text) {
  return fs.existsSync(p) && fs.readFileSync(p, 'utf8') === text ? 'unchanged' : 'write';
}

function detectType(cwd, flags) {
  if (flags.monorepo) return 'monorepo';
  if (flags.repo) return 'repo';
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.workspaces) return 'monorepo';
    } catch (_) { /* ignore */ }
  }
  if (fs.existsSync(path.join(cwd, 'apps')) && fs.existsSync(path.join(cwd, 'packages'))) {
    return 'monorepo';
  }
  return 'repo';
}

function walk(dir, base, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return;
  }
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) walk(full, rel, out);
    else out.push(rel);
  }
}

function templateFiles(type) {
  const files = [];
  walk(path.join(SRC_DIR, type), '', files);
  return files;
}

// Path a template file is installed to (see TEMPLATE_RENAMES).
function installName(rel) {
  const renamed = TEMPLATE_RENAMES[path.basename(rel)];
  return renamed ? path.join(path.dirname(rel), renamed) : rel;
}

// Restrict the file set to the chosen environment (shared + that env's dirs).
function scopeFiles(files, env) {
  if (!env || !ENV_DIRS[env]) return files;
  const allowed = new Set([...SHARED_ROOT, ...SHARED_DIRS, ...ENV_DIRS[env]]);
  const dirs = [...SHARED_DIRS, ...ENV_DIRS[env]].map((dir) => path.normalize(dir));
  return files.filter((rel) => {
    const normalized = path.normalize(rel);
    const top = normalized.split(path.sep)[0];
    return allowed.has(top) || allowed.has(normalized)
      || dirs.some((dir) => normalized.startsWith(dir + path.sep));
  });
}

// ---- Group selection (--exclude / --only) ----

function inDir(rel, dir) {
  return rel === dir || rel.startsWith(dir + path.sep);
}

// The harness that owns a file, or null when the file is shared.
function harnessOf(rel) {
  const n = path.normalize(rel);
  if (SHARED_ROOT.includes(n) || SHARED_DIRS.some((d) => inDir(n, path.normalize(d)))) return null;
  if (inDir(n, path.join('.github', 'instructions'))) return null;
  return HARNESS_OWNED[n.split(path.sep)[0]] || null;
}

// Feature groups a file belongs to: a path segment or its file stem equals the group name
// (factory/, .agents/skills/gh-cli/, prisma-migrations.md).
function featuresOf(rel) {
  const n = path.normalize(rel);
  const segments = n.split(path.sep).map((s) => s.replace(/^\./, ''));
  const stem = path.basename(n).split('.')[0];
  return FEATURE_GROUPS.filter((g) => segments.includes(g) || stem === g || stem.startsWith(g + '-'));
}

function groupsOf(rel) {
  const harness = harnessOf(rel);
  return harness ? [harness, ...featuresOf(rel)] : featuresOf(rel);
}

// Selection = { exclude, only } as lists of group names. Shared (untagged) files are always kept.
// Exclude drops files in any listed group. Only keeps tagged files in a listed group.
function selectionKeeps(rel, sel) {
  if (!sel) return true;
  const groups = groupsOf(rel);
  if (groups.some((g) => sel.exclude.includes(g))) return false;
  if (sel.only.length && groups.length && !groups.some((g) => sel.only.includes(g))) return false;
  return true;
}

function normalizeSelection(input) {
  const sel = { exclude: [], only: [] };
  for (const key of ['exclude', 'only']) {
    const list = (input && input[key]) || [];
    if (!Array.isArray(list)) throw new Error(`${key} must be a list of group names`);
    for (const g of list) {
      if (!SELECTABLE_GROUPS.includes(g)) {
        throw new Error(`Unknown group "${g}" for --${key}. Valid groups: ${SELECTABLE_GROUPS.join(', ')}`);
      }
    }
    sel[key] = [...new Set(list)].sort();
  }
  return sel;
}

function splitGroups(value) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

// A missing saved config means no selection. One that exists but does not parse is an error:
// treating it as empty would let patch add files the user excluded.
function readConfigOrThrow(cwd) {
  const p = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (ex) {
    throw new Error(`${CONFIG_FILE} exists but is not valid JSON (${ex.message}). Fix or remove it; nothing was written.`);
  }
}

// Explicit --exclude/--only replace the saved selection; without them the saved one applies.
function resolveSelection(cwd, flags) {
  const hasExclude = flags.exclude !== undefined;
  const hasOnly = flags.only !== undefined;
  if (hasExclude && hasOnly) throw new Error('Use either --exclude or --only, not both');
  if (hasExclude || hasOnly) {
    return { selection: normalizeSelection({ exclude: flags.exclude, only: flags.only }), explicit: true };
  }
  return { selection: normalizeSelection(readConfigOrThrow(cwd)), explicit: false };
}

function configText(sel) {
  return JSON.stringify({ exclude: sel.exclude, only: sel.only }, null, 2) + '\n';
}

// ---- Planning ----

// The path that blocks writing `dest` (an ancestor that is a file, or `dest` itself as a directory).
function blockerOf(cwd, dest) {
  const parts = path.normalize(dest).split(path.sep);
  for (let i = 1; i <= parts.length; i++) {
    const p = path.join(cwd, ...parts.slice(0, i));
    if (!fs.existsSync(p)) return null;
    const isDir = fs.statSync(p).isDirectory();
    if (i < parts.length && !isDir) return parts.slice(0, i).join(path.sep);
    if (i === parts.length && isDir) return dest;
  }
  return null;
}

// One entry per template file the command touches.
//   add:       missing in the target
//   overwrite: install --force on an existing file
//   skip:      patch keeps an existing file (identical or user-changed)
//   conflict:  install without --force on an existing file, or a path blocked by a file/dir of another type
function planFiles(type, cwd, { mode, force, env, selection }) {
  const rels = scopeFiles(templateFiles(type), env).filter((rel) => selectionKeeps(rel, selection));
  return rels.map((rel) => {
    const dest = installName(rel);
    const from = path.join(SRC_DIR, type, rel);
    const hash = fileHash(from);
    const blocker = blockerOf(cwd, dest);
    if (blocker) return { rel: dest, from, hash, action: 'conflict', reason: `blocked by ${blocker}` };
    const to = path.join(cwd, dest);
    if (!fs.existsSync(to)) return { rel: dest, from, hash, action: 'add', same: false };
    const same = fileHash(to) === hash;
    if (mode === 'install' && !force) return { rel: dest, from, hash, action: 'conflict', reason: 'exists', same };
    if (mode === 'install') return { rel: dest, from, hash, action: 'overwrite', same };
    return { rel: dest, from, hash, action: 'skip', same, reason: same ? 'identical' : 'kept, differs from template' };
  });
}

function countActions(plan) {
  const counts = { add: 0, overwrite: 0, skip: 0, conflict: 0 };
  for (const e of plan) counts[e.action]++;
  return counts;
}

function applyPlan(cwd, plan) {
  let copied = 0;
  for (const e of plan) {
    if (e.action !== 'add' && e.action !== 'overwrite') continue;
    const to = path.join(cwd, e.rel);
    try {
      fs.mkdirSync(path.dirname(to), { recursive: true });
    } catch (ex) {
      throw new Error(`Failed to create directory for ${e.rel}: ${ex.message}`);
    }
    try {
      fs.copyFileSync(e.from, to);
    } catch (ex) {
      throw new Error(`Failed to copy ${e.rel}: ${ex.message}`);
    }
    copied++;
  }
  return copied;
}

// Files the scaffold would write that already exist in the target repo.
function conflicts(type, cwd, env) {
  return planFiles(type, cwd, { mode: 'install', force: false, env, selection: null })
    .filter((e) => e.action === 'conflict')
    .map((e) => e.rel);
}

function printPlan(plan) {
  const c = countActions(plan);
  info(`Dry run, nothing will be written: ${c.add} add, ${c.overwrite} overwrite, ${c.skip} skip, ${c.conflict} conflict.`);
  const sections = [['add', 'Would add'], ['overwrite', 'Would overwrite'],
    ['skip', 'Would skip (existing, kept)'], ['conflict', 'Conflicts']];
  for (const [action, label] of sections) {
    const list = plan.filter((e) => e.action === action);
    if (!list.length) continue;
    console.log(`  ${label} (${list.length}):`);
    for (const e of list) console.log(`     - ${e.rel}${e.reason ? ` (${e.reason})` : ''}`);
  }
}

// ---- Handoff, version, manifest, selection (the files written besides templates) ----

function envHeader(type, env) {
  if (!env || !ENV_INFO[env]) {
    return [
      '# Bootstrap handoff',
      '',
      'Your AI agent should run the full bootstrap flow (the complete procedure is below). Key steps:',
      '1. Replace all `{{PLACEHOLDER}}` values in the AI instruction files.',
      '2. Calibrate each agent\'s tools for your environment (see the Agent Tool & Permission Calibration section).',
      '3. Verify with `npx nitm-ai-dev-toolkit doctor`.',
      '',
      'The default scaffold includes Claude Code, OpenAI Codex, GitHub Copilot, Cursor, and OpenCode.',
      'Ask your AI agent to read and follow `.nitm/BOOTSTRAP.md`.',
      'Claude Code, GitHub Copilot, Cursor, and OpenCode also have harness-specific bootstrap commands.',
      'For OpenAI Codex, use the handoff file directly; no native `/bootstrap` command is provided.',
      '',
      'The full bootstrap procedure follows.',
    ].join('\n');
  }
  const info = ENV_INFO[env];
  return [
    `# Bootstrap handoff — environment: ${info.name}`,
    '',
    `Bootstrap entry point: ${info.command}`,
    '',
      'Then ask your AI agent to run the full bootstrap flow (procedure below). Key steps:',
      '1. Replace all `{{PLACEHOLDER}}` values in the AI instruction files.',
      `2. Calibrate each agent's tools for ${info.name} (see the Agent Tool & Permission Calibration section).`,
      `3. Verify with \`npx nitm-ai-dev-toolkit doctor --env ${env}\`.`,
    '',
    'The full bootstrap procedure follows.',
  ].join('\n');
}

function handoffContent(type, env) {
  const bootSrc = path.join(SRC_DIR, type, '.claude', 'prompt-snippets', 'bootstrap.md');
  const body = fs.existsSync(bootSrc) ? fs.readFileSync(bootSrc, 'utf8') : '';
  return envHeader(type, env) + '\n\n' + body;
}

// create | unchanged | replace. A replaced handoff is backed up first, never lost.
function handoffState(cwd, content) {
  const p = path.join(cwd, HANDOFF_FILE);
  if (!fs.existsSync(p)) return 'create';
  return fs.readFileSync(p, 'utf8') === content ? 'unchanged' : 'replace';
}

// Copies the current handoff to a new backup name. Existing backups are never overwritten:
// COPYFILE_EXCL fails on a taken name and we retry with a numeric suffix.
function backupHandoff(cwd) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(path.join(cwd, BACKUP_DIR), { recursive: true });
  for (let n = 0; ; n++) {
    const rel = path.join(BACKUP_DIR, `BOOTSTRAP.${stamp}${n ? `-${n}` : ''}.md`);
    try {
      fs.copyFileSync(path.join(cwd, HANDOFF_FILE), path.join(cwd, rel), fs.constants.COPYFILE_EXCL);
      return rel;
    } catch (ex) {
      if (ex.code !== 'EEXIST') throw ex;
    }
  }
}

function readManifest(cwd) {
  const m = readJson(path.join(cwd, MANIFEST_FILE));
  return m && m.files && typeof m.files === 'object' ? m : { files: {} };
}

// Manifest keys are template paths written with '/'. Anything absolute or escaping the target is ignored.
function safeManifestPath(key) {
  const rel = String(key).replace(/\\/g, '/');
  if (path.posix.isAbsolute(rel) || path.win32.isAbsolute(rel) || rel.split('/').includes('..')) return null;
  return rel;
}

function manifestText(files) {
  const sorted = Object.fromEntries(Object.keys(files).sort().map((k) => [k, files[k]]));
  return JSON.stringify({ toolkit: packageVersion(), files: sorted }, null, 2) + '\n';
}

// The toolkit version this project was scaffolded or patched with, against the package version.
function toolkitVersionStatus(cwd) {
  const pkg = packageVersion();
  const p = path.join(cwd, VERSION_FILE);
  const installed = fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;
  const status = installed === null ? 'missing' : installed === pkg ? 'match' : 'mismatch';
  return { installed, package: pkg, status };
}

// Known historical toolkit files still on disk. Matched by path AND content hash, so user files never match.
// Reported only. Nothing is deleted.
function findStale(cwd, type) {
  const current = new Set(templateFiles(type).map(installName));
  const stale = [];
  for (const [key, hashes] of Object.entries(KNOWN_HISTORICAL)) {
    const rel = path.join(...key.split('/'));
    const p = path.join(cwd, rel);
    if (current.has(rel) || !fs.existsSync(p) || !fs.statSync(p).isFile()) continue;
    if (hashes.includes(fileHash(p))) stale.push(rel);
  }
  return stale;
}

// Manifest-owned files whose content no longer matches what the toolkit recorded (edited by the user).
function customizedOwned(cwd) {
  const out = [];
  for (const [key, hash] of Object.entries(readManifest(cwd).files)) {
    const rel = safeManifestPath(key);
    if (rel === null) continue;
    const p = path.join(cwd, ...rel.split('/'));
    if (fs.existsSync(p) && fs.statSync(p).isFile() && fileHash(p) !== hash) out.push(rel);
  }
  return out;
}

// Everything install/patch writes besides template files. Writes only when not dryRun.
function recordState(cwd, { type, env, plan, selection, explicit, dryRun }) {
  const content = handoffContent(type, env);
  const handoff = handoffState(cwd, content);
  const versionText = packageVersion() + '\n';
  const version = writeState(path.join(cwd, VERSION_FILE), versionText);
  const files = { ...readManifest(cwd).files };
  for (const e of plan) {
    if (e.action === 'add' || e.action === 'overwrite' || (e.action === 'skip' && e.same)) {
      files[e.rel.split(path.sep).join('/')] = e.hash;
    }
  }
  const manifest = manifestText(files);
  const manifestState = writeState(path.join(cwd, MANIFEST_FILE), manifest);
  const config = explicit ? writeState(path.join(cwd, CONFIG_FILE), configText(selection)) : null;
  const state = { handoff, version, manifest: manifestState, config, backup: null };
  if (dryRun) return state;
  if (config === 'write') writeText(cwd, CONFIG_FILE, configText(selection));
  if (handoff === 'replace') state.backup = backupHandoff(cwd);
  if (handoff !== 'unchanged') writeText(cwd, HANDOFF_FILE, content);
  if (version === 'write') writeText(cwd, VERSION_FILE, versionText);
  if (manifestState === 'write') writeText(cwd, MANIFEST_FILE, manifest);
  return state;
}

function printDryState(s) {
  const handoffWord = { create: 'create', replace: 'replace (old copy backed up)', unchanged: 'no change' }[s.handoff];
  const word = (x) => (x === 'unchanged' ? 'no change' : 'write');
  info('Would also:');
  console.log(`    - ${HANDOFF_FILE}: ${handoffWord}`);
  console.log(`    - ${VERSION_FILE}: ${word(s.version)}`);
  console.log(`    - ${MANIFEST_FILE}: ${word(s.manifest)}`);
  if (s.config !== null) console.log(`    - ${CONFIG_FILE}: ${word(s.config)} (selection persisted for later patch)`);
}

function printStale(stale) {
  if (!stale.length) return;
  warn(`${stale.length} stale toolkit file(s) left in place (not deleted; remove by hand if unwanted):`);
  stale.forEach((f) => console.log('     - ' + f));
}

function printHandoff(env, state) {
  if (env && ENV_INFO[env]) {
    info(`Scaffold complete (tailored to ${ENV_INFO[env].name}). Hand off to your AI agent:`);
    console.log(`    Bootstrap entry point: ${ENV_INFO[env].command}`);
  } else {
    info('Scaffold complete. Hand off to your AI agent to finish setup:');
  }
  console.log('    1. Ask your AI agent to read and follow `.nitm/BOOTSTRAP.md`.');
  if (!env || !ENV_INFO[env]) {
    console.log('       Includes Claude Code, OpenAI Codex, GitHub Copilot, Cursor, and OpenCode.');
    console.log('       Other harnesses also have bootstrap commands; Codex uses the handoff file directly.');
  }
  console.log('    2. Run `npx nitm-ai-dev-toolkit doctor' + (env ? ` --env ${env}` : '') + '` to verify the install.');
  if (state.handoff === 'unchanged') info(`${HANDOFF_FILE} already up to date (not rewritten).`);
  if (state.backup) info(`Previous ${HANDOFF_FILE} differed; backed up to ${state.backup}.`);
}

// ---- Commands ----

function cmdInstall(cwd, flags) {
  const type = detectType(cwd, flags);
  if (flags.env && !ENV_DIRS[flags.env]) warn(`Unknown --env "${flags.env}"; scaffolding all environments.`);
  info(`Detected project type: ${type}` + (flags.env ? `, environment: ${flags.env}` : ''));
  const { selection, explicit } = resolveSelection(cwd, flags);
  const plan = planFiles(type, cwd, { mode: 'install', force: flags.force, env: flags.env, selection });
  const counts = countActions(plan);
  const cf = plan.filter((e) => e.action === 'conflict');
  const existing = cf.filter((e) => e.reason === 'exists');
  const blocked = cf.filter((e) => e.reason !== 'exists');

  if (flags.dryRun) {
    printPlan(plan);
    printDryState(recordState(cwd, { type, env: flags.env, plan, selection, explicit, dryRun: true }));
    if (cf.length) process.exitCode = 1;
    return { copied: 0, skipped: 0, conflicts: cf.length, dryRun: true, planned: counts };
  }
  if (blocked.length) {
    err(`Install aborted: ${blocked.length} path(s) are blocked by a file or directory of another type.`);
    blocked.slice(0, 20).forEach((e) => console.log(`     - ${e.rel} (${e.reason})`));
    throw new Error('install: path type conflicts block writes');
  }
  if (existing.length) {
    err(`Install aborted: ${existing.length} file(s) already exist in this project.`);
    existing.slice(0, 20).forEach((e) => console.log('     - ' + e.rel));
    if (existing.length > 20) console.log(`     ...and ${existing.length - 20} more.`);
    console.log('');
    info('To overwrite them, re-run with --force.');
    info('To keep your changes and only add missing files, run: npx nitm-ai-dev-toolkit patch');
    throw new Error('install: conflicting files exist (use --force to overwrite)');
  }
  const copied = applyPlan(cwd, plan);
  ok(`Copied ${copied} file(s), skipped ${counts.skip} existing.`);
  printHandoff(flags.env, recordState(cwd, { type, env: flags.env, plan, selection, explicit, dryRun: false }));
  return { copied, skipped: counts.skip, conflicts: 0, dryRun: false, planned: counts };
}

function cmdPatch(cwd, flags) {
  const type = detectType(cwd, flags);
  const { selection, explicit } = resolveSelection(cwd, flags);
  // patch never overwrites existing files, even with --force (data-loss guard)
  const plan = planFiles(type, cwd, { mode: 'patch', env: flags.env, selection });
  const counts = countActions(plan);
  const conflictEntries = plan.filter((e) => e.action === 'conflict');
  const stale = findStale(cwd, type);

  if (flags.dryRun) {
    printPlan(plan);
    printStale(stale);
    printDryState(recordState(cwd, { type, env: flags.env, plan, selection, explicit, dryRun: true }));
    if (conflictEntries.length) process.exitCode = 1;
    return { copied: 0, skipped: counts.skip, conflicts: conflictEntries.length, stale, dryRun: true, planned: counts };
  }
  const copied = applyPlan(cwd, plan);
  ok(`Ensured files present: ${copied} added, ${counts.skip} already there.`);
  if (conflictEntries.length) {
    err(`${conflictEntries.length} path(s) could not be written (blocked by a file or directory of another type):`);
    conflictEntries.forEach((e) => console.log(`     - ${e.rel} (${e.reason})`));
    process.exitCode = 1;
  }
  printStale(stale);
  printHandoff(flags.env, recordState(cwd, { type, env: flags.env, plan, selection, explicit, dryRun: false }));
  return { copied, skipped: counts.skip, conflicts: conflictEntries.length, stale, dryRun: false, planned: counts };
}

// Placeholders the agent fills per task or feature at runtime, so they are not bootstrap leftovers.
const RUNTIME_PLACEHOLDERS = new Set(['ISSUE_ID', 'ISSUE_KEY', 'FEATURE_NAME', 'NAME']);
// Placeholders are intentional in these: `templates/` and `docs/` ship blank forms and reference
// docs; bootstrap*.md, constitution.md and create-skill.md document placeholder syntax.
const PLACEHOLDER_EXEMPT_DIRS = ['templates', 'docs'];
const PLACEHOLDER_EXEMPT_FILES = [/^bootstrap.*\.md$/, /^constitution\.md$/, /^create-skill\.md$/];

function placeholderExempt(rel) {
  const n = path.normalize(rel);
  return PLACEHOLDER_EXEMPT_DIRS.includes(n.split(path.sep)[0])
    || PLACEHOLDER_EXEMPT_FILES.some((re) => re.test(path.basename(n)));
}

function hasUnresolvedPlaceholder(content) {
  const names = content.match(/\{\{[A-Z][A-Z0-9_]*\}\}/g) || [];
  return names.some((name) => !RUNTIME_PLACEHOLDERS.has(name.slice(2, -2)));
}

function scanPlaceholders(cwd, relFiles) {
  const found = [];
  for (const rel of relFiles) {
    if (placeholderExempt(rel)) continue;
    const p = path.join(cwd, rel);
    if (!fs.existsSync(p)) continue;
    try {
      const content = fs.readFileSync(p, 'utf8');
      if (hasUnresolvedPlaceholder(content)) found.push(rel);
    } catch (_) { /* ignore */ }
  }
  return found;
}

function cmdDoctor(cwd, flags) {
  const type = detectType(cwd, flags);
  const { selection, explicit } = resolveSelection(cwd, flags);
  const files = scopeFiles(templateFiles(type), flags.env)
    .filter((rel) => selectionKeeps(rel, selection))
    .map(installName);
  const missingFiles = [];
  let present = 0;
  for (const rel of files) {
    if (fs.existsSync(path.join(cwd, rel))) present++;
    else missingFiles.push(rel);
  }
  const placeholders = scanPlaceholders(cwd, files);
  const version = toolkitVersionStatus(cwd);
  const stale = findStale(cwd, type);
  const customized = customizedOwned(cwd);
  const result = { type, present, missingFiles, placeholders, version, stale, customized,
    selection, selectionSource: explicit ? 'flags' : CONFIG_FILE };

  console.log('');
  if (missingFiles.length === 0) ok(`All ${present} template files present.`);
  else {
    warn(`${missingFiles.length} missing file(s):`);
    missingFiles.forEach((f) => console.log('     - ' + f));
  }
  if (selection.exclude.length || selection.only.length) {
    info(`Selection (${result.selectionSource}): exclude [${selection.exclude.join(', ')}], only [${selection.only.join(', ')}].`);
  }
  if (version.status === 'match') ok(`${VERSION_FILE} ${version.installed} matches toolkit ${version.package}.`);
  else if (version.status === 'missing') warn(`${VERSION_FILE} is missing (toolkit ${version.package}). Run patch to record it.`);
  else warn(`${VERSION_FILE} is ${version.installed}, toolkit is ${version.package}. Run upgrade or patch to record it.`);
  if (placeholders.length === 0) ok('No unresolved {{PLACEHOLDER}} values found.');
  else {
    warn(`${placeholders.length} file(s) still contain {{PLACEHOLDER}} values (AI handoff replaces these):`);
    placeholders.slice(0, 20).forEach((f) => console.log('     - ' + f));
    if (placeholders.length > 20) console.log(`     ...and ${placeholders.length - 20} more.`);
  }
  printStale(stale);
  if (customized.length) info(`${customized.length} toolkit-installed file(s) differ from the install record (your edits; kept).`);
  console.log('');
  info('Run your AI agent on .nitm/BOOTSTRAP.md to finish configuration, then re-run doctor.');
  return result;
}

// ---- Upgrade ----

// Semver-style ordering: X-anything sorts below X. Prerelease identifiers compare per semver
// (numeric identifiers numerically, below alphanumeric ones; a shorter set sorts first).
function compareVersions(a, b) {
  const split = (v) => {
    const i = v.indexOf('-');
    return { core: (i < 0 ? v : v.slice(0, i)).split('.').map(Number), pre: i < 0 ? null : v.slice(i + 1) };
  };
  const x = split(a);
  const y = split(b);
  for (let i = 0; i < 3; i++) {
    if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  }
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  const ax = x.pre.split('.');
  const ay = y.pre.split('.');
  for (let i = 0; i < Math.max(ax.length, ay.length); i++) {
    if (ax[i] === undefined) return -1;
    if (ay[i] === undefined) return 1;
    const nx = /^\d+$/.test(ax[i]);
    const ny = /^\d+$/.test(ay[i]);
    if (nx && ny) {
      if (Number(ax[i]) !== Number(ay[i])) return Number(ax[i]) - Number(ay[i]);
    } else if (nx !== ny) {
      return nx ? -1 : 1;
    } else if (ax[i] !== ay[i]) {
      return ax[i] < ay[i] ? -1 : 1;
    }
  }
  return 0;
}

function currentVersion() {
  try { return packageVersion(); } catch (_) { return 'unknown'; }
}

// `upgrade [version]`, `upgrade nitm-ai-dev-toolkit@<version>` or `upgrade --version <version>`.
// Returns undefined when no version was given (the latest published release is used).
function parseUpgradeTarget(flags) {
  const positional = (flags._ || []).slice(1);
  if (positional.length > 1) throw new Error(`Unknown option for upgrade: ${positional[1]}`);
  if (positional.length && flags.version !== undefined) {
    throw new Error('Give the version once: as an argument or with --version');
  }
  let v = flags.version !== undefined ? flags.version : positional[0];
  if (v === undefined) return undefined;
  if (v.startsWith(PKG_NAME + '@')) v = v.slice(PKG_NAME.length + 1);
  if (!VERSION_RE.test(v)) {
    throw new Error(`Pin an exact version such as 5.0.1 (got "${v}"). Leave it out to use the latest published release.`);
  }
  return v;
}

// `spec` is only ever `nitm-ai-dev-toolkit` or `nitm-ai-dev-toolkit@<version>`, and the version is
// checked by the anchored VERSION_RE before this runs (parseUpgradeTarget and resolveUpgradeVersion).
// That makes the Windows shell path safe: npm.cmd needs a shell, and nothing reaching it can carry
// shell metacharacters. Everywhere else the call uses argv with no shell.
function npmQuery(spec, field) {
  const args = ['view', spec, field];
  const opts = { encoding: 'utf8', timeout: 60000, stdio: 'pipe' };
  try {
    if (process.platform === 'win32') return execFileSync('npm.cmd', args, { ...opts, shell: true });
    return execFileSync('npm', args, opts);
  } catch (_) {
    throw new Error('Could not reach npm to resolve the version (are you online?).');
  }
}

// Resolves the exact published version to install. Never returns a range or `latest`.
function resolveUpgradeVersion(requested, npmView = npmQuery) {
  // Validation comes first: no npm call may see a version that failed VERSION_RE.
  if (requested) {
    if (!VERSION_RE.test(requested)) throw new Error(`Pin an exact version such as 5.0.1 (got "${requested}").`);
    const published = npmView(`${PKG_NAME}@${requested}`, 'version').split('\n')
      .map((line) => line.trim().split(/\s+/).pop().replace(/^'|'$/g, ''));
    if (!published.includes(requested)) throw new Error(`${PKG_NAME}@${requested} is not published on npm.`);
    return requested;
  }
  const latest = npmView(PKG_NAME, 'dist-tags.latest').trim();
  if (!VERSION_RE.test(latest)) throw new Error(`npm returned no usable latest version ("${latest}").`);
  return latest;
}

// Upgrade runs the pinned package in patch mode: missing files are added and existing
// (possibly customised) files are kept. Only an explicit --force reaches `install --force`.
function upgradeArgs(flags, version) {
  if (!version) throw new Error('upgradeArgs needs a resolved, pinned version');
  const force = Boolean(flags && flags.force);
  const args = ['--yes', `${PKG_NAME}@${version}`, force ? 'install' : 'patch'];
  if (force) args.push('--force');
  if (flags && flags.env) args.push('--env', flags.env);
  if (flags && flags.exclude !== undefined) args.push('--exclude', flags.exclude.join(','));
  if (flags && flags.only !== undefined) args.push('--only', flags.only.join(','));
  if (flags && flags.dryRun) args.push('--dry-run');
  return args;
}

function cmdUpgrade(cwd, flags, deps = {}) {
  const requested = parseUpgradeTarget(flags);
  // Reads the effective selection first: a corrupt saved config or a combined --exclude/--only stops here.
  const { selection, explicit } = resolveSelection(cwd, flags);
  const target = resolveUpgradeVersion(requested, deps.npmView || npmQuery);
  info(`Resolved ${PKG_NAME}@${target} (installed toolkit: ${currentVersion()}).`);
  const selectionActive = selection.exclude.length > 0 || selection.only.length > 0;
  if (flags.dryRun && compareVersions(target, DRY_RUN_UPGRADE_MIN) < 0) {
    throw new Error(`--dry-run needs ${PKG_NAME} >= ${DRY_RUN_UPGRADE_MIN}; ${target} has no dry run and would write. Pin a newer version.`);
  }
  if (compareVersions(target, DRY_RUN_UPGRADE_MIN) < 0 && selectionActive) {
    const saved = explicit ? 'the --exclude/--only you passed' : `the selection saved in ${CONFIG_FILE}`;
    throw new Error(`${PKG_NAME}@${target} predates --exclude/--only and would ignore ${saved}. `
      + `Pin ${DRY_RUN_UPGRADE_MIN} or later, or clear the selection with --exclude "" (and no --only).`);
  }
  // An explicit empty selection clears the saved one. The pinned run cannot do this, so clear it here.
  if (compareVersions(target, DRY_RUN_UPGRADE_MIN) < 0 && explicit && !flags.dryRun) {
    const text = configText(selection);
    if (writeState(path.join(cwd, CONFIG_FILE), text) === 'write') writeText(cwd, CONFIG_FILE, text);
  }
  if (flags.force) warn('--force: existing files will be overwritten with the latest templates. Back up your customisations first.');
  else info('Adding missing files only; your existing files are kept. Pass --force to overwrite them.');
  info(`Running pinned ${PKG_NAME}@${target}${flags.dryRun ? ' (dry run, nothing written)' : ''}...`);
  const run = deps.spawn || spawnSync;
  const r = run('npx', upgradeArgs(flags, target), { cwd, stdio: 'inherit', timeout: 120000 });
  if (r.error) {
    err('Upgrade failed: ' + r.error.message);
    process.exitCode = 1;
    return { version: target, status: null };
  }
  if (r.status === 0) {
    ok(flags.dryRun ? 'Dry run complete; nothing was written.' : 'Upgrade complete. Hand off to your AI agent with .nitm/BOOTSTRAP.md to finish setup.');
  } else if (flags.dryRun && r.status === 1) {
    err('Upgrade dry run found conflicts (exit 1); nothing was written. Resolve them, then re-run.');
    process.exitCode = 1;
  } else {
    err('Upgrade failed.');
    process.exitCode = 1;
  }
  return { version: target, status: r.status };
}

function cmdOmoStarter(cwd, flags) {
  const sub = flags._[1];
  if (sub !== 'install') {
    err('Usage: nitm-ai-dev-toolkit omo-slim-starter install');
    return;
  }
  if (flags.dryRun) {
    info(`Dry run: would run \`npx --yes nitm-opencode-starter install\` in ${cwd}. Nothing was run.`);
    return;
  }
  info('Delegating to the published starter: npx nitm-opencode-starter install');
  const r = spawnSync('npx', ['--yes', 'nitm-opencode-starter', 'install'], { cwd, stdio: 'inherit', timeout: 120000 });
  if (r.error) { err('Could not run starter: ' + r.error.message); return; }
  if (r.status === 0) {
    ok('Starter installed via nitm-opencode-starter.');
  } else {
    err('Could not run `npx nitm-opencode-starter install` (is it published / are you online?).');
    info('Install it manually: npx nitm-opencode-starter install');
  }
}

const FACTORY_USAGE = 'Usage: nitm-ai-dev-toolkit factory <status|watch|archive|prune> [--dir <path>] [--all] [--abandoned] [--interval <ms>] [--dry-run] [--yes]';
const FACTORY_SUB_USAGE = {
  archive: 'Usage: nitm-ai-dev-toolkit factory archive [--dir <path>] [--all] [--dry-run]',
  prune: 'Usage: nitm-ai-dev-toolkit factory prune [--dir <path>] [--all] [--abandoned] [--dry-run] [--yes]',
};

function cmdFactory(cwd, flags) {
  const sub = flags._[1];
  // --abandoned changes what prune deletes; elsewhere it would be a silent no-op, so refuse it.
  if (flags.abandoned && sub !== 'prune') {
    err('--abandoned is only for factory prune');
    process.exitCode = 1;
    return;
  }
  if (sub === 'status') return factory.cmdFactoryStatus(cwd, flags);
  if (sub === 'watch') return factory.cmdFactoryWatch(cwd, flags);
  if (sub === 'archive' || sub === 'prune') {
    const extra = flags._.slice(2);
    if (extra.length) {
      err(`Unknown option for factory ${sub}: ${extra[0]}`);
      err(FACTORY_SUB_USAGE[sub]);
      process.exitCode = 1;
      return;
    }
    return sub === 'archive'
      ? factoryArchive.cmdFactoryArchive(cwd, flags)
      : factoryPrune.cmdFactoryPrune(cwd, flags);
  }
  err(FACTORY_USAGE);
  process.exitCode = 1;
}

function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--monorepo') flags.monorepo = true;
    else if (a === '--repo') flags.repo = true;
    else if (a === '--force' || a === '-f') flags.force = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--yes') flags.yes = true;
    else if (a === '--abandoned') flags.abandoned = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else if (a === '--dir' || a === '--interval' || a === '--version') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} requires a value`);
      flags[a.slice(2)] = v;
    } else if (a.startsWith('--dir=') || a.startsWith('--interval=') || a.startsWith('--version=')) {
      const eq = a.indexOf('=');
      const v = a.slice(eq + 1);
      if (!v) throw new Error(`${a.slice(0, eq)}= requires a value`);
      flags[a.slice(2, eq)] = v;
    } else if (a === '--exclude' || a === '--only') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} requires a value (e.g. ${a} factory,prisma)`);
      flags[a.slice(2)] = splitGroups(v);
    } else if (a.startsWith('--exclude=') || a.startsWith('--only=')) {
      const eq = a.indexOf('=');
      flags[a.slice(2, eq)] = splitGroups(a.slice(eq + 1));
    } else if (a === '--env') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error('--env requires a value (e.g. --env claude)');
      flags.env = v;
    } else if (a.startsWith('--env=')) {
      const v = a.slice(6);
      if (!v) throw new Error('--env= requires a value');
      flags.env = v;
    }
    else flags._.push(a);
  }
  return flags;
}

function usage() {
  console.log(`nitm-ai-dev-toolkit — scaffold AI agent config into any repo, then hand off to your AI agent.

Usage:
  npx nitm-ai-dev-toolkit install [--monorepo|--repo] [--env <claude|codex|copilot|cursor|opencode>] [--force] [--dry-run] [--exclude <groups>|--only <groups>]
      Scaffold AI config into the current repo (auto-detects repo vs monorepo),
      tailored to your harness, then hand off to your AI agent to run the bootstrap flow.
      If files already exist, install aborts (use --force to overwrite, or \`patch\` to add missing).
      --dry-run lists adds, overwrites, skips and conflicts; writes nothing; exits 1 if there are conflicts.

  npx nitm-ai-dev-toolkit patch [--monorepo|--repo] [--env <env>] [--exclude <groups>|--only <groups>] [--dry-run]
      Add only missing template files (never overwrites existing ones), then
      re-emit the bootstrap handoff so your AI agent can finish configuration.
      A given --exclude/--only is saved to .nitm/toolkit.json and used by later patch/doctor runs.

  npx nitm-ai-dev-toolkit upgrade [version] [--env <env>] [--force] [--dry-run] [--exclude <groups>|--only <groups>]
      Upgrade to a pinned version: the given one (\`upgrade 5.0.1\`, \`upgrade nitm-ai-dev-toolkit@5.0.1\`,
      or \`--version 5.0.1\`) or the latest published release, resolved and printed before anything runs.
      Like \`patch\`, adds missing files and keeps your existing ones, then re-emits the bootstrap handoff.
      --force also overwrites existing files with the latest templates (back up customisations first).
      --dry-run runs the pinned version's dry run (needs ${DRY_RUN_UPGRADE_MIN} or newer).

  npx nitm-ai-dev-toolkit doctor [--monorepo|--repo] [--env <env>]
      Inspect the current install: missing files, unresolved {{PLACEHOLDER}}
       values, .toolkit-version against the toolkit version, and stale toolkit files
       (reported, never deleted).

  npx nitm-ai-dev-toolkit omo-slim-starter install
      Run \`npx nitm-opencode-starter install\` to scaffold the oh-my-opencode-slim
      starter (published to npm). Falls back to printing the command if unavailable.

  npx nitm-ai-dev-toolkit factory status [--dir <path>] [--all]
      Print one table of factory jobs (factory/jobs/<NNN-slug>/job.json), then exit.
      Closed jobs (merged, abandoned) are hidden and counted; --all shows them,
      plus archived jobs from factory/archive/ (marked [archived]).
      Read-only. Run /factory <feature> in your agent to create jobs.

  npx nitm-ai-dev-toolkit factory watch [--dir <path>] [--interval <ms>] [--all]
      Live terminal view of factory jobs. ↑/↓ or j/k select, Enter opens a job's
      markdown files, q quits. Closed jobs are hidden unless --all.
      Not a TTY? Behaves like \`factory status\`.

  npx nitm-ai-dev-toolkit factory archive [--dir <path>] [--all] [--dry-run]
      Move closed jobs (merged, abandoned) from factory/jobs/ to factory/archive/.
      Default: only jobs closed more than 7 days ago. --all: every closed job.
      --dry-run: list what would move, move nothing. Open jobs are never touched.
      Does not touch git or branches (/factory archive and /factory prune handle those).

  npx nitm-ai-dev-toolkit factory prune [--dir <path>] [--all] [--abandoned] [--dry-run] [--yes]
      PERMANENTLY delete closed jobs from factory/jobs/ and factory/archive/.
      Default: only merged jobs closed more than 7 days ago. --all: every merged job
      (no age limit). --abandoned: also delete abandoned jobs (same age rule).
      Without --yes it only lists what would be deleted. --dry-run always only
      lists, even with --yes. Open jobs are never touched. Deletes job folders only;
      git, docs and branches are not touched.

Options:
  --env <env>  Optional. Limit the scaffold to ONE harness:
               claude | codex | copilot | cursor | opencode
               Omit to scaffold ALL environments, including OpenAI Codex.
               Ask your agent to read and follow .nitm/BOOTSTRAP.md.
               Other harnesses also have bootstrap commands; Codex uses the handoff
               file directly (no native /bootstrap command is provided).
  --exclude <groups>
               Comma-separated groups to leave out (install, patch, upgrade, doctor).
               Harnesses: claude | codex | copilot | cursor | opencode.
               Features: factory | prisma | bkt-cli | gh-cli | glab-cli | acli | linear-cli.
               Harness groups keep the shared files (AGENTS.md, docs/, hooks/, shared skills
               and snippets). Feature groups apply everywhere, including factory/ and shared
               skills such as .agents/skills/gh-cli. Pass --exclude "" to clear the saved selection.
               Cannot be combined with --only.
  --only <groups>
               Keep only the listed groups. Untagged shared files are still kept, as with --exclude.
               Same group names as --exclude. Cannot be combined with --exclude.
  --monorepo   Force monorepo template
  --repo       Force single-repo template
  --force      Overwrite existing files (install, upgrade). patch never overwrites
  --dry-run    install/patch/upgrade: list what would change, write nothing.
               omo-slim-starter install: print the command only
               factory archive/prune: list only, change nothing
  --version <v>
               upgrade: pinned version to install (exact, e.g. 5.0.1)
  --dir <path> factory: jobs directory (default: ./factory/jobs)
  --interval <ms>
               factory watch: refresh interval (default: 2000, minimum: 100)
  --all        factory status/watch: include closed and archived jobs
               factory archive: include every closed job, not just those older than 7 days
               factory prune: include every merged job, not just those older than 7 days
  --abandoned  factory prune: also delete abandoned jobs (default: merged only)
  --yes        factory prune: actually delete (without it, prune only lists)
  -h, --help   Show this help
`);
}

function main() {
  const cwd = process.cwd();
  try {
    const flags = parseFlags(process.argv.slice(2));
    if (flags.help) {
      usage();
      return;
    }
    const cmd = flags._[0];
    switch (cmd) {
      case 'install': return cmdInstall(cwd, flags);
      case 'patch': return cmdPatch(cwd, flags);
      case 'upgrade': return cmdUpgrade(cwd, flags);
      case 'doctor': return cmdDoctor(cwd, flags);
      case 'omo-slim-starter': return cmdOmoStarter(cwd, flags);
      case 'factory': return cmdFactory(cwd, flags);
      default:
        if (cmd) err(`Unknown command: ${cmd}`);
        usage();
    }
  } catch (e) {
    err(e.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  detectType,
  scopeFiles,
  templateFiles,
  installName,
  planFiles,
  conflicts,
  scanPlaceholders,
  envHeader,
  parseFlags,
  selectionKeeps,
  normalizeSelection,
  findStale,
  toolkitVersionStatus,
  readManifest,
  cmdInstall,
  cmdPatch,
  cmdDoctor,
  cmdUpgrade,
  upgradeArgs,
  parseUpgradeTarget,
  resolveUpgradeVersion,
  compareVersions,
  DRY_RUN_UPGRADE_MIN,
  cmdOmoStarter,
  cmdFactory,
  ENV_DIRS,
  SHARED_ROOT,
  SHARED_DIRS,
  KNOWN_HISTORICAL,
  VERSION_FILE,
  HANDOFF_FILE,
  CONFIG_FILE,
  MANIFEST_FILE,
};
