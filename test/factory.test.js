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
  }
});
