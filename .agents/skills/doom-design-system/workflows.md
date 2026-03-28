# Doom Workflows

## New Component

Use this workflow whenever scaffolding a new component from scratch.

### Steps

1. Create directory: `components/[ComponentName]/`

2. Create `components/[ComponentName]/[ComponentName].tsx`:

```tsx
'use client';

import clsx from "clsx";
import React from "react";

import styles from "./[ComponentName].module.scss";

export interface [ComponentName]Props {
  className?: string;
  children?: React.ReactNode;
}

export const [ComponentName] = React.forwardRef<
  HTMLDivElement,
  [ComponentName]Props
>(({ className, children }, ref) => {
  return (
    <div ref={ref} className={clsx(styles.root, className)}>
      {children}
    </div>
  );
});

[ComponentName].displayName = "[ComponentName]";
```

3. Create `components/[ComponentName]/[ComponentName].module.scss`:

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

4. Create `components/[ComponentName]/index.ts`:

```ts
export * from "./[ComponentName]";
```

5. Create `components/[ComponentName]/[ComponentName].stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";

import { [ComponentName] } from "./[ComponentName]";

const meta: Meta<typeof [ComponentName]> = {
  title: "Components/[ComponentName]",
  component: [ComponentName],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof [ComponentName]>;

export const Default: Story = {
  args: {
    children: "[ComponentName] Content",
  },
};
```

6. Create `components/[ComponentName]/[ComponentName].test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { [ComponentName] } from "./[ComponentName]";

describe("[ComponentName]", () => {
  it("renders children", () => {
    render(<[ComponentName]>Test Content</[ComponentName]>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
```

7. Add export to root `index.ts`:

```ts
export * from "./components/[ComponentName]";
```

8. Register in A2UI — see `a2ui.md` Contributor Guide.

9. Create skill doc at `.agents/skills/doom-design-system/components/[componentname].md` following the format of any existing component doc.

10. Run tests:

```bash
npm test -- components/[ComponentName] --run
```

---

## Storybook

1. Install dependencies if not already done:

```bash
npm install
```

2. Start Storybook:

```bash
npm run storybook
```

3. Open `http://localhost:6006` in your browser to view the component documentation.
