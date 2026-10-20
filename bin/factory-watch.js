'use strict';

// `factory` subcommand: a read-only view of factory/jobs/<NNN-slug>/job.json.
// `status` prints one table and exits; `watch` is a live terminal UI.
// Stdlib only. Never writes to the jobs directory (agents write it concurrently).

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const NO_JOBS = 'No factory jobs yet — run /factory <feature> in your agent';
const DEFAULT_INTERVAL = 2000;
// Closed jobs are hidden from status/watch unless --all; `factory archive` moves them to archive/.
const CLOSED_STAGES = new Set(['merged', 'abandoned']);
const DAY_MS = 24 * 60 * 60 * 1000;
// `factory archive` and `factory prune` keep closed jobs younger than this unless --all.
const DEFAULT_AGE_DAYS = 7;
const CODES = { red: 31, green: 32, yellow: 33, cyan: 36, dim: 2 };
// Stages waiting on the operator (awaiting-spec, awaiting-plan, awaiting-human) are yellow; needs-human is red.
// Working stages (spec, plan, build, review, approve) keep the default in-progress colour.
// `abandoned` is a closed job (`/factory abandon`), so it is dimmed like a finished one.
const STAGE_COLOR = new Map([
  ['merged', 'green'], ['abandoned', 'dim'], ['needs-human', 'red'], ['awaiting-human', 'yellow'],
  ['awaiting-spec', 'yellow'], ['awaiting-plan', 'yellow'],
]);
const CHIP = new Map([['PASS', ['✓', 'green']], ['CHANGES', ['✗', 'red']]]);
const PENDING_CHIP = ['·', 'dim'];
const STAGE_W = 15;
const RND_W = 3;
const AGE_W = 4;
const GAP = '  ';
const HINT_LIST = '↑/↓ select · Enter open · r refresh · q quit';
const HINT_DETAIL = '↑/↓ choose file · Enter view · r refresh · q/Esc back';
const HINT_PAGER = '↑/↓ PgUp/PgDn space scroll · q/Esc back';

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), Math.max(lo, hi));

function resolveDir(cwd, flags = {}) {
  return path.resolve(cwd, flags.dir || path.join('factory', 'jobs'));
}

// Archive sits beside the jobs directory: factory/jobs -> factory/archive.
function archiveDirOf(jobsDir) {
  return path.join(path.dirname(jobsDir), 'archive');
}

function isClosed(job) {
  return CLOSED_STAGES.has(job.stage);
}

function hiddenLine(n) {
  return `${n} closed job${n === 1 ? '' : 's'} hidden (--all to show)`;
}

function parseInterval(v) {
  if (v === undefined) return DEFAULT_INTERVAL;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 100) throw new Error('--interval must be a whole number of milliseconds, at least 100');
  return n;
}

// Honour NO_COLOR (present and non-empty) and only colour real terminals.
function colorOn(stream, env) {
  return Boolean(stream.isTTY) && (env.NO_COLOR === undefined || env.NO_COLOR === '');
}

function paint(color, text, on) {
  return on && CODES[color] ? `\x1b[${CODES[color]}m${text}\x1b[0m` : text;
}

function truncate(s, w) {
  if (w <= 0) return '';
  if (s.length <= w) return s;
  return w === 1 ? '…' : s.slice(0, w - 1) + '…';
}

function formatAge(updatedAt, now = Date.now()) {
  const ts = typeof updatedAt === 'number' ? updatedAt : Date.parse(updatedAt);
  if (!Number.isFinite(ts)) return '-';
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// Strip control characters so agent-written text cannot break the layout.
function clean(v) { return String(v).replace(/[\x00-\x1f\x7f]/g, ' '); }
function field(v, fallback) { return typeof v === 'string' && v.trim() ? clean(v) : fallback; }

// Tolerant of partial/malformed job.json: missing parts fall back to defaults.
// issue_key (nullable) and feature_dir are optional; absent or null means ''.
function normalizeJob(raw, dirName, dir) {
  const job = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const reviews = job.reviews && typeof job.reviews === 'object' ? job.reviews : {};
  const lensSrc = Array.isArray(job.lenses) ? job.lenses : Object.keys(reviews);
  return {
    dirName,
    dir,
    id: field(job.id, dirName),
    feature: field(job.feature, ''),
    stage: field(job.stage, '?'),
    round: Number.isInteger(job.round) ? String(job.round) : '-',
    lenses: lensSrc.filter((l) => typeof l === 'string').map(clean),
    reviews,
    updatedAt: job.updatedAt,
    issueKey: field(job.issue_key, ''),
    featureDir: field(job.feature_dir, ''),
    // Set only when the job is `needs-human` because its spec or plan agent failed.
    failedStage: job.failed_stage === 'spec' || job.failed_stage === 'plan' ? job.failed_stage : null,
  };
}

// Raw parsed job.json, or null when missing or unparseable.
function readJob(jobDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(jobDir, 'job.json'), 'utf8'));
  } catch (_) {
    return null;
  }
}

function sortById(jobs) {
  return jobs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function loadJobs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return { exists: false, jobs: [] };
  }
  const jobs = sortById(entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const jobDir = path.join(dir, e.name);
      return normalizeJob(readJob(jobDir), e.name, jobDir);
    }));
  return { exists: true, jobs };
}

// Shared by `factory archive` and `factory prune`. Sorts the job folders in `dir`:
//   candidates  closed jobs eligible under the rule (default: updatedAt more than
//               `ageDays` before `now`; all: every closed job, even with no date)
//   skippedOpen open jobs (counted only, never touched)
//   kept        closed jobs newer than `ageDays` (default mode only)
//   skippedInvalid  unreadable job.json, or a closed job with no usable date in default mode
function selectClosedJobs(dir, { all = false, now = Date.now(), ageDays = DEFAULT_AGE_DAYS } = {}) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return { exists: false, candidates: [], skippedOpen: 0, kept: 0, skippedInvalid: [] };
  }
  const out = { exists: true, candidates: [], skippedOpen: 0, kept: 0, skippedInvalid: [] };
  const ids = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  for (const id of ids) {
    const dirPath = path.join(dir, id);
    const raw = readJob(dirPath);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      out.skippedInvalid.push({ id, reason: 'missing or unparseable job.json' });
      continue;
    }
    if (!isClosed(raw)) {
      out.skippedOpen++;
      continue;
    }
    const ts = typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.parse(raw.updatedAt);
    if (!all) {
      if (!Number.isFinite(ts)) {
        out.skippedInvalid.push({ id, reason: 'no valid updatedAt, age unknown' });
        continue;
      }
      if (now - ts <= ageDays * DAY_MS) {
        out.kept++;
        continue;
      }
    }
    out.candidates.push({ id, dir: dirPath, stage: raw.stage });
  }
  return out;
}

// What status and watch list. By default closed jobs are hidden and counted;
// with `all` the archive is included too, each job marked `archived`.
function loadListed(dir, all) {
  const own = loadJobs(dir);
  if (all) {
    const archived = loadJobs(archiveDirOf(dir)).jobs.map((j) => ({ ...j, archived: true }));
    return { exists: own.exists, jobs: sortById(own.jobs.concat(archived)), hidden: 0 };
  }
  return {
    exists: own.exists,
    jobs: own.jobs.filter((j) => !isClosed(j)),
    hidden: own.jobs.filter(isClosed).length,
  };
}

// Markdown files inside one job dir, including round-<N>/ subfolders.
function listMarkdown(jobDir) {
  const out = [];
  const walk = (rel) => {
    let entries;
    try {
      entries = fs.readdirSync(path.join(jobDir, rel), { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const e of entries) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) walk(r);
      else if (e.name.endsWith('.md')) out.push(r);
    }
  };
  walk('');
  return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function chipsOf(job) {
  return job.lenses.map((lens) => {
    const [sym, color] = CHIP.get(String(job.reviews[lens]).toUpperCase()) || PENDING_CHIP;
    return { plain: `${sym} ${lens}`, color };
  });
}

function plainLenses(job) {
  return chipsOf(job).map((c) => c.plain).join(' ');
}

// Column widths shared by every row so the table lines up; feature takes the rest.
function layout(jobs, width) {
  const idW = Math.max(2, ...jobs.map((j) => j.id.length));
  const lensW = Math.max(6, ...jobs.map((j) => plainLenses(j).length));
  const featW = Math.max(0, width - idW - STAGE_W - RND_W - lensW - AGE_W - GAP.length * 5);
  return { idW, lensW, featW };
}

function formatHeader(lay) {
  return [
    'ID'.padEnd(lay.idW),
    'STAGE'.padEnd(STAGE_W),
    'RND'.padEnd(RND_W),
    'LENSES'.padEnd(lay.lensW),
    truncate('FEATURE', lay.featW).padEnd(lay.featW),
    'AGE'.padStart(AGE_W),
  ].join(GAP);
}

function formatRow(job, lay, { color = false, now } = {}) {
  const chips = chipsOf(job);
  const lenses = chips.map((c) => paint(c.color, c.plain, color)).join(' ');
  return [
    job.id.padEnd(lay.idW),
    paint(STAGE_COLOR.get(job.stage) || 'cyan', truncate(job.stage, STAGE_W).padEnd(STAGE_W), color),
    job.round.padEnd(RND_W),
    lenses + ' '.repeat(lay.lensW - plainLenses(job).length),
    truncate(job.archived ? `[archived] ${job.feature}` : job.feature, lay.featW).padEnd(lay.featW),
    formatAge(job.updatedAt, now).padStart(AGE_W),
  ].join(GAP);
}

function cmdFactoryStatus(cwd, flags = {}, opts = {}) {
  const stdout = opts.stdout || process.stdout;
  const on = colorOn(stdout, opts.env || process.env);
  const dir = resolveDir(cwd, flags);
  const { exists, jobs, hidden } = loadListed(dir, Boolean(flags.all));
  const line = (text) => stdout.write(text + '\n');
  if (!exists) {
    line(`${paint('cyan', '•', on)} ${NO_JOBS}`);
  } else if (!jobs.length) {
    const msg = hidden ? `No open jobs in ${dir}.` : `No jobs in ${dir} yet.`;
    line(`${paint('cyan', '•', on)} ${msg}`);
  } else {
    const lay = layout(jobs, stdout.columns || 100);
    line(paint('dim', formatHeader(lay), on));
    for (const job of jobs) line(formatRow(job, lay, { color: on, now: opts.now }));
  }
  if (hidden) line(paint('dim', hiddenLine(hidden), on));
  return { dir, exists, jobs, hidden };
}

// ---- watch (live TUI) -------------------------------------------------------

function openJob(state) {
  return state.jobs.find((j) => j.dir === state.openDir) || null;
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    return `(cannot read ${path.basename(file)}: ${e.code || e.message})`;
  }
}

function listScreen(state, ctx) {
  const { cols, rows, on, now, dir } = ctx;
  const footer = state.hidden ? 1 : 0;
  const lines = [truncate(`factory · ${state.jobs.length} job(s) · ${dir}`, cols), ''];
  if (!state.exists) {
    lines.push(paint('dim', NO_JOBS, on));
  } else if (!state.jobs.length) {
    lines.push(paint('dim', state.hidden ? `No open jobs in ${dir}.` : `No jobs in ${dir} yet.`, on));
  } else {
    const lay = layout(state.jobs, cols - 2);
    const visible = Math.max(1, rows - 5 - footer);
    if (state.selected < state.top) state.top = state.selected;
    if (state.selected >= state.top + visible) state.top = state.selected - visible + 1;
    lines.push('  ' + paint('dim', formatHeader(lay), on));
    state.jobs.slice(state.top, state.top + visible).forEach((job, i) => {
      const mark = state.top + i === state.selected ? '› ' : '  ';
      lines.push(mark + formatRow(job, lay, { color: on, now }));
    });
  }
  lines.push('');
  if (state.hidden) lines.push(paint('dim', hiddenLine(state.hidden), on));
  lines.push(paint('dim', HINT_LIST, on));
  return lines;
}

function detailScreen(state, ctx, job) {
  const { cols, rows, on } = ctx;
  const issue = job.issueKey ? `  ${job.issueKey}` : '';
  const failed = job.failedStage ? `  failed: ${job.failedStage}` : '';
  const lines = [truncate(`${job.id}  ${job.stage}  round ${job.round}${issue}${failed}  ${job.feature}`, cols)];
  if (job.featureDir) lines.push(paint('dim', truncate(job.featureDir, cols), on));
  lines.push('');
  if (!state.files.length) {
    lines.push(paint('dim', '(no markdown files yet)', on));
  } else {
    const visible = Math.max(1, rows - 4 - (job.featureDir ? 1 : 0));
    const start = clamp(state.fileIdx - Math.floor(visible / 2), 0, state.files.length - visible);
    state.files.slice(start, start + visible).forEach((f, i) => {
      const mark = start + i === state.fileIdx ? '› ' : '  ';
      lines.push(truncate(mark + f, cols));
    });
  }
  lines.push('', paint('dim', HINT_DETAIL, on));
  return lines;
}

function pagerScreen(state, ctx, job) {
  const { cols, rows, on } = ctx;
  const body = readText(path.join(job.dir, state.file))
    .replace(/\t/g, '  ')
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '')
    .split('\n');
  const visible = Math.max(1, rows - 3);
  state.scroll = clamp(state.scroll, 0, body.length - visible);
  const end = Math.min(body.length, state.scroll + visible);
  const lines = [truncate(`${state.file}  lines ${state.scroll + 1}-${end} of ${body.length}`, cols), ''];
  body.slice(state.scroll, end).forEach((l) => lines.push(truncate(l, cols)));
  lines.push(paint('dim', HINT_PAGER, on));
  return lines;
}

function screen(state, ctx) {
  const job = openJob(state);
  if (state.view === 'detail' && job) return detailScreen(state, ctx, job);
  if (state.view === 'pager' && job) return pagerScreen(state, ctx, job);
  return listScreen(state, ctx);
}

function cmdFactoryWatch(cwd, flags = {}, opts = {}) {
  const interval = parseInterval(flags.interval);
  const stdin = opts.stdin || process.stdin;
  const stdout = opts.stdout || process.stdout;
  if (!stdout.isTTY || !stdin.isTTY) return cmdFactoryStatus(cwd, flags, opts);

  const dir = resolveDir(cwd, flags);
  const on = colorOn(stdout, opts.env || process.env);
  const all = Boolean(flags.all);
  const state = {
    view: 'list', selected: 0, top: 0, exists: false, jobs: [], hidden: 0,
    openDir: null, files: [], fileIdx: 0, file: null, scroll: 0,
  };

  function refresh() {
    const r = loadListed(dir, all);
    state.exists = r.exists;
    state.jobs = r.jobs;
    state.hidden = r.hidden;
    state.selected = clamp(state.selected, 0, r.jobs.length - 1);
    const job = openJob(state);
    if (state.view !== 'list' && !job) state.view = 'list';
    if (state.view === 'detail') {
      state.files = listMarkdown(job.dir);
      state.fileIdx = clamp(state.fileIdx, 0, state.files.length - 1);
    }
  }

  function render() {
    const ctx = { cols: stdout.columns || 80, rows: stdout.rows || 24, on, now: Date.now(), dir };
    const lines = screen(state, ctx);
    stdout.write('\x1b[H' + lines.slice(0, ctx.rows).map((l) => l + '\x1b[K').join('\n') + '\x1b[J');
  }

  let timer = null;
  let restored = false;
  // Idempotent: every exit path (q, Ctrl-C, SIGTERM, crash, normal end) goes through here.
  function restore() {
    if (restored) return;
    restored = true;
    clearInterval(timer);
    stdin.removeListener('keypress', onKeypress);
    if (stdin.setRawMode) stdin.setRawMode(false);
    stdin.pause();
    stdout.write('\x1b[?25h\x1b[?1049l');
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
    stdout.removeListener('resize', render);
    process.removeListener('uncaughtException', onCrash);
    process.removeListener('exit', restore);
  }
  function onSigint() { restore(); process.exit(130); }
  function onSigterm() { restore(); process.exit(143); }
  function onCrash(e) {
    restore();
    console.error(e && e.stack ? e.stack : String(e));
    process.exit(1);
  }

  function onKey(str, key = {}) {
    const name = key.name;
    if (key.ctrl && name === 'c') {
      process.exitCode = 130;
      return restore();
    }
    const step = name === 'up' || name === 'k' ? -1 : name === 'down' || name === 'j' ? 1 : 0;
    const enter = name === 'return' || name === 'enter';
    const page = Math.max(1, (stdout.rows || 24) - 3);
    if (name === 'r') refresh();
    else if (state.view === 'list') {
      if (name === 'q') return restore();
      if (step) state.selected = clamp(state.selected + step, 0, state.jobs.length - 1);
      const job = state.jobs[state.selected];
      if (enter && job) {
        state.openDir = job.dir;
        state.files = listMarkdown(job.dir);
        state.fileIdx = 0;
        state.view = 'detail';
      }
    } else if (state.view === 'detail') {
      if (name === 'q' || name === 'escape') state.view = 'list';
      else if (step) state.fileIdx = clamp(state.fileIdx + step, 0, state.files.length - 1);
      else if (enter && state.files.length) {
        state.file = state.files[state.fileIdx];
        state.scroll = 0;
        state.view = 'pager';
      }
    } else {
      if (name === 'q' || name === 'escape') state.view = 'detail';
      else if (step) state.scroll = Math.max(0, state.scroll + step);
      else if (name === 'pageup') state.scroll = Math.max(0, state.scroll - page);
      else if (name === 'pagedown' || name === 'space') state.scroll += page;
    }
    render();
  }
  const onKeypress = (str, key) => onKey(str, key);

  stdout.write('\x1b[?1049h\x1b[?25l');
  readline.emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.on('keypress', onKeypress);
  stdin.resume();
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  stdout.on('resize', render);
  process.on('uncaughtException', onCrash);
  process.on('exit', restore);

  refresh();
  render();
  timer = setInterval(() => { refresh(); render(); }, interval);
}

module.exports = {
  DEFAULT_INTERVAL,
  NO_JOBS,
  CLOSED_STAGES,
  DEFAULT_AGE_DAYS,
  resolveDir,
  archiveDirOf,
  isClosed,
  hiddenLine,
  selectClosedJobs,
  parseInterval,
  readJob,
  loadJobs,
  loadListed,
  listMarkdown,
  normalizeJob,
  formatAge,
  truncate,
  layout,
  formatHeader,
  formatRow,
  cmdFactoryStatus,
  cmdFactoryWatch,
};
