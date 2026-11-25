'use strict';

// Tests for the `factory` subcommand (bin/factory-watch.js) and its CLI wiring.
// Run with: npm test  (node --test). No real TTY: fake streams stand in for stdin/stdout.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { spawnSync } = require('child_process');

const factory = require('../bin/factory-watch.js');
const factoryArchive = require('../bin/factory-archive.js');
const prune = require('../bin/factory-prune.js');
const cli = require('../bin/cli.js');

const CLI = path.join(__dirname, '..', 'bin', 'cli.js');
const NOW = Date.parse('2026-10-20T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const NO_JOBS_LINE = '• No factory jobs yet — run /factory <feature> in your agent\n';
const HIDDEN_ONE = '1 closed job hidden (--all to show)';

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nitm-factory-'));
}
function writeJob(root, dirName, job) {
  const d = path.join(root, dirName);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'job.json'), typeof job === 'string' ? job : JSON.stringify(job));
  return d;
}
// Fixture: two good jobs (written out of order), one malformed, one with no job.json yet.
function fixture() {
  const root = path.join(tmp(), 'factory', 'jobs');
  writeJob(root, '002-login', {
    id: '002-login', feature: 'Login with passkeys', branch: 'factory/002', worktree: '/x',
    stage: 'awaiting-human', round: 2, lenses: ['security', 'tests'],
    reviews: { security: 'PASS', tests: 'CHANGES' }, approvalMode: 'human',
    createdAt: '2026-10-20T10:00:00Z', updatedAt: '2026-10-20T11:59:30Z',
  });
  writeJob(root, '001-export', {
    id: '001-export', feature: 'CSV export\u0007 of reports and a very long tail that needs cutting',
    stage: 'merged', round: 1, lenses: ['tests'], reviews: { tests: 'PASS' },
    updatedAt: '2026-10-20T08:00:00Z',
  });
  writeJob(root, '003-broken', '{"id": "003-broken", "stage": ');
  fs.mkdirSync(path.join(root, '004-partial'));
  return root;
}
// The project directory that contains a fixture jobs root.
const cwdOf = (root) => path.dirname(path.dirname(root));
const jobsRootOf = (cwd) => path.join(cwd, 'factory', 'jobs');
const archiveRootOf = (cwd) => path.join(cwd, 'factory', 'archive');
// A job whose updatedAt is `daysAgo` before NOW.
const jobAged = (id, stage, daysAgo) => ({
  id, feature: id, stage, round: 1, lenses: [], reviews: {},
  updatedAt: new Date(NOW - daysAgo * DAY).toISOString(),
});

// Recording stand-in for process.stdout (write + output(), plus EventEmitter for 'resize').
function fakeStdout(props = {}) {
  const chunks = [];
  return Object.assign(new EventEmitter(), {
    isTTY: false,
    columns: 120,
    rows: 24,
    write(chunk) { chunks.push(String(chunk)); return true; },
    output: () => chunks.join(''),
  }, props);
}
const pipe = () => fakeStdout({ isTTY: false });
const tty = (props = {}) => fakeStdout({ isTTY: true, ...props });

// Fake TTY stdin: records setRawMode calls; the watch loop attaches keypress/data listeners.
function fakeStdin() {
  const stdin = Object.assign(new EventEmitter(), {
    isTTY: true,
    rawCalls: [],
    setRawMode(on) { this.rawCalls.push(on); },
    pause() {},
    resume() {},
  });
  return stdin;
}

test('loadJobs: sorts by id and tolerates malformed/partial job.json', () => {
  const root = fixture();
  const { exists, jobs } = factory.loadJobs(root);
  assert.equal(exists, true);
  assert.deepEqual(jobs.map((j) => j.id), ['001-export', '002-login', '003-broken', '004-partial']);
  const broken = jobs[2];
  assert.equal(broken.stage, '?');
  assert.equal(broken.feature, '');
  const partial = jobs[3];
  assert.equal(partial.stage, '?');
  assert.equal(partial.id, '004-partial');
  assert.equal(jobs[1].stage, 'awaiting-human');
  assert.equal(jobs[1].round, '2');
});

test('loadJobs: missing dir reports exists=false with no jobs', () => {
  const r = factory.loadJobs(path.join(tmp(), 'nope'));
  assert.deepEqual(r, { exists: false, jobs: [] });
});

test('loadJobs and status never write to the jobs directory', () => {
  const root = fixture();
  const before = fs.readFileSync(path.join(root, '002-login', 'job.json'), 'utf8');
  factory.loadJobs(root);
  factory.cmdFactoryStatus(cwdOf(root), {}, { stdout: pipe(), env: {} });
  assert.equal(fs.readFileSync(path.join(root, '002-login', 'job.json'), 'utf8'), before);
});

test('normalizeJob: strips control characters from feature text', () => {
  const job = factory.normalizeJob({ feature: 'a\u0007b\tc' }, 'x', '/x');
  assert.equal(job.feature, 'a b c');
});

test('formatAge: seconds, minutes, hours, days, and unparseable input', () => {
  assert.equal(factory.formatAge('2026-10-20T11:59:30Z', NOW), '30s');
  assert.equal(factory.formatAge('2026-10-20T11:30:00Z', NOW), '30m');
  assert.equal(factory.formatAge('2026-10-20T09:00:00Z', NOW), '3h');
  assert.equal(factory.formatAge('2026-10-18T12:00:00Z', NOW), '2d');
  assert.equal(factory.formatAge(undefined, NOW), '-');
  assert.equal(factory.formatAge('not a date', NOW), '-');
});

test('truncate: cuts to width with an ellipsis and handles tiny widths', () => {
  assert.equal(factory.truncate('short', 10), 'short');
  assert.equal(factory.truncate('abcdefghij', 5), 'abcd…');
  assert.equal(factory.truncate('abc', 1), '…');
  assert.equal(factory.truncate('abc', 0), '');
});

test('formatRow: feature is truncated so the row fits the width', () => {
  const { jobs } = factory.loadJobs(fixture());
  const width = 70;
  const lay = factory.layout(jobs, width);
  const row = factory.formatRow(jobs[0], lay, { color: false, now: NOW });
  assert.ok(row.length <= width, `row is ${row.length} wide, expected <= ${width}`);
  assert.ok(row.includes('…'), 'long feature should be ellipsised');
  assert.ok(row.startsWith('001-export'));
  assert.match(row, /\s+\d+[smhd]$/, 'age column stays at the right edge');
});

test('formatRow: lens chips show PASS, CHANGES and pending', () => {
  const { jobs } = factory.loadJobs(fixture());
  const lay = factory.layout(jobs, 120);
  const row = factory.formatRow(jobs[1], lay, { color: false, now: NOW });
  assert.match(row, /✓ security/);
  assert.match(row, /✗ tests/);
  const pending = factory.normalizeJob({ id: 'p', lenses: ['arch'], reviews: {} }, 'p', '/p');
  assert.match(factory.formatRow(pending, factory.layout([pending], 80), { now: NOW }), /· arch/);
});

test('formatRow: colour codes only when enabled', () => {
  const { jobs } = factory.loadJobs(fixture());
  const lay = factory.layout(jobs, 120);
  assert.equal(/\x1b\[/.test(factory.formatRow(jobs[0], lay, { color: false, now: NOW })), false);
  const coloured = factory.formatRow(jobs[0], lay, { color: true, now: NOW });
  assert.match(coloured, /\x1b\[32mmerged/);
});

test('formatRow: awaiting-plan and awaiting-human are yellow (need the operator); needs-human is red', () => {
  const plan = factory.normalizeJob({ id: 'p', stage: 'awaiting-plan', round: 0 }, 'p', '/p');
  const human = factory.normalizeJob({ id: 'h', stage: 'awaiting-human', round: 1 }, 'h', '/h');
  const broken = factory.normalizeJob({ id: 'b', stage: 'needs-human', round: 1 }, 'b', '/b');
  const lay = factory.layout([plan, human, broken], 120);
  assert.match(factory.formatRow(plan, lay, { color: true, now: NOW }), /\x1b\[33mawaiting-plan/);
  assert.match(factory.formatRow(human, lay, { color: true, now: NOW }), /\x1b\[33mawaiting-human/);
  assert.match(factory.formatRow(broken, lay, { color: true, now: NOW }), /\x1b\[31mneeds-human/);
});

test('formatRow: awaiting-spec is yellow; spec and plan are working stages in the default colour', () => {
  const spec = factory.normalizeJob({ id: 's', stage: 'awaiting-spec', round: 0 }, 's', '/s');
  const writing = factory.normalizeJob({ id: 'w', stage: 'spec', round: 0 }, 'w', '/w');
  const planning = factory.normalizeJob({ id: 'p', stage: 'plan', round: 0 }, 'p', '/p');
  const lay = factory.layout([spec, writing, planning], 120);
  assert.match(factory.formatRow(spec, lay, { color: true, now: NOW }), /\x1b\[33mawaiting-spec/);
  assert.match(factory.formatRow(writing, lay, { color: true, now: NOW }), /\x1b\[36mspec/);
  assert.match(factory.formatRow(planning, lay, { color: true, now: NOW }), /\x1b\[36mplan/);
});

test('status: lists an awaiting-plan job with its stage name intact', () => {
  const root = path.join(tmp(), 'factory', 'jobs');
  writeJob(root, '001-plan', {
    id: '001-plan', feature: 'Tune search', stage: 'awaiting-plan', round: 0,
    lenses: [], reviews: {}, size: 'large', tracking: 'tracked',
    updatedAt: '2026-10-20T11:59:30Z',
  });
  const stdout = pipe();
  factory.cmdFactoryStatus(cwdOf(root), {}, { stdout, env: {} });
  const lines = stdout.output().trimEnd().split('\n');
  assert.match(lines[1], /^001-plan\s+awaiting-plan\s+0\s/);
});

test('normalizeJob: feature_dir and issue_key are optional; null or absent becomes empty', () => {
  const bare = factory.normalizeJob({ id: 'a', feature: 'x' }, 'a', '/a');
  assert.equal(bare.issueKey, '');
  assert.equal(bare.featureDir, '');
  const nullKey = factory.normalizeJob({ id: 'b', issue_key: null, feature_dir: null }, 'b', '/b');
  assert.equal(nullKey.issueKey, '');
  assert.equal(nullKey.featureDir, '');
  const full = factory.normalizeJob({
    id: 'c', issue_key: 'OPS-7', feature_dir: 'docs/features/search', size: 'small', tracking: 'none',
    stage: 'awaiting-plan',
  }, 'c', '/c');
  assert.equal(full.issueKey, 'OPS-7');
  assert.equal(full.featureDir, 'docs/features/search');
});

test('watch detail: shows issue_key and feature_dir when present, and works without them', () => {
  const root = fixture();
  writeJob(root, '000-plan', {
    id: '000-plan', feature: 'Search', stage: 'awaiting-plan', round: 0,
    issue_key: 'OPS-7', feature_dir: 'docs/features/search', size: 'large', tracking: 'tracked',
  });
  writeJob(root, '000-bare', { id: '000-bare', feature: 'Plain', stage: 'build', round: 0 });
  // Jobs sort by id: 000-bare is row 0, 000-plan is row 1. `keys` are sent one at a time.
  const open = (keys) => {
    const stdin = fakeStdin();
    const stdout = tty();
    factory.cmdFactoryWatch(cwdOf(root), { dir: root, interval: '60000' }, { stdin, stdout, env: {} });
    try {
      for (const k of keys) stdin.emit('data', k);
      return stdout.output();
    } finally {
      stdin.emit('data', 'q');
      stdin.emit('data', 'q');
    }
  };
  const withKeys = open(['\x1b[B', '\r']);
  assert.match(withKeys, /000-plan\s+awaiting-plan\s+round 0\s+OPS-7\s+Search/);
  assert.ok(withKeys.includes('docs/features/search'), 'feature_dir shown in detail');
  const bare = open(['\r']);
  assert.match(bare, /000-bare\s+build\s+round 0\s+Plain/);
  assert.equal(bare.includes('docs/features'), false, 'no feature_dir line when absent');
});

test('status: prints one table, sorted by id, closed jobs hidden, with no colour when piped', () => {
  const root = fixture();
  const stdout = pipe();
  factory.cmdFactoryStatus(cwdOf(root), {}, { stdout, env: {} });
  const out = stdout.output();
  const lines = out.trimEnd().split('\n');
  assert.match(lines[0], /^ID\s+STAGE\s+RND\s+LENSES\s+FEATURE\s+AGE$/);
  assert.match(lines[1], /^002-login/);
  assert.match(lines[2], /^003-broken\s+\?/);
  assert.match(lines[3], /^004-partial\s+\?/);
  assert.equal(lines[4], HIDDEN_ONE);
  assert.equal(lines.length, 5);
  assert.equal(out.includes('001-export'), false, 'merged job is hidden by default');
  assert.equal(/\x1b\[/.test(out), false);
});

test('status: hidden-count line only appears when closed jobs exist', () => {
  const root = path.join(tmp(), 'factory', 'jobs');
  writeJob(root, '001-open', { id: '001-open', stage: 'build', round: 0 });
  const stdout = pipe();
  const res = factory.cmdFactoryStatus(cwdOf(root), {}, { stdout, env: {} });
  assert.equal(res.hidden, 0);
  assert.equal(stdout.output().includes('hidden'), false);
});

test('status: only closed jobs present prints "No open jobs" and the hidden count', () => {
  const root = path.join(tmp(), 'factory', 'jobs');
  writeJob(root, '001-done', { id: '001-done', stage: 'merged', round: 1 });
  writeJob(root, '002-dropped', { id: '002-dropped', stage: 'abandoned', round: 0 });
  const stdout = pipe();
  factory.cmdFactoryStatus(cwdOf(root), {}, { stdout, env: {} });
  assert.equal(stdout.output(), '• No open jobs in ' + root + '.\n2 closed jobs hidden (--all to show)\n');
});

test('status --all: shows closed jobs and archived jobs, marking archived ones', () => {
  const root = fixture();
  const cwd = cwdOf(root);
  writeJob(archiveRootOf(cwd), '000-old', {
    id: '000-old', feature: 'Old export', stage: 'merged', round: 1, updatedAt: '2026-10-01T00:00:00Z',
  });
  const stdout = pipe();
  const res = factory.cmdFactoryStatus(cwd, { all: true }, { stdout, env: {} });
  const lines = stdout.output().trimEnd().split('\n');
  assert.match(lines[1], /^000-old\s+merged\s.*\[archived\] Old export/);
  assert.match(lines[2], /^001-export\s+merged\s/);
  assert.equal(/\[archived\]/.test(lines[2]), false, 'factory/jobs entries are not marked archived');
  assert.equal(stdout.output().includes('hidden'), false, 'no hidden line with --all');
  assert.deepEqual(res.jobs.map((j) => j.id), ['000-old', '001-export', '002-login', '003-broken', '004-partial']);
  assert.equal(res.jobs[0].archived, true);
});

test('status: archive is not shown without --all', () => {
  const root = fixture();
  const cwd = cwdOf(root);
  writeJob(archiveRootOf(cwd), '000-old', { id: '000-old', stage: 'merged', round: 1 });
  const stdout = pipe();
  factory.cmdFactoryStatus(cwd, {}, { stdout, env: {} });
  assert.equal(stdout.output().includes('000-old'), false);
});

test('watch: hides closed jobs with a footer line; --all shows them', () => {
  const root = fixture();
  const cwd = cwdOf(root);
  const hiddenView = tty();
  const hiddenIn = fakeStdin();
  factory.cmdFactoryWatch(cwd, { dir: root, interval: '60000' }, { stdin: hiddenIn, stdout: hiddenView, env: {} });
  try {
    assert.ok(hiddenView.output().includes(HIDDEN_ONE));
    assert.equal(hiddenView.output().includes('001-export'), false);
  } finally {
    hiddenIn.emit('data', 'q');
  }
  const allView = tty();
  const allIn = fakeStdin();
  factory.cmdFactoryWatch(cwd, { dir: root, interval: '60000', all: true }, { stdin: allIn, stdout: allView, env: {} });
  try {
    assert.ok(allView.output().includes('001-export'));
    assert.equal(allView.output().includes('hidden'), false);
  } finally {
    allIn.emit('data', 'q');
  }
});

test('status: writes to the injected stdout, not console.log', () => {
  const logged = [];
  const log = console.log;
  console.log = (...args) => logged.push(args.join(' '));
  const stdout = pipe();
  try {
    factory.cmdFactoryStatus(tmp(), {}, { stdout, env: {} });
  } finally {
    console.log = log;
  }
  assert.deepEqual(logged, []);
  assert.equal(stdout.output(), NO_JOBS_LINE);
});

test('status: --dir selects the jobs directory', () => {
  const root = fixture();
  const stdout = pipe();
  factory.cmdFactoryStatus(tmp(), { dir: root }, { stdout, env: {} });
  assert.match(stdout.output(), /002-login/);
});

test('status: NO_COLOR suppresses colour even on a TTY', () => {
  const root = fixture();
  const cwd = cwdOf(root);
  const colouredOut = tty();
  factory.cmdFactoryStatus(cwd, {}, { stdout: colouredOut, env: {} });
  assert.match(colouredOut.output(), /\x1b\[/);
  const plainOut = tty();
  factory.cmdFactoryStatus(cwd, {}, { stdout: plainOut, env: { NO_COLOR: '1' } });
  assert.equal(/\x1b\[/.test(plainOut.output()), false);
  const emptyVar = tty();
  factory.cmdFactoryStatus(cwd, {}, { stdout: emptyVar, env: { NO_COLOR: '' } });
  assert.match(emptyVar.output(), /\x1b\[/, 'empty NO_COLOR is treated as unset');
});

test('status: missing jobs dir prints the friendly message', () => {
  const stdout = pipe();
  const result = factory.cmdFactoryStatus(tmp(), {}, { stdout, env: {} });
  assert.equal(stdout.output(), NO_JOBS_LINE);
  assert.equal(result.exists, false);
});

test('status: empty jobs dir says so', () => {
  const cwd = tmp();
  fs.mkdirSync(path.join(cwd, 'factory', 'jobs'), { recursive: true });
  const stdout = pipe();
  factory.cmdFactoryStatus(cwd, {}, { stdout, env: {} });
  assert.match(stdout.output(), /No jobs in .* yet\./);
});

test('listMarkdown: finds top-level and round-N markdown files, sorted', () => {
  const root = fixture();
  const job = path.join(root, '002-login');
  fs.writeFileSync(path.join(job, 'spec.md'), '# spec');
  fs.writeFileSync(path.join(job, 'build.md'), '# build');
  fs.mkdirSync(path.join(job, 'round-1'));
  fs.writeFileSync(path.join(job, 'round-1', 'review-security.md'), 'x');
  fs.writeFileSync(path.join(job, 'job.json'), '{}');
  assert.deepEqual(factory.listMarkdown(job),
    ['build.md', path.join('round-1', 'review-security.md'), 'spec.md']);
});

test('parseInterval: default, valid, and invalid values', () => {
  assert.equal(factory.parseInterval(undefined), 2000);
  assert.equal(factory.parseInterval('500'), 500);
  assert.throws(() => factory.parseInterval('fast'), /--interval/);
  assert.throws(() => factory.parseInterval('50'), /--interval/);
  assert.throws(() => factory.parseInterval('1.5'), /--interval/);
});

test('parseFlags: --dir and --interval in both forms', () => {
  assert.equal(cli.parseFlags(['factory', 'status', '--dir', 'x/y']).dir, 'x/y');
  assert.equal(cli.parseFlags(['factory', 'watch', '--interval=500']).interval, '500');
  assert.equal(cli.parseFlags(['factory', 'watch', '--interval', '750']).interval, '750');
  assert.throws(() => cli.parseFlags(['factory', '--dir']), /--dir requires a value/);
  assert.throws(() => cli.parseFlags(['factory', '--dir=']), /--dir= requires a value/);
});

test('watch: falls back to a one-shot status when stdout is not a TTY', () => {
  const cwd = tmp();
  const stdout = pipe();
  factory.cmdFactoryWatch(cwd, {}, { stdout, stdin: pipe(), env: {} });
  assert.equal(stdout.output(), NO_JOBS_LINE);
});

// Starts the live view on fake streams. `press` feeds raw terminal input to stdin.
// The caller must quit the view (press 'q') so its timer and listeners are cleaned up.
function startWatch() {
  const stdin = fakeStdin();
  const stdout = tty();
  factory.cmdFactoryWatch(cwdOf(fixture()), { interval: '60000' }, { stdin, stdout, env: {} });
  return { stdin, stdout, press: (data) => stdin.emit('data', data) };
}

test('watch: q restores the terminal, removes its listeners and leaves exitCode alone', () => {
  const prevExit = process.exitCode;
  const { stdin, stdout, press } = startWatch();
  try {
    assert.deepEqual(stdin.rawCalls, [true], 'raw mode on while running');
    assert.equal(stdout.listenerCount('resize'), 1, 'resize listener attached');
    assert.ok(stdout.output().startsWith('\x1b[?1049h'), 'alternate screen entered');
  } finally {
    press('q');
  }
  assert.deepEqual(stdin.rawCalls, [true, false], 'raw mode restored');
  assert.ok(stdout.output().includes('\x1b[?1049l'), 'alternate screen left');
  assert.equal(stdin.listenerCount('keypress'), 0, 'keypress listener removed');
  assert.equal(stdout.listenerCount('resize'), 0, 'resize listener removed');
  assert.equal(process.exitCode, prevExit, 'q exits with the default code');
});

test('watch: Ctrl-C restores the terminal and sets exit code 130', () => {
  const prevExit = process.exitCode;
  const { stdin, stdout, press } = startWatch();
  try {
    press('\x03');
    assert.equal(process.exitCode, 130);
    assert.deepEqual(stdin.rawCalls, [true, false]);
    assert.ok(stdout.output().includes('\x1b[?1049l'));
  } finally {
    process.exitCode = prevExit;
    press('q');
  }
});

test('watch: resize re-renders through stdout resize events', () => {
  const { stdout, press } = startWatch();
  try {
    const before = stdout.output().length;
    stdout.emit('resize');
    assert.ok(stdout.output().length > before, 'resize triggers a render');
  } finally {
    press('q');
  }
});

test('cli --help lists the factory commands', () => {
  const r = spawnSync(process.execPath, [CLI, '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /factory status \[--dir <path>\]/);
  assert.match(r.stdout, /factory watch \[--dir <path>\] \[--interval <ms>\] \[--all\]/);
  assert.match(r.stdout, /factory archive \[--dir <path>\] \[--all\] \[--dry-run\]/);
});

for (const args of [['factory'], ['factory', 'bogus']]) {
  test(`cli ${args.join(' ')} prints a usage error and exits 1`, () => {
    const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: tmp() });
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /Usage: nitm-ai-dev-toolkit factory <status\|watch\|archive\|prune>/);
  });
}

test('parseFlags: --all, --dry-run and --yes are boolean flags', () => {
  const f = cli.parseFlags(['factory', 'archive', '--all', '--dry-run', '--yes']);
  assert.equal(f.all, true);
  assert.equal(f.dryRun, true);
  assert.equal(f.yes, true);
  assert.deepEqual(f._, ['factory', 'archive']);
});

// ---- archive ------------------------------------------------------------------

test('archive: default archives only closed jobs more than 7 days old', () => {
  const cwd = tmp();
  const root = jobsRootOf(cwd);
  writeJob(root, '001-six-days', jobAged('001-six-days', 'merged', 6));
  writeJob(root, '002-eight-days', jobAged('002-eight-days', 'merged', 8));
  writeJob(root, '003-open', jobAged('003-open', 'build', 30));
  writeJob(root, '004-abandoned', jobAged('004-abandoned', 'abandoned', 8));
  const stdout = pipe();
  const res = factoryArchive.cmdFactoryArchive(cwd, {}, { stdout, now: NOW });
  assert.deepEqual(res.moved.map((m) => m.id), ['002-eight-days', '004-abandoned']);
  assert.ok(fs.existsSync(path.join(root, '001-six-days')), '6-day-old merged job stays');
  assert.equal(fs.existsSync(path.join(root, '002-eight-days')), false);
  assert.ok(fs.existsSync(path.join(archiveRootOf(cwd), '002-eight-days', 'job.json')), 'moved with its files');
  assert.equal(res.skippedOpen, 1);
  assert.match(stdout.output(), /^Moved 2 closed job\(s\) to /m);
  assert.match(stdout.output(), /^Skipped 1 open job\(s\)\.$/m);
  assert.match(stdout.output(), /Kept 1 closed job\(s\) newer than 7 days/);
});

test('archive --all: archives every closed job and still never touches open ones', () => {
  const cwd = tmp();
  const root = jobsRootOf(cwd);
  writeJob(root, '001-six-days', jobAged('001-six-days', 'merged', 6));
  writeJob(root, '002-eight-days', jobAged('002-eight-days', 'merged', 8));
  writeJob(root, '003-open', jobAged('003-open', 'awaiting-human', 30));
  const res = factoryArchive.cmdFactoryArchive(cwd, { all: true }, { stdout: pipe(), now: NOW });
  assert.deepEqual(res.moved.map((m) => m.id), ['001-six-days', '002-eight-days']);
  assert.ok(fs.existsSync(path.join(root, '003-open', 'job.json')), 'open job untouched');
  assert.equal(res.skippedOpen, 1);
});

test('archive --dry-run: reports what would move and moves nothing', () => {
  const cwd = tmp();
  const root = jobsRootOf(cwd);
  writeJob(root, '001-old', jobAged('001-old', 'merged', 9));
  const stdout = pipe();
  const res = factoryArchive.cmdFactoryArchive(cwd, { dryRun: true }, { stdout, now: NOW });
  assert.equal(res.dryRun, true);
  assert.deepEqual(res.moved.map((m) => m.id), ['001-old']);
  assert.ok(fs.existsSync(path.join(root, '001-old', 'job.json')), 'job still in jobs/');
  assert.equal(fs.existsSync(archiveRootOf(cwd)), false, 'archive not created');
  assert.match(stdout.output(), /^Would move 1 closed job\(s\) to /m);
});

test('archive: never overwrites an existing archive entry', () => {
  const cwd = tmp();
  const root = jobsRootOf(cwd);
  writeJob(root, '002-eight-days', jobAged('002-eight-days', 'merged', 8));
  writeJob(archiveRootOf(cwd), '002-eight-days', { id: 'archived-earlier', marker: 'keep me' });
  const stdout = pipe();
  const res = factoryArchive.cmdFactoryArchive(cwd, { all: true }, { stdout, now: NOW });
  assert.deepEqual(res.skippedArchived, ['002-eight-days']);
  assert.deepEqual(res.moved, []);
  assert.ok(fs.existsSync(path.join(root, '002-eight-days', 'job.json')), 'source left in place');
  const kept = JSON.parse(fs.readFileSync(path.join(archiveRootOf(cwd), '002-eight-days', 'job.json'), 'utf8'));
  assert.equal(kept.marker, 'keep me', 'existing archive content untouched');
  assert.match(stdout.output(), /already in archive \(not overwritten\)/);
});

test('archive: invalid or unreadable job.json is skipped and reported, never moved', () => {
  const cwd = tmp();
  const root = jobsRootOf(cwd);
  writeJob(root, '005-broken', '{"id": "005-broken", "stage": ');
  writeJob(root, '006-array', '[]');
  fs.mkdirSync(path.join(root, '007-no-job-json'), { recursive: true });
  writeJob(root, '008-no-date', { id: '008-no-date', stage: 'merged' });
  const stdout = pipe();
  const res = factoryArchive.cmdFactoryArchive(cwd, { all: true }, { stdout, now: NOW });
  assert.deepEqual(res.skippedInvalid.map((s) => s.id), ['005-broken', '006-array', '007-no-job-json']);
  assert.deepEqual(res.moved.map((m) => m.id), ['008-no-date']);
  for (const id of ['005-broken', '006-array', '007-no-job-json']) {
    assert.ok(fs.existsSync(path.join(root, id)), `${id} left in place`);
  }
  assert.match(stdout.output(), /Skipped 3 invalid \(not moved\)/);
});

test('archive: a closed job with no usable updatedAt is skipped by default (age unknown) but moves with --all', () => {
  const cwd = tmp();
  const root = jobsRootOf(cwd);
  writeJob(root, '001-no-date', { id: '001-no-date', stage: 'merged' });
  const byDefault = factoryArchive.cmdFactoryArchive(cwd, {}, { stdout: pipe(), now: NOW });
  assert.deepEqual(byDefault.skippedInvalid, [{ id: '001-no-date', reason: 'no valid updatedAt, age unknown' }]);
  assert.ok(fs.existsSync(path.join(root, '001-no-date')));
  const withAll = factoryArchive.cmdFactoryArchive(cwd, { all: true }, { stdout: pipe(), now: NOW });
  assert.deepEqual(withAll.moved.map((m) => m.id), ['001-no-date']);
});

test('archive: missing jobs directory is a no-op that reports so', () => {
  const cwd = tmp();
  const stdout = pipe();
  const res = factoryArchive.cmdFactoryArchive(cwd, {}, { stdout, now: NOW });
  assert.equal(res.exists, false);
  assert.equal(fs.existsSync(archiveRootOf(cwd)), false);
  assert.match(stdout.output(), /nothing to archive/);
});

test('archive: --dir selects the jobs directory and the archive sits beside it', () => {
  const base = tmp();
  const root = path.join(base, 'custom', 'jobs');
  writeJob(root, '001-old', jobAged('001-old', 'merged', 10));
  factoryArchive.cmdFactoryArchive(tmp(), { dir: root }, { stdout: pipe(), now: NOW });
  assert.ok(fs.existsSync(path.join(base, 'custom', 'archive', '001-old', 'job.json')));
});

test('cli factory archive: unknown flag prints a usage error and exits 1', () => {
  const r = spawnSync(process.execPath, [CLI, 'factory', 'archive', '--bogus'], { encoding: 'utf8', cwd: tmp() });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /Unknown option for factory archive: --bogus/);
  assert.doesNotMatch(r.stdout + r.stderr, /\n\s+at /, 'no stack trace');
});

test('cli factory archive --dry-run: exits 0 and moves nothing', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-old', jobAged('001-old', 'merged', 30));
  const r = spawnSync(process.execPath, [CLI, 'factory', 'archive', '--dry-run'], { encoding: 'utf8', cwd });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Would move 1 closed job/);
  assert.ok(fs.existsSync(path.join(jobsRootOf(cwd), '001-old', 'job.json')));
  assert.equal(fs.existsSync(archiveRootOf(cwd)), false);
});

test('cli factory status --dir without a value prints a clean error and exits 1', () => {
  const r = spawnSync(process.execPath, [CLI, 'factory', 'status', '--dir'], { encoding: 'utf8', cwd: tmp() });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /--dir requires a value/);
  assert.doesNotMatch(r.stdout + r.stderr, /\n\s+at /, 'no stack trace');
});

test('normalizeJob: failed_stage keeps only spec or plan; anything else is null', () => {
  assert.equal(factory.normalizeJob({ id: 'a', stage: 'needs-human', failed_stage: 'spec' }, 'a', '/a').failedStage, 'spec');
  assert.equal(factory.normalizeJob({ id: 'b', stage: 'needs-human', failed_stage: 'plan' }, 'b', '/b').failedStage, 'plan');
  assert.equal(factory.normalizeJob({ id: 'c', stage: 'needs-human', failed_stage: null }, 'c', '/c').failedStage, null);
  assert.equal(factory.normalizeJob({ id: 'd', stage: 'needs-human', failed_stage: 'build' }, 'd', '/d').failedStage, null);
  assert.equal(factory.normalizeJob({ id: 'e', stage: 'build' }, 'e', '/e').failedStage, null);
});

test('formatRow: abandoned is dimmed like a closed job', () => {
  const job = factory.normalizeJob({ id: 'x', stage: 'abandoned', round: 0 }, 'x', '/x');
  const lay = factory.layout([job], 120);
  assert.match(factory.formatRow(job, lay, { color: true, now: NOW }), /\x1b\[2mabandoned/);
});

test('watch detail: shows failed_stage in the header when a spec or plan agent failed', () => {
  const root = fixture();
  writeJob(root, '000-broken', { id: '000-broken', feature: 'Export', stage: 'needs-human', round: 0, failed_stage: 'plan' });
  const stdin = fakeStdin();
  const stdout = tty();
  factory.cmdFactoryWatch(cwdOf(root), { dir: root, interval: '60000' }, { stdin, stdout, env: {} });
  try {
    stdin.emit('data', '\r');
    assert.ok(stdout.output().includes('000-broken  needs-human  round 0  failed: plan  Export'));
  } finally {
    stdin.emit('data', 'q');
    stdin.emit('data', 'q');
  }
});

// ---- prune ------------------------------------------------------------------

// Closed/open jobs in both the jobs dir and the sibling archive dir.
function pruneTree() {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-old', jobAged('001-old', 'merged', 30));
  writeJob(archiveRootOf(cwd), '002-old', jobAged('002-old', 'abandoned', 30));
  return cwd;
}
const exists = (cwd, loc, id) => fs.existsSync(path.join(loc === 'jobs' ? jobsRootOf(cwd) : archiveRootOf(cwd), id));

test('prune: without --yes deletes nothing and says to rerun with --yes', () => {
  const cwd = pruneTree();
  const stdout = pipe();
  const res = prune.cmdFactoryPrune(cwd, { all: true, abandoned: true }, { stdout, now: NOW });
  assert.equal(res.willDelete, false);
  assert.ok(exists(cwd, 'jobs', '001-old'));
  assert.ok(exists(cwd, 'archive', '002-old'));
  assert.deepEqual(res.candidates.map((c) => c.id), ['001-old', '002-old']);
  assert.match(stdout.output(), /Would delete 2 closed job\(s\):/);
  assert.match(stdout.output(), /Nothing deleted\. Rerun with --yes to delete these permanently\./);
});

test('prune --yes: deletes job folders from both jobs and archive, nothing else', () => {
  const cwd = pruneTree();
  const docs = path.join(cwd, 'docs', 'features', 'search', 'spec.md');
  fs.mkdirSync(path.dirname(docs), { recursive: true });
  fs.writeFileSync(docs, '# spec');
  const stdout = pipe();
  const res = prune.cmdFactoryPrune(cwd, { all: true, yes: true, abandoned: true }, { stdout, now: NOW });
  assert.equal(exists(cwd, 'jobs', '001-old'), false);
  assert.equal(exists(cwd, 'archive', '002-old'), false);
  assert.ok(fs.existsSync(archiveRootOf(cwd)), 'archive dir itself is kept');
  assert.equal(fs.readFileSync(docs, 'utf8'), '# spec', 'docs outside the two dirs untouched');
  assert.deepEqual(res.deleted.map((d) => [d.location, d.id]), [['jobs', '001-old'], ['archive', '002-old']]);
  assert.match(stdout.output(), /^Deleted 2 closed job\(s\):/m);
  assert.match(stdout.output(), /per location: jobs 1, archive 1/);
});

test('prune --yes: default keeps closed jobs younger than 7 days and deletes older ones', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-six-days', jobAged('001-six-days', 'merged', 6));
  writeJob(jobsRootOf(cwd), '002-eight-days', jobAged('002-eight-days', 'merged', 8));
  const res = prune.cmdFactoryPrune(cwd, { yes: true }, { stdout: pipe(), now: NOW });
  assert.deepEqual(res.deleted.map((d) => d.id), ['002-eight-days']);
  assert.equal(res.kept, 1);
  assert.ok(exists(cwd, 'jobs', '001-six-days'));
  assert.equal(exists(cwd, 'jobs', '002-eight-days'), false);
});

test('prune --all --yes: deletes every closed job, including ones with no date', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-six-days', jobAged('001-six-days', 'merged', 6));
  writeJob(archiveRootOf(cwd), '002-no-date', { id: '002-no-date', stage: 'abandoned' });
  const res = prune.cmdFactoryPrune(cwd, { all: true, yes: true, abandoned: true }, { stdout: pipe(), now: NOW });
  assert.deepEqual(res.deleted.map((d) => d.id), ['001-six-days', '002-no-date']);
  assert.equal(exists(cwd, 'archive', '002-no-date'), false);
});

test('prune --dry-run with --yes: lists only, deletes nothing', () => {
  const cwd = pruneTree();
  const stdout = pipe();
  const res = prune.cmdFactoryPrune(cwd, { all: true, yes: true, abandoned: true, dryRun: true }, { stdout, now: NOW });
  assert.equal(res.willDelete, false);
  assert.ok(exists(cwd, 'jobs', '001-old'));
  assert.ok(exists(cwd, 'archive', '002-old'));
  assert.match(stdout.output(), /Would delete 2 closed job\(s\):/);
  assert.match(stdout.output(), /Dry run: nothing deleted\./);
});

test('prune: open jobs are counted, never deleted (even with --all --yes)', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-open', jobAged('001-open', 'awaiting-human', 400));
  writeJob(jobsRootOf(cwd), '002-done', jobAged('002-done', 'merged', 400));
  const res = prune.cmdFactoryPrune(cwd, { all: true, yes: true }, { stdout: pipe(), now: NOW });
  assert.equal(res.skippedOpen, 1);
  assert.ok(exists(cwd, 'jobs', '001-open'), 'open job untouched');
  assert.equal(exists(cwd, 'jobs', '002-done'), false);
});

test('prune: invalid job.json is skipped and reported, never deleted', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '005-broken', '{"id": "005-broken", "stage": ');
  writeJob(jobsRootOf(cwd), '006-no-date', { id: '006-no-date', stage: 'merged' });
  const stdout = pipe();
  const res = prune.cmdFactoryPrune(cwd, { all: true, yes: true }, { stdout, now: NOW });
  assert.deepEqual(res.skippedInvalid.map((s) => [s.location, s.id]), [['jobs', '005-broken']]);
  assert.ok(exists(cwd, 'jobs', '005-broken'));
  assert.equal(exists(cwd, 'jobs', '006-no-date'), false);
  assert.match(stdout.output(), /Skipped 1 invalid \(not deleted\):/);
});

test('prune: closed job with no usable date is skipped by default (age unknown)', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-no-date', { id: '001-no-date', stage: 'merged' });
  const res = prune.cmdFactoryPrune(cwd, { yes: true }, { stdout: pipe(), now: NOW });
  assert.deepEqual(res.skippedInvalid, [{ location: 'jobs', id: '001-no-date', reason: 'no valid updatedAt, age unknown' }]);
  assert.ok(exists(cwd, 'jobs', '001-no-date'));
});

test('cli factory prune: unknown flag prints a usage error and exits 1', () => {
  const r = spawnSync(process.execPath, [CLI, 'factory', 'prune', '--bogus'], { encoding: 'utf8', cwd: tmp() });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /Unknown option for factory prune: --bogus/);
  assert.match(r.stdout, /factory prune \[--dir <path>\] \[--all\] \[--abandoned\] \[--dry-run\] \[--yes\]/);
});

test('cli factory prune without --yes: exits 0, lists, deletes nothing', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-old', jobAged('001-old', 'merged', 30));
  const r = spawnSync(process.execPath, [CLI, 'factory', 'prune'], { encoding: 'utf8', cwd });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Rerun with --yes/);
  assert.ok(exists(cwd, 'jobs', '001-old'));
});

test('prune: default deletes old merged jobs and keeps old abandoned ones', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-merged', jobAged('001-merged', 'merged', 30));
  writeJob(jobsRootOf(cwd), '002-abandoned', jobAged('002-abandoned', 'abandoned', 30));
  writeJob(archiveRootOf(cwd), '003-abandoned', jobAged('003-abandoned', 'abandoned', 30));
  const stdout = pipe();
  const res = prune.cmdFactoryPrune(cwd, { yes: true }, { stdout, now: NOW });
  assert.deepEqual(res.deleted.map((d) => d.id), ['001-merged']);
  assert.equal(res.skippedAbandoned, 2);
  assert.equal(res.skippedOpen, 0, 'abandoned jobs are not counted as open');
  assert.ok(exists(cwd, 'jobs', '002-abandoned'));
  assert.ok(exists(cwd, 'archive', '003-abandoned'));
  assert.match(stdout.output(), /Kept 2 abandoned job\(s\) \(--abandoned deletes them too\)\./);
  assert.match(stdout.output(), /Skipped 0 open job\(s\)/);
});

test('prune --abandoned: deletes old merged and old abandoned jobs, still keeps young ones', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-merged', jobAged('001-merged', 'merged', 30));
  writeJob(jobsRootOf(cwd), '002-abandoned', jobAged('002-abandoned', 'abandoned', 30));
  writeJob(archiveRootOf(cwd), '003-abandoned-young', jobAged('003-abandoned-young', 'abandoned', 2));
  const stdout = pipe();
  const res = prune.cmdFactoryPrune(cwd, { yes: true, abandoned: true }, { stdout, now: NOW });
  assert.deepEqual(res.deleted.map((d) => d.id), ['001-merged', '002-abandoned']);
  assert.equal(res.skippedAbandoned, 0);
  assert.equal(res.kept, 1);
  assert.ok(exists(cwd, 'archive', '003-abandoned-young'));
  assert.doesNotMatch(stdout.output(), /--abandoned deletes them too/);
});

test('prune --all: deletes every merged job but still keeps abandoned ones unless --abandoned', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-merged-young', jobAged('001-merged-young', 'merged', 1));
  writeJob(jobsRootOf(cwd), '002-abandoned', jobAged('002-abandoned', 'abandoned', 30));
  const res = prune.cmdFactoryPrune(cwd, { all: true, yes: true }, { stdout: pipe(), now: NOW });
  assert.deepEqual(res.deleted.map((d) => d.id), ['001-merged-young']);
  assert.equal(res.skippedAbandoned, 1);
  assert.ok(exists(cwd, 'jobs', '002-abandoned'));
});

test('archive unchanged: moves both merged and abandoned jobs, prune stage filter does not apply', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-merged', jobAged('001-merged', 'merged', 30));
  writeJob(jobsRootOf(cwd), '002-abandoned', jobAged('002-abandoned', 'abandoned', 30));
  const res = factoryArchive.cmdFactoryArchive(cwd, {}, { stdout: pipe(), now: NOW });
  assert.deepEqual(res.moved.map((m) => m.id), ['001-merged', '002-abandoned']);
  assert.equal(res.skippedAbandoned, undefined, 'archive result has no prune-only field');
  assert.ok(exists(cwd, 'archive', '002-abandoned'));
});

test('selectClosedJobs: stages option narrows the selection and counts skipped abandoned', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-merged', jobAged('001-merged', 'merged', 30));
  writeJob(jobsRootOf(cwd), '002-abandoned', jobAged('002-abandoned', 'abandoned', 30));
  const merged = factory.selectClosedJobs(jobsRootOf(cwd), { now: NOW, stages: ['merged'] });
  assert.deepEqual(merged.candidates.map((c) => c.id), ['001-merged']);
  assert.equal(merged.skippedAbandoned, 1);
  const both = factory.selectClosedJobs(jobsRootOf(cwd), { now: NOW });
  assert.deepEqual(both.candidates.map((c) => c.id), ['001-merged', '002-abandoned']);
  assert.equal(both.skippedAbandoned, 0);
});

test('cli factory prune --abandoned: lists abandoned jobs; --abandoned is refused for archive and status', () => {
  const cwd = tmp();
  writeJob(jobsRootOf(cwd), '001-abandoned', jobAged('001-abandoned', 'abandoned', 30));
  const list = spawnSync(process.execPath, [CLI, 'factory', 'prune', '--abandoned'], { encoding: 'utf8', cwd });
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /Would delete 1 closed job\(s\):/);
  assert.match(list.stdout, /\[jobs\] 001-abandoned  abandoned/);
  assert.ok(exists(cwd, 'jobs', '001-abandoned'));
  for (const sub of ['archive', 'status']) {
    const r = spawnSync(process.execPath, [CLI, 'factory', sub, '--abandoned'], { encoding: 'utf8', cwd });
    assert.equal(r.status, 1, sub);
    assert.match(r.stdout, /--abandoned is only for factory prune/);
    assert.ok(exists(cwd, 'jobs', '001-abandoned'), `${sub} deletes and moves nothing`);
  }
});

test('factory skill puts worktrees in .worktrees/ and never outside the repo', () => {
  for (const tpl of ['repo', 'monorepo']) {
    const skill = fs.readFileSync(path.join(__dirname, '..', 'src', tpl, '.agents', 'skills', 'factory', 'SKILL.md'), 'utf8');
    assert.ok(skill.includes('.worktrees/<id>'), tpl + ': uses .worktrees/<id>');
    assert.ok(!/\.\.\/<repo-name>/.test(skill), tpl + ': no sibling ../ worktree path');
    assert.ok(!skill.includes('-factory/<id>'), tpl + ': no <repo>-factory path');
    assert.ok(skill.includes('named by the job id'), tpl + ': folder named by job id');
    assert.ok(/worktree-bootstrap\.md` replaces the worktree skill's project-setup and baseline-test/.test(skill), tpl + ': bootstrap replaces setup/baseline');
    const wt = fs.readFileSync(path.join(__dirname, '..', 'src', tpl, '.agents', 'skills', 'using-git-worktrees', 'SKILL.md'), 'utf8');
    assert.ok(!wt.includes('ls -d worktrees'), tpl + ': worktree skill has no worktrees/ check');
    assert.ok(!wt.includes('.worktrees|worktrees'), tpl + ': worktree skill has no worktrees/ case');
    assert.ok(!/check-ignore -q worktrees/.test(wt), tpl + ': worktree skill has no worktrees/ ignore check');
    assert.ok(!wt.includes('"~/'), tpl + ': worktree skill has no quoted tilde path');
  }
});

// Plan-only route (small jobs without spec.md). These are workflow text contracts: they show that the
// instructions say the route, its bounds, its gates, and its re-entry. They do not prove runtime behaviour.
const SPEC_ROUTE_LAYOUTS = ['repo', 'monorepo'];
const srcText = (tpl, ...parts) => fs.readFileSync(path.join(__dirname, '..', 'src', tpl, ...parts), 'utf8');
const factorySkill = (tpl) => srcText(tpl, '.agents', 'skills', 'factory', 'SKILL.md');
const order = (text, first, second) => {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  assert.notEqual(a, -1, "missing: " + first);
  assert.notEqual(b, -1, "missing: " + second);
  assert.ok(a < b, first + " must come before " + second);
};
const section = (text, start, end) => {
  const a = text.indexOf(start);
  const b = text.indexOf(end, a + start.length);
  assert.notEqual(a, -1, 'missing section: ' + start);
  assert.notEqual(b, -1, 'missing section end: ' + end);
  return text.slice(a, b);
};

test('plan-only route: intake proposes it only inside the stated bounds, and the default is the spec route', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const intake = section(skill, '3. **Spec route.**', '4. **Intake gate.**');
    assert.match(intake, /Propose plan-only \(no `spec\.md`, no spec gate\) only when every check below holds\. Any miss, a total near the budget or not estimable, and an unknown route, mean the spec route:/, tpl + ': bounded proposal, unknown means spec');
    assert.match(intake, /the total working context a builder would carry for this job/, tpl + ': total context estimate');
    assert.match(intake, /confidently below the 100,000-token budget with a reasonable margin/, tpl + ': confidently below the budget with a margin');
    assert.match(intake, /not the current session usage or the model window, and the budget is not enforced across harnesses/, tpl + ': not usage, window, or cross-harness enforcement');
    assert.match(intake, /judgment, not a tokenizer or a tool/, tpl + ': no tokenizer');
    assert.match(intake, /the same `small` as the plan's `\*\*Size:\*\*` line/, tpl + ': size is the existing classification');
    assert.match(intake, /Clear requirements and acceptance criteria\.[^\n]*labelled `Derived:`/, tpl + ': derived criteria are labelled and shown');
    assert.match(intake, /No ambiguity and no product decision\./, tpl + ': ambiguity and product decisions block the route');
    assert.match(intake, /suggest splitting the request into smaller features, on either route\. Never skip the spec to fit a large total, and never propose plan-only then\./, tpl + ': oversize total is split, not skipped');
  }
});

test('plan-only route: the intake gate shows the route and lets the operator decline the skip', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const gate = section(factorySkill(tpl), '4. **Intake gate.**', '5. **Continue as Start.**');
    assert.match(gate, /Shown when questions were asked or a plan-only route is proposed\./, tpl + ': gate shown for a proposal');
    assert.match(gate, /3\. Use the spec route instead\. Offered only when plan-only is proposed; the skip is then not confirmed\./, tpl + ': decline option');
    assert.match(gate, /Picking 1 with a plan-only route confirms the skip\./, tpl + ': confirm records the skip');
  }
});

test('plan-only route: job.json records spec_route, and legacy or unknown jobs keep the spec route and its spec.md', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /- `spec_route`: `spec` or `plan-only`\. Set at intake/, tpl + ': job.json field');
    assert.match(skill, /A job without it is the spec route, so legacy jobs keep their spec\./, tpl + ': legacy default');
    assert.match(skill, /A plan-only job starts at stage `plan`\./, tpl + ': starts at plan');
    assert.match(skill, /Start without intake always records the spec route\./, tpl + ': standalone start defaults to spec');
    assert.match(skill, /add the `## Spec route` section \(the route, its basis, and any `Derived:` criteria/, tpl + ': intake.md records the basis');
  }
});

test('plan-only route: plan confirmation needs size small and an explicit fit PASS, and a non-small size re-enters the spec route', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /1\. Confirm the plan\. Offered only when the current fit review is an explicit `VERDICT: PASS`\. On plan-only, also only when size is `small`\./, tpl + ': confirm needs PASS and small');
    assert.match(skill, /On plan-only, a size other than `small` is not confirmed: run Plan-only re-entry\./, tpl + ': non-small is not confirmed');
    assert.match(skill, /On a plan-only route, a size other than `small`, or an open `\[PRODUCT DECISION\]` item in the plan, triggers Plan-only re-entry/, tpl + ': planner size or decision triggers re-entry');
    assert.match(skill, /Every job stops at `awaiting-plan` before anything is ticketed or built, in every `APPROVAL_MODE` and on either route\./, tpl + ': plan gate on both routes');
  }
});

test('plan-only route: scope re-entry returns to the spec route before the build, and clears earlier approvals', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const reentry = section(factorySkill(tpl), '## Plan-only re-entry', '## Fit review (spec and plan gates)');
    assert.match(reentry, /the plan's size is not `small` \(`large` or `unclear`\)/, tpl + ': size trigger');
    assert.match(reentry, /the scope broadened past the original request/, tpl + ': scope trigger');
    assert.match(reentry, /set `spec_route` to `spec` and stage `spec`/, tpl + ': route flips to spec');
    assert.match(reentry, /Rerun `planner` in spec mode from the original request/, tpl + ': spec mode reruns without a spec.md');
    assert.match(reentry, /Show the spec gate\. Once it is confirmed, plan again and show the plan gate\./, tpl + ': spec gate, then plan gate');
    assert.match(reentry, /Earlier plan confirmations, fit PASS results, and the plan-only requirements sections are not reused: the plan gate's confirmation is asked again for the new plan\./, tpl + ': stale approval not reused');
    assert.match(reentry, /After the build has started, use `\/factory rework` instead/, tpl + ': after build goes through rework');
    const rework = section(factorySkill(tpl), '`/factory rework <job-id> <note>`:', '## Functional QA');
    assert.match(rework, /On a plan-only job, choice 1 first sets `spec_route` to `spec`/, tpl + ': rework spec change re-enters the spec route');
  }
});

test('plan-only route: resume tells an intentional missing spec.md from a missing file in the spec route', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /\*\*Route and missing files\.\*\* A resumed job keeps its recorded route: resume never rewrites `spec_route`, and only Plan-only re-entry changes it. A job without `spec_route` is on the spec route, so legacy jobs keep their spec\./, tpl + ': legacy resume');
    assert.match(skill, /On the plan-only route, a missing `spec\.md` is expected: never report it as missing, and never rerun the spec stage for it\./, tpl + ': intentional absence');
    assert.match(skill, /On the spec route, a missing `spec\.md` is a missing required file: rerun the spec stage/, tpl + ': required file missing');
    assert.match(skill, /A missing `plan\.md` is a missing required file on any route/, tpl + ': plan.md required on any route');
    assert.match(skill, /A plan-only job never enters `spec` or `awaiting-spec`/, tpl + ': status row');
  }
});

test('plan-only route: checkpoints, rework, and the paths block carry the route without requiring spec.md', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /Spec route: `spec` or `plan-only`\. On plan-only there is no `spec\.md`, and its absence is expected\./, tpl + ': paths block route');
    assert.match(skill, /the accepted spec \(spec route\) or the plan's `## Requirements Source` and `## Acceptance Criteria` \(plan-only\), and the plan, are traced against them\./, tpl + ': checkpoint A sources');
    assert.match(skill, /Copy `spec\.md` \(when the main checkout has it\) and `plan\.md`/, tpl + ': doc sync skips missing spec');
    assert.match(skill, /Copy the job's `spec\.md` \(when it exists\), `plan\.md`, and `tasks\.md`/, tpl + ': worktree copy skips missing spec');
  }
});

test('plan-only route: source priority puts the verbatim original request first and checks the copies against it', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const priority = section(skill, '- **Source priority.**', '- **Goal sources in every dispatch.**');
    assert.match(priority, /\(1\) the verbatim original request and every explicit amendment/, tpl + ': original request first');
    assert.match(priority, /\(2\) the accepted spec, or on a plan-only route the plan's `## Requirements Source` and `## Acceptance Criteria`\. Each must quote \(1\) and is checked against it\./, tpl + ': copies checked against original');
    assert.match(priority, /A copy that differs is a conflict: report it with both quotes, and repair it to the verbatim text/, tpl + ': mismatch is a scoped repair');
    assert.match(priority, /\(3\) the plan[^\n]*never override them\./, tpl + ': plan never overrides');
  }
});

test('plan-only route: the human plan gate, the plan fit PASS, and the QA and approval rules are unchanged', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /- \*\*Confirm needs an explicit PASS\.\*\*/, tpl + ': fit PASS still required');
    assert.match(skill, /On plan-only, the fit review checks the plan against the original request and its `## Requirements Source`, and the confirmation is the same\./, tpl + ': same confirmation');
    assert.match(skill, /Required QA evidence\.\*\* Refuse, in every mode and from `needs-human` too/, tpl + ': QA evidence still required');
    assert.match(skill, /Do not waive this with the approve command/, tpl + ': QA not waivable');
    assert.match(skill, /Refuse unless the first line of `build.md` is exactly `STATUS: READY`/, tpl + ': approve readiness unchanged');
    assert.match(skill, /Spec route only\. A plan-only job skips this section and goes to Plan\./, tpl + ': spec section skipped only on plan-only');
    assert.match(skill, /Spec route only\. Runs in every `APPROVAL_MODE`, before any plan is written\. A plan-only job has no spec gate\./, tpl + ': spec gate is spec route only');
  }
  const a = section(factorySkill('repo'), '3. **Spec route.**', '4. **Intake gate.**');
  const b = section(factorySkill('monorepo'), '3. **Spec route.**', '4. **Intake gate.**');
  assert.equal(a, b, 'spec route intake text is identical across src/repo and src/monorepo');
  const r1 = section(factorySkill('repo'), '## Plan-only re-entry', '## Fit review (spec and plan gates)');
  const r2 = section(factorySkill('monorepo'), '## Plan-only re-entry', '## Fit review (spec and plan gates)');
  assert.equal(r1, r2, 'plan-only re-entry text is identical across layouts');
});

test('plan-only route: role briefs no longer require spec.md unconditionally and name the plan-only fallback', () => {
  const roles = ['spec.md', 'build.md', 'review-code.md', 'review-security.md', 'review-ux.md', 'review-ui.md', 'approve.md'];
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    for (const role of roles) {
      const brief = srcText(tpl, '.agents', 'skills', 'factory', 'roles', role);
      assert.match(brief, /plan-only/, tpl + ' ' + role + ': names the plan-only route');
      assert.doesNotMatch(brief, /`spec\.md` and `plan\.md` in the feature folder \(paths block\), always/, tpl + ' ' + role + ': no unconditional spec.md');
    }
    const build = srcText(tpl, '.agents', 'skills', 'factory', 'roles', 'build.md');
    assert.match(build, /`plan\.md` in the feature folder \(paths block\), always\./, tpl + ': builder always reads plan.md');
    const spec = srcText(tpl, '.agents', 'skills', 'factory', 'roles', 'spec.md');
    assert.match(spec, /Plan-only route \(no `spec\.md`\) only: the plan also carries these sections, after Approach and before Steps:/, tpl + ': planner writes the requirements sections');
    assert.match(spec, /- AC-1: <the original criterion, verbatim>/, tpl + ': criteria verbatim with AC numbering');
    assert.match(spec, /write `small` only when the plan is one or two steps and no product decision is open/, tpl + ': planner sizes conservatively');
  }
});

test('plan-only route: the wrapper, README, and CHANGELOG state the route in both layouts', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const wrapper = srcText(tpl, '.claude', 'prompt-snippets', 'factory.md');
    assert.match(wrapper, /Spec before plan, on the spec route only/, tpl + ': wrapper gate scope');
    const readme = srcText(tpl, 'factory', 'README.md');
    assert.match(readme, /### Spec route/, tpl + ': README section');
    assert.match(readme, /stays confidently below 100,000 tokens with a reasonable margin/, tpl + ': README bound');
    assert.match(readme, /Near or unknown means the spec route\./, tpl + ': README ceiling');
    assert.match(readme, /Every job stops at the plan gate, in every approval mode/, tpl + ': README gate summary');
  }
  const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, /plan-only route/, 'CHANGELOG records the plan-only route');
});

// Round 2 contract checks: new-feature-only route, always-kept intake, grill-me clarification, and the
// opt-in advisory retro. Text contracts only: they show the instructions say this, not what an agent does.
test('plan-only route: only a new feature takes it, and resume never rewrites the route', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /\*\*New feature only\.\*\* The feature folder does not exist yet, and no open or archived job names it\./, tpl + ': new feature only');
    assert.match(skill, /A route is never overwritten on resume\./, tpl + ': no overwrite on resume');
    assert.match(skill, /resume never rewrites `spec_route`, and only Plan-only re-entry changes it/, tpl + ': resume keeps route');
    assert.match(skill, /Total context fits\.\*\* Estimate the total working context a builder would carry/, tpl + ': total estimate');
    assert.match(skill, /If the estimate is near the budget, or cannot be made, the spec route applies\./, tpl + ': near or unknown is spec');
    assert.doesNotMatch(skill, /60,000|4 characters per token/, tpl + ': no fixed cutoff or calibration');
  }
});

test('intake: the original request is always kept when typed, even with no questions and on the spec route', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /Always write `intake\.md` when the request text was typed: its `## Original request` section is the verbatim request, even with no questions and on the spec route\./, tpl + ': intake.md always written');
    assert.doesNotMatch(skill, /Skip intake\.md when nothing was asked/, tpl + ': no skip wording');
  }
});

test('intake: grill-me is referenced for genuinely blocking ambiguity, inside the existing intake gate', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const step2 = section(skill, '2. **Ask only glaring questions.**', '3. **Spec route.**');
    assert.match(step2, /For a genuinely blocking ambiguity, follow the \[grill-me\]\(\.\.\/grill-me\/SKILL\.md\) skill/, tpl + ': grill-me link');
    assert.match(step2, /at most five questions/, tpl + ': five-question limit kept');
    assert.match(step2, /the answers recorded verbatim in `intake\.md`/, tpl + ': verbatim answers kept');
    assert.match(step2, /the intake gate still shown before anything is created/, tpl + ': gate kept');
    assert.match(step2, /Grill-me never confirms anything for the operator; the gate's numbered choice does\./, tpl + ': never auto-confirm');
  }
});

test('retro: opt-in per job, off for absent or legacy jobs, flag on the new job only', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const retro = section(skill, '## Retro (opt-in, advisory)', '## Approve');
    assert.match(retro, /Only a job whose `job\.json` has `"retro": true` runs retro\./, tpl + ': opt-in flag');
    assert.match(retro, /Absent or any other value is off, which is every legacy job\. Resume never changes it\./, tpl + ': legacy off, resume keeps');
    assert.match(skill, /- `retro`: `true` when the job opted in/, tpl + ': job.json field documented');
    assert.match(skill, /A `--in-place`, `--retro`, or `--learn` flag on a resumed job is not applied/, tpl + ': resumed flag not applied');
    assert.match(skill, /\/factory \[--in-place\] \[--retro\] \[--learn\] <request>/, tpl + ': invocation');
  }
});

test('retro: the hook runs once after the valid decision and before routing, for APPROVE and ESCALATE', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const hits = skill.split('Retro hook').length - 1;
    assert.equal(hits, 2, tpl + ': exactly two hook calls, step 8 escalation and step 9 approve');
    order(skill, 'save it as `decision.md` (see Harness notes)', 'run the Retro hook (see Retro) before the routing below');
    order(skill, 'run the Retro hook (see Retro) before the routing below', '`ESCALATE` → stage `needs-human`');
    order(skill, 'write `decision.md` with first line `ESCALATE` and the reason', 'run the Retro hook (see Retro) for this `ESCALATE`');
    order(skill, 'run the Retro hook (see Retro) for this `ESCALATE`', 'Stage `needs-human`. Tell the user. Stop.');
  }
});

test('retro: never at /factory approve, inside a merge, or after a push; no duplicate, and gates are unchanged', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const retro = section(skill, '## Retro (opt-in, advisory)', '## Approve');
    assert.match(retro, /Retro does not run at `\/factory approve`, inside a merge, or after a push\./, tpl + ': not at approve/merge/push');
    const approve = section(skill, '## Approve\n', '## Abandon');
    assert.doesNotMatch(approve, /Retro/, tpl + ': approve section has no retro');
    const merge = section(skill, '## Merge procedure', '\n## Status\n');
    assert.doesNotMatch(merge, /Retro/, tpl + ': merge section has no retro');
    assert.match(approve, /Refuse unless the first line of `build\.md` is exactly `STATUS: READY`/, tpl + ': approve readiness unchanged');
    assert.match(approve, /Required QA evidence\.\*\* Refuse, in every mode and from `needs-human` too/, tpl + ': QA unchanged');
    const step9 = section(skill, '9. **Approve.**', '### Repair');
    assert.match(step9, /`APPROVE` and `\{\{APPROVAL_MODE\}\}` is exactly `auto`/, tpl + ': auto branch unchanged');
    assert.match(step9, /`APPROVE` otherwise: stage `awaiting-human`/, tpl + ': human branch unchanged');
  }
});

test('retro: the standalone skill is mirrored, pinned to its MIT source with notice, and never changes a gate', () => {
  const body = (tpl) => srcText(tpl, '.agents', 'skills', 'retro', 'SKILL.md');
  assert.equal(body('repo'), body('monorepo'), 'retro skill identical across layouts');
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const text = body(tpl);
    assert.match(text, /^---\nname: retro\n/, tpl + ': frontmatter name');
    assert.match(text, /commit `d65391149dbb5fe76478e76fa8d5122b2aa5a70e`/, tpl + ': pinned provenance');
    assert.match(text, /MIT licensed: Copyright \(c\) 2026 Matt Pocock/, tpl + ': MIT notice');
    assert.match(text, /LICENSE/, tpl + ': license link');
    assert.match(text, /It never changes a verdict, stage, gate, approval, or merge\./, tpl + ': advisory only');
    assert.match(text, /Run no tests, lint, build, git, or tracker command\./, tpl + ': runs no tests');
    assert.doesNotMatch(text, /\{\{/, tpl + ': no placeholders');
    assert.doesNotMatch(text, /60,000|request\.md/, tpl + ': no fixed cutoff, no request.md');
  }
});

test('retro: argument hints on every Factory command surface name --retro', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    for (const f of ['.claude/commands/factory.md', '.github/prompts/factory.prompt.md', '.cursor/commands/factory.md', '.opencode/commands/factory.md']) {
      assert.match(srcText(tpl, f), /\[--in-place\] \[--retro\] \[--learn\] <feature request>/, tpl + ' ' + f);
    }
  }
});

test('contradictions: AGENTS keeps the confirmations and states plan-only; the wrapper separates spec-before-plan from plan-before-build', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const agents = srcText(tpl, 'AGENTS.md');
    assert.doesNotMatch(agents, /stops at a spec gate and a plan gate for your confirmation/, tpl + ': old contradiction gone');
    assert.match(agents, /stops at a plan gate for your confirmation before any ticket or build/, tpl + ': plan gate stated');
    assert.match(agents, /Spec and plan confirmations stay mandatory human steps in every approval mode\./, tpl + ': mandatory human confirmations');
    assert.match(agents, /When the configured workflow supports and selects the plan-only route, there is no spec to confirm/, tpl + ': plan-only is conditional on configured support');
    assert.match(agents, /With `--retro`, each acceptance decision also saves an advisory retro report, which never changes a gate\./, tpl + ': retro sentence');
    const wrapper = srcText(tpl, '.claude', 'prompt-snippets', 'factory.md');
    assert.match(wrapper, /Spec before plan, on the spec route only: the spec gate holds the spec, and no plan is written until the operator confirms it in chat\. Drafting a spec is not approval\./, tpl + ': spec before plan');
    assert.match(wrapper, /Plan before ticket or build, on either route: the plan gate holds the plan, and nothing is ticketed or built until the operator confirms it in chat\. Drafting a plan is not approval\./, tpl + ': plan before build');
    assert.match(wrapper, /`round-<R>\/retro-<D>\.md`/, tpl + ': wrapper writes list');
  }
});

test('spec audit: the repair, builder, and fit-review text no longer require spec.md when the spec route is off', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /It reads `spec\.md` \(spec route only\), `plan\.md`, `build\.md`/, tpl + ': repair reads spec only on spec route');
    assert.match(skill, /point it at `spec\.md` \(spec route only\), `plan\.md`, `build\.md`/, tpl + ': builder continuity');
    assert.match(skill, /One match:\*\* continue that feature\. Whichever of its `spec\.md`, `plan\.md`, and `tasks\.md` exist/, tpl + ': resume inputs');
    const fit = srcText(tpl, '.claude', 'rules-snippets', 'fit-review.md');
    assert.match(fit, /or, on a factory plan-only route with no spec, the plan's Requirements Source and Acceptance Criteria/, tpl + ': fit-review goal source without spec');
  }
  assert.equal(srcText('repo', '.claude', 'rules-snippets', 'fit-review.md'), srcText('monorepo', '.claude', 'rules-snippets', 'fit-review.md'), 'fit-review identical');
});

// Autonomous build, Closeout, merge evidence, the acceptance basis header, tracking, and the template skill rows.
// Text contracts. Several tests compare two sections on purpose: a record shape, a merge field, an event order,
// or a header line must mean the same thing wherever it is written. They show what the instructions say, not
// what an agent does at runtime.
const PARKED_RECORD = /^- T\d+ \| (technical|human-only) \| cites: [^|]+ \| blocker: [^|]+ \| dependents: [^|]+$/;
const isValidRecord = (line) => PARKED_RECORD.test(line) && !/[<>]/.test(line);
const keysOf = (s) => [...s.matchAll(/"(\w+)":/g)].map((m) => m[1]);

test('parked records: the builder example lines are valid records; placeholders, cite-less, and unknown-tag lines are not', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const brief = srcText(tpl, '.agents', 'skills', 'factory', 'roles', 'build.md');
    const block = section(brief, '  ## Parked items\n', '  ## Completed');
    const records = block.split('\n').filter((l) => /^\s*- T\d+ \|/.test(l)).map((l) => l.trim());
    assert.equal(records.length, 2, tpl + ': two example records');
    for (const r of records) assert.equal(isValidRecord(r), true, tpl + ': example is valid: ' + r);
    assert.equal(isValidRecord('- T3 | technical | cites: <refs> | blocker: <one line> | dependents: <ids>'), false, tpl + ': placeholder rejected');
    assert.equal(isValidRecord('- T3 | technical | blocker: looks fine | dependents: T5'), false, tpl + ': cite-less rejected');
    assert.equal(isValidRecord('- T3 | maybe | cites: src/a.ts:1 | blocker: x | dependents: none'), false, tpl + ': unknown tag rejected');
  }
});

test('parked records: the Factory skill documents the same shape, and the step 6 classes and the resume row use the same words', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const rules = section(skill, '**Build status rules.**', '1. **Reclassify.**');
    assert.ok(rules.includes('`- T<n> | technical|human-only | cites: <refs> | blocker: <one line> | dependents: <ids, or none>`'), tpl + ': documented shape');
    assert.equal(isValidRecord('- T3 | technical | cites: src/a.ts:1 | blocker: the test fails | dependents: T5'), true, tpl + ': documented shape validates');
    assert.match(rules, /`STATUS: BLOCKED` with at least one valid record and no invalid one: the pass\./, tpl + ': rules define the pass class');
    assert.match(rules, /`STATUS: READY` and no `## Parked items` heading: READY\./, tpl + ': rules define READY');
    const table = section(skill, '| Stage | Resume action |', '| `abandoned` |');
    assert.match(table, /`STATUS: BLOCKED` with valid parked records, `failed_stage` null/, tpl + ': resume row uses the same class');
    assert.match(section(skill, '6. **Build.**', '7. **Review round N.**'), /Valid `BLOCKED` with parked records → run the Autonomous pass/, tpl + ': step 6 uses the same class');
  }
});

test('autonomous classification: the pass cites Blocker Classification, not Scheduling, and its human-only items match autonomous-mode', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const pass = section(factorySkill(tpl), '### Autonomous pass', '### Alignment checkpoint A');
    assert.match(pass, /section Canonical Blocker Classification, and its Oracle Semantics/, tpl + ': cites classification');
    assert.match(pass, /Do not apply its Scheduling section\./, tpl + ': no batch scheduling');
    assert.match(pass, /A requirement meaning, a role, permission, credential, or environment the flow does not grant, an undefined check command, a human approval or decision/, tpl + ': human classes are never technical');
    const auto = srcText(tpl, '.agents', 'skills', 'autonomous-mode', 'SKILL.md');
    assert.match(auto, /^## Canonical Blocker Classification$/m, tpl + ': sibling heading the Factory pass cites');
    for (const phrase of ['**Requirement meaning**', '**Role or permission**', '**Undefined check command**', '**Human approval or decision**', '**Technical-unknown**', 'Oracle Semantics']) {
      assert.ok(auto.includes(phrase), tpl + ' autonomous-mode human-only item: ' + phrase);
    }
  }
});

test('Oracle: permissions are explicit in the Factory skill and the prompt summary; the key is task id plus cited input identity, and a task is never asked twice', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const pass = section(skill, '### Autonomous pass', '### Alignment checkpoint A');
    assert.match(pass, /Oracle's permissions are fixed: read-only, advice only\. It never edits, never approves, never changes a goal, a gate, or a check, and never answers a human-only item\./, tpl + ': permissions');
    assert.match(pass, /A key is the task id plus the content identity of each cite\./, tpl + ': key is content identity');
    assert.match(pass, /The blocker's free text, citation-free text, and the build location's HEAD are never part of the key\./, tpl + ': key excludes text and HEAD');
    assert.match(pass, /`git rev-parse HEAD:<path>` \(read-only\)/, tpl + ': blob identity');
    assert.match(pass, /never its full output/, tpl + ': no volatile output in key');
    assert.match(pass, /Never use a reviewer fallback\./, tpl + ': no reviewer fallback');
    assert.match(pass, /write `- T<n> \| key: <key> \| state: asked \| evidence: none` into `## Oracle advice`, then dispatch one read-only Oracle/, tpl + ': attempt row written before the call');
    assert.match(pass, /A task gets one Oracle ask per cycle\./, tpl + ': one ask per cycle');
    assert.match(pass, /`\/factory rework <id> <note>` starts a new cycle, and it is the only renewal\./, tpl + ': rework is the only renewal');
    assert.match(pass, /rows never move back, so the loop ends\./, tpl + ': loop terminates');
    const wrapper = srcText(tpl, '.claude', 'prompt-snippets', 'factory.md');
    assert.match(wrapper, /Autonomous build permissions: for a finished BLOCKED build with valid parked records, read-only Oracle may be asked once per technical blocker key/, tpl + ': wrapper permissions');
    assert.match(wrapper, /It never approves, never answers a human-only item, a gate, a check, or the meaning of a requirement, and never changes a goal\./, tpl + ': wrapper never list');
  }
});

test('autonomous build: step 6 classifies the build, READY is refused with a parked section, and the builder never writes READY with parked work', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const step6 = section(skill, '6. **Build.**', '7. **Review round N.**');
    assert.match(step6, /\[autonomous-mode\]\(\.\.\/autonomous-mode\/SKILL\.md\) before dispatch/, tpl + ': links sibling skill');
    assert.match(step6, /on a plan-only job \(no `tasks\.md`\) the approved plan's numbered Steps/, tpl + ': plan-only units');
    assert.match(step6, /Do not set `needs-human` before the pass ends\./, tpl + ': no early needs-human');
    assert.match(step6, /reason the Build status rules give \(for example "builder wrote no valid status"\)/, tpl + ': invalid status path');
    assert.match(skill, /`STATUS: READY` with a `## Parked items` heading: invalid\./, tpl + ': READY with parked section invalid');
    const brief = srcText(tpl, '.agents', 'skills', 'factory', 'roles', 'build.md');
    assert.match(brief, /Never write READY while any required item is parked, and never tick a parked task/, tpl + ': builder rule');
    assert.match(brief, /Work every independent approved item before you park anything\./, tpl + ': finish independent work first');
    assert.match(brief, /Tag a blocker `technical` only when you can cite the input that settles it\./, tpl + ': cite-to-tag rule');
    assert.doesNotMatch(brief, /When unsure, tag `technical`/, tpl + ': old unsure rule removed');
    assert.doesNotMatch(brief, /<!-- with BLOCKED/, tpl + ': no commented parked heading');
    assert.match(section(skill, '### Autonomous pass', '### Alignment checkpoint A'), /it never runs a full rerun, a repair, or a review/, tpl + ': resume never repairs');
  }
});

test('resume: a finished BLOCKED build re-enters the pass by dispatch priority, an interrupted build reruns the builder, and operator state stops the pass', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const resume = section(factorySkill(tpl), '### Resume of build and review state', '### 4. Create a new job');
    assert.match(resume, /Dispatch priority, first match wins\./, tpl + ': priority rule');
    assert.match(resume, /A `rework-<r>\.md` newer than `build\.md` is an accepted rework note the builder has not built\./, tpl + ': rework note beats older BLOCKED');
    assert.match(resume, /A valid `STATUS: BLOCKED` with parked records, newer than every `rework-<k>\.md`: the builder finished and the autonomous pass is due\. Do not rerun the builder\./, tpl + ': finished BLOCKED is not a rerun');
    assert.match(resume, /Otherwise the build was interrupted or never finished: rerun `implementer`/, tpl + ': interrupted build reruns');
    const pass = section(factorySkill(tpl), '### Autonomous pass', '### Alignment checkpoint A');
    assert.match(pass, /First check the build location\. If it has uncommitted changes, they are operator state the builder did not write, so do not run the pass\./, tpl + ': operator state');
    assert.match(pass, /A human-only item stays parked until the operator reworks it\./, tpl + ': human-only needs rework');
    assert.match(pass, /A changed key is reported in `## Needs you`, and it is asked only after a rework/, tpl + ': changed key needs rework');
  }
});

test('approve and the decision header: the first-line tokens are unchanged, APPROVE and ESCALATE both carry Round and Tested commit, and approve refuses parked work', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const step9 = section(skill, '9. **Approve.**', '### Repair');
    assert.match(step9, /Write the acceptance basis header under the first line, for both `APPROVE` and `ESCALATE`: line 2 `Round: <N>`/, tpl + ': header for both decisions');
    assert.match(step9, /and line 3 `Tested commit: <sha\|none>`/, tpl + ': tested commit line');
    assert.match(step9, /The approver's first line stays the exact token/, tpl + ': exact token kept');
    const escalate = section(skill, 'Any `CHANGES` on the third review round', '   - All `PASS`');
    assert.match(escalate, /with the acceptance basis header under the first line \(`Round: N` and `Tested commit: <sha\|none>`, as in step 9\)/, tpl + ': escalation header');
    const approveStep3 = section(skill, '3. Refuse unless the first line of `build.md`', '4. Refuse while `merge-conflict.md`');
    assert.match(approveStep3, /and `build\.md` has no parked record/, tpl + ': approve refuses parked');
    const approverBrief = srcText(tpl, '.agents', 'skills', 'factory', 'roles', 'approve.md');
    assert.match(approverBrief, /The first line must be exactly `APPROVE` or `ESCALATE`/, tpl + ': approver tokens');
    assert.match(approverBrief, /a parked required item is `ESCALATE`, whatever the reviews say\./, tpl + ': approver parked boundary');
  }
});

test('merge record: job.json, the local merge, and the push-mr finish write the same fields, and Closeout reads them', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const jobField = section(skill, '- `merge`: the verified merge record', '- `mr`: URL');
    const local = jobField.match(/\{"mode":"local",[^}]*\}/)[0];
    const push = jobField.match(/\{"mode":"push-mr",[^}]*\}/)[0];
    assert.deepEqual(keysOf(local), ['mode', 'commit', 'tested_commit'], tpl + ': local fields');
    assert.deepEqual(keysOf(push), ['mode', 'state', 'mr', 'commit', 'tested_commit'], tpl + ': push-mr fields');
    const localStep = section(skill, '6. **Verify and persist the merge.**', '7. **Closeout.**');
    for (const k of ['`mode` `local`', '`commit`', '`tested_commit`', 'in one job.json update']) assert.ok(localStep.includes(k), tpl + ' local writes ' + k);
    const pushStep = section(skill, '   - **Merged:**', '   - **Open:**');
    for (const k of ['`mode` `push-mr`', '`state` `MERGED`', '`mr` equal to the job', '`commit`', '`tested_commit`', 'in one job.json update']) assert.ok(pushStep.includes(k), tpl + ' push-mr writes ' + k);
    const closeout = section(skill, '## Closeout (opt-in Learn)', '## Approve\n');
    assert.match(closeout, /`merge` is present, and it is either `mode` `local` with a `commit`, or `mode` `push-mr` with `state` `MERGED` and `mr` equal to `job\.mr`/, tpl + ': gate reads the same fields');
  }
});

test('order: the merge record and stage merged are one write, then Closeout runs, then cleanup; the push-mr forge read is the only evidence read', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const local = section(skill, '### Local merge', '### Push and merge request');
    order(local, 'stage `merged` in one job.json update', '**Closeout.**');
    order(local, '**Closeout.**', '**Cleanup.**');
    order(local, '**Cleanup.**', '**Finish.**');
    const push = section(skill, '   - **Merged:**', '   - **Open:**');
    order(push, 'first, from the same forge read', 'Then write `merge` and stage `merged` in one job.json update');
    order(push, 'Then write `merge` and stage `merged` in one job.json update', 'Then run Closeout (see Closeout)');
    order(push, 'Then run Closeout (see Closeout)', 'Then clean up:');
    assert.match(push, /\(no extra fetch\)/, tpl + ': no extra fetch for the merge record');
    assert.equal(skill.split('Run Closeout (see Closeout)').length - 1 + skill.split('Then run Closeout (see Closeout)').length - 1, 2, tpl + ': exactly two merge call sites');
  }
});

test('Closeout recovery: approve on a merged opt-in job reads only evidence that passes its identity check, never repeats the merge, cleanup, approval, tests, or fetch', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const approve1 = section(skill, '## Approve\n', '2. Otherwise refuse');
    assert.match(approve1, /Do not merge again, clean up again, or approve again\./, tpl + ': no repeat');
    assert.match(approve1, /run the bounded Closeout recovery \(see Closeout\)/, tpl + ': recovery reference');
    assert.match(approve1, /Say whether `worktree_path` or branch `factory\/<id>` still exists \(read-only\)/, tpl + ': leftovers reported');
    const closeout = section(skill, '## Closeout (opt-in Learn)', '## Approve\n');
    assert.match(closeout, /no merge, no cleanup, no approval, no tests, no fetch, no checkout\./, tpl + ': recovery bounds');
    assert.match(closeout, /`git -C <build location> symbolic-ref --short HEAD` prints `factory\/<id>` \(read-only\)/, tpl + ': identity check for push-mr');
    assert.match(closeout, /An in-place push-mr job whose main checkout has moved off `factory\/<id>` skips with `Learn skipped: evidence no longer accessible`/, tpl + ': in-place after cleanup skips');
    assert.match(closeout, /The default branch's files are never read: no `git show`, no checkout\./, tpl + ': no default-branch reads');
    assert.match(closeout, /An existing `learn\.md` is reused, never recomputed\./, tpl + ': idempotent');
    assert.match(closeout, /The only git commands are the read-only identity checks in step 1\./, tpl + ': only identity git commands');
    assert.match(closeout, /Run no test, lint, build, or tracker command, and make no fetch, checkout, or network call\./, tpl + ': no tests or fetch');
    assert.match(closeout, /The merge stands, and cleanup runs anyway\./, tpl + ': cleanup not blocked');
  }
});

test('acceptance basis header: decision.md, the Factory Retro section, and the retro skill use the same two lines', () => {
  const shape = /^\s*Decision: <APPROVE\|ESCALATE>, round <R>\n\s*Tested commit: <sha\|none>$/m;
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(section(skill, '## Retro (opt-in, advisory)', '## Closeout (opt-in Learn)'), shape, tpl + ': Factory Retro header');
    assert.match(srcText(tpl, '.agents', 'skills', 'retro', 'SKILL.md'), shape, tpl + ': retro skill header');
    assert.match(section(skill, '## Retro (opt-in, advisory)', '## Closeout (opt-in Learn)'), /`Round: <N>` and `Tested commit: <sha\|none>`/, tpl + ': Retro names decision header');
  }
});

test('retro: one report per round and decision; the same two header lines decide skip, mismatch, or write', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const retro = section(factorySkill(tpl), '## Retro (opt-in, advisory)', '## Closeout (opt-in Learn)');
    assert.match(retro, /The report is `round-<R>\/retro-<D>\.md` in the job folder, where `D` is `approve` or `escalate`\./, tpl + ': file per round and decision');
    assert.match(retro, /If `round-<R>\/retro-<D>\.md` exists and its first two lines equal them, skip the write/, tpl + ': same header skips');
    assert.match(retro, /If it exists with different lines, do not overwrite it, and print `Retro skipped: existing report does not match current decision`/, tpl + ': mismatch never overwrites');
    assert.match(retro, /Reports are never copied between decisions\./, tpl + ': no copy');
    assert.match(retro, /a repair or rework starts a new round with its own report/, tpl + ': new round, new report');
    assert.match(retro, /Retro skipped: <reason>/, tpl + ': unavailable');
    assert.doesNotMatch(retro, /sha256|hash|git status|git rev-parse/, tpl + ': no fingerprint, no git query');
    assert.match(srcText(tpl, '.agents', 'skills', 'retro', 'SKILL.md'), /The first two lines are the basis header copied from the current `decision\.md`/, tpl + ': retro skill mirrors the rule');
  }
});

test('Learn: opt-in and fallback text, one minimal memory read, and Learn reads retro only on the Factory header match', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const closeout = section(skill, '## Closeout (opt-in Learn)', '## Approve\n');
    assert.match(closeout, /Run Closeout only when all of these hold:/, tpl + ': opt-in gate');
    assert.match(closeout, /`job\.json` has `"learn": true` \(independent of `retro`\)/, tpl + ': independent of retro');
    assert.match(closeout, /A retro report passes to Learn only when its two header lines equal the current `decision\.md` header/, tpl + ': retro only on match');
    assert.match(closeout, /A `none` tested commit is no identity, so Learn gets no retro\./, tpl + ': none is no identity');
    assert.match(closeout, /Name each missing optional input in the report and continue with what remains/, tpl + ': optional missing continues');
    assert.match(closeout, /Skip \(`Learn skipped: <reason>`, nothing written\) only when the mandatory proof is missing/, tpl + ': mandatory missing skips');
    assert.match(closeout, /Learn proposes and never applies\./, tpl + ': proposes only');
    const learn = srcText(tpl, '.agents', 'skills', 'learn', 'SKILL.md');
    assert.match(learn, /identity the current `decision\.md` records/, tpl + ': Learn compares decision.md identity');
    assert.match(learn, /Never use `merge\.commit`/, tpl + ': Learn never uses the merge commit');
    const analyze = section(skill, '1. **Analyze, read-only.**', '2. **Ask only glaring questions.**');
    assert.match(analyze, /the file named by an existing pointer in `AGENTS\.md`, or `docs\/agent-memory\.md`/, tpl + ': memory location');
    assert.match(analyze, /A job unrelated to any entry reads none of it\./, tpl + ': no forced reads');
  }
});

test('Learn: opt-in flag is per job, off for legacy, and only the two verified merge steps reference Closeout', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.match(skill, /`learn`: `true` when the job opted in to the advisory Learn report after a verified merge/, tpl + ': job.json field');
    assert.match(skill, /`--in-place`, `--retro`, and `--learn` apply only to a new job/, tpl + ': new job only');
    assert.match(skill, /A `--in-place`, `--retro`, or `--learn` flag on a resumed job is not applied/, tpl + ': resume does not apply');
    assert.match(skill, /\/factory \[--in-place\] \[--retro\] \[--learn\] <request>/, tpl + ': invocation');
    const retro = section(skill, '## Retro (opt-in, advisory)', '## Closeout (opt-in Learn)');
    assert.doesNotMatch(retro, /Closeout|Learn/, tpl + ': retro does not kick learn');
    const step9 = section(skill, '9. **Approve.**', '### Repair');
    assert.doesNotMatch(step9, /Closeout|Learn/, tpl + ': no learn on approve or escalate');
  }
});

test('tracking: the ticket preview comes before any write, the parent included, and the plan confirmation is not approval', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const tracking = section(factorySkill(tpl), '## Tracking\n', '## Worktree\n');
    order(tracking, '2. **Preview, before any write.**', '3. **Approved writes.**');
    assert.ok(!/Otherwise create the parent ticket/.test(tracking), tpl + ': no parent write before preview');
    assert.match(tracking, /The plan gate's confirmation is not approval for tracker writes\./, tpl + ': plan gate is not approval');
    assert.match(tracking, /\(1\) create exactly this preview/, tpl + ': numbered approval');
    assert.match(tracking, /The preview in step 2 is that flow's preview-and-approve step, so the flow does not ask a second time/, tpl + ': single approval point');
    assert.match(tracking, /If a line or the parent changed after the approval, stop, show a new preview, and ask again\./, tpl + ': changed preview asks again');
  }
});

test('template AGENTS: six skill rows resolve to real skill files in both layouts, Code Review and Requesting are split, and Brainstorming names Grill Me', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const agents = srcText(tpl, 'AGENTS.md');
    for (const s of ['autonomous-mode', 'design-system', 'grill-me', 'learn', 'requesting-code-review', 'retro', 'code-review']) {
      assert.ok(agents.includes('`' + s + '/SKILL.md`'), tpl + ' row for ' + s);
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'src', tpl, '.agents', 'skills', s, 'SKILL.md')), tpl + ' skill file ' + s);
    }
    assert.match(agents, /\| \*\*Code Review\*\* \| `code-review\/SKILL\.md`/, tpl + ': Code Review row points to code-review');
    assert.match(agents, /\| \*\*Requesting Code Review\*\* \| `requesting-code-review\/SKILL\.md`/, tpl + ': requesting row kept');
    assert.match(agents, /\| \*\*Brainstorming\*\*[^\n]*For blocking questions about a plan, use Grill Me instead/, tpl + ': brainstorming separation');
    assert.match(agents, /\| \*\*Grill Me\*\* \| `grill-me\/SKILL\.md`/, tpl + ': grill-me row');
  }
});

test('CHANGELOG: covers code-review, design-system, the assign preview, the specify and plan grill, the opencode-mem removal, and this lane', () => {
  const cl = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
  for (const phrase of ['`code-review`', '`design-system`', 'Preview and Approve', '`specify` and `plan` prompt snippets', '`opencode-mem`', 'Factory merge evidence', 'Factory acceptance basis', 'Factory tracking']) {
    assert.ok(cl.includes(phrase), 'CHANGELOG mentions ' + phrase);
  }
});

test('autonomous build and documentation: README, AGENTS pointer, and the plan-only documentation precedence', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    assert.match(srcText(tpl, 'factory', 'README.md'), /## Autonomous build/, tpl + ': README section');
    const agents = srcText(tpl, 'AGENTS.md');
    assert.match(agents, /After plan confirmation, the build works through every unblocked item and asks you only for what needs you/, tpl + ': AGENTS pointer');
    assert.match(agents, /\*\*Factory plan-only exception:\*\* For a Factory job on the plan-only route/, tpl + ': documentation precedence');
    assert.match(agents, /This overrides the spec prerequisite and the spec-first sequence, in this section and in the documentation checklist, only for that job's feature folder\./, tpl + ': narrow precedence');
    assert.match(agents, /spec \+ plan, or plan only on a Factory plan-only job/, tpl + ': docs bullet carries plan-only');
  }
});

// Bounds and seams for the autonomous pass, the dispatch priority, the single merge write, and Learn's inputs.
test('autonomous pass bounds: a RESOLVED row is consumed once, keys are frozen per pass, and a spent task is never re-dispatched', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const pass = section(factorySkill(tpl), '### Autonomous pass', '### Alignment checkpoint A');
    assert.match(pass, /Before dispatch, rewrite each executable root's row to `state: dispatched` in `build\.md`\./, tpl + ': consumed before dispatch');
    assert.match(pass, /A root whose row is `dispatched` and is still parked stays parked, with reason "guided attempt spent: still parked after RESOLVED", and is never dispatched again in this cycle\./, tpl + ': spent is terminal');
    assert.match(pass, /Return to step 1 for tasks that have no row yet\./, tpl + ': new tasks only');
    assert.match(pass, /computed once when the pass starts and kept for the whole pass/, tpl + ': keys frozen per pass');
    assert.match(pass, /For a repo path it is the git blob id of the committed file, from `git rev-parse HEAD:<path>` \(read-only\)\./, tpl + ': blob id');
    assert.match(pass, /A missing path is `missing:<path>`\./, tpl + ': missing path key');
    assert.match(pass, /a `dispatched` row whose task is still parked is parked for the cycle/, tpl + ': interrupted dispatch on resume parks');
    assert.match(pass, /reason "guided re-dispatch was interrupted or spent: rerun with \/factory rework <id> <note> if needed"/, tpl + ': interrupted dispatch remedy is existing rework');
    assert.match(pass, /Each return either removes a `RESOLVED` row or adds rows for tasks that had none/, tpl + ': termination argument');
  }
});

test('dispatch priority: a newer rework note beats an older BLOCKED build, Repair reuses the same status handling, and the build row agrees', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const resume = section(skill, '- **`build`.** Dispatch priority', '- **`needs-human` with `failed_stage` null.**');
    assert.match(resume, /Rules 1, 2, and 4 apply to stage `build` only\. `needs-human` with `failed_stage` null uses rule 3 alone/, tpl + ': needs-human uses rule 3 only');
    const repair = section(skill, '### Repair', '### Autonomous pass');
    assert.match(repair, /Classify the result with the Build status rules, as step 6 does\./, tpl + ': repair classifies');
    assert.match(repair, /run the Autonomous pass for round `U`, with the same bounds and permissions/, tpl + ': repair pass round U, no wider permissions');
    assert.match(repair, /after its valid `READY`, run checkpoint A for `U` before step 7/, tpl + ': repair checkpoint after pass');
    const row = section(skill, '| Stage | Resume action |', '| `abandoned` |');
    assert.match(row, /a newer rework note reruns the builder in rework mode/, tpl + ': build row names rework first');
    const stepNine = section(skill, '9. **Approve.**', '### Repair');
    assert.doesNotMatch(stepNine, /No builder, repair, or review runs/, tpl + ': no contradictory no-builder claim');
    assert.doesNotMatch(row, /No builder, repair, or review runs/, tpl + ': table has no contradictory claim');
    assert.match(row, /No full rerun, repair, or review runs\. The pass may dispatch the builder in autonomous mode/, tpl + ': table names the bounded dispatch');
  }
});

test('single write and mandatory versus optional Learn inputs are the same wherever they are described', () => {
  const a = factorySkill('repo');
  const b = factorySkill('monorepo');
  for (const name of ['### Autonomous pass', '## Closeout (opt-in Learn)', '### Resume of build and review state', '### Local merge', '### Push and merge request']) {
    const x = section(a, name, '\n## ');
    const y = section(b, name, '\n## ');
    assert.ok(x.length > 50, name + ' section found');
    assert.equal(x.length > 0, y.length > 0, name + ' present in both layouts');
  }
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    assert.doesNotMatch(skill, /Then set stage `merged`\. Writing this/, tpl + ': no separate sequential merged write');
    assert.match(skill, /rewriting the whole file once with both/, tpl + ': merge and merged in one rewrite');
    const closeout = section(skill, '## Closeout (opt-in Learn)', '## Approve\n');
    assert.match(closeout, /Skip \(`Learn skipped: <reason>`, nothing written\) only when the mandatory proof is missing, or the learn skill cannot read any artifact\./, tpl + ': skip only for mandatory');
    assert.match(closeout, /A copy that fails its identity check is treated as missing, never as evidence\./, tpl + ': identity check, no stale reads');
  }
});

// B1 and B2: a RESOLVED root unlocks its recorded dependents only in order and only if the root finishes; a row whose
// key no longer matches the current inputs is not executable advice. Text contracts.
test('B1: a RESOLVED root dispatches its recorded dependents in order, never before their prerequisites, and never when the root stays blocked', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const step4 = section(factorySkill(tpl), '4. **Guided re-dispatch, once.**', '5. **Inconclusive.**');
    assert.match(step4, /Dependent candidates are the tasks named under the `dependents:` of all executable roots in this batch, and only those that are parked\./, tpl + ': candidates are the union over all executable roots');
    assert.match(step4, /A candidate stays parked, with its real blocker, while any unresolved blocker outside this batch remains, including a stale row on its own blocker\./, tpl + ': outside blockers and stale rows exclude');
    assert.match(step4, /A dependent starts only after every one of its prerequisites is verified finished and committed: already finished and committed before this run \(listed under `## Completed`\), or finished and committed earlier in this run\./, tpl + ': completed prerequisites count');
    assert.match(step4, /If a prerequisite stays blocked, the dependent does not start and is recorded under that prerequisite's actual blocker\./, tpl + ': blocked prerequisite keeps dependent unstarted');
    assert.match(step4, /If a root stays blocked, its dependents do not run at all\./, tpl + ': blocked root keeps dependents from running');
    assert.match(step4, /A dependent that hits a real new blocker records it normally, and that blocker goes through steps 1 to 3\./, tpl + ': new blocker is normal');
    assert.match(step4, /A dependent that was not started is not dispatched again in this cycle unless its own blocker gets a new `RESOLVED` row\./, tpl + ': once-only dependents');
    const brief = srcText(tpl, '.agents', 'skills', 'factory', 'roles', 'build.md');
    assert.match(brief, /Start a named dependent only after every one of its prerequisites is verified finished and committed, either already listed under `## Completed` or earlier in this run; if one is still blocked, leave the dependent unstarted and record it under that prerequisite's blocker\./, tpl + ': builder honours the ordering');
  }
});

test('B2: only a parked technical root with a RESOLVED row whose key matches the current key is executable; a mismatch stays parked and is reported', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const step4 = section(skill, '4. **Guided re-dispatch, once.**', '5. **Inconclusive.**');
    assert.match(step4, /Executable advice: a task is executable only when it is parked, tagged `technical`, its row is `RESOLVED` with cited evidence, and the row's `key` equals that task's current key \(computed at pass start, or now on resume\)\./, tpl + ': executable definition');
    assert.match(step4, /A row whose key differs is not executable: the task stays parked with reason "advice key no longer matches current inputs; rework to ask again", and it is listed in `## Needs you`\./, tpl + ': mismatch stays parked and reported');
    const step7 = section(skill, '7. **Resume (parked-task resume).**', '### Alignment checkpoint A');
    assert.match(step7, /Rows are handled as in step 3 and step 4/, tpl + ': resumed unconsumed rows use the step 4 key check');
  }
});

// Outgoing PR/MR body, prototype, domain-first language, and handoff: dependency, order, parity, and privacy contracts.
test('push-mr: one sanitized pr-body.md path for both forges, never the raw decision, and the step 4 text is identical across layouts', () => {
  const step4 = (tpl) => section(factorySkill(tpl), '4. **Open the request, once.**', 'Record the URL the command prints in `mr`.');
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const s = step4(tpl);
    assert.match(s, /--body-file <job folder>\/pr-body\.md`/, tpl + ': GitHub uses pr-body.md');
    assert.match(s, /--description-file <job folder>\/pr-body\.md --yes`/, tpl + ': GitLab uses pr-body.md');
    assert.doesNotMatch(s, /<job folder>\/decision\.md`\)|--body-file <job folder>\/decision|--description-file <job folder>\/decision/, tpl + ': no raw decision body in either command');
    assert.match(s, /`decision\.md` is never changed/, tpl + ': decision not mutated');
    assert.match(s, /The raw `decision\.md` is never the body\./, tpl + ': no raw body, even without a template');
    assert.match(s, /the rows of `qa\.md` in the build location, only when its `Tested commit:` equals the current decision's `Tested commit:` and the Functional QA freshness rules \(see Functional QA\) show that evidence fresh/, tpl + ': canonical freshness rule, not HEAD equality');
    assert.match(s, /`QA evidence unavailable: <reason>`/, tpl + ': unavailable QA is named');
    assert.match(s, /The test gate of step 2 is kept either way\./, tpl + ': step 2 kept');
    assert.doesNotMatch(s, /equals the build location's `HEAD`/, tpl + ': no HEAD equality');
    assert.match(s, /Rollback: `not attempted`\./, tpl + ': rollback not attempted');
    assert.match(s, /Never run a rollback\./, tpl + ': rollback never executed');
    assert.match(s, /adds no approval\./, tpl + ': no new authority');
  }
  assert.equal(step4('repo'), step4('monorepo'), 'step 4 identical across layouts');
});

test('prototype: offered only for a blocking question the examples did not settle, within the cap, before job artifacts, in isolation', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const intake = section(factorySkill(tpl), '2. **Ask only glaring questions.**', '3. **Spec route.**');
    const proto = section(intake, '**Disposable prototype', '   Do not ask about details');
    assert.match(proto, /After the discussion and the domain examples above, offer it only when one qualifying blocking question remains/, tpl + ': discussion and examples first');
    assert.match(proto, /a UI or state question qualifies too/, tpl + ': not limited to terms');
    assert.match(proto, /Never run the prototype unless the operator says yes\./, tpl + ': never without yes');
    assert.match(proto, /in the five-question cap/, tpl + ': counts toward the cap');
    assert.match(proto, /It runs before any Factory job artifact exists\./, tpl + ': before job artifacts');
    assert.match(proto, /outside the live project directory/, tpl + ': isolated from the live directory');
    assert.match(proto, /no production data, no commits, no new dependencies, and no external action/, tpl + ': no side effects');
    assert.match(proto, /Only the decision and its evidence come back, never the prototype's code\./, tpl + ': only decision returns');
    assert.match(proto, /The spec and plan approvals stay exactly as they are\./, tpl + ': approvals unchanged');
  }
});

test('domain examples: first, indented as part of the intake list, not questions, and never an automatic doc write', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const lines = factorySkill(tpl).split('\n');
    const lead = (needle) => { const l = lines.find((x) => x.includes(needle)); assert.ok(l, tpl + ': found ' + needle); return l; };
    assert.match(lead('**Domain examples first.**'), /^   \*\*Domain examples first\.\*\*/, tpl + ': indented');
    assert.match(lead('Do not ask about details the spec writer can decide'), /^   Do not ask about details/, tpl + ': indented');
    const intake = section(factorySkill(tpl), '2. **Ask only glaring questions.**', '3. **Spec route.**');
    order(intake, '**Domain examples first.**', 'Only if they do not settle the term, ask one question, counted in the cap.');
    order(intake, '**Domain examples first.**', '**Disposable prototype');
    assert.match(intake, /Examples are not questions and do not count toward the five-question cap\./, tpl + ': examples do not count');
    assert.match(intake, /Do not write to a glossary, ADR, or any other doc automatically\./, tpl + ': no automatic doc writes');
  }
});

test('handoff: only a crossing of a human or tool boundary, not reviewer or approver dispatch or routine resume, with a named owner and no automatic send', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const handoff = section(factorySkill(tpl), '## Handoff summary', '## Harness notes');
    assert.match(handoff, /only when the job crosses a human or tool boundary/, tpl + ': boundary crossing');
    assert.match(handoff, /Ordinary reviewer and approver dispatches, and routine resumes, are not handoffs\./, tpl + ': not dispatch or resume');
    assert.match(handoff, /names the owner of the next step \(the operator, a reviewer, or a tool\)/, tpl + ': owner may be recipient');
    assert.match(handoff, /the redacted evidence it shares/, tpl + ': redacted shared evidence');
    assert.match(handoff, /Never send it automatically\./, tpl + ': no automatic send');
    assert.match(handoff, /creates no artifact or stage\./, tpl + ': no new artifact or stage');
  }
});

// Creation-time snapshot and template selection: the body describes the SHA pushed at creation, and a template is
// used only when its selection is unique, otherwise the same sanitized fallback applies on both forges.
test('push-mr body: a creation-time snapshot tied to the recorded push SHA, with no unqualified pass for a later revision', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const skill = factorySkill(tpl);
    const step3 = section(skill, '3. **Push.**', '4. **Open the request, once.**');
    assert.match(step3, /On success, record the pushed SHA \(the build location's `HEAD`\) for the body's verification snapshot\./, tpl + ': step 3 records the SHA');
    const step4 = section(skill, '4. **Open the request, once.**', 'Record the URL the command prints in `mr`.');
    assert.match(step4, /Verification \(a creation-time snapshot\. Its label displays two SHAs: the branch SHA that step 3 recorded, and the accepted Tested commit\./, tpl + ': snapshot label shows both SHAs');
    assert.match(step4, /Show `unknown` for either one that is not recorded\./, tpl + ': unknown SHA shown');
    assert.match(step4, /Later pushes can update the branch, but this procedure does not edit the existing request body or add another forge operation, so the snapshot may then differ\./, tpl + ': later pushes allowed, body not edited');
    assert.match(step4, /Never present it as a pass for a later revision\)/, tpl + ': no unqualified pass');
    assert.match(step4, /The test gate of step 2 is kept either way\./, tpl + ': step 2 and QA freshness kept');
  }
});

test('push-mr template: GitHub root file recognized, a template only on a unique selection, and the same sanitized fallback otherwise', () => {
  for (const tpl of SPEC_ROUTE_LAYOUTS) {
    const step4 = section(factorySkill(tpl), '4. **Open the request, once.**', 'Record the URL the command prints in `mr`.');
    assert.match(step4, /Use a template only when the selection is unique\./, tpl + ': unique selection only');
    assert.match(step4, /`pull_request_template\.md` at the repository root/, tpl + ': GitHub root candidate');
    assert.match(step4, /Several candidates without a unique choice, such as several GitLab templates with no `Default\.md`, are no unique selection\./, tpl + ': ambiguity named');
    assert.match(step4, /No template, or no unique selection: the body is the decision's summary, then the sections above, in that order, the same sanitized fallback on both forges\./, tpl + ': same fallback');
    assert.match(step4, /The raw `decision\.md` is never the body\./, tpl + ': no raw decision');
    assert.match(step4, /adds no approval\./, tpl + ': approval untouched');
  }
});
