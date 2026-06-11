# Implement Fixes

Implement bug fixes and corrections with proper validation and documentation.

## Usage

```
/implement-fixes {{ISSUE_KEY}}-456
/implement-fixes "Fix authentication timeout issue"
```

## Orchestrator Checkpoint

> **🛑 For multiple independent fixes**: If fixing 2+ unrelated bugs, use `dispatching-parallel-agents`
> to dispatch one subagent per bug (different root causes, different files = parallel-safe).
> For a single focused fix, proceed directly — single-agent is appropriate.
> See `.claude/rules-snippets/subagent-workflow.md` for patterns.

## Workflow Modes

1. **Issue-Based Fixes**: For tracked fixes requiring documentation
2. **Direct Code Fixes**: For quick fixes without issue tracking

## Process

> **📋 Standards**: Follow [Coding Standards](../rules-snippets/coding-standards.md) and [Documentation](../rules-snippets/documentation.md).

1. **Load Fix Context**:
   - Retrieve issue details if applicable
   - Understand the reported bug
   - Identify affected code areas

2. **Create Fix Branch**:
   ```bash
   git checkout {{DEFAULT_BRANCH}}
   git pull origin {{DEFAULT_BRANCH}}
   git checkout -b fix/{{FIX_DESCRIPTION}}
   ```

3. **Implement Fix**:
   - Identify root cause
   - Make minimal, focused changes
   - Fix only the reported issue
   - Maintain backward compatibility

4. **Validate Fix**:
   - Run type checking: `{{PACKAGE_MANAGER}} run check-types`
   - Run tests: `{{PACKAGE_MANAGER}} run test`
   - Build: `{{PACKAGE_MANAGER}} run build`
   - Verify fix resolves the issue
   - Check for regressions

5. **Commit and Push**:
   ```bash
   git commit -m "fix({{SCOPE}}): {{FIX_DESCRIPTION}}"
   git push -u origin fix/{{FIX_DESCRIPTION}}
   ```

6. **Create Pull Request**:
   - Target: `{{DEFAULT_BRANCH}}`
   - Include:
     - Root cause explanation
     - Fix approach description
     - Testing performed
     - Potential impacts

7. **Report Status**:
   - Bug fixed and root cause
   - Validation completed
   - PR ready for review

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
- **Test Focus**: Add tests for the specific bug
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
