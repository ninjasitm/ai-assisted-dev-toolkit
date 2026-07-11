#!/usr/bin/env node
'use strict';

// nitm-ai-dev-toolkit CLI
// Scaffolds AI agent config into a target repo, then hands off to an AI agent
// to run the bootstrap flow (replace {{PLACEHOLDER}}s, calibrate agent tools).

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const PKG_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

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

function copyMissing(type, cwd, force) {
  const src = path.join(SRC_DIR, type);
  const files = templateFiles(type);
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

function handoff(type, cwd) {
  const bootSrc = path.join(SRC_DIR, type, '.claude', 'prompt-snippets', 'bootstrap.md');
  const nitmDir = path.join(cwd, '.nitm');
  fs.mkdirSync(nitmDir, { recursive: true });
  if (fs.existsSync(bootSrc)) {
    fs.copyFileSync(bootSrc, path.join(nitmDir, 'BOOTSTRAP.md'));
  }
  info('Scaffold complete. Hand off to your AI agent to finish setup:');
  console.log('    1. Read .nitm/BOOTSTRAP.md (also at .claude/prompt-snippets/bootstrap.md)');
  console.log('    2. Ask your AI agent to run the bootstrap flow: replace {{PLACEHOLDER}}s');
  console.log('       and calibrate each agent\'s tools for this project.');
  console.log('    3. Run `npx nitm-ai-dev-toolkit doctor` to verify the install.');
}

function cmdInstall(cwd, flags) {
  const type = detectType(cwd, flags);
  info(`Detected project type: ${type}`);
  const { copied, skipped } = copyMissing(type, cwd, flags.force);
  ok(`Copied ${copied} file(s), skipped ${skipped} existing.`);
  handoff(type, cwd);
}

function cmdPatch(cwd, flags) {
  const type = detectType(cwd, flags);
  const { copied, skipped } = copyMissing(type, cwd, flags.force);
  ok(`Ensured files present: ${copied} added, ${skipped} already there.`);
  handoff(type, cwd);
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
  info(`Doctor check (type=${type})`);
  const files = templateFiles(type);
  const missingFiles = [];
  let present = 0;
  for (const rel of files) {
    if (fs.existsSync(path.join(cwd, rel))) present++;
    else missingFiles.push(rel);
  }
  const placeholders = scanPlaceholders(cwd, files);

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
  const r = spawnSync('npx', ['nitm-ai-dev-toolkit@latest', 'install'], { cwd, stdio: 'inherit' });
  if (r.status === 0) ok('Upgrade complete.');
  else err('Upgrade failed.');
}

function cmdOmoStarter(cwd, flags) {
  const sub = flags._[1];
  if (sub !== 'install') {
    err('Usage: nitm-ai-dev-toolkit omo-slim-starter install');
    return;
  }
  const url = 'https://github.com/ninjasitm/nitm-opencode-starter.git';
  const target = path.join(cwd, 'nitm-opencode-starter');
  info(`Cloning starter from ${url} ...`);
  const r = spawnSync('git', ['clone', url, target], { stdio: 'inherit' });
  if (r.status !== 0) {
    err('Clone failed.');
    return;
  }
  const pkgPath = path.join(target, 'package.json');
  let pkg = {};
  if (fs.existsSync(pkgPath)) {
    try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch (_) { /* ignore */ }
  }
  pkg.scripts = pkg.scripts || {};
  Object.assign(pkg.scripts, {
    'ai:install': 'nitm-ai-dev-toolkit install',
    'ai:patch': 'nitm-ai-dev-toolkit patch',
    'ai:upgrade': 'nitm-ai-dev-toolkit upgrade',
    'ai:doctor': 'nitm-ai-dev-toolkit doctor',
  });
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  ok('Wired install/patch/upgrade/doctor into starter package.json (npm run ai:install, ...).');
  info('Next: cd nitm-opencode-starter && npm run ai:install');
}

function parseFlags(argv) {
  const flags = { _: [] };
  for (const a of argv) {
    if (a === '--monorepo') flags.monorepo = true;
    else if (a === '--repo') flags.repo = true;
    else if (a === '--force' || a === '-f') flags.force = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else flags._.push(a);
  }
  return flags;
}

function usage() {
  console.log(`nitm-ai-dev-toolkit — scaffold AI agent config into any repo, then hand off to your AI agent.

Usage:
  npx nitm-ai-dev-toolkit install [--monorepo|--repo] [--force]
      Scaffold AI config (Cursor, Copilot, Claude Code, OpenCode) into the
      current repo, then hand off to your AI agent to run the bootstrap flow.

  npx nitm-ai-dev-toolkit patch [--monorepo|--repo] [--force]
      Ensure all template files are present and re-emit the bootstrap handoff.

  npx nitm-ai-dev-toolkit upgrade
      Upgrade to the latest published version (re-scaffolds via @latest).

  npx nitm-ai-dev-toolkit doctor [--monorepo|--repo]
      Inspect the current install: missing files, unresolved {{PLACEHOLDER}}
      values, and agent-tool calibration drift.

  npx nitm-ai-dev-toolkit omo-slim-starter install
      Clone the nitm-opencode-starter and wire install/patch/upgrade/doctor
      commands into it.

Options:
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
}

main();
