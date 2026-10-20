'use strict';

// `factory archive`: moves closed jobs (merged, abandoned) from factory/jobs/<id>/
// to factory/archive/<id>/. Default only archives jobs closed more than 7 days ago;
// --all archives every closed job. Open jobs are never touched. Stdlib only.
// Selection is shared with `factory prune` (factory.selectClosedJobs).
// Never touches git or branches: those are left to /factory archive and /factory prune.

const fs = require('fs');
const path = require('path');
const factory = require('./factory-watch.js');

function cmdFactoryArchive(cwd, flags = {}, opts = {}) {
  const stdout = opts.stdout || process.stdout;
  const now = opts.now === undefined ? Date.now() : opts.now;
  const all = Boolean(flags.all);
  const dryRun = Boolean(flags.dryRun);
  const jobsDir = factory.resolveDir(cwd, flags);
  const archiveDir = factory.archiveDirOf(jobsDir);
  const line = (text) => stdout.write(text + '\n');
  const result = {
    dir: jobsDir, archiveDir, dryRun, exists: true,
    moved: [], skippedOpen: 0, kept: 0, skippedInvalid: [], skippedArchived: [],
  };

  const sel = factory.selectClosedJobs(jobsDir, { all, now });
  if (!sel.exists) {
    result.exists = false;
    line(`• No jobs directory at ${jobsDir} — nothing to archive.`);
    return result;
  }
  result.skippedOpen = sel.skippedOpen;
  result.kept = sel.kept;
  result.skippedInvalid = sel.skippedInvalid;

  for (const c of sel.candidates) {
    const target = path.join(archiveDir, c.id);
    if (fs.existsSync(target)) {
      result.skippedArchived.push(c.id);
      continue;
    }
    if (!dryRun) {
      fs.mkdirSync(archiveDir, { recursive: true });
      fs.renameSync(c.dir, target);
    }
    result.moved.push({ id: c.id, stage: c.stage });
  }

  const verb = dryRun ? 'Would move' : 'Moved';
  if (result.moved.length) {
    line(`${verb} ${result.moved.length} closed job(s) to ${archiveDir}:`);
    for (const { id, stage } of result.moved) line(`  ${id}  ${stage}`);
  } else {
    line('No closed jobs to move.');
  }
  line(`Skipped ${result.skippedOpen} open job(s).`);
  if (result.skippedInvalid.length) {
    line(`Skipped ${result.skippedInvalid.length} invalid (not moved):`);
    for (const { id, reason } of result.skippedInvalid) line(`  ${id}  ${reason}`);
  }
  if (result.skippedArchived.length) {
    line(`Skipped ${result.skippedArchived.length} already in archive (not overwritten):`);
    for (const id of result.skippedArchived) line(`  ${id}`);
  }
  if (!all && result.kept) {
    line(`Kept ${result.kept} closed job(s) newer than ${factory.DEFAULT_AGE_DAYS} days (--all moves them too).`);
  }
  return result;
}

module.exports = { cmdFactoryArchive };
