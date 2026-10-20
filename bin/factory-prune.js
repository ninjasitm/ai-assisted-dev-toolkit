'use strict';

// `factory prune`: permanently deletes closed jobs from both factory/jobs/ and the
// sibling factory/archive/. By default only merged jobs; --abandoned also deletes
// abandoned jobs. Age rule (factory.selectClosedJobs): default only jobs closed more
// than 7 days ago with a valid updatedAt; --all every such job, with no age limit.
// Open jobs are counted, never touched. Deletes only the job folders inside those
// two directories. Stdlib only.
//
// Safety: without --yes nothing is deleted (it lists and says to rerun with --yes).
// --dry-run always only lists, even with --yes.

const fs = require('fs');
const path = require('path');
const factory = require('./factory-watch.js');

function cmdFactoryPrune(cwd, flags = {}, opts = {}) {
  const stdout = opts.stdout || process.stdout;
  const now = opts.now === undefined ? Date.now() : opts.now;
  const all = Boolean(flags.all);
  const dryRun = Boolean(flags.dryRun);
  const yes = Boolean(flags.yes);
  const willDelete = yes && !dryRun;
  const abandoned = Boolean(flags.abandoned);
  const stages = abandoned ? ['merged', 'abandoned'] : ['merged'];
  const jobsDir = factory.resolveDir(cwd, flags);
  const archiveDir = factory.archiveDirOf(jobsDir);
  const line = (text) => stdout.write(text + '\n');
  const locations = [{ name: 'jobs', dir: jobsDir }, { name: 'archive', dir: archiveDir }];
  const result = {
    dryRun, yes, willDelete, abandoned, locations: {},
    candidates: [], deleted: [], skippedOpen: 0, kept: 0, skippedAbandoned: 0, skippedInvalid: [],
  };

  for (const loc of locations) {
    const sel = factory.selectClosedJobs(loc.dir, { all, now, stages });
    result.locations[loc.name] = { dir: loc.dir, exists: sel.exists };
    if (!sel.exists) continue;
    result.skippedOpen += sel.skippedOpen;
    result.kept += sel.kept;
    result.skippedAbandoned += sel.skippedAbandoned;
    for (const { id, reason } of sel.skippedInvalid) result.skippedInvalid.push({ location: loc.name, id, reason });
    for (const c of sel.candidates) result.candidates.push({ location: loc.name, id: c.id, dir: c.dir, stage: c.stage });
  }

  if (willDelete) {
    for (const c of result.candidates) {
      fs.rmSync(c.dir, { recursive: true });
      result.deleted.push(c);
    }
  }

  const verb = willDelete ? 'Deleted' : 'Would delete';
  if (result.candidates.length) {
    line(`${verb} ${result.candidates.length} closed job(s):`);
    for (const c of result.candidates) line(`  [${c.location}] ${c.id}  ${c.stage}`);
    const count = (name) => result.candidates.filter((c) => c.location === name).length;
    line(`  per location: jobs ${count('jobs')}, archive ${count('archive')}`);
  } else {
    line('No closed jobs to delete.');
  }
  if (!willDelete && result.candidates.length) {
    line(dryRun ? 'Dry run: nothing deleted.' : 'Nothing deleted. Rerun with --yes to delete these permanently.');
  }
  line(`Skipped ${result.skippedOpen} open job(s) (never deleted).`);
  if (result.skippedInvalid.length) {
    line(`Skipped ${result.skippedInvalid.length} invalid (not deleted):`);
    for (const { location, id, reason } of result.skippedInvalid) line(`  [${location}] ${id}  ${reason}`);
  }
  if (!all && result.kept) {
    line(`Kept ${result.kept} closed job(s) newer than ${factory.DEFAULT_AGE_DAYS} days (--all deletes them too).`);
  }
  if (!abandoned && result.skippedAbandoned) {
    line(`Kept ${result.skippedAbandoned} abandoned job(s) (--abandoned deletes them too).`);
  }
  return result;
}

module.exports = { cmdFactoryPrune };
