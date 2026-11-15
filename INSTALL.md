# Install the AI-Assisted Development Toolkit

These instructions are a task document for any AI coding tool, including Claude Code, Codex, Replit, Lovable, Cursor, Copilot, and OpenCode. Follow them in the **target project's root**, not in a clone of the toolkit source.

Source: https://github.com/ninjasitm/ai-assisted-dev-toolkit

Package: `nitm-ai-dev-toolkit`

## Prerequisites and limitations

Automatic setup requires project file access, a terminal, Node.js 18+ with npm/npx, and access to npm. These instructions work through ordinary project access, not a tool-specific integration. Hosted tools may not expose these capabilities or automatically load the resulting instruction files. Report those limits rather than claim setup succeeded.

## Installation steps

1. Inspect this project's root, existing AI instructions, and working-tree
   changes. Preserve application code, secrets, and existing customizations.
   Identify the actual AI tool/runtime from session evidence; ask me if unclear.
   Do not infer active tools from configuration folders alone.

2. Check whether you can read/write project files and run shell commands,
   and whether Node.js 18+ and npm/npx are available. If anything is missing,
   stop and explain the limitation. Give me the exact manual steps to run
   the install command below in my project root, then return here for setup.
   Do not install system software or claim to have run commands you cannot run.

3. If I use OpenCode, run `opencode --version` before installing anything.
   Require OpenCode V2 (at least 2.0.7 when using oh-my-opencode-slim 3+).
   Stop if the version is missing, unparseable, or unsupported; ask me to
   upgrade OpenCode or stay on toolkit 3.x. Do not write toolkit files or
   version markers until this check passes. For other tools, skip this check.

   In the project root, run:

   ```bash
   npx nitm-ai-dev-toolkit install
   ```

   Let the installer detect single-repo versus monorepo layout. Do not invent
   `--env` values for tools such as Replit or Lovable; the default includes all
   supported harnesses. If existing files conflict or the toolkit is already
   installed, stop and ask before patching, upgrading, or overwriting anything.
   Never use `--force` or delete existing configuration to bypass a conflict.

4. After a successful install, read and follow `.nitm/BOOTSTRAP.md` as a task
   document, including the files it tells you to read. Configure for this
   project and the tools I actually use. Ask only for values you cannot detect
   and approvals required by bootstrap. Do not assume `/bootstrap` is a native
   command or that your tool automatically loads these instruction files.

5. Run:

   ```bash
   npx nitm-ai-dev-toolkit doctor
   ```

   Report what was installed/configured, checks actually run, unresolved
   placeholders or warnings, and any manual activation steps or tool limits.
   Distinguish files being installed from instructions actually being loaded.
   Do not commit or push changes.

For manual copying instead, see [Usage](README.md#usage). For installer options and existing installations, see [CLI (npx)](README.md#cli-npx).
