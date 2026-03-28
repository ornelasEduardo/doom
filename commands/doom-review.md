---
description: "Runs an accessibility audit on one or more components. Usage: /doom-review or /doom-review [component-path]"
---

Use the `accessibility-reviewer` agent to audit components for WCAG 2.1 AAA compliance.

**If a path was provided** (e.g., `/doom-review components/Button`):
Pass that path directly to the `accessibility-reviewer` agent.

**If no path was provided**:
Run `git diff --name-only --staged` to get staged component files.
Filter for files under `components/` and pass those paths to the `accessibility-reviewer` agent.
If no component files are staged, ask: "Which component would you like me to review? (e.g., components/Button)"
