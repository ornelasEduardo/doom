# Agent Cheat Sheet (Doom Design System)

This file is a quick reference for AI agents working on this codebase. It consolidates common commands, architectural patterns, and file locations.

## ⚡️ Common Commands

| Action        | Command             | Description                                           |
| :------------ | :------------------ | :---------------------------------------------------- |
| **Test**      | `npm test -- --run` | Run all unit tests (Vitest).                          |
| **Storybook** | `npm run storybook` | Start Storybook dev server on port 6006.              |
| **Build**     | `npm run build`     | Build the package (`dist/`).                          |
| **Verify**    | `npm run verify`    | Run linting, build validation, and integration tests. |

## 📍 Key Locations

| Context           | Path                                   | Notes                                     |
| :---------------- | :------------------------------------- | :---------------------------------------- |
| **Components**    | `components/{Name}/{Name}.tsx`         | Main component implementation.            |
| **Styles**        | `components/{Name}/{Name}.module.scss` | Component-specific styles (SCSS Modules). |
| **Stories**       | `components/{Name}/{Name}.stories.tsx` | Storybook stories.                        |
| **Tests**         | `components/{Name}/{Name}.test.tsx`    | Unit tests.                               |
| **Global Mixins** | `styles/_mixins.scss`                  | Shared SCSS mixins (hover, focus, etc.).  |
| **Skills**        | `.agent/skills/doom/`                  | detailed documentation for agents.        |

## 🏗 Architecture Patterns

### Component Composition

Use explicit namespaced sub-components for container-like elements to allow flexibility.
**Pattern:**

```tsx
// Definition
const Root = ({ children }) => <div className={styles.root}>{children}</div>;
const Header = ({ children }) => (
  <div className={styles.header}>{children}</div>
);

export const Component = Object.assign(Root, { Header, Body, Footer });

// Usage
<Component>
  <Component.Header>Title</Component.Header>
  <Component.Body>Content</Component.Body>
</Component>;
```

**Used in:** `Modal`, `Drawer`, `Sheet`, `Chart`.

### Styling Philosophy (Neubrutalist)

- **Bold**: High contrast, bold fonts (700+ for headers/triggers).
- **Hard Edges**: Borders often `2px solid var(--primary)`.
- **Shadows**: Hard shadows (`box-shadow: 4px 4px 0px 0px var(--shadow-primary)`).
- **Interactive**: UPPERCASE text, letter-spacing, aggressive hover states.

**Common SCSS Imports:**

```scss
@use "../../styles/mixins" as m;

.root {
  @include m.base-interactive; // Sets basic transitions and cursor
  @include m.active-press; // Press effect

  &:hover {
    @include m.brutalist-hover; // The signature hover effect
  }

  @include m.focus; // Accessible focus ring + shadow lift
}
```

## 🎨 Common Tokens (CSS Variables)

| Category    | Token                      | Value (Approx)                            |
| :---------- | :------------------------- | :---------------------------------------- |
| **Colors**  | `--primary`                | Main purple brand color                   |
|             | `--bg` / `--card-bg`       | Background colors (often #fff or #f0f0f0) |
|             | `--text-base` / `--size-*` | Typography and sizing                     |
| **Spacing** | `--spacing-xs`             | 0.25rem (4px)                             |
|             | `--spacing-sm`             | 0.5rem (8px)                              |
|             | `--spacing-md`             | 0.75rem (12px)                            |
|             | `--spacing-lg`             | 1rem (16px)                               |
| **Radius**  | `--radius`                 | Main border radius                        |
| **Shadow**  | `--shadow-primary`         | Hard shadow color                         |

## 🧪 Testing Guidelines

- Use `@testing-library/react`.
- Prefer `screen.getByRole` or `screen.getByText`.
- For Select/Combobox/Dropdown, check for `aria-expanded` states.

## 🛠 Conventions & Best Practices

| Category    | Rule                                                                                   |
| :---------- | :------------------------------------------------------------------------------------- |
| **Icons**   | Use `lucide-react`. Do not import from other libraries.                                |
| **Titles**  | Use `ReactNode` type for titles (not `string`), wrapped in a `<div>` if needed.        |
| **Exports** | `export * from './Component'` in `index.ts`. Named exports only.                       |
| **Margins** | Do NOT add default margins to text elements (`h1`-`h6`, `p`). Layouts control spacing. |

## 📋 New Component Checklist

When creating a new component (e.g., `Floop`), ensure you create:

1.  `components/Floop/Floop.tsx` (Implementation)
2.  `components/Floop/Floop.module.scss` (Styles)
3.  `components/Floop/Floop.stories.tsx` (Storybook)
4.  `components/Floop/Floop.test.tsx` (Tests)
5.  `components/Floop/index.ts` (Export)

**Scaffold Code:**

```tsx
// Floop.tsx
import React from "react";
import clsx from "clsx";
import styles from "./Floop.module.scss";

export interface FloopProps {
  className?: string;
  children?: React.ReactNode;
}

export const Floop = ({ className, children }: FloopProps) => {
  return <div className={clsx(styles.root, className)}>{children}</div>;
};
```

```scss
// Floop.module.scss
@use "../../styles/mixins" as m;

.root {
  // Base styles
}
```
