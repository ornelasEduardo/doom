---
description: Scaffolds a new component with implementation, styles, stories, and tests.
---

1. Create the component directory: `components/[ComponentName]`
2. Create the implementation file `components/[ComponentName]/[ComponentName].tsx`:

   ```tsx
   import React from "react";
   import clsx from "clsx";
   import styles from "./[ComponentName].module.scss";

   export interface [ComponentName]Props {
     className?: string;
     children?: React.ReactNode;
   }

   export const [ComponentName] = ({ className, children }: [ComponentName]Props) => {
     return <div className={clsx(styles.root, className)}>{children}</div>;
   };
   ```

3. Create the styles file `components/[ComponentName]/[ComponentName].module.scss`:

   ```scss
   @use "../../styles/mixins" as m;

   .root {
     @include m.base-interactive;
     // Add component-specific styles here
   }
   ```

4. Create the index file `components/[ComponentName]/index.ts`:
   ```ts
   export * from "./[ComponentName]";
   ```
5. Create the stories file `components/[ComponentName]/[ComponentName].stories.tsx`:

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

6. Create the test file `components/[ComponentName]/[ComponentName].test.tsx`:

   ```tsx
   import { render, screen } from "@testing-library/react";
   import { describe, it, expect } from "vitest";
   import { [ComponentName] } from "./[ComponentName]";

   describe("[ComponentName] Component", () => {
     it("renders correctly", () => {
       render(<[ComponentName]>Test Content</[ComponentName]>);
       expect(screen.getByText("Test Content")).toBeInTheDocument();
     });
   });
   ```

7. Run tests to verify the new component:
   ```bash
   npm test -- components/[ComponentName] --run
   ```
