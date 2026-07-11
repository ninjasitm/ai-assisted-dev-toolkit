#!/usr/bin/env node
'use strict';

// nitm-ai-dev-toolkit CLI
// Scaffolds AI agent config into a target repo, then hands off to an AI agent
// to run the bootstrap flow (replace {{PLACEHOLDER}}s, calibrate agent tools).
// Use --env to tailor the scaffold + handoff to the user's harness.

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const PKG_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

// Platform config dirs per harness. `.agents` is Claude-only (universal skills).
const ENV_DIRS = {
  claude: ['.claude', '.agents'],
  copilot: ['.github', '.vscode'],
  cursor: ['.cursor'],
  opencode: ['.opencode'],
};
const ENV_INFO = {
  claude: { name: 'Claude Code', command: '/bootstrap (Claude Code command in .claude/commands/)' },
  copilot: { name: 'GitHub Copilot', command: '/bootstrap (Copilot prompt in .github/prompts/bootstrap.prompt.md)' },
  cursor: { name: 'Cursor', command: '/bootstrap (Cursor command in .cursor/commands/)' },
  opencode: { name: 'OpenCode', command: 'the bootstrap command in .opencode/commands/' },
};
// Files/dirs copied for every environment (shared across harnesses).
const SHARED_ROOT = ['AGENTS.md', 'README.md', 'CLAUDE.md', '.mcp.json'];
const SHARED_DIRS = ['docs', 'templates', 'hooks'];

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

// Restrict the file set to the chosen environment (shared + that env's dirs).
function scopeFiles(files, env) {
  if (!env || !ENV_DIRS[env]) return files;
  const allowed = new Set([...SHARED_ROOT, ...SHARED_DIRS, ...ENV_DIRS[env]]);
  return files.filter((rel) => {
    const top = rel.split(path.sep)[0];
    return allowed.has(top) || allowed.has(rel);
  });
}

function copyMissing(type, cwd, force, env) {
  const src = path.join(SRC_DIR, type);
  const files = scopeFiles(templateFiles(type), env);
  let copied = 0;
  let skipped = 0;
  for (const rel of files) {
    const from = path.join(src, rel);
    const to = path.join(cwd, rel);
    if (fs.existsSync(to) && !force) {
      skipped++;
      continue;
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
  }
  return { copied, skipped, total: files.length };
}

// Files the scaffold would write that already exist in the target repo.
function conflicts(type, cwd, env) {
  const files = scopeFiles(templateFiles(type), env);
  const out = [];
  for (const rel of files) {
    if (fs.existsSync(path.join(cwd, rel))) out.push(rel);
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
      'The `/bootstrap` command auto-detects your harness (Claude Code, GitHub Copilot, Cursor, or OpenCode),',
      'so you do not need to specify it — just run `/bootstrap` from whatever environment you are in.',
      '',
      'The full bootstrap procedure follows.',
    ].join('\n');
  }
  const info = ENV_INFO[env];
  return [
    `# Bootstrap handoff — environment: ${info.name}`,
    '',
    `Run the bootstrap via: ${info.command}`,
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
    console.log(`    Run ${ENV_INFO[env].command}`);
  } else {
    info('Scaffold complete. Hand off to your AI agent to finish setup:');
  }
  console.log('    1. Run `/bootstrap` from your AI environment (it auto-detects your harness),');
  console.log('       OR hand `.nitm/BOOTSTRAP.md` to your AI agent to run the full bootstrap flow.');
  console.log('    3. Run `npx nitm-ai-dev-toolkit doctor' + (env ? ` --env ${env}` : '') + '` to verify the install.');
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
  const { copied, skipped } = copyMissing(type, cwd, flags.force, flags.env);
  ok(`Ensured files present: ${copied} added, ${skipped} already there.`);
  handoff(type, cwd, flags.env);
  return { copied, skipped };
}

function scanPlaceholders(cwd, relFiles) {
  const found = [];
  for (const rel of relFiles) {
    const p = path.join(cwd, rel);
    if (!fs.existsSync(p)) continue;
    try {
      const content = fs.readFileSync(p, 'utf8');
      if (/\{\{[A-Z_]+\}\}/.test(content)) found.push(rel);
    } catch (_) { /* ignore */ }
  }
  return found;
}

function cmdDoctor(cwd, flags) {
  const type = detectType(cwd, flags);
  const files = scopeFiles(templateFiles(type), flags.env);
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

function cmdUpgrade(cwd) {
  let latest;
  try {
    latest = execSync('npm view nitm-ai-dev-toolkit version', { encoding: 'utf8' }).trim();
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
  if (latest === cur) {
    ok(`Already on latest version (${cur}).`);
    return;
  }
  info(`New version available: ${latest} (current ${cur}).`);
  info('Upgrading via latest package...');
  const r = spawnSync('npx', ['nitm-ai-dev-toolkit@latest', 'install', '--force'], { cwd, stdio: 'inherit' });
  if (r.status === 0) ok('Upgrade complete.');
  else err('Upgrade failed.');
}

function cmdOmoStarter(cwd, flags) {
  const sub = flags._[1];
  if (sub !== 'install') {
    err('Usage: nitm-ai-dev-toolkit omo-slim-starter install');
    return;
  }
  info('Delegating to the published starter: npx nitm-opencode-starter install');
  const r = spawnSync('npx', ['nitm-opencode-starter', 'install'], { cwd, stdio: 'inherit' });
  if (r.status === 0) {
    ok('Starter installed via nitm-opencode-starter.');
  } else {
    err('Could not run `npx nitm-opencode-starter install` (is it published / are you online?).');
    info('Install it manually: npx nitm-opencode-starter install');
  }
}

function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--monorepo') flags.monorepo = true;
    else if (a === '--repo') flags.repo = true;
    else if (a === '--force' || a === '-f') flags.force = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else if (a === '--env') flags.env = argv[++i];
    else if (a.startsWith('--env=')) flags.env = a.slice(6);
    else flags._.push(a);
  }
  return flags;
}

function usage() {
  console.log(`nitm-ai-dev-toolkit — scaffold AI agent config into any repo, then hand off to your AI agent.

Usage:
  npx nitm-ai-dev-toolkit install [--monorepo|--repo] [--env <claude|copilot|cursor|opencode>] [--force]
      Scaffold AI config into the current repo (auto-detects repo vs monorepo),
      tailored to your harness, then hand off to your AI agent to run the bootstrap flow.
      If files already exist, install aborts (use --force to overwrite, or \`patch\` to add missing).

  npx nitm-ai-dev-toolkit patch [--monorepo|--repo] [--env <env>] [--force]
      Add only missing template files (never overwrites existing ones), then
      re-emit the bootstrap handoff so your AI agent can finish configuration.

  npx nitm-ai-dev-toolkit upgrade
      Upgrade to the latest published version (re-scaffolds via @latest).

  npx nitm-ai-dev-toolkit doctor [--monorepo|--repo] [--env <env>]
      Inspect the current install: missing files, unresolved {{PLACEHOLDER}}
      values, and agent-tool calibration drift.

  npx nitm-ai-dev-toolkit omo-slim-starter install
      Run \`npx nitm-opencode-starter install\` to scaffold the oh-my-opencode-slim
      starter (published to npm). Falls back to printing the command if unavailable.

Options:
  --env <env>  Optional. Limit the scaffold to ONE harness:
               claude | copilot | cursor | opencode
               Omit to scaffold ALL environments (cross-compatible). The /bootstrap
               command auto-detects your harness at runtime, so --env is rarely needed.
  --monorepo   Force monorepo template
  --repo       Force single-repo template
  --force      Overwrite existing files
  -h, --help   Show this help
`);
}

function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help) {
    usage();
    return;
  }
  const cmd = flags._[0];
  const cwd = process.cwd();
  try {
    switch (cmd) {
      case 'install': return cmdInstall(cwd, flags);
      case 'patch': return cmdPatch(cwd, flags);
      case 'upgrade': return cmdUpgrade(cwd);
      case 'doctor': return cmdDoctor(cwd, flags);
      case 'omo-slim-starter': return cmdOmoStarter(cwd, flags);
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
  copyMissing,
  scanPlaceholders,
  envHeader,
  conflicts,
  parseFlags,
  cmdInstall,
  cmdPatch,
  cmdDoctor,
  cmdUpgrade,
  cmdOmoStarter,
  ENV_DIRS,
  SHARED_ROOT,
  SHARED_DIRS,
};
