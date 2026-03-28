# Doom Design System — Claude Code

## Plugin

Full AI skills, agents, hooks, and commands are available as a plugin.

**Via official marketplace** (once approved):
```bash
/plugin install doom-design-system@claude-plugins-official
```

**Self-hosted (available now)**:
```bash
/plugin marketplace add ornelasEduardo/doom
/plugin install doom-design-system@doom
```

## Without the plugin

Read `.agents/skills/doom-design-system/SKILL.md` directly for architecture rules, component reference, and coding standards.

## Quick Reference

| Action    | Command              |
|-----------|----------------------|
| Test      | `npm test -- --run`  |
| Build     | `npm run build`      |
| Verify    | `npm run verify`     |
| Storybook | `npm run storybook`  |

Component docs: `.agents/skills/doom-design-system/components/<name>.md`

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
| `/doom-design-system:new-component [Name]` | Scaffold a new component |
| `/doom-design-system:a2ui [description]` | Generate A2UI JSON |
| `/doom-design-system:doom-review [path?]` | Run accessibility audit on staged or specified components |
