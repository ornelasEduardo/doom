# Agent Coding Rules & Standards

These rules must be followed for all code generation and modification tasks within the `doom` design system.

## 0. Communication Protocol (Experienced Engineer)

- **Conciseness**: Be succinct. Avoid fluff, filler, and stating the obvious. Focus on the _actions_ and _technical rationale_.
- **Competence Assumption**: Assume the user is an experienced engineer. Do not over-explain basic concepts (e.g., standard React patterns, basic CSS) unless explicitly asked.
- **High-Quality Options**: Propose options _only_ when:
  1.  The request is ambiguous or has multiple valid high-level architectural approaches.
  2.  You detect a significant risk or deviation from best practices in the user's request.
  - Otherwise, proceed with the most optimal, standard implementation immediately.

## 1. Component Architecture

- **Reusability**: Components must be generic, reusable, and composable. Avoid business logic.
- **Props**: Expose sufficient props for customization (className, style, children, etc.) but enforce consistency via variants.
- **Exports**: All public components must be exported from the root `index.ts`.

## 2. Styling & Layout

- **NO Inline Styles**: Avoid the `style={{ ... }}` prop. Use styled-components/emotion.
- **Layout Components**: Use `Flex` and `Grid` for internal component layout where possible.
- **Spacing**: Use `gap` for spacing between elements.
- **Library**: Use `@emotion/styled` and `@emotion/react`.

## 3. Typography

- **Use Text Component**: Internally use the `<Text>` component for any text rendering.
- **Variants**: Use `variant="..."` (h1-h6, body, small, caption).
- **Colors**: Use `color="..."` (primary, muted, error, etc.) instead of hex codes.

## 4. Theming & Colors

- **CSS Variables Only**: Never use hardcoded hex values. Use the defined CSS variables.
  - `var(--primary)`
  - `var(--card-bg)`
  - `var(--card-border)`
  - `var(--muted-foreground)`
- **Borders**: Always use `var(--border-width)` and `var(--radius)`.

## 5. Icons

- **Library**: Use `lucide-react`.
- **Standard Props**: Always set `strokeWidth={2.5}` for the neubrutalism aesthetic.
- **Sizing**: Use the `size` prop (e.g., `size={24}`).

## 6. File Organization & Imports

- **Colocation**: Keep related files together (Component, Stories, Tests).
- **Relative Imports**: Use relative imports (e.g., `../../components/...`) for internal dependencies. Do NOT use path aliases like `@/`.

## 7. TypeScript & Safety

- **Strict Typing**: Define explicit interfaces for all component props.
- **No Any**: Avoid using `any`.
- **Prop Types**: Use specific union types for string props (e.g., `variant: 'primary' | 'secondary'`).

## 8. React Patterns

- **'use client'**: Explicitly add `'use client';` at the top of components to ensure compatibility with Next.js App Router consumers.
- **ForwardRef**: Ensure primitive components forward refs to the underlying DOM element.

## 9. Documentation & Testing

- **Storybook**: Every component MUST have a corresponding `.stories.tsx` file.
- **Maintenance**: If you add/modify props, you **MUST** update the Storybook file.
- **Examples**: Stories should cover all major variants and states.
- **Unit Tests**: Create/update unit tests (`.test.tsx`) for all components using `vitest`.

## 10. Accessibility Standards

- **Color Contrast**: Ensure all text and UI components meet **WCAG 2.1 AAA** standards.
- **Semantic HTML**: Use appropriate HTML tags (`<button>`, `<nav>`, `<main>`, `<h1>`-`<h6>`).
- **ARIA**: Use ARIA attributes only when semantic HTML is insufficient.
- **Focus Management**: Ensure all interactive elements are focusable and have visible focus states.

## 11. Code Quality & Readability

### Naming

- **Descriptive names**: Function and variable names must accurately describe what they represent
- **Self-documenting**: Code should be readable without comments; names should explain intent
- **Verbs for functions**: Use action verbs (e.g., `handleClick`, `fetchData`, `calculateTotal`)
- **Nouns for variables**: Use descriptive nouns (e.g., `selectedUser`, `isLoading`, `errorMessage`)

```typescript
// ✅ Good
const activeUserCount = users.filter((u) => u.isActive).length;
const findNearestDataPoint = (x: number) => { ... };

// ❌ Bad
const cnt = users.filter((u) => u.isActive).length;
const fn = (x: number) => { ... };
```

### Semantic Organization

- **Group related code**: Variables, functions, and statements that are related should be grouped together
- **Separate with blank lines**: Use blank lines to separate semantic groups
- **Declarations vs statements**: Separate variable declarations from control flow statements (if/for/while) with a blank line
- **Logical ordering**: Declare variables at the top, then derived values, then handlers, then effects
- **Within function bodies**: Separate variable declarations, conditional checks, and effect statements (function calls, state updates) with blank lines

```typescript
// ✅ Good - semantic grouping in components
function Component() {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);

  // Derived values
  const isEmpty = !data || data.length === 0;
  const title = isOpen ? "Close" : "Open";

  // Handlers
  const handleToggle = () => setIsOpen(!isOpen);
  const handleSubmit = () => { ... };

  // Effects
  useEffect(() => { ... }, []);

  return ( ... );
}

// ✅ Good - separation within event handlers/functions
const handleInteraction = (event: Event) => {
  // Variables
  const svgNode = element.ownerSVGElement;
  const svgRect = svgNode.getBoundingClientRect();
  let clientX: number;
  let clientY: number;

  // Conditionals
  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // Derived calculations
  const px = clientX - svgRect.left;
  const py = clientY - svgRect.top;

  // Effect (state update, API call, etc.)
  setHoverState({ x: px, y: py, data: d });
};

// ❌ Bad - no separation, hard to scan
const handleInteraction = (event: Event) => {
  const svgNode = element.ownerSVGElement;
  const svgRect = svgNode.getBoundingClientRect();
  let clientX: number;
  let clientY: number;
  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  const px = clientX - svgRect.left;
  const py = clientY - svgRect.top;
  setHoverState({ x: px, y: py, data: d });
};
```

### Cognitive Load Reduction

- **Single responsibility**: Each function should do ONE thing well
- **Extract early**: Break complex logic into smaller, named functions
- **Avoid deep nesting**: Maximum 2-3 levels of nesting; extract to functions if deeper
- **Short functions**: Aim for functions that fit on one screen (~20-30 lines max)
- **Early returns**: Use guard clauses to handle edge cases first, reducing nesting
- **Const by default**: Use `const`; only use `let` when reassignment is truly needed
- **Named constants**: Replace magic numbers/strings with descriptive constants

```typescript
// ✅ Good - extracted helper
const findNearestPoint = (x: number): DataPoint | null => {
  const index = Math.round(x / step);
  return data[Math.min(Math.max(0, index), data.length - 1)];
};

const handleInteraction = (event: Event) => {
  const [x, y] = getPointerCoords(event);
  const point = findNearestPoint(x);
  if (point) {
    updateTooltip(x, y, point);
  }
};

// ❌ Bad - everything inline
const handleInteraction = (event: Event) => {
  const rect = svg.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const index = Math.round(x / step);
  const point = data[Math.min(Math.max(0, index), data.length - 1)];
  if (point) {
    tooltipRef.current.style.transform = `translate(${x}px, ${y}px)`;
    setActiveData(point);
  }
};
```

### Right Tool for the Job

- **Readability first**: Choose the approach that reduces cognitive load and reads most clearly
- **Array methods**: Great for simple transformations, filtering, or when chaining 1-2 operations
- **For loops**: Better when logic is complex, has multiple conditions, or when chaining many array methods would be harder to follow
- **Avoid mutations**: Prefer creating new objects/arrays when practical

```typescript
// ✅ Array methods - clean for simple operations
const activeUsers = users.filter((u) => u.isActive);
const userNames = activeUsers.map((u) => u.name);

// ✅ For loop - clearer for complex logic with multiple conditions
let nearestData: T | null = null;
let minDist = Infinity;

for (const d of data) {
  const dist = Math.abs(pointerX - getCenter(d));

  if (dist < minDist && isValid(d)) {
    minDist = dist;
    nearestData = d;
  }
}

// ❌ Bad - chained array methods that are hard to follow
const result = data
  .filter((d) => isValid(d))
  .map((d) => ({ ...d, dist: Math.abs(pointerX - getCenter(d)) }))
  .reduce((acc, d) => (!acc || d.dist < acc.dist ? d : acc), null);
```

### Comments

- **Minimal comments**: Code should be self-explanatory; avoid obvious comments
- **Why, not what**: If a comment is needed, explain WHY, not WHAT the code does
- **No commented-out code**: Delete unused code; it's in version control if needed

```typescript
// ✅ Good - explains non-obvious behavior
// Delay prevents flickering when moving between adjacent chart elements
hideTimeoutRef.current = setTimeout(() => setActiveData(null), 16);

// ❌ Bad - states the obvious
// Set the active data to null
setActiveData(null);
```

## 12. Code Formatting (ESLint + Prettier)

### Prettier Rules

- **Trailing Commas**: ALWAYS include trailing commas on multi-line:
  - Function parameters
  - Object properties
  - Array elements
  - JSX props
  - Import statements
- **Semicolons**: Always use semicolons
- **Quotes**: Use double quotes for strings
- **Indentation**: 2 spaces
- **Max Line Length**: 80 characters (URLs, strings, and template literals are exempt)

### ESLint Rules

#### Import Sorting (`simple-import-sort`)

- **Order**: Imports must be sorted alphabetically within groups
- **Groups**: Separate groups with blank lines:
  1. External packages (react, next, etc.)
  2. Internal imports (relative paths)
- **Named imports**: Sort alphabetically inside braces

```typescript
// ✅ Correct
import clsx from "clsx";
import React, { useEffect, useMemo, useRef } from "react";

import { Card } from "../Card/Card";
import { Stack } from "../Layout/Layout";
import styles from "./Chart.module.scss";

// ❌ Wrong - unsorted
import { Stack } from "../Layout/Layout";
import { Card } from "../Card/Card";
import React from "react";
```

#### JSX Prop Sorting (`react/jsx-sort-props`)

- **Order**: Props must be sorted alphabetically
- **Shorthand first**: Boolean shorthand props come first
- **Callbacks last**: Event handlers (onClick, onChange, etc.) come last
- **Reserved first**: `key` and `ref` always come first

```tsx
// ✅ Correct
<Button
  key={id}
  ref={buttonRef}
  disabled
  visible
  className={styles.button}
  label="Submit"
  variant="primary"
  onChange={handleChange}
  onClick={handleClick}
/>

// ❌ Wrong - unsorted, callbacks not last
<Button
  onClick={handleClick}
  label="Submit"
  disabled
  variant="primary"
/>
```

#### Curly Braces (`curly`)

- **Always use braces**: Even for single-line if/else/for/while statements

```typescript
// ✅ Correct
if (condition) {
  doSomething();
}

// ❌ Wrong
if (condition) doSomething();
```

#### Unused Code (`unused-imports`)

- **Remove unused imports**: Delete any import not used in the file
- **Unused variables**: Prefix with underscore `_` if intentionally unused

```typescript
// ✅ Correct - underscore prefix for unused
const [_value, setValue] = useState();

// ❌ Wrong - unused import/variable
import { UnusedComponent } from "./components";
const unusedVar = 123;
```

#### No ESLint Disable

- **Never use `eslint-disable` comments** - fix the underlying issue instead

### Quick Reference

| Rule            | Requirement                  |
| --------------- | ---------------------------- |
| Trailing commas | Always on multi-line         |
| Import order    | Alphabetical, grouped        |
| JSX props       | Alphabetical, callbacks last |
| Curly braces    | Always required              |
| Unused imports  | Remove them                  |
| Unused vars     | Prefix with `_`              |
| eslint-disable  | Never use                    |

## 13. Skills

### Proactive Reading

- **Check related skills first**: Before modifying a component, token, or style, check if a corresponding `.agent/skills/doom/*.md` file exists. If so, read it to understand patterns and conventions.

### Maintenance

- **Keep skills in sync**: When modifying code that has a corresponding skill file, you MUST update the skill to reflect any changes.
