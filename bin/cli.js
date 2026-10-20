#!/usr/bin/env node
'use strict';

// nitm-ai-dev-toolkit CLI
// Scaffolds AI agent config into a target repo, then hands off to an AI agent
// to run the bootstrap flow (replace {{PLACEHOLDER}}s, calibrate agent tools).
// Use --env to tailor the scaffold + handoff to the user's harness.

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const factory = require('./factory-watch.js');
const factoryArchive = require('./factory-archive.js');
const factoryPrune = require('./factory-prune.js');

const PKG_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

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

function copyMissing(type, cwd, force, env) {
  const src = path.join(SRC_DIR, type);
  const files = scopeFiles(templateFiles(type), env);
  let copied = 0;
  let skipped = 0;
  for (const rel of files) {
    const from = path.join(src, rel);
    const dest = installName(rel);
    const to = path.join(cwd, dest);
    if (fs.existsSync(to) && !force) {
      skipped++;
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(to), { recursive: true });
    } catch (e) {
      if (e.code !== 'EEXIST') throw new Error(`Failed to create directory for ${rel}: ${e.message}`);
    }
    try {
      fs.copyFileSync(from, to);
    } catch (e) {
      throw new Error(`Failed to copy ${rel}: ${e.message}`);
    }
    copied++;
  }
  return { copied, skipped, total: files.length };
}

// Files the scaffold would write that already exist in the target repo.
function conflicts(type, cwd, env) {
  const files = scopeFiles(templateFiles(type), env);
  const out = [];
  for (const rel of files) {
    const dest = installName(rel);
    if (fs.existsSync(path.join(cwd, dest))) out.push(dest);
  }
  return out;
}

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

function handoff(type, cwd, env) {
  const bootSrc = path.join(SRC_DIR, type, '.claude', 'prompt-snippets', 'bootstrap.md');
  const nitmDir = path.join(cwd, '.nitm');
  fs.mkdirSync(nitmDir, { recursive: true });
  const header = envHeader(type, env);
  let body = '';
  if (fs.existsSync(bootSrc)) body = fs.readFileSync(bootSrc, 'utf8');
  fs.writeFileSync(path.join(nitmDir, 'BOOTSTRAP.md'), header + '\n\n' + body);
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

function cmdInstall(cwd, flags) {
  const type = detectType(cwd, flags);
  if (flags.env && !ENV_DIRS[flags.env]) warn(`Unknown --env "${flags.env}"; scaffolding all environments.`);
  info(`Detected project type: ${type}` + (flags.env ? `, environment: ${flags.env}` : ''));
  const cf = conflicts(type, cwd, flags.env);
  if (cf.length && !flags.force) {
    err(`Install aborted: ${cf.length} file(s) already exist in this project.`);
    cf.slice(0, 20).forEach((f) => console.log('     - ' + f));
    if (cf.length > 20) console.log(`     ...and ${cf.length - 20} more.`);
    console.log('');
    info('To overwrite them, re-run with --force.');
    info('To keep your changes and only add missing files, run: npx nitm-ai-dev-toolkit patch');
    throw new Error('install: conflicting files exist (use --force to overwrite)');
  }
  const { copied, skipped } = copyMissing(type, cwd, flags.force, flags.env);
  ok(`Copied ${copied} file(s), skipped ${skipped} existing.`);
  handoff(type, cwd, flags.env);
  return { copied, skipped, conflicts: cf.length };
}

function cmdPatch(cwd, flags) {
  const type = detectType(cwd, flags);
  // patch never overwrites existing files, even with --force (data-loss guard)
  const { copied, skipped } = copyMissing(type, cwd, false, flags.env);
  ok(`Ensured files present: ${copied} added, ${skipped} already there.`);
  handoff(type, cwd, flags.env);
  return { copied, skipped };
}

// Placeholders the agent fills per task or feature at runtime, so they are not bootstrap leftovers.
const RUNTIME_PLACEHOLDERS = new Set(['ISSUE_ID', 'ISSUE_KEY', 'FEATURE_NAME', 'NAME']);
// `templates/` ships blank forms whose placeholders are meant to stay until a feature is written.
const PLACEHOLDER_EXEMPT_DIR = 'templates';

function hasUnresolvedPlaceholder(content) {
  const names = content.match(/\{\{[A-Z][A-Z0-9_]*\}\}/g) || [];
  return names.some((name) => !RUNTIME_PLACEHOLDERS.has(name.slice(2, -2)));
}

function scanPlaceholders(cwd, relFiles) {
  const found = [];
  for (const rel of relFiles) {
    if (path.normalize(rel).split(path.sep)[0] === PLACEHOLDER_EXEMPT_DIR) continue;
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
  const files = scopeFiles(templateFiles(type), flags.env).map(installName);
  const missingFiles = [];
  let present = 0;
  for (const rel of files) {
    if (fs.existsSync(path.join(cwd, rel))) present++;
    else missingFiles.push(rel);
  }
  const placeholders = scanPlaceholders(cwd, files);
  const result = { type, present, missingFiles, placeholders };

  console.log('');
  if (missingFiles.length === 0) ok(`All ${present} template files present.`);
  else {
    warn(`${missingFiles.length} missing file(s):`);
    missingFiles.forEach((f) => console.log('     - ' + f));
  }
  if (placeholders.length === 0) ok('No unresolved {{PLACEHOLDER}} values found.');
  else {
    warn(`${placeholders.length} file(s) still contain {{PLACEHOLDER}} values (AI handoff replaces these):`);
    placeholders.slice(0, 20).forEach((f) => console.log('     - ' + f));
    if (placeholders.length > 20) console.log(`     ...and ${placeholders.length - 20} more.`);
  }
  console.log('');
  info('Run your AI agent on .nitm/BOOTSTRAP.md to finish configuration, then re-run doctor.');
  return result;
}

// Upgrade runs the latest package in patch mode: missing files are added and existing
// (possibly customised) files are kept. Only an explicit --force reaches `install --force`.
function upgradeArgs(flags) {
  const force = Boolean(flags && flags.force);
  const args = ['--yes', 'nitm-ai-dev-toolkit@latest', force ? 'install' : 'patch'];
  if (force) args.push('--force');
  if (flags && flags.env) args.push('--env', flags.env);
  return args;
}

function cmdUpgrade(cwd, flags) {
  let latest;
  try {
    latest = execSync('npm view nitm-ai-dev-toolkit version', { encoding: 'utf8', timeout: 60000, stdio: 'pipe' }).trim();
  } catch (_) {
    err('Could not reach npm to check for updates (are you online?).');
    return;
  }
  let cur;
  try {
    cur = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')).version;
  } catch (_) {
    cur = 'unknown';
  }
  if (latest === cur) info(`Already on latest version (${cur}); refreshing missing files and the handoff.`);
  else info(`New version available: ${latest} (current ${cur}).`);
  if (flags && flags.force) {
    warn('--force: existing files will be overwritten with the latest templates. Back up your customisations first.');
  } else {
    info('Adding missing files only; your existing files are kept. Pass --force to overwrite them.');
  }
  info('Upgrading via latest package...');
  const r = spawnSync('npx', upgradeArgs(flags), { cwd, stdio: 'inherit', timeout: 120000 });
  if (r.error) { err('Upgrade failed: ' + r.error.message); return; }
  if (r.status === 0) ok('Upgrade complete. Hand off to your AI agent with .nitm/BOOTSTRAP.md to finish setup.');
  else err('Upgrade failed.');
}

function cmdOmoStarter(cwd, flags) {
  const sub = flags._[1];
  if (sub !== 'install') {
    err('Usage: nitm-ai-dev-toolkit omo-slim-starter install');
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
    else if (a === '--dir' || a === '--interval') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} requires a value`);
      flags[a.slice(2)] = v;
    } else if (a.startsWith('--dir=') || a.startsWith('--interval=')) {
      const eq = a.indexOf('=');
      const v = a.slice(eq + 1);
      if (!v) throw new Error(`${a.slice(0, eq)}= requires a value`);
      flags[a.slice(2, eq)] = v;
    }
    else if (a === '--env') {
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
  npx nitm-ai-dev-toolkit install [--monorepo|--repo] [--env <claude|codex|copilot|cursor|opencode>] [--force]
      Scaffold AI config into the current repo (auto-detects repo vs monorepo),
      tailored to your harness, then hand off to your AI agent to run the bootstrap flow.
      If files already exist, install aborts (use --force to overwrite, or \`patch\` to add missing).

  npx nitm-ai-dev-toolkit patch [--monorepo|--repo] [--env <env>]
      Add only missing template files (never overwrites existing ones), then
      re-emit the bootstrap handoff so your AI agent can finish configuration.

  npx nitm-ai-dev-toolkit upgrade [--env <env>] [--force]
      Upgrade to the latest published version. Like \`patch\`, adds missing files and
      keeps your existing ones, then re-emits the bootstrap handoff. --force also
      overwrites existing files with the latest templates (back up customisations first).

  npx nitm-ai-dev-toolkit doctor [--monorepo|--repo] [--env <env>]
      Inspect the current install: missing files, unresolved {{PLACEHOLDER}}
       values.

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
  --monorepo   Force monorepo template
  --repo       Force single-repo template
  --force      Overwrite existing files (install, upgrade). patch never overwrites
  --dir <path> factory: jobs directory (default: ./factory/jobs)
  --interval <ms>
               factory watch: refresh interval (default: 2000, minimum: 100)
  --all        factory status/watch: include closed and archived jobs
               factory archive: include every closed job, not just those older than 7 days
               factory prune: include every merged job, not just those older than 7 days
  --abandoned  factory prune: also delete abandoned jobs (default: merged only)
  --dry-run    factory archive/prune: list only, change nothing
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
  copyMissing,
  scanPlaceholders,
  envHeader,
  conflicts,
  parseFlags,
  cmdInstall,
  cmdPatch,
  cmdDoctor,
  cmdUpgrade,
  upgradeArgs,
  cmdOmoStarter,
  cmdFactory,
  ENV_DIRS,
  SHARED_ROOT,
  SHARED_DIRS,
};
