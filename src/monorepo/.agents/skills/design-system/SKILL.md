---
name: design-system
description: Use when building or changing UI so it reuses the project's existing design system (tokens, shared components, design references) instead of inventing new styles. Applies only to projects or apps that have a UI.
---

# Design System

Make UI work match what the project already has. This skill sets no visual style. The project's own docs, tokens, and components are the standard.

**When to use:** adding or changing screens, components, styles, or copy that users see.

**Skip:** no visual change, or backend-only work.

## 1. Find the source of truth

Before writing UI, look for these and read what exists:

- Design system or style guide docs (search `docs/`, the app or package README, `AGENTS.md`, Storybook or similar).
- Token definitions: colors, spacing, type scale, radii, shadows, breakpoints (theme files, CSS variables, config).
- Shared components or a UI package, and the nearest similar screen.
- Design references the project links to (Figma, mockups, screenshots).

Name the files you used. In a monorepo, use the docs and components of the app you are changing, and its shared UI package, before anything at the root.

## 2. Reuse before adding

- Use existing tokens and components. No hard-coded values where a token exists.
- Follow the project's component conventions and naming, and the nearest similar component.
- Add a new component or token only when nothing fits. Put it where the project keeps shared ones.

## 3. Cover the states

For each new or changed view, check: loading, empty, error, disabled, focus, and hover where relevant. Check a narrow and a wide viewport. Follow the project's accessibility rules (labels, keyboard use, contrast).

## 4. Verify in proportion

When a dev server and browser tool are available, look at the changed view at a narrow and a wide width. For a small change, tests or a code read can be enough. Say what you did not check.

## 5. Flag gaps, do not fabricate

If the project has no documented token, pattern, or reference for what you need, say so and ask. Do not invent a standard and present it as the project's. Link to the existing doc instead of copying it into a new one.

## Report

List the sources used, what was reused, anything new you added and why, and any gaps or unchecked states.
