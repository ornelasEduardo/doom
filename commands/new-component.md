---
description: "Scaffolds a complete new Doom Design System component. Usage: /new-component [Name] or /new-component [Name] --spec path/to/spec.md"
---

Use the `component-builder` agent to scaffold a new component.

Extract from the command arguments:
- **Component name** (required, PascalCase) — ask if not provided
- **Description** (optional one-liner) — pass to agent if provided
- **Spec file** (optional) — `--spec path/to/spec.md` — pass to agent if provided

Then invoke the `component-builder` agent with the name, description, and spec path (if given).
