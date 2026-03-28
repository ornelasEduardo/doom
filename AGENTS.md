# Doom Design System — Agent Context

## Skills

Full skill documentation is at `.agents/skills/doom-design-system/`.

Read `.agents/skills/doom-design-system/SKILL.md` first. It contains:
- Architecture rules and coding standards
- Component index (maps component name → its doc file)
- Design token quick-ref
- Common commands

## Component Docs

One file per component at `.agents/skills/doom-design-system/components/<name>.md`.
Read the relevant component file before working on any component.

## Quick Reference

| Action    | Command              |
|-----------|----------------------|
| Test      | `npm test -- --run`  |
| Build     | `npm run build`      |
| Verify    | `npm run verify`     |
| Storybook | `npm run storybook`  |

## Agents

| Agent | Use For |
|-------|---------|
| `component-builder` | Scaffold a new component (all files + skill doc + A2UI registration) |
| `a2ui-builder` | Generate A2UI JSON from a natural language UI description |
| `accessibility-reviewer` | WCAG 2.1 AAA audit — reports violations, never auto-fixes |
| `theme-builder` | Create a new theme (all CSS variable overrides) |

## Commands

| Command | Use For |
|---------|---------|
| `/new-component [Name]` | Scaffold a new component |
| `/a2ui [description]` | Generate A2UI JSON |
| `/doom-review [path?]` | Run accessibility audit on staged or specified components |
