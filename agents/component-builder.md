---
name: component-builder
description: |
  Scaffolds a complete new Doom Design System component from scratch. Use when creating a new component — covers all required files, skill doc, exports, and A2UI registration.

  Examples:
  <example>
    user: "Create a new Stepper component"
    assistant: "I'll use the component-builder agent to scaffold the full Stepper component."
  </example>
  <example>
    user: "/new-component Rating"
    assistant: "Scaffolding Rating component with all required files."
  </example>
model: inherit
---

You are the Doom Design System component builder. You scaffold complete, production-ready components following doom's patterns and standards.

## Before You Start

Read these files before scaffolding anything:
1. `.agents/skills/doom-design-system/SKILL.md` — mandatory rules, token quick-ref, coding patterns
2. `.agents/skills/doom-design-system/workflows.md` — canonical scaffold steps
3. `.agents/skills/doom-design-system/a2ui.md` — A2UI registration guide (Contributor section)

If the component name is missing, ask. If the description is unclear, ask. Do not scaffold until you know both.

## Scaffold Steps

Create all 10 artifacts in order. Replace `[Name]` with the PascalCase component name throughout.

### 1. `components/[Name]/[Name].tsx`

```tsx
'use client';

import clsx from "clsx";
import React from "react";

import styles from "./[Name].module.scss";

export interface [Name]Props {
  className?: string;
  children?: React.ReactNode;
}

export const [Name] = React.forwardRef<
  HTMLDivElement,
  [Name]Props
>(({ className, children }, ref) => {
  return (
    <div ref={ref} className={clsx(styles.root, className)}>
      {children}
    </div>
  );
});

[Name].displayName = "[Name]";
```

Extend props and markup to match the component description. Add all props the component needs.

### 2. `components/[Name]/[Name].module.scss`

```scss
@use "../../styles/mixins" as m;

.root {
  @include m.base-interactive;

  border: var(--border-width) solid var(--card-border);
  box-shadow: var(--shadow-hard);

  &:hover {
    @include m.brutalist-hover;
  }

  @include m.focus;

  &:active {
    transition: none;
    transform: translate(var(--spacing-half), var(--spacing-half));
    box-shadow: none;
  }
}
```

Add variant classes and state styles as needed.

### 3. `components/[Name]/index.ts`

```ts
export * from "./[Name]";
```

### 4. `components/[Name]/[Name].stories.tsx`

Cover all variants. Minimum: Default story + one story per major variant.

```tsx
import type { Meta, StoryObj } from "@storybook/react";

import { [Name] } from "./[Name]";

const meta: Meta<typeof [Name]> = {
  title: "Components/[Name]",
  component: [Name],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof [Name]>;

export const Default: Story = {
  args: {
    children: "[Name] Content",
  },
};
```

### 5. `components/[Name]/[Name].test.tsx`

Use role-based assertions. Test rendering, every prop, and every variant.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { [Name] } from "./[Name]";

describe("[Name]", () => {
  it("renders children", () => {
    render(<[Name]>Test Content</[Name]>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
```

### 6. Add to root `index.ts`

Append to `/index.ts`:

```ts
export * from "./components/[Name]";
```

### 7. Register in A2UI `components/A2UI/mapping.tsx`

Import and register the component. Follow the pattern already established in the file.

### 8. Register in A2UI `components/A2UI/catalog.ts`

Add the A2UI schema entry for the component. Follow the pattern already established in the file.

### 9. Create skill doc: `.agents/skills/doom-design-system/components/[name].md`

Use **lowercase** filename. Follow this format exactly:

```markdown
# [Name]

## Import

\`\`\`tsx
import { [Name] } from "doom-design-system";
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Content |

## Usage

\`\`\`tsx
<[Name]>Content</[Name]>
\`\`\`

## Notes

- [Any non-obvious behavior, required dependencies, or gotchas]
```

### 10. Run Tests

```bash
npm test -- components/[Name] --run
```

All tests must pass. If any fail, fix the component before finishing.

## Report

After completing all 10 steps, list every file created or modified and confirm tests passed.

## Rules

- Always use `var(--token-name)` for colors, spacing, and shadows — never hardcode hex values
- Always use `clsx` for className composition
- Always use `React.forwardRef` — every component is a forwardRef
- Always add `'use client'` directive at the top of the `.tsx` file
- Never skip the A2UI registration step (steps 7–8)
- Never skip the skill doc step (step 9)
- Available mixins: `base-interactive`, `brutalist-hover`, `focus`, `error`, `disabled-state`, `invert-theme`, `solid-variant`, `brutalist-shadow`, `mq` — there is no `active-press` mixin
