# Implement Fixes

Implement bug fixes and corrections with proper validation and documentation.

## Usage

```
/implement-fixes {{ISSUE_KEY}}-456
/implement-fixes "Fix authentication timeout issue"
```

## Orchestrator Checkpoint

> **🛑 Every fix runs the delivery loop** in [implement.md](implement.md). Initialize steps 1 and 2 below
> before any reproduction or build. Then one builder reproduces and fixes the bug, and the orchestrator
> repeats verify, review and decide until the fix is accepted or a stop condition is reached. Do not
> fix the bug inline, and do not write a spec or plan first.
> For several unrelated bugs, run one loop per bug, each with its own builder. Use
> `dispatching-parallel-agents` only when their root causes and files do not overlap.

## Workflow Modes

1. **Issue-Based Fixes**: For tracked fixes requiring documentation
2. **Direct Code Fixes**: For quick fixes without issue tracking

## Process

> **📋 Standards**: Follow [Coding Standards](../rules-snippets/coding-standards.md) and [Documentation](../rules-snippets/documentation.md).

1. **Load Fix Context** (orchestrator, before any build):
   - Retrieve issue details if applicable
   - The reported bug and any stated expected behavior are the requirement. Do not require a spec or plan first.
   - Identify the affected code areas
   - Turn the requirements into acceptance criteria, one per requirement: for example "the reported behavior no longer occurs" and "existing behavior the bug touches still works". Discover the real checks as in [implement.md](implement.md) step 1.

2. **Create Fix Branch and Capture Baseline** (orchestrator, before any build):

   ```bash
   git checkout {{DEFAULT_BRANCH}}
   git pull origin {{DEFAULT_BRANCH}}
   git checkout -b fix/{{FIX_DESCRIPTION}}
   ```

   Then take the baseline snapshot as in implement.md step 1, before any build.

3. **Reproduce and Build** (builder, implement.md step 2):
   - Dispatch one builder with the bug report, the AC list, the discovered checks, the base commit and the baseline.
   - The builder identifies the root cause and writes a **failing test that reproduces the bug**. It watches the test fail for the right reason, then makes the minimal change that passes it. The reproduction belongs to the builder, not to the orchestrator.
   - Fix only the reported issue. Maintain backward compatibility. Leave all changes uncommitted, including new files.

4. **Verify, Review and Decide** (repeat implement.md steps 3, 4 and 5 until an exit):
   - Verify: rerun the reproducing test and confirm it passes now, run every check that covers an AC, and run the full test suite for regressions.
   - Review: the independent read-only reviewer checks the fix, the reproducing test, and the untracked files.
   - Decide: repair goes back to the same builder. Repeat until `ACCEPTED`, `BLOCKED`, or `NOT ACCEPTED: needs decision`. There is no round limit. A review PASS alone never accepts.

5. **Commit and Push** (only after `ACCEPTED`, and only when there are accepted changes): stage only the fix's paths, never `git add -A` or a foreign change. Skip the commit when nothing is staged.
   ```bash
   git commit -m "fix({{SCOPE}}): {{FIX_DESCRIPTION}}"
   git push -u origin fix/{{FIX_DESCRIPTION}}
   ```

6. **Create Pull Request** (only after `ACCEPTED`):
   - Target: `{{DEFAULT_BRANCH}}`
   - Include:
     - Root cause explanation
     - Fix approach description
     - Testing performed, with the reproducing test and its failing-then-passing output
     - Potential impacts

7. **Report Status**:
   - Bug fixed and root cause
   - Review verdict and `ACCEPTED`, or `BLOCKED` / `NOT ACCEPTED` with the open items
   - Validation evidence per AC
   - PR ready for review (only when accepted)

   **Include a Fixes Applied table** summarizing every change:

   ```markdown
   ## Fixes Applied

   | File | Issue | Fix |
   | ---- | ----- | --- |
   | `PostsCategory.php` | Missing `BelongsTo` import → fatal runtime error | Added `use Illuminate\Database\Eloquent\Relations\BelongsTo;` |
   | `PostsCategory.php` | Timestamp constants with no DB columns | Replaced `CREATED_AT`/`UPDATED_AT` constants with `public $timestamps = false` |
   | `Metadata.php` | `deleted_at` cast with no SoftDeletes/column | Removed spurious `'deleted_at' => 'datetime'` cast |
   | `Metadata.php` | Two unreachable `break` after `return` | Removed the dead `break` statements |
   | `Follow.php` | `end_date` missing from `$casts` | Added `'end_date' => 'datetime'` |
   | `Follow.php` | `end_date` assigned twice in `beforeDelete()` | Removed the redundant first assignment |
   | `LoginController.php` | `Request` used but not imported → fatal error | Added `use Illuminate\Http\Request;` |
   | `RegisterController.php` | Unused `Str` import | Removed `use Illuminate\Support\Str;` |
   ```

   Every fix must appear in this table — one row per file+issue pair.

## Fix Guidelines

- **Minimal Scope**: Fix only the reported issue
- **No Refactoring**: Avoid unrelated code changes
- **Backward Compatible**: Don't break existing functionality
- **Test First**: The builder writes a failing test reproducing the bug before writing the fix — no exceptions
- **Document**: Record the fix in changelog if significant

## Documentation

For significant fixes, document in `docs/fixes/` or `CHANGELOG.md`:

```markdown
## [{{VERSION}}] - {{DATE}}

### Fixed

- {{FIX_DESCRIPTION}} ({{ISSUE_KEY}})
  - Root cause: {{ROOT_CAUSE}}
  - Solution: {{SOLUTION}}
```
