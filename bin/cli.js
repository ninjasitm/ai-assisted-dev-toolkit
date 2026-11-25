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
const relevance = require('./relevance.js');
const skillIntegrity = require('./skill-integrity.js');

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
// First release whose patch and install honour .nitm/retired.json and the relevance plan. Upgrade refuses
// older targets while that file has entries or a tracker override, because those targets would ignore it.
// First supported release: 5.2.0.
const RELEVANCE_MIN = '5.2.0';
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
// First release with patch --skip-path and --expect. Upgrade refuses older targets that would ignore them.
const SKIP_PATH_MIN = '5.4.4';
const PATCH_REVIEW_SCHEMA = 'nitm-patch-review/1';
// Project files by their posix key. Metadata keys are never skippable.
const VERSION_KEY = '.toolkit-version';
const MANIFEST_KEY = '.nitm/manifest.json';
const CONFIG_KEY = '.nitm/toolkit.json';
const RETIRED_KEY = '.nitm/retired.json';
const HANDOFF_KEY = '.nitm/BOOTSTRAP.md';
const MANDATORY_KEYS = [VERSION_KEY, MANIFEST_KEY, CONFIG_KEY];
// Raw SHA-256 of the handoff that the 5.3.1 package wrote, keyed `<layout>:<env or all>`. Taken from the
// published 5.3.1 package (bin/cli.js envHeader plus src/<layout>/.claude/prompt-snippets/bootstrap.md) and
// checked against that package's own install output. Used only when the manifest has no handoff entry.
const HANDOFF_STOCK_VERSION = '5.3.1';
const STOCK_HANDOFF_5_3_1 = {
  'repo:all': '53bb3c2e54006374d61a57f4ba88492daac0f02b99246309859a43d40d6ae640',
  'repo:claude': '0f364a54a8cab2d8ca295d4e647202d54941ea68d67ff34a2b0f60752bfcaac4',
  'repo:codex': 'b702c4ae9e81033bdd43d78a00d293e3b7a07a97d5d5090aa0c9759dafb1985a',
  'repo:copilot': 'bd04b547e2ff3913e1c06b8a6e3f9ceccb011d55187e03fb0c3d1ac934fb335e',
  'repo:cursor': '10288a1f250dfc442e43506af37d090eaeacce05d477ae6e04708ad078b729be',
  'repo:opencode': 'a6b4cfb3badf6de3913aa2e06fa39541d10a8bfb8829f56f485c250cee947a9b',
  'monorepo:all': '95c305de906fa4ddc7e26487c2c6f36263ce9b5b328fe6e6e4f81ab03653fa44',
  'monorepo:claude': '32da5cedc1f7bb26e5c07106c2959b26b67232f69db75f8542dd631f8edf2cce',
  'monorepo:codex': '84369051375a20cdaf81fa974c4d9591c30e58cdd2bf33717a870999367588e9',
  'monorepo:copilot': '86409ce8cca6b8cbba7c00894f7400e0bf03e8b0ed14df2557bb4a9867f214e0',
  'monorepo:cursor': '56c78a418906e60ea955df6710045b26735dc85d04dca1154b2e44aff86eae9d',
  'monorepo:opencode': 'f30a09d9835c4ba21ea1c7f55f0a7ab16d3949c9ded28072b14af88871148962',
};

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
function configFrom(st) {
  if (st.kind === 'missing') return null;
  if (st.kind === 'unsafe') throw new Error(`${CONFIG_FILE} is not a regular file (${st.reason}). Fix or remove it; nothing was written.`);
  try {
    return JSON.parse(st.buf.toString('utf8'));
  } catch (ex) {
    throw new Error(`${CONFIG_FILE} exists but is not valid JSON (${ex.message}). Fix or remove it; nothing was written.`);
  }
}

function readConfigOrThrow(cwd) { return configFrom(pathState(cwd, CONFIG_KEY)); }

// Explicit --exclude/--only replace the saved selection; without them the saved one applies.
// `configState` is a snapshot state of the saved config when the caller has one; otherwise it is read here.
function resolveSelection(cwd, flags, configState) {
  const hasExclude = flags.exclude !== undefined;
  const hasOnly = flags.only !== undefined;
  if (hasExclude && hasOnly) throw new Error('Use either --exclude or --only, not both');
  if (hasExclude || hasOnly) {
    return { selection: normalizeSelection({ exclude: flags.exclude, only: flags.only }), explicit: true };
  }
  const saved = configState ? configFrom(configState) : readConfigOrThrow(cwd);
  return { selection: normalizeSelection(saved), explicit: false };
}

function configText(sel) {
  return JSON.stringify({ exclude: sel.exclude, only: sel.only }, null, 2) + '\n';
}

// ---- Planning ----

// Typed state of one project path, read without following links. Each ancestor is lstat'ed and must be a
// directory; the final component is opened with O_NOFOLLOW and fstat'ed before its bytes are read. `kind` is
// missing, file or unsafe. `chain` records the identity of each existing ancestor directory, so a later write
// can tell that a directory the review relied on was replaced.
function identityOf(st) {
  return `${st.dev}:${st.ino}:${st.size}:${st.mtimeMs}:${st.ctimeMs}:${st.mode}:${st.nlink}`;
}

function readFileState(p, upto) {
  let fd;
  try {
    fd = fs.openSync(p, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  } catch (ex) {
    return { kind: 'unsafe', reason: `${upto} cannot be opened without following links (${ex.code || ex.message})` };
  }
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) return { kind: 'unsafe', reason: `${upto} is not a regular file` };
    const buf = fs.readFileSync(fd);
    return { kind: 'file', buf, sha256: sha256(buf), mode: st.mode & 0o777, nlink: st.nlink, identity: identityOf(st) };
  } finally {
    fs.closeSync(fd);
  }
}

function pathState(cwd, key) {
  const parts = key.split('/');
  const chain = [];
  let p = cwd;
  for (let i = 0; i < parts.length; i++) {
    p = path.join(p, parts[i]);
    const upto = parts.slice(0, i + 1).join('/');
    let st;
    try {
      st = fs.lstatSync(p);
    } catch (ex) {
      if (ex.code === 'ENOENT') return { kind: 'missing', chain };
      if (ex.code === 'ENOTDIR') return { kind: 'unsafe', reason: `${upto} is under a file`, chain };
      throw ex;
    }
    if (st.isSymbolicLink()) return { kind: 'unsafe', reason: `${upto} is a symbolic link`, chain };
    if (i < parts.length - 1) {
      if (!st.isDirectory()) return { kind: 'unsafe', reason: `${upto} is not a directory`, chain };
      chain.push({ upto, id: `${st.dev}:${st.ino}` });
      continue;
    }
    if (st.isDirectory()) return { kind: 'unsafe', reason: `${upto} is a directory`, chain };
    if (!st.isFile()) return { kind: 'unsafe', reason: `${upto} is not a regular file`, chain };
    return { ...readFileState(p, upto), chain };
  }
  return { kind: 'missing', chain };
}

// One read per path per review: every decision about a path uses the same typed state.
function makeSnapshot(cwd) {
  const cache = new Map();
  return {
    get(key) {
      if (!cache.has(key)) cache.set(key, pathState(cwd, key));
      return cache.get(key);
    },
  };
}

// Same reviewed state, for a recheck: kind, bytes, mode, link count and identity of the target, and the
// identity of each ancestor directory the review found. Directories created by earlier writes are allowed.
function sameState(reviewed, now) {
  if (reviewed.kind !== now.kind) return false;
  if (reviewed.kind === 'unsafe') return reviewed.reason === now.reason;
  if (reviewed.kind === 'file' && (reviewed.identity !== now.identity || reviewed.sha256 !== now.sha256)) return false;
  return reviewed.chain.every((d, i) => Boolean(now.chain[i]) && now.chain[i].upto === d.upto && now.chain[i].id === d.id);
}

// The template's bytes, read once. Every hash, action and write for that entry comes from this buffer.
function readSource(from) {
  const buf = fs.readFileSync(from);
  return { buf, hash: sha256(buf), mode: fs.statSync(from).mode & 0o777 };
}

function installEntry(e, force) {
  if (e.snap.kind === 'missing') return { ...e, action: 'add', same: false };
  const same = e.snap.sha256 === e.hash;
  if (!force) return { ...e, action: 'conflict', reason: 'exists', same };
  return { ...e, action: 'overwrite', same };
}

// Patch decision for one template file that is not retired and not blocked.
function patchEntry(e) {
  const relevant = relevance.relevanceOf(e.key, e.facts);
  if (e.snap.kind === 'missing') {
    if (relevant.status === 'add') return { ...e, action: 'add', same: false };
    return { ...e, action: relevant.status === 'review' ? 'review' : 'irrelevant', reason: relevant.reason };
  }
  const same = e.snap.sha256 === e.hash;
  if (relevant.status === 'irrelevant') {
    return { ...e, action: 'irrelevant', same, present: true, reason: relevant.reason };
  }
  if (same) return { ...e, action: 'skip', same: true, reason: 'identical' };
  if (relevant.status === 'add' && e.manifest[e.key] === e.snap.sha256) {
    return { ...e, action: 'update', same: false, reason: 'unchanged since the toolkit wrote it' };
  }
  return { ...e, action: 'review', same: false, reason: 'kept, differs from template' };
}

// A write to a hard-linked file would also change its other names, so it is a conflict, never a write.
function guardLinks(e) {
  if (!['add', 'update', 'overwrite'].includes(e.action)) return e;
  if (e.snap.kind === 'file' && e.snap.nlink > 1) {
    return { ...e, action: 'conflict', reason: `hard-linked (${e.snap.nlink} names); writing it would change the other names` };
  }
  return e;
}

// One entry per template file the command touches. `action`:
//   add:        missing in the target and applies to this project (patch)
//   update:     patch refreshes a file the toolkit wrote and the user never changed (manifest hash matches)
//   overwrite:  install --force on an existing file
//   skip:       identical to the template, already current
//   review:     locally changed, or missing while relevance is undecided; kept and reported, never overwritten
//   irrelevant: does not apply to this project (missing: not added; present: kept, reported)
//   retired:    listed in .nitm/retired.json; never added, updated or overwritten
//   conflict:   a path blocked by a file or directory of another type, a symbolic link or a non-regular file,
//               a hard-linked file that a write would change, or install without --force on an existing file
// Each entry also carries `snap` (the typed state it was decided from), `buf` (the template bytes) and `mode`.
// `retired`, `facts` and `manifest` may be passed in; `snap` is a shared snapshot (see makeSnapshot).
function planFiles(type, cwd, { mode, force, env, selection, retired, facts, manifest, snap }) {
  const retiredConfig = retired || relevance.readRetired(cwd);
  const projectFacts = mode === 'patch' ? (facts || relevance.detectProject(cwd, retiredConfig)) : null;
  const known = mode === 'patch' ? (manifest || readManifest(cwd).files) : {};
  const view = snap || makeSnapshot(cwd);
  const rels = scopeFiles(templateFiles(type), env).filter((rel) => selectionKeeps(rel, selection));
  return rels.map((rel) => {
    const dest = installName(rel);
    const from = path.join(SRC_DIR, type, rel);
    const source = readSource(from);
    const key = dest.split(path.sep).join('/');
    const st = view.get(key);
    const base = { rel: dest, from, key, hash: source.hash, buf: source.buf, mode: source.mode, snap: st };
    const retirement = relevance.retiredFor(key, retiredConfig.entries);
    if (retirement) {
      return { ...base, action: 'retired', reason: `${retirement.reason} (retired ${retirement.date})` };
    }
    if (st.kind === 'unsafe') return { ...base, action: 'conflict', reason: `blocked by ${st.reason}` };
    if (mode === 'install') return guardLinks(installEntry(base, force));
    return guardLinks(patchEntry({ ...base, facts: projectFacts, manifest: known }));
  });
}

const PLAN_ACTIONS = ['add', 'update', 'overwrite', 'skip', 'review', 'irrelevant', 'retired', 'conflict', 'skipped'];

function countActions(plan) {
  const counts = Object.fromEntries(PLAN_ACTIONS.map((a) => [a, 0]));
  for (const e of plan) counts[e.action]++;
  return counts;
}

function applyPlan(cwd, plan) {
  let copied = 0;
  for (const e of plan) {
    if (!['add', 'update', 'overwrite'].includes(e.action)) continue;
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

const PLAN_SECTIONS = [
  ['add', 'Would add'],
  ['update', 'Would update (unchanged since the toolkit wrote them; template changed)'],
  ['overwrite', 'Would overwrite'],
  ['review', 'Needs review (not written)'],
  ['irrelevant', 'Not relevant to this project (not written)'],
  ['skipped', 'Skipped by --skip-path (not written)'],
  ['retired', 'Retired (never re-added)'],
  ['conflict', 'Conflicts'],
];

// The plan is shown before any write: what is added, updated, held back and why.
function printPlan(plan, dryRun) {
  const c = countActions(plan);
  const summary = `${c.add} add, ${c.update} update, ${c.overwrite} overwrite, ${c.review} need review, `
    + `${c.irrelevant} not relevant, ${c.skipped} skipped, ${c.retired} retired, ${c.skip} already current, ${c.conflict} conflict.`;
  info(dryRun ? `Dry run, nothing will be written: ${summary}` : `Plan: ${summary}`);
  for (const [action, label] of PLAN_SECTIONS) {
    // Present files that do not apply are kept silently here; doctor lists them as retirement candidates.
    const list = plan.filter((e) => e.action === action && !(action === 'irrelevant' && e.present));
    if (!list.length) continue;
    console.log(`  ${label} (${list.length}):`);
    for (const e of list) console.log(`     - ${e.rel}${e.reason ? ` (${e.reason})` : ''}`);
  }
}

function printFacts(facts) {
  const yn = (v) => (v ? 'yes' : 'no');
  const tracker = facts.trackers === null
    ? `not detected (set "trackers" in ${relevance.RETIRED_FILE})`
    : `${facts.trackers.join(', ') || 'none'} (${facts.trackerSource})`;
  info(`Project facts: tracker ${tracker}; Playwright ${yn(facts.playwright)}; Prisma ${yn(facts.prisma)}; UI ${yn(facts.ui)}.`);
}

// Harness wrappers that inline policy or diverge from their snippet. Reported only; nothing is moved.
function printWrappers(wrappers) {
  if (!wrappers.length) return;
  warn(`${wrappers.length} harness wrapper(s) inline policy or diverge from their snippet. Propose moving the content into the snippet and keeping the wrapper a thin link (nothing changed):`);
  wrappers.forEach((w) => console.log(`     - ${w.rel} (${w.status}: ${w.reason})`));
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

// Lenient read, for doctor's read-only report only. Patch and install use manifestOf: an unreadable manifest
// must not look empty, or the next write would drop the records it holds.
function readManifest(cwd) {
  const m = readJson(path.join(cwd, MANIFEST_FILE));
  return m && m.files && typeof m.files === 'object' ? m : { files: {} };
}

// Strict read of a manifest state: absent is empty; anything else must be a JSON object whose "files" map holds
// hash strings. Otherwise it throws before any write.
function manifestOf(st) {
  if (st.kind === 'missing') return {};
  if (st.kind === 'unsafe') throw new Error(`${MANIFEST_FILE} is not a regular file (${st.reason}). Fix or remove it; nothing was written.`);
  let m;
  try {
    m = JSON.parse(st.buf.toString('utf8'));
  } catch (ex) {
    throw new Error(`${MANIFEST_FILE} exists but is not valid JSON (${ex.message}). Fix or remove it; nothing was written.`);
  }
  if (!m || typeof m !== 'object' || Array.isArray(m) || !m.files || typeof m.files !== 'object' || Array.isArray(m.files)) {
    throw new Error(`${MANIFEST_FILE} must be a JSON object with a "files" map. Fix or remove it; nothing was written.`);
  }
  for (const [k, v] of Object.entries(m.files)) {
    if (typeof v !== 'string') throw new Error(`${MANIFEST_FILE}: "${k}" must map to a hash string. Fix or remove it; nothing was written.`);
  }
  return m.files;
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
    if (current.has(rel)) continue;
    const st = pathState(cwd, key);
    if (st.kind === 'file' && hashes.includes(st.sha256)) stale.push(rel);
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

// Install's compatibility path: everything install writes besides template files (the handoff, with its
// backup when it differs, the install-time manifest and the saved selection). Patch never calls this; its checks
// live in buildPatchReview. Writes only when not dryRun.
function recordInstallState(cwd, { type, env, plan, selection, explicit, dryRun }) {
  const content = handoffContent(type, env);
  const handoff = handoffState(cwd, content);
  const versionText = packageVersion() + '\n';
  const version = writeState(path.join(cwd, VERSION_FILE), versionText);
  const files = { ...manifestOf(pathState(cwd, MANIFEST_KEY)) };
  for (const e of plan) {
    if (['add', 'update', 'overwrite'].includes(e.action) || (e.action === 'skip' && e.same)) {
      files[e.rel.split(path.sep).join('/')] = e.hash;
    }
  }
  // Install leaves the handoff holding exactly these bytes, so the manifest records its ownership.
  files[HANDOFF_KEY] = sha256(Buffer.from(content));
  const manifest = manifestText(files);
  const manifestState = writeState(path.join(cwd, MANIFEST_FILE), manifest);
  const config = explicit ? writeState(path.join(cwd, CONFIG_FILE), configText(selection)) : null;
  const state = { handoff, version, manifest: manifestState, config, backup: null };
  if (dryRun) return state;
  if (config === 'write') writeText(cwd, CONFIG_FILE, configText(selection));
  if (handoff === 'replace') state.backup = backupHandoff(cwd);
  if (handoff !== 'unchanged') writeText(cwd, HANDOFF_FILE, content);
  if (manifestState === 'write') writeText(cwd, MANIFEST_FILE, manifest);
  // The version marker is written last: it only says the patch finished.
  if (version === 'write') writeText(cwd, VERSION_FILE, versionText);
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

function printHandoffSteps(env) {
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
}

function printHandoff(env, state) {
  printHandoffSteps(env);
  if (state.handoff === 'unchanged') info(`${HANDOFF_FILE} already up to date (not rewritten).`);
  if (state.backup) info(`Previous ${HANDOFF_FILE} differed; backed up to ${state.backup}.`);
}

// Patch never backs up or replaces the handoff: it reports what it decided and why.
function printPatchHandoff(env, h) {
  printHandoffSteps(env);
  if (h.decision === 'create') info(`${HANDOFF_KEY} created.`);
  if (h.decision === 'refresh') info(`${HANDOFF_KEY} refreshed to this release (it was toolkit-owned and unchanged).`);
  if (h.decision === 'unchanged') info(`${HANDOFF_KEY} already up to date (not rewritten).`);
  if (h.decision === 'keep') warn(`${HANDOFF_KEY} is customized or of unknown origin: kept as is. Nothing was written or backed up for it.`);
  if (h.decision === 'skipped') info(`${HANDOFF_KEY} was left out by --skip-path (not rewritten).`);
}

// ---- Commands ----

function cmdInstall(cwd, flags) {
  // Packaged skills are verified before any plan is built or file is written (dry run included).
  skillIntegrity.assertIntact(PKG_ROOT);
  // A malformed manifest stops install before any template is written: the write would drop its records.
  manifestOf(pathState(cwd, MANIFEST_KEY));
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
    printPlan(plan, true);
    printDryState(recordInstallState(cwd, { type, env: flags.env, plan, selection, explicit, dryRun: true }));
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
  printHandoff(flags.env, recordInstallState(cwd, { type, env: flags.env, plan, selection, explicit, dryRun: false }));
  return { copied, skipped: counts.skip, conflicts: 0, dryRun: false, planned: counts };
}

// ---- Patch review: one plan for preview and apply ----
//
// `patch --dry-run` prints a Review token: a SHA-256 over everything a real patch depends on. It covers the
// release bytes it would write, the patch logic (bin/cli.js, bin/relevance.js, bin/skill-integrity.js), the
// flags, the project facts, and the typed state of every candidate (skipped and kept paths included) and of
// every protected path. `patch --expect <token>` rebuilds the same review and writes only when the token
// matches, and each write rechecks its target against the review immediately before it happens. There is no
// atomic multi-file apply: a concurrent change stops the run, leaves the earlier writes in place, and does not
// advance the version marker, which is written last.

const HANDOFF_TEXT = {
  create: 'create',
  refresh: 'refresh (toolkit-owned and unchanged; this release replaces it)',
  unchanged: 'no change (already this release)',
  keep: 'keep (customized or ownership unknown; not replaced, not backed up)',
  skipped: 'skipped by --skip-path (not written)',
  conflict: 'conflict',
};

const REVIEW_LOGIC_FILES = ['cli.js', 'relevance.js', 'skill-integrity.js'];

function toKey(rel) { return String(rel).split(path.sep).join('/'); }
function sha256Text(text) { return sha256(Buffer.from(text)); }
function matchesSkip(key, s) { return key === s || key.startsWith(s + '/'); }

// Stable JSON: object keys sorted at every level, so the same state always digests to the same token.
function canonicalJson(value) {
  return JSON.stringify(value, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
}

// What the digest records about a typed state: its kind and facts, never a file's bytes or a directory id.
function digestOf(st) {
  const dirs = st.chain.map((d) => d.upto);
  if (st.kind === 'file') return { kind: 'file', sha256: st.sha256, mode: st.mode, nlink: st.nlink, dirs };
  if (st.kind === 'unsafe') return { kind: 'unsafe', reason: st.reason, dirs };
  return { kind: 'missing', dirs };
}

function logicIdentity() {
  return Object.fromEntries(REVIEW_LOGIC_FILES.map((f) => [f, sha256(fs.readFileSync(path.join(__dirname, f)))]));
}

// Every path a patch in this scope could touch, as posix keys: template files after install renames, the
// environment scope and (when given) the saved selection, plus the handoff.
function skipUniverse(type, env, selection) {
  const names = scopeFiles(templateFiles(type), env)
    .filter((rel) => !selection || selectionKeeps(rel, selection))
    .map((rel) => toKey(installName(rel)));
  return [...new Set([...names, HANDOFF_KEY])];
}

// A literal path: no globs, no absolute or climbing forms, no trailing or doubled separators.
function literalPathError(s) {
  if (!s || s.trim() !== s) return 'is empty or has surrounding spaces';
  if (/[\\\0]/.test(s)) return 'must be a literal repo-relative path with / separators';
  if (/[*?[\]{}!]/.test(s)) return 'globs are not supported; give a literal file or directory path';
  if (s.startsWith('/') || /^[A-Za-z]:/.test(s)) return 'must be repo-relative, not absolute';
  if (s.endsWith('/')) return 'must not end with /';
  if (s.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')) {
    return 'must be canonical: no empty, . or .. segments';
  }
  return null;
}

function describeSelection(sel) {
  return `exclude [${sel.exclude.join(', ')}], only [${sel.only.join(', ')}]`;
}

// Returns the validated, de-duplicated, sorted skip list. Whole-segment matching: `factory` skips factory/...
// and nothing else. Typos, globs, metadata, and paths the saved selection already leaves out fail here,
// before any write.
function validateSkipPaths(raw, type, env, selection) {
  const all = skipUniverse(type, env);
  const kept = skipUniverse(type, env, selection);
  const out = new Set();
  for (const s of raw) {
    const problem = literalPathError(s);
    if (problem) throw new Error(`--skip-path "${s}" ${problem}.`);
    if (MANDATORY_KEYS.some((m) => m === s || m.startsWith(s + '/'))) {
      throw new Error(`--skip-path "${s}" would leave out patch metadata (${MANDATORY_KEYS.join(', ')}), which every patch checks. Nothing was written.`);
    }
    if (!all.some((u) => matchesSkip(u, s))) {
      throw new Error(`--skip-path "${s}" matches no template path or the handoff in this scope (typo, or outside --env). Nothing was written.`);
    }
    if (!kept.some((u) => matchesSkip(u, s))) {
      throw new Error(`--skip-path "${s}" matches only files the saved selection already leaves out (${describeSelection(selection)}). There is nothing to skip; remove it.`);
    }
    out.add(s);
  }
  return [...out].sort();
}

// Flag rules for patch and upgrade. Returns true when the review path (skip or token) is in use.
function assertReviewOptions(flags) {
  const skips = flags.skipPath || [];
  const hasExpect = flags.expect !== undefined;
  if (hasExpect && !/^[0-9a-f]{64}$/.test(flags.expect)) {
    throw new Error('--expect takes the Review token printed by patch --dry-run (64 lowercase hex characters).');
  }
  if (hasExpect && flags.dryRun) throw new Error('--expect applies to a real patch; a dry run only prints the Review token. Nothing was written.');
  if (skips.length && (flags.exclude !== undefined || flags.only !== undefined)) {
    throw new Error('--skip-path cannot be combined with --exclude/--only: those rewrite the saved selection. Run them in a separate command.');
  }
  if (skips.length && !flags.dryRun && !hasExpect) {
    throw new Error('--skip-path needs --expect <token>. Run the same command with --dry-run, review the plan, then apply with the Review token it prints.');
  }
  return skips.length > 0 || hasExpect;
}

// Options a command does not take are refused rather than ignored: a silently ignored flag can change what
// gets written. `--force` on patch is the documented legacy flag and has no effect (it never overwrites).
const NOT_FOR_COMMAND = {
  patch: ['version', 'all', 'yes', 'dir', 'interval', 'abandoned'],
  upgrade: ['all', 'yes', 'dir', 'interval', 'abandoned'],
};
function assertCommandFlags(cmd, flags) {
  const positional = (flags._ || []).slice(1);
  if (cmd === 'patch' && positional.length) throw new Error(`Unknown option for patch: ${positional[0]}`);
  if (cmd === 'upgrade') {
    const stray = positional.find((p) => p.startsWith('-'));
    if (stray) throw new Error(`Unknown option for upgrade: ${stray}`);
  }
  for (const f of NOT_FOR_COMMAND[cmd]) {
    if (flags[f] !== undefined && flags[f] !== false) throw new Error(`--${f} is not an option of ${cmd}. Nothing was written.`);
  }
  if (flags.repo && flags.monorepo) throw new Error('Use either --repo or --monorepo, not both. Nothing was written.');
  if (flags.env !== undefined && !ENV_DIRS[flags.env]) {
    throw new Error(`Unknown --env "${flags.env}". Valid: ${Object.keys(ENV_DIRS).join(', ')}. Nothing was written.`);
  }
}

// Who owns the installed handoff. A recorded manifest entry is authoritative: it must match, otherwise the
// handoff is not ours to replace. With no entry, an exact stock 5.3.1 handoff for this layout is ours.
function handoffOwnership({ type, env, manifest, sha }) {
  if (Object.prototype.hasOwnProperty.call(manifest, HANDOFF_KEY)) {
    return manifest[HANDOFF_KEY] === sha ? 'unchanged since the toolkit wrote it' : null;
  }
  const layout = `${type}:${env && ENV_INFO[env] ? env : 'all'}`;
  return STOCK_HANDOFF_5_3_1[layout] === sha ? `stock ${HANDOFF_STOCK_VERSION} handoff, byte-exact` : null;
}

function handoffPlan(type, env, { snap, manifest, skipped }) {
  const content = handoffContent(type, env);
  const release = sha256Text(content);
  const before = snap.get(HANDOFF_KEY);
  let decision;
  let reason = null;
  if (skipped) {
    decision = 'skipped';
    reason = 'excluded by --skip-path';
  } else if (before.kind === 'missing') {
    decision = 'create';
  } else if (before.kind === 'unsafe') {
    decision = 'conflict';
    reason = before.reason;
  } else if (before.sha256 === release) {
    decision = 'unchanged';
  } else {
    const owner = handoffOwnership({ type, env, manifest, sha: before.sha256 });
    decision = owner ? 'refresh' : 'keep';
    reason = owner;
  }
  if (decision === 'refresh' && before.nlink > 1) {
    decision = 'conflict';
    reason = `hard-linked (${before.nlink} names); writing it would change the other names`;
  }
  return {
    content, release, before, decision, reason,
    write: decision === 'create' || decision === 'refresh',
    record: decision === 'create' || decision === 'refresh' || decision === 'unchanged',
  };
}

// A metadata write, or null when the file already holds exactly these bytes (it is not rewritten). Unsafe
// targets are reported with the protected conflicts; a hard-linked target that would change is a conflict.
function metaWrite(st, key, kind, buf, conflicts) {
  if (st.kind === 'unsafe') return null;
  if (st.kind === 'file' && st.buf.equals(buf)) return null;
  if (st.kind === 'file' && st.nlink > 1) {
    conflicts.push({ rel: key, reason: `hard-linked (${st.nlink} names); writing it would change the other names` });
    return null;
  }
  return { path: key, kind, content: buf, sha256: sha256(buf), mode: null, reviewed: st };
}

// The complete patch decision for one project. Reads each path once, through one snapshot, and writes nothing.
function buildPatchReview(cwd, flags, type) {
  const env = flags.env;
  const snap = makeSnapshot(cwd);
  // Protected metadata and the handoff are read first, so every later decision uses these same states.
  const { selection, explicit } = resolveSelection(cwd, flags, snap.get(CONFIG_KEY));
  const skipPaths = validateSkipPaths(flags.skipPath || [], type, env, selection);
  const manifest = manifestOf(snap.get(MANIFEST_KEY));
  const skipped = (key) => skipPaths.some((s) => matchesSkip(key, s));
  // The retirement list is parsed from the snapshot taken above. An unsafe file is refused before it is read, and
  // the list that classifies the paths is the list whose bytes were reviewed.
  const retiredState = snap.get(RETIRED_KEY);
  if (retiredState.kind === 'unsafe') {
    throw new Error(`${relevance.RETIRED_FILE} is not a regular file (${retiredState.reason}). Fix or remove it; nothing was written.`);
  }
  const retired = relevance.parseRetired(retiredState.kind === 'missing' ? null : retiredState.buf.toString('utf8'));
  const facts = relevance.detectProject(cwd, retired);
  const plan = planFiles(type, cwd, { mode: 'patch', env, selection, retired, facts, manifest, snap });
  const conflicts = [];

  const entries = plan.map((e) => {
    const rel = toKey(e.rel);
    let action = e.action;
    let reason = e.reason || null;
    if (action !== 'retired' && skipped(rel)) {
      action = 'skipped';
      reason = 'excluded by --skip-path';
    }
    return { rel, action, reason, same: Boolean(e.same), present: e.present, release: e.hash, mode: e.mode, buf: e.buf, snap: e.snap };
  }).sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  for (const e of entries) if (e.action === 'conflict') conflicts.push({ rel: e.rel, reason: e.reason });

  const handoff = handoffPlan(type, env, { snap, manifest, skipped: skipped(HANDOFF_KEY) });
  if (handoff.decision === 'conflict') conflicts.push({ rel: HANDOFF_KEY, reason: handoff.reason });
  const protectedKeys = [VERSION_KEY, MANIFEST_KEY, CONFIG_KEY, RETIRED_KEY];
  for (const k of protectedKeys) {
    const st = snap.get(k);
    if (st.kind === 'unsafe') conflicts.push({ rel: k, reason: st.reason });
  }

  // Ordered writes: templates, the handoff, then metadata with the version marker last.
  const writes = [];
  for (const e of entries) {
    if (e.action === 'add' || e.action === 'update') {
      writes.push({
        path: e.rel, kind: 'template', content: e.buf, sha256: e.release,
        mode: e.action === 'add' ? e.mode : null, reviewed: e.snap,
      });
    }
  }
  if (handoff.write) {
    writes.push({ path: HANDOFF_KEY, kind: 'handoff', content: Buffer.from(handoff.content), sha256: handoff.release, mode: null, reviewed: handoff.before });
  }
  if (explicit) {
    const w = metaWrite(snap.get(CONFIG_KEY), CONFIG_KEY, 'config', Buffer.from(configText(selection)), conflicts);
    if (w) writes.push(w);
  }
  // Only files that now hold release bytes are recorded. Skipped, kept and conflicting entries keep their record.
  const files = { ...manifest };
  for (const e of entries) {
    if (e.action === 'add' || e.action === 'update' || (e.action === 'skip' && e.same)) files[e.rel] = e.release;
  }
  if (handoff.record) files[HANDOFF_KEY] = handoff.release;
  const manifestWrite = metaWrite(snap.get(MANIFEST_KEY), MANIFEST_KEY, 'manifest', Buffer.from(manifestText(files)), conflicts);
  if (manifestWrite) writes.push(manifestWrite);
  const versionWrite = metaWrite(snap.get(VERSION_KEY), VERSION_KEY, 'version', Buffer.from(packageVersion() + '\n'), conflicts);
  if (versionWrite) writes.push(versionWrite);

  // The protected inputs were read before the relevance and manifest reads above; any change in between stops here.
  for (const k of [...protectedKeys, HANDOFF_KEY]) {
    if (!sameState(snap.get(k), pathState(cwd, k))) {
      throw new Error(`${k} changed while the patch was being reviewed. Nothing was written; run patch --dry-run again.`);
    }
  }

  const digestInput = {
    schema: PATCH_REVIEW_SCHEMA,
    toolkit: packageVersion(),
    logic: logicIdentity(),
    checkout: fs.realpathSync(cwd),
    type,
    env: env || null,
    selection: { explicit, exclude: selection.exclude, only: selection.only },
    skipPaths,
    facts,
    protected: Object.fromEntries([...protectedKeys, HANDOFF_KEY].map((k) => [k, digestOf(snap.get(k))])),
    handoff: { decision: handoff.decision, release: handoff.release, reason: handoff.reason },
    entries: entries.map((e) => ({ rel: e.rel, action: e.action, reason: e.reason, release: e.release, mode: e.mode, before: digestOf(e.snap) })),
    writes: writes.map((w) => ({ path: w.path, kind: w.kind, sha256: w.sha256, mode: w.mode })),
    conflicts,
  };
  // Protected inputs the marker depends on. Each is checked again just before the marker is written: a file we
  // wrote must hold the bytes we wrote, and a file we did not write must still hold its reviewed state.
  const guards = [MANIFEST_KEY, CONFIG_KEY, RETIRED_KEY, HANDOFF_KEY].map((k) => ({ path: k, reviewed: snap.get(k) }));
  return {
    plan: entries, handoff, writes, conflicts, facts, skipPaths, selection, explicit, guards,
    token: sha256Text(canonicalJson(digestInput)),
  };
}

function printReview(review, dryRun) {
  printPlan(review.plan, dryRun);
  const h = review.handoff;
  info(`${HANDOFF_KEY}: ${HANDOFF_TEXT[h.decision]}${h.reason && h.decision !== 'keep' ? ` [${h.reason}]` : ''}`);
  info(`${dryRun ? 'Would write' : 'Writing'} ${review.writes.length} item(s), in this order (metadata last):`);
  if (!review.writes.length) console.log('    (none)');
  review.writes.forEach((w, i) => console.log(`    ${i + 1}. ${w.path} [${w.kind}] sha256 ${w.sha256.slice(0, 12)}`));
}

// Opens one reviewed target and checks that the descriptor is the reviewed file. A missing target is created
// with O_EXCL, so anything that appeared since the review makes the open fail (null). An existing regular file
// is opened without create or truncate; its descriptor must match the reviewed identity and hold the reviewed
// bytes. In both cases the path must still name the same file as the descriptor. Returns null on any mismatch.
const NO_FOLLOW = fs.constants.O_NOFOLLOW || 0;

// `opening.created` is set as soon as an exclusive create succeeds, so the caller knows the file now exists even
// if a later check fails.
function openReviewedTarget(to, reviewed, opening) {
  const created = reviewed.kind === 'missing';
  if (!created && reviewed.kind !== 'file') return null;
  let fd;
  try {
    fd = created
      ? fs.openSync(to, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | NO_FOLLOW, 0o666)
      : fs.openSync(to, fs.constants.O_RDWR | NO_FOLLOW);
  } catch (ex) {
    if (['EEXIST', 'ENOENT', 'ELOOP'].includes(ex.code)) return null;
    throw ex;
  }
  if (created) opening.created = true;
  let keep = false;
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) return null;
    if (!created && (identityOf(st) !== reviewed.identity || sha256(fs.readFileSync(fd)) !== reviewed.sha256)) return null;
    let onPath;
    try {
      onPath = fs.lstatSync(to);
    } catch (ex) {
      if (ex.code === 'ENOENT') return null;
      throw ex;
    }
    if (!onPath.isFile() || onPath.dev !== st.dev || onPath.ino !== st.ino) return null;
    keep = true;
    return fd;
  } finally {
    if (!keep) fs.closeSync(fd);
  }
}

// Writes the whole buffer at offset 0 through the descriptor. A short write continues from where it stopped.
function writeAllSync(fd, buf) {
  let off = 0;
  while (off < buf.length) {
    const n = fs.writeSync(fd, buf, off, buf.length - off, off);
    if (!(n > 0)) throw new Error('no bytes were written');
    off += n;
  }
}

// Writes the reviewed bytes in order. Each target is rechecked against its reviewed state first, then opened once
// and written through that descriptor (see openReviewedTarget). The mode is set on the descriptor. A change stops
// the run with the earlier writes in place and the version marker still at its prior value. A failure after a
// target was opened can leave that file partly written; it is reported, not removed by path.
// Failure reporting. Before the version marker is touched, a failure means it was not advanced. From the first
// change to the marker onward (an exclusive create, or the first write/truncate/mode/close on it), the marker's
// state is unknown, so the message says so and does not claim it was not advanced. No rollback is attempted.
function applyPatchReview(cwd, review) {
  let done = 0;
  const total = review.writes.length;
  const stop = (why) => new Error(`${why} Stopped after ${done} of ${total} write(s); the version marker was not advanced. Run patch --dry-run again.`);
  const unconfirmed = (why) => new Error(`${why} Stopped after ${done} of ${total} write(s). The version marker state is unconfirmed: it was being changed, so it may or may not have advanced. Inspect ${VERSION_KEY} and run patch --dry-run again.`);
  const written = new Map(review.writes.map((w) => [w.path, w]));
  for (const w of review.writes) {
    if (w.kind === 'version') {
      for (const g of review.guards) {
        const now = pathState(cwd, g.path);
        const wrote = written.get(g.path);
        const same = wrote ? now.kind === 'file' && now.sha256 === wrote.sha256 : sameState(g.reviewed, now);
        if (!same) throw stop(`${g.path} changed during the writes.`);
      }
    }
    const marker = w.kind === 'version';
    if (!sameState(w.reviewed, pathState(cwd, w.path))) throw stop(`${w.path} changed after review.`);
    const to = path.join(cwd, ...w.path.split('/'));
    const opening = { created: false };
    let fd = null;
    try {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fd = openReviewedTarget(to, w.reviewed, opening);
    } catch (ex) {
      const why = `Failed writing ${w.path} (${ex.message}).`;
      throw marker && opening.created ? unconfirmed(why) : stop(why);
    }
    if (fd === null) {
      const why = `${w.path} changed after review.`;
      throw marker && opening.created ? unconfirmed(why) : stop(why);
    }
    // From here on, a change to the marker has started when it is the marker. Every later failure is unconfirmed.
    let failure = null;
    try {
      writeAllSync(fd, w.content);
      fs.ftruncateSync(fd, w.content.length);
      if (w.mode !== null) fs.fchmodSync(fd, w.mode);
    } catch (ex) {
      failure = { what: 'Failed writing', ex };
    }
    try {
      fs.closeSync(fd);
    } catch (ex) {
      if (failure) failure.closeEx = ex;
      else failure = { what: 'Failed closing', ex };
    }
    if (failure) {
      const why = `${failure.what} ${w.path} (${failure.ex.message}).${failure.closeEx ? ` Closing it also failed (${failure.closeEx.message}).` : ''}`;
      throw marker ? unconfirmed(why) : stop(`${why} ${w.path} may be partly written and was not removed.`);
    }
    done++;
  }
}

function printConflicts(conflicts) {
  err(`${conflicts.length} path(s) conflict (blocked by another type, a symbolic link, a non-regular file, or a hard link):`);
  conflicts.forEach((c) => console.log(`     - ${c.rel} (${c.reason})`));
}

// Classifies every template file, shows one plan, and writes it only when the plan is not blocked. Existing
// files that differ are reported, never overwritten (not even with --force). A customised handoff is kept.
// With --skip-path the approved review token is required, and the write set is exactly the plan it covers.
function cmdPatch(cwd, flags) {
  // Packaged skills are verified before any plan is built or file is written (dry run included).
  skillIntegrity.assertIntact(PKG_ROOT);
  assertCommandFlags('patch', flags);
  assertReviewOptions(flags);
  if (flags.force) warn('--force has no effect on patch: patch never overwrites a file. Use install --force or upgrade --force to overwrite on purpose.');
  const type = detectType(cwd, flags);
  const review = buildPatchReview(cwd, flags, type);
  const counts = countActions(review.plan);
  const stale = findStale(cwd, type);
  // Blocked and unsafe paths are not audited: their content is not trusted, so they are reported as conflicts only.
  const audited = review.plan.filter((e) => e.snap.kind === 'file' && e.action !== 'skipped' && e.action !== 'conflict');
  const wrappers = relevance.auditWrappers(cwd, audited);
  const blocked = review.conflicts.length > 0;

  if (flags.dryRun) {
    printFacts(review.facts);
    printReview(review, true);
    printWrappers(wrappers);
    printStale(stale);
    if (blocked) {
      printConflicts(review.conflicts);
      process.exitCode = 1;
      warn('No Review token: resolve the conflicts above, or leave those paths out with --skip-path, then dry-run again.');
    } else {
      info(`Review token: ${review.token}`);
      info(review.skipPaths.length
        ? 'Apply with the same command plus --expect <token>. Skipped paths are not written.'
        : 'Apply with the same command. Add --expect <token> to bind the apply to this exact plan.');
    }
    return { copied: 0, skipped: counts.skip, skippedByPath: counts.skipped, conflicts: review.conflicts.length, stale, wrappers, facts: review.facts, dryRun: true, planned: counts, token: blocked ? null : review.token };
  }
  if (blocked) {
    printFacts(review.facts);
    printPlan(review.plan, false);
    printConflicts(review.conflicts);
    err('Nothing was written. Resolve the conflicts, or leave those paths out with --skip-path, then dry-run again.');
    process.exitCode = 1;
    return { copied: 0, skipped: counts.skip, skippedByPath: counts.skipped, conflicts: review.conflicts.length, stale, wrappers, facts: review.facts, dryRun: false, planned: counts, token: review.token };
  }
  if (flags.expect !== undefined && flags.expect !== review.token) {
    throw new Error('Review token does not match the current files, flags or release. Nothing was written. Run patch --dry-run again and review the new token.');
  }
  printFacts(review.facts);
  printReview(review, false);
  applyPatchReview(cwd, review);
  const copied = review.writes.filter((w) => w.kind === 'template').length;
  ok(`Patched: ${copied} file(s) written, ${counts.skip} already current, ${counts.review} kept for review, ${counts.skipped} left out by --skip-path.`);
  printWrappers(wrappers);
  printStale(stale);
  printPatchHandoff(flags.env, review.handoff);
  return { copied, skipped: counts.skip, skippedByPath: counts.skipped, conflicts: 0, stale, wrappers, facts: review.facts, dryRun: false, planned: counts, token: review.token };
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

// Read-only. Missing means a file that applies to the project and is absent. Retired paths, files that do
// not apply, and files whose relevance is still undecided are reported in their own sections.
function cmdDoctor(cwd, flags) {
  const type = detectType(cwd, flags);
  const { selection, explicit } = resolveSelection(cwd, flags);
  const retired = relevance.readRetired(cwd);
  const facts = relevance.detectProject(cwd, retired);
  const plan = planFiles(type, cwd, { mode: 'patch', env: flags.env, selection, retired, facts });
  const retiredFiles = [];
  const notRelevant = [];
  const undecided = [];
  const missingFiles = [];
  const files = [];
  let present = 0;
  for (const e of plan) {
    if (e.action === 'retired') {
      retiredFiles.push({ rel: e.rel, reason: e.reason, present: fs.existsSync(path.join(cwd, e.rel)) });
      continue;
    }
    files.push(e.rel);
    if (fs.existsSync(path.join(cwd, e.rel))) {
      present++;
      if (e.action === 'irrelevant') notRelevant.push(e.rel);
    } else if (e.action === 'irrelevant') {
      continue;
    } else if (e.action === 'review') {
      undecided.push({ rel: e.rel, reason: e.reason });
    } else {
      missingFiles.push(e.rel);
    }
  }
  const placeholders = scanPlaceholders(cwd, files);
  const version = toolkitVersionStatus(cwd);
  const stale = findStale(cwd, type);
  const customized = customizedOwned(cwd);
  const wrappers = relevance.auditWrappers(cwd, plan);
  const result = { type, present, missingFiles, undecided, retired: retiredFiles, notRelevant, wrappers, facts,
    placeholders, version, stale, customized, selection, selectionSource: explicit ? 'flags' : CONFIG_FILE };

  console.log('');
  printFacts(facts);
  if (missingFiles.length === 0 && undecided.length === 0) ok(`All ${present} template files present.`);
  if (missingFiles.length) {
    warn(`${missingFiles.length} missing file(s):`);
    missingFiles.forEach((f) => console.log('     - ' + f));
  }
  if (undecided.length) {
    warn(`${undecided.length} file(s) not installed because relevance is undecided (run patch --dry-run for the reason):`);
    undecided.forEach((u) => console.log(`     - ${u.rel} (${u.reason})`));
  }
  if (retiredFiles.length) {
    info(`${retiredFiles.length} retired path(s), never re-added (${relevance.RETIRED_FILE}):`);
    retiredFiles.forEach((r) => console.log(`     - ${r.rel} (${r.reason})${r.present ? ' [still on disk, kept]' : ''}`));
  }
  if (notRelevant.length) {
    info(`${notRelevant.length} present file(s) do not apply to this project. Consider retiring them in ${relevance.RETIRED_FILE} (kept as is):`);
    notRelevant.forEach((f) => console.log('     - ' + f));
  }
  if (wrappers.length) {
    warn(`${wrappers.length} harness wrapper(s) inline policy or diverge from their snippet (nothing changed):`);
    wrappers.forEach((w) => console.log(`     - ${w.rel} (${w.status}: ${w.reason})`));
  }
  if (selection.exclude.length || selection.only.length) {
    info(`Selection (${result.selectionSource}): exclude [${selection.exclude.join(', ')}], only [${selection.only.join(', ')}].`);
  }
  if (version.status === 'match') ok(`${VERSION_FILE} ${version.installed} matches toolkit ${version.package}.`);
  else if (version.status === 'missing') warn(`${VERSION_FILE} is missing (toolkit ${version.package}). Doctor does not write it; the guided patch flow records it after preview and approval.`);
  else warn(`${VERSION_FILE} is ${version.installed}, toolkit is ${version.package}. Doctor does not write it; the guided patch flow records it after preview and approval.`);
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
  // The layout is part of the write set: a monorepo or repo upgrade must not be re-detected by the pinned run.
  if (flags && flags.monorepo) args.push('--monorepo');
  else if (flags && flags.repo) args.push('--repo');
  if (flags && flags.env) args.push('--env', flags.env);
  if (flags && flags.exclude !== undefined) args.push('--exclude', flags.exclude.join(','));
  if (flags && flags.only !== undefined) args.push('--only', flags.only.join(','));
  if (flags && flags.dryRun) args.push('--dry-run');
  for (const p of (flags && flags.skipPath) || []) args.push('--skip-path', p);
  if (flags && flags.expect !== undefined) args.push('--expect', flags.expect);
  return args;
}

function cmdUpgrade(cwd, flags, deps = {}) {
  // Every refusal here happens before the npm lookup and before anything runs.
  assertCommandFlags('upgrade', flags);
  const requested = parseUpgradeTarget(flags);
  const reviewActive = assertReviewOptions(flags);
  // The review is bound to one release. A latest lookup could change between the dry run and the apply.
  if (reviewActive && requested === undefined) {
    throw new Error(`--skip-path and --expect need an exact pin, e.g. upgrade ${SKIP_PATH_MIN}. A latest lookup could change the release between the dry run and the apply.`);
  }
  if (reviewActive && flags.force) {
    throw new Error('--skip-path and --expect are patch options and cannot be combined with --force (install).');
  }
  // Reads the effective selection first: a corrupt saved config or a combined --exclude/--only stops here.
  const { selection, explicit } = resolveSelection(cwd, flags);
  // A malformed retirement list stops here too, before the npm lookup and before any write.
  const retired = relevance.readRetired(cwd);
  const target = resolveUpgradeVersion(requested, deps.npmView || npmQuery);
  info(`Resolved ${PKG_NAME}@${target} (installed toolkit: ${currentVersion()}).`);
  if (reviewActive && compareVersions(target, SKIP_PATH_MIN) < 0) {
    throw new Error(`${PKG_NAME}@${target} predates --skip-path/--expect and would ignore them, so it could write files you meant to leave out. `
      + `Pin ${SKIP_PATH_MIN} or later.`);
  }
  const retirementActive = retired.entries.length > 0 || retired.trackers !== undefined;
  if (retirementActive && compareVersions(target, RELEVANCE_MIN) < 0) {
    throw new Error(`${PKG_NAME}@${target} predates retirement support and would re-add the paths and tracker `
      + `choices recorded in ${relevance.RETIRED_FILE}. Pin ${RELEVANCE_MIN} or later.`);
  }
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
  else info('Applying the patch plan: adds files that apply and updates files you never changed; edited files are kept. Pass --force to overwrite them.');
  info(`Running pinned ${PKG_NAME}@${target}${flags.dryRun ? ' (dry run, nothing written)' : ''}...`);
  const run = deps.spawn || spawnSync;
  const r = run('npx', upgradeArgs(flags, target), { cwd, stdio: 'inherit', timeout: 120000 });
  if (r.error) {
    err('Upgrade failed: ' + r.error.message);
    process.exitCode = 1;
    return { version: target, status: null };
  }
  if (r.status === 0) {
    ok(flags.dryRun ? 'Dry run complete; nothing was written.' : 'Upgrade scaffold applied. Setup is not finished: hand off to your AI agent with .nitm/BOOTSTRAP.md, then re-run doctor.');
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
    else if (a === '--skip-path' || a === '--expect') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} requires a value`);
      addReviewFlag(flags, a, v);
    } else if (a.startsWith('--skip-path=') || a.startsWith('--expect=')) {
      const eq = a.indexOf('=');
      const v = a.slice(eq + 1);
      if (!v) throw new Error(`${a.slice(0, eq)}= requires a value`);
      addReviewFlag(flags, a.slice(0, eq), v);
    }
    else flags._.push(a);
  }
  return flags;
}

// --skip-path repeats (one literal path per flag); --expect is given once.
function addReviewFlag(flags, name, v) {
  if (name === '--skip-path') {
    flags.skipPath = [...(flags.skipPath || []), v];
    return;
  }
  if (flags.expect !== undefined) throw new Error('--expect may be given only once');
  flags.expect = v;
}

function usage() {
  console.log(`nitm-ai-dev-toolkit — scaffold AI agent config into any repo, then hand off to your AI agent.

Usage:
  npx nitm-ai-dev-toolkit install [--monorepo|--repo] [--env <claude|codex|copilot|cursor|opencode>] [--force] [--dry-run] [--exclude <groups>|--only <groups>]
      Scaffold AI config into the current repo (auto-detects repo vs monorepo),
      tailored to your harness, then hand off to your AI agent to run the bootstrap flow.
      If files already exist, install aborts (use --force to overwrite, or \`patch\` to add missing).
      --dry-run lists adds, overwrites, skips and conflicts; writes nothing; exits 1 if there are conflicts.

  npx nitm-ai-dev-toolkit patch [--monorepo|--repo] [--env <env>] [--exclude <groups>|--only <groups>] [--dry-run] [--skip-path <path>]... [--expect <token>]
      Classify every template file against the project, print the plan, then write it: add
      files that apply, update files you never changed. Files that differ from the template are
      kept and listed for review; files that do not apply (other trackers, Playwright, Prisma,
      empty MCP configs) and retired paths (.nitm/retired.json) are never added. Harness wrappers
      that inline policy are reported, not changed. Then re-emit the bootstrap handoff.
      A given --exclude/--only is saved to .nitm/toolkit.json and used by later patch/doctor runs.
      A customised .nitm/BOOTSTRAP.md is kept, never backed up or replaced by patch.
      --skip-path <path> (repeatable): leave out one literal file or directory for this run only, without
      changing the saved selection. A real patch with skips needs --expect <token>: run the same command with
      --dry-run first, review the plan, then apply with the Review token it prints.

  npx nitm-ai-dev-toolkit upgrade [version] [--env <env>] [--force] [--dry-run] [--exclude <groups>|--only <groups>]
      Upgrade to a pinned version: the given one (\`upgrade 5.0.1\`, \`upgrade nitm-ai-dev-toolkit@5.0.1\`,
      or \`--version 5.0.1\`) or the latest published release, resolved and printed before anything runs.
      Like \`patch\`, adds missing files and keeps your existing ones, then re-emits the bootstrap handoff.
      --force also overwrites existing files with the latest templates (back up customisations first).
      --dry-run runs the pinned version's dry run (needs ${DRY_RUN_UPGRADE_MIN} or newer).

  npx nitm-ai-dev-toolkit doctor [--monorepo|--repo] [--env <env>]
      Inspect the current install (read-only): missing files, retired paths (.nitm/retired.json,
       never counted as missing), files that do not apply to the project, files whose relevance is
       undecided, harness wrappers that inline policy, unresolved {{PLACEHOLDER}} values,
       .toolkit-version against the toolkit version, and stale toolkit files (reported, never deleted).

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
  --skip-path <path>
               patch/upgrade: leave out one literal repo-relative file or directory (whole segments, e.g.
               factory or AGENTS.md; no globs). Repeatable. Not written and not saved. Needs --expect for a real run.
  --expect <token>
               patch/upgrade: apply only the plan that this Review token (from --dry-run) covers.
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
    // Only patch and upgrade take the review flags. Elsewhere they would be silently ignored, so refuse them.
    if ((flags.skipPath || flags.expect !== undefined) && cmd !== 'patch' && cmd !== 'upgrade') {
      throw new Error(`--skip-path and --expect are only for patch and upgrade, not ${cmd || 'this command'}`);
    }
    switch (cmd) {
      case 'install': return cmdInstall(cwd, flags);
      case 'patch': return cmdPatch(cwd, flags);
      case 'upgrade': return cmdUpgrade(cwd, flags);
      case 'doctor': return cmdDoctor(cwd, flags);
      case 'omo-slim-starter': return cmdOmoStarter(cwd, flags);
      case 'factory': return cmdFactory(cwd, flags);
      default:
        // No command prints help and exits 0. An unknown command is an error: help, then exit 1.
        if (cmd) {
          err(`Unknown command: ${cmd}`);
          usage();
          process.exitCode = 1;
        } else {
          usage();
        }
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
  RELEVANCE_MIN,
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
  RETIRED_FILE: relevance.RETIRED_FILE,
  readRetired: relevance.readRetired,
  detectProject: relevance.detectProject,
  relevanceOf: relevance.relevanceOf,
  auditWrappers: relevance.auditWrappers,
  countActions,
  validateSkipPaths,
  assertReviewOptions,
  STOCK_HANDOFF_5_3_1,
};
