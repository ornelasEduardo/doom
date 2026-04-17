# Missing Components for 1.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 new components (ToggleGroup, Rating, Stepper, TreeView, Calendar/DatePicker) and enhance the component-builder skill to guarantee doom-style consistency.

**Architecture:** Phase 0 enhances tooling and extends Checkbox. Phases 1-3 build components in dependency order — simple first, complex last. Each component uses TDD, follows doom conventions, and ships with all required artifacts (source, styles, tests, stories, skill doc, A2UI registration).

**Tech Stack:** React 19, TypeScript, SCSS Modules, vitest, Storybook 10, clsx, lucide-react, date-fns (new peer dep), dnd-kit (existing), TanStack Virtual (existing)

**Design Spec:** `docs/superpowers/specs/2026-04-05-missing-components-design.md` — the authoritative reference for all props, tokens, doom-isms, and accessibility requirements. Every task below references specific sections of the spec.

---

## Phase 0: Tooling & Pre-Requisites

### Task 1: Enhance Component-Builder Skill

**Spec reference:** Pre-Requisite 1

**Files:**
- Modify: `skills/doom-design-system/SKILL.md`
- Modify: `agents/component-builder.md`

- [ ] **Step 1: Fix SKILL.md mixin import inconsistency**

In `skills/doom-design-system/SKILL.md`, change line 62:

```
- Always use `@use "../../styles/mixins" as m;` for interactive states
+ Always use `@use "../../styles/mixins" as *;` for interactive states
```

Also update the Neubrutalist Aesthetic example (around line 125-143) to use `as *` instead of `as m`, and remove the `m.` prefix from all mixin includes in that example.

- [ ] **Step 2: Add Doom Philosophy section to SKILL.md**

Add after the "Neubrutalist Aesthetic" section (after the code example, before "Component Reference"):

```markdown
### Doom Philosophy

Neubrutalism draws from early web brutalism and print design. The core principle: **every element announces itself**. Nothing is subtle. Form follows function with maximum honesty.

This means:
- Borders are visible and thick — elements don't float in space
- Shadows are hard and offset — depth is graphic, not photorealistic
- Hover states are physical — elements lift off the page like stickers
- Press states are physical — elements push into the page
- Disabled states are visual — hatched overlays say "blocked", not just faded
- Typography is bold and uppercase for labels — whisper nothing

When making design judgment calls, ask: "Would this feel at home on a punk zine or a protest poster?" If the answer is "it's too refined," make it bolder.

### When NOT to Use Mixins

Not every element is a control. These do NOT get hover/press/focus treatment:
- Plain text (`<Text>`, `<span>`, `<p>`)
- Icons used as decoration (not as buttons)
- Layout containers (`<Flex>`, `<Stack>`, `<Grid>`)
- Separators, dividers, connector lines
- Static labels, descriptions, badges (unless clickable)

Only interactive elements — things the user clicks, types into, or focuses — get the full mixin treatment.

Dense repeated elements (tree rows, table rows, list items) get a lighter touch: flat `--muted` background on hover instead of the full lift animation. Lifting 50 rows would be chaos.
```

- [ ] **Step 3: Add compound component template to component-builder.md**

Add after the existing "Scaffold Steps" section 3 (index.ts), as a new section titled "Compound Component Template":

```markdown
## Compound Component Template

Use this template instead of the simple template when the component has multiple subcomponents that share state (e.g., Tabs, Accordion, Stepper).

### Directory Structure

When a component has 3+ internal files beyond the base set (tsx, scss, test, stories, index), organize into subdirectories:

\`\`\`
components/[Name]/
  [Name].tsx                root component
  [Name].module.scss
  [Name].test.tsx
  [Name].stories.tsx
  index.ts

  context/                  if compound (shared state between parts)
    [Name]Context.ts

  components/               if has internal subcomponents
    [SubPart].tsx

  hooks/                    if has 2+ hooks
    use[Feature].ts

  types/                    if types are shared across files
    [name].ts

  utils/                    if has pure utility functions
    [util].ts
\`\`\`

### Context File Template

\`\`\`tsx
// context/[Name]Context.ts
'use client';

import { createContext, useContext } from "react";

export interface [Name]ContextValue {
  // shared state + setters
}

export const [Name]Context = createContext<[Name]ContextValue | null>(null);

export function use[Name]Context() {
  const context = useContext([Name]Context);
  if (!context) {
    throw new Error("[ChildComponent] must be used within <[Name]>");
  }
  return context;
}
\`\`\`

### Root Component Pattern

\`\`\`tsx
// [Name].tsx
'use client';

import { useState, useId } from "react";
import clsx from "clsx";
import { [Name]Context, type [Name]ContextValue } from "./context/[Name]Context";
import styles from "./[Name].module.scss";

export function [Name]({ value, defaultValue, onValueChange, children, className }: [Name]Props) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const baseId = useId();

  const setValue = (newValue: ValueType) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const contextValue: [Name]ContextValue = {
    value: currentValue,
    setValue,
    baseId,
  };

  return (
    <[Name]Context.Provider value={contextValue}>
      <div className={clsx(styles.root, className)}>
        {children}
      </div>
    </[Name]Context.Provider>
  );
}
\`\`\`
```

- [ ] **Step 4: Add mixin enforcement table and doom judgment calls**

Add to the end of `agents/component-builder.md`, before the existing "Rules" section:

```markdown
## Mixin Enforcement

Every interactive surface MUST use the appropriate mixins. This is non-negotiable:

| Surface Type | Required |
|---|---|
| Clickable control (button, toggle, nav arrow) | `@include base-interactive`, `@include brutalist-hover`, `@include focus`, active press CSS |
| Container/surface (panel, card, tree container) | `--shadow-hard` or `--shadow-sm`, `--card-bg`, `--card-border` |
| Disableable element | `@include disabled-state` |
| Focusable element | `@include focus` on `:focus-visible` |
| Error state | `@include error` |

## Doom Design Judgment (what mixins don't cover)

- Surfaces with a border and background probably need an offset shadow
- Dense repeated elements (tree rows, table rows) do NOT lift on hover — use flat `--muted` background
- Today/current indicators use bold markers (dots, thick borders), not subtle highlights
- Transitions are fast (`--duration-fast`) or instant — no slow fades, no slides
- Disabled items get a visual strike-through or hatched overlay, not just opacity
- Range/selection bands use `--primary` at 10% opacity with hard edges, not gradients
```

- [ ] **Step 5: Add test and story coverage checklists**

Add to `agents/component-builder.md`, replacing the minimal test template in step 5 with:

```markdown
### 5. `components/[Name]/[Name].test.tsx`

Use role-based assertions. Minimum required test coverage:

- Renders correctly (query by role, not by text content)
- Every variant renders without error (if applicable)
- Controlled mode: value prop drives state, onValueChange fires
- Uncontrolled mode: defaultValue sets initial, internal state updates
- Disabled state prevents interaction (click does not fire callback)
- Keyboard navigation works (if interactive)
- Accessibility attributes present (roles, aria-*)
- Compound components: child throws when used outside parent context
- Callbacks fire with correct arguments
```

Replace the minimal story template in step 4 with:

```markdown
### 4. `components/[Name]/[Name].stories.tsx`

Minimum required stories:

- `Default` — base usage with args
- One story per variant (if applicable)
- `Sizes` — sm/md/lg rendered side by side (if applicable)
- `Disabled` — disabled state
- `Controlled` — interactive render function demonstrating controlled state
- Compound components: full composition example showing all subcomponents
```

- [ ] **Step 6: Commit skill enhancement**

```bash
git add skills/doom-design-system/SKILL.md agents/component-builder.md
git commit -m "feat: enhance component-builder with compound templates, doom philosophy, and checklists"
```

---

### Task 2: Extend Checkbox with Indeterminate State

**Spec reference:** Pre-Requisite 2

**Files:**
- Modify: `components/Checkbox/Checkbox.tsx`
- Modify: `components/Checkbox/Checkbox.test.tsx`
- Modify: `components/Checkbox/Checkbox.stories.tsx`
- Modify: `skills/doom-design-system/components/checkbox.md`

- [ ] **Step 1: Write failing test for indeterminate**

Add to `components/Checkbox/Checkbox.test.tsx`:

```tsx
it("renders indeterminate state", () => {
  render(<Checkbox label="Partial" indeterminate />);
  const checkbox = screen.getByRole("checkbox");
  expect(checkbox).toHaveProperty("indeterminate", true);
});

it("shows Minus icon when indeterminate", () => {
  const { container } = render(<Checkbox label="Partial" indeterminate />);
  // Minus icon should be rendered instead of Check
  expect(container.querySelector('[data-testid="minus-icon"], .icon')).toBeInTheDocument();
});

it("indeterminate is overridden by checked", () => {
  render(<Checkbox label="Checked" indeterminate checked />);
  const checkbox = screen.getByRole("checkbox");
  expect(checkbox).toBeChecked();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/Checkbox --run`
Expected: FAIL — `indeterminate` prop not recognized.

- [ ] **Step 3: Implement indeterminate prop**

In `components/Checkbox/Checkbox.tsx`:

1. Add `indeterminate?: boolean` to `CheckboxProps`
2. Import `Minus` from `lucide-react` alongside existing `Check`
3. Add a `useEffect` to set `ref.current.indeterminate = indeterminate` when the prop is true
4. In the display span, render `<Minus>` when `indeterminate && !checked`, otherwise `<Check>`

The internal ref needs to be merged with the forwarded ref — use a callback ref or `useImperativeHandle` pattern.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- components/Checkbox --run`
Expected: All PASS

- [ ] **Step 5: Add Indeterminate story**

Add to `components/Checkbox/Checkbox.stories.tsx`:

```tsx
export const Indeterminate: Story = {
  args: {
    label: "Select all (partial)",
    indeterminate: true,
  },
};
```

- [ ] **Step 6: Update checkbox skill doc**

Add `indeterminate` prop to the props table in `skills/doom-design-system/components/checkbox.md`:

```
| `indeterminate` | `boolean` | `false` | Shows indeterminate (minus) state. Overridden by `checked`. Used for parent checkboxes in tree selections. |
```

- [ ] **Step 7: Commit**

```bash
git add components/Checkbox/ skills/doom-design-system/components/checkbox.md
git commit -m "feat(checkbox): add indeterminate state support"
```

---

## Phase 1: Simple Components (No Dependencies on Each Other)

### Task 3: Build ToggleGroup

**Spec reference:** Section 1 (ToggleGroup)
**Doom-isms reference:** Spec Section 1 "Doom-isms" + "Tokens"
**Uses enhanced component-builder skill:** Yes — compound component template

**Files:**
- Create: `components/ToggleGroup/ToggleGroup.tsx` — context + ToggleGroup + ToggleGroupItem
- Create: `components/ToggleGroup/ToggleGroup.module.scss`
- Create: `components/ToggleGroup/ToggleGroup.test.tsx`
- Create: `components/ToggleGroup/ToggleGroup.stories.tsx`
- Create: `components/ToggleGroup/index.ts`
- Create: `skills/doom-design-system/components/togglegroup.md`
- Modify: `skills/doom-design-system/SKILL.md` — add to Forms reference table
- Modify: `components/A2UI/mapping.tsx` — register `toggle-group`, `toggle-group-item`
- Modify: `components/A2UI/catalog.ts` — add descriptor
- Modify: `index.ts` — add export

ToggleGroup is simple enough to keep all components in one file (ToggleGroup + ToggleGroupItem + context are small).

- [ ] **Step 1: Write failing tests**

Create `components/ToggleGroup/ToggleGroup.test.tsx` with tests for:
- Renders a group with role="group"
- Items render as buttons with aria-pressed
- Single mode: clicking item sets it as pressed, onValueChange fires with string
- Single mode: clicking already-pressed item deselects it (value becomes "")
- Multiple mode: clicking items toggles them independently, onValueChange fires with string[]
- Controlled mode: value prop drives pressed state
- Uncontrolled mode: defaultValue sets initial state
- Disabled group: all items are disabled, clicks don't fire onValueChange
- Disabled individual item: only that item is disabled
- Keyboard: arrow keys move focus between items (roving tabindex)
- Context error: ToggleGroupItem outside ToggleGroup throws

Use `@testing-library/react` with `render`, `screen`, `fireEvent`. Query by `role("group")`, `role("button")`, check `aria-pressed`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/ToggleGroup --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Create types and context**

Create `components/ToggleGroup/ToggleGroup.tsx` with:

1. `ToggleGroupContextValue` interface: `activeValue: string | string[]`, `setActiveValue`, `type`, `size`, `variant`, `disabled`
2. `ToggleGroupContext` via `createContext<ToggleGroupContextValue | null>(null)`
3. `useToggleGroupContext()` hook that throws if null

- [ ] **Step 4: Implement ToggleGroup root component**

In the same file, add `ToggleGroup` component:
- Props: `type`, `value`, `defaultValue`, `onValueChange`, `size`, `variant`, `disabled`, `className`, `children`
- Controlled/uncontrolled pattern with `isControlled` flag
- `role="group"` on the wrapper div
- Provides context to children

- [ ] **Step 5: Implement ToggleGroupItem**

In the same file, add `ToggleGroupItem` component:
- Consumes context, throws if missing
- Renders `<button>` with `aria-pressed`
- Computes `isPressed` from context value (checks string equality for single, array.includes for multiple)
- onClick: toggles value via context (for single: set or clear; for multiple: add or remove from array)
- Applies pressed/unpressed CSS classes from context variant

- [ ] **Step 6: Implement keyboard navigation**

Add roving tabindex to ToggleGroup:
- Only the focused item has `tabIndex={0}`, others have `tabIndex={-1}`
- Arrow left/right moves focus between items
- Disabled items are skipped during arrow navigation
- Space/Enter toggles the focused item (native button behavior handles this)

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- components/ToggleGroup --run`
Expected: All PASS.

- [ ] **Step 8: Write SCSS styles**

Create `components/ToggleGroup/ToggleGroup.module.scss`:
- `@use "../../styles/mixins" as *;`
- `@layer doom.components { ... }`
- `.group` — `display: inline-flex`, offset shadow via `--shadow-hard`
- `.item` — `@include base-interactive`, shared borders via negative margin, `@include focus` on `:focus-visible`
- `.item.pressed` — inset shadow `0 2px 0 0 var(--card-border)`, variant-specific bg/text colors
- `.item:first-child` — left border radius, `.item:last-child` — right border radius, middle items — `border-radius: 0`
- `.primary` / `.outline` variant classes on pressed items
- `.sm` / `.lg` size overrides
- `.disabled` — `@include disabled-state`
- All token references per spec Section 1 "Tokens"

- [ ] **Step 9: Write stories**

Create `components/ToggleGroup/ToggleGroup.stories.tsx`:
- `Default` — single mode with text items
- `Multiple` — multi-select mode
- `PrimaryVariant` — variant="primary" with pressed items
- `OutlineVariant` — variant="outline" with pressed items
- `Sizes` — sm/md/lg side by side
- `Disabled` — disabled group
- `IconOnly` — items with only icons and aria-labels
- `Controlled` — render function with useState

- [ ] **Step 10: Create barrel export and register**

1. Create `components/ToggleGroup/index.ts`: `export * from "./ToggleGroup"`
2. Add to `index.ts`: `export * from "./components/ToggleGroup"` (alphabetical order)
3. Add to `components/A2UI/mapping.tsx`: `"toggle-group": ToggleGroup, "toggle-group-item": ToggleGroupItem`
4. Add to `components/A2UI/catalog.ts`: descriptor with category "primitives", props for type/value/variant/size/disabled
5. Add to `skills/doom-design-system/SKILL.md` Forms table: `| ToggleGroup | components/togglegroup.md |`

- [ ] **Step 11: Create skill doc**

Create `skills/doom-design-system/components/togglegroup.md` with:
- Import example
- Props table (ToggleGroup and ToggleGroupItem)
- Usage examples (single, multiple, icon-only)
- Notes: items must be inside ToggleGroup, keyboard nav with arrows

- [ ] **Step 12: Run full test suite and commit**

```bash
npm test -- components/ToggleGroup --run
git add components/ToggleGroup/ components/A2UI/mapping.tsx components/A2UI/catalog.ts index.ts skills/doom-design-system/
git commit -m "feat: add ToggleGroup component"
```

---

### Task 4: Build Rating

**Spec reference:** Section 2 (Rating)
**Doom-isms reference:** Spec Section 2 "Doom-isms" + "Tokens"
**Uses enhanced component-builder skill:** Yes — simple component template

**Files:**
- Create: `components/Rating/Rating.tsx`
- Create: `components/Rating/Rating.module.scss`
- Create: `components/Rating/Rating.test.tsx`
- Create: `components/Rating/Rating.stories.tsx`
- Create: `components/Rating/index.ts`
- Create: `skills/doom-design-system/components/rating.md`
- Modify: `skills/doom-design-system/SKILL.md` — add to Forms reference table
- Modify: `components/A2UI/mapping.tsx` — register `rating`
- Modify: `components/A2UI/catalog.ts` — add descriptor
- Modify: `index.ts` — add export

- [ ] **Step 1: Write failing tests**

Create `components/Rating/Rating.test.tsx` with tests for:
- Renders 5 radio buttons by default (role="radio")
- Container has role="radiogroup"
- value=3: first 3 icons have aria-checked="true", last 2 have aria-checked="false"
- Clicking icon 4 calls onValueChange(4)
- Controlled mode: value prop drives checked state
- Uncontrolled mode: defaultValue sets initial, clicks update internal state
- Custom count: count={10} renders 10 icons
- allowHalf: clicking left half of icon 3 calls onValueChange(2.5)
- Keyboard: arrow right increments, arrow left decrements, Home sets 0, End sets count
- readOnly: renders spans (not buttons), role="img", no click handlers
- Disabled: buttons are disabled, clicks don't fire onValueChange
- Custom icon: icon prop renders the provided LucideIcon
- aria-labels: each icon has "Rate N out of {count}"

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/Rating --run`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Rating component**

Create `components/Rating/Rating.tsx`:
- Props: `value`, `defaultValue`, `onValueChange`, `count`, `icon`, `allowHalf`, `size`, `readOnly`, `disabled`, `className`, `aria-label`
- Controlled/uncontrolled pattern
- Internal `hoverValue` state for hover preview (null when not hovering)
- Render `count` items, each either `<button role="radio">` (interactive) or `<span>` (readOnly)
- Each item renders two layers: unfilled icon (always visible) + filled icon (clipped or shown based on value)
- `allowHalf`: each icon has two hit zones — left half triggers value N-0.5, right half triggers value N. Implement via `onMouseMove` checking `event.nativeEvent.offsetX < element.clientWidth / 2`
- readOnly: wrapper is `<div role="img" aria-label="{value} out of {count}">`
- Interactive: wrapper is `<div role="radiogroup" aria-label={ariaLabel}>`
- Each button: `aria-checked={isActive}`, `aria-label="Rate {n} out of {count}"`
- Keyboard: `onKeyDown` on container — ArrowRight/ArrowLeft to increment/decrement (by 0.5 if allowHalf, else by 1), Home for 0, End for count

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- components/Rating --run`
Expected: All PASS.

- [ ] **Step 5: Write SCSS styles**

Create `components/Rating/Rating.module.scss`:
- `@use "../../styles/mixins" as *;`
- `@layer doom.components { ... }`
- `.container` — `display: inline-flex`, `gap: var(--control-gap)`
- `.icon` — relative positioning for layered filled/unfilled icons
- `.iconButton` — `@include focus` on `:focus-visible`, no border/background (transparent button)
- `.filled` — `color: var(--warning)`, `transition: transform var(--duration-fast) var(--ease-in-out)`
- `.unfilled` — `color: var(--muted-foreground)`
- `.iconButton:hover .filled` — `transform: scale(1.15)`
- `.iconButton:active .filled` — `transform: scale(0.85)`
- `.halfClip` — `clip-path: inset(0 50% 0 0)`, positioned absolutely over unfilled icon
- `.disabled` — `@include disabled-state`
- Size classes: `.sm`, `.lg` mapping to icon sizes per spec

- [ ] **Step 6: Write stories**

Create `components/Rating/Rating.stories.tsx`:
- `Default` — value=3
- `HalfStars` — value=3.5, allowHalf
- `CustomIcon` — icon={Heart}
- `CustomCount` — count=10, value=7
- `ReadOnly` — readOnly, value=4.5
- `Disabled` — disabled
- `Sizes` — sm/md/lg side by side
- `Controlled` — render function with useState

- [ ] **Step 7: Create barrel export and register**

1. Create `components/Rating/index.ts`: `export * from "./Rating"`
2. Add to `index.ts`: `export * from "./components/Rating"`
3. Add to A2UI mapping: `"rating": Rating`
4. Add to A2UI catalog: descriptor with category "primitives"
5. Add to SKILL.md Forms table: `| Rating | components/rating.md |`

- [ ] **Step 8: Create skill doc**

Create `skills/doom-design-system/components/rating.md` with:
- Import, props table, usage examples (basic, custom icon, half stars, read-only)
- Notes: icon prop accepts any LucideIcon, allowHalf enables 0.5 step keyboard nav

- [ ] **Step 9: Run full test suite and commit**

```bash
npm test -- components/Rating --run
git add components/Rating/ components/A2UI/mapping.tsx components/A2UI/catalog.ts index.ts skills/doom-design-system/
git commit -m "feat: add Rating component"
```

---

## Phase 2: Medium Components

### Task 5: Build Stepper

**Spec reference:** Section 3 (Stepper)
**Doom-isms reference:** Spec Section 3 "Doom-isms" + "Tokens"
**Uses enhanced component-builder skill:** Yes — compound component template with subdirectories

**Files:**
- Create: `components/Stepper/Stepper.tsx`
- Create: `components/Stepper/Stepper.module.scss`
- Create: `components/Stepper/Stepper.test.tsx`
- Create: `components/Stepper/Stepper.stories.tsx`
- Create: `components/Stepper/index.ts`
- Create: `components/Stepper/context/StepperContext.ts`
- Create: `components/Stepper/components/StepperStep.tsx`
- Create: `components/Stepper/components/StepIndicator.tsx`
- Create: `components/Stepper/components/StepConnector.tsx`
- Create: `components/Stepper/components/StepperNavigation.tsx`
- Create: `components/Stepper/types/stepper.ts`
- Create: `skills/doom-design-system/components/stepper.md`
- Modify: `skills/doom-design-system/SKILL.md` — add to Navigation reference table
- Modify: `components/A2UI/mapping.tsx` — register `stepper`, `stepper-step`
- Modify: `components/A2UI/catalog.ts` — add descriptor
- Modify: `index.ts` — add export

- [ ] **Step 1: Create types**

Create `components/Stepper/types/stepper.ts` with:
- `StepperProps`: `activeStep`, `defaultStep`, `onStepChange`, `orientation`, `showNavigation`, `nextLabel`, `backLabel`, `completeLabel`, `onComplete`, `className`, `children`
- `StepperStepProps`: `label`, `description`, `icon`, `disabled`, `optional`, `validator`, `className`, `children`
- `StepMeta`: internal type for tracking registered steps — `{ label, description, icon, disabled, optional, validator }`
- `StepperContextValue`: `activeStep`, `setActiveStep`, `orientation`, `totalSteps`, `registerStep`, `steps: StepMeta[]`

- [ ] **Step 2: Write failing tests**

Create `components/Stepper/Stepper.test.tsx` with tests for:
- Renders step indicators with role="tablist"
- Each indicator has role="tab"
- Active step has aria-current="step" and aria-selected="true"
- Content panel has role="tabpanel"
- Only active step's content is rendered
- Controlled mode: activeStep prop drives which step is shown
- Uncontrolled mode: defaultStep sets initial step
- Clicking a completed step indicator navigates back
- Clicking a future step indicator does nothing
- showNavigation: renders Back and Next buttons
- Back button disabled on first step
- Next button calls onStepChange(activeStep + 1)
- Last step shows Complete button, clicking calls onComplete
- Optional step shows "Optional" badge text
- Disabled step indicator has aria-disabled="true"
- validator: async validator blocks step transition when returning false
- StepperStep outside Stepper throws
- Keyboard: arrow keys navigate between step indicators
- Vertical orientation: renders with vertical class

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- components/Stepper --run`
Expected: FAIL.

- [ ] **Step 4: Create context**

Create `components/Stepper/context/StepperContext.ts`:
- `StepperContext` via `createContext`
- `useStepperContext()` hook with error throw
- Import types from `../types/stepper`

- [ ] **Step 5: Implement StepIndicator (internal)**

Create `components/Stepper/components/StepIndicator.tsx`:
- Renders the circle with step number (or custom icon, or Check icon if completed)
- Label + optional description text below circle
- If `optional`, renders `<Badge variant="secondary" size="sm">Optional</Badge>`
- CSS classes for states: `.incomplete`, `.active`, `.completed`, `.disabled`
- `role="tab"`, `aria-selected`, `aria-disabled`, `aria-current="step"` (when active)
- Clickable only if step is completed and not disabled — `@include brutalist-hover` and `@include focus`

- [ ] **Step 6: Implement StepConnector (internal)**

Create `components/Stepper/components/StepConnector.tsx`:
- Renders the line between step indicators
- CSS classes: `.complete` (uses `--success` color), `.incomplete` (uses `--card-border`)
- Thickness: `--surface-border-width`
- Horizontal: full width between indicators. Vertical: full height.

- [ ] **Step 7: Implement StepperStep**

Create `components/Stepper/components/StepperStep.tsx`:
- Consumes StepperContext
- Registers itself on mount (via `registerStep` from context) using `Children.toArray` index
- Renders children only if this step is active (index === activeStep)
- Content wrapped in `<div role="tabpanel" aria-labelledby={indicatorId}>`

- [ ] **Step 8: Implement StepperNavigation (internal)**

Create `components/Stepper/components/StepperNavigation.tsx`:
- Renders `<Flex justify="end" gap={2}>` with Back and Next/Complete buttons
- Back: `<Button variant="secondary">` — disabled on step 0
- Next: `<Button variant="primary">` — calls validator before advancing
- On last step: shows Complete button, calls `onComplete`
- Skip button shown for optional steps

- [ ] **Step 9: Implement Stepper root**

Create `components/Stepper/Stepper.tsx`:
- Controlled/uncontrolled pattern for `activeStep`
- Collects `StepMeta` from children via `registerStep`
- Renders indicator row: `StepIndicator` + `StepConnector` for each step
- Renders children (StepperStep components)
- If `showNavigation`, renders `StepperNavigation` after children
- `orientation` prop adds `.vertical` class
- Provides StepperContext

- [ ] **Step 10: Write SCSS styles**

Create `components/Stepper/Stepper.module.scss`:
- All tokens per spec Section 3 "Tokens"
- `.root` — flex column
- `.indicatorRow` — flex row (horizontal) or flex column (vertical)
- `.indicator` — circle with `border-radius: var(--radius-pill)`, thick `--surface-border-width` border
- `.indicator.active` — `--primary` bg, glow ring box-shadow
- `.indicator.completed` — `--success` bg, `--border-strong` border
- `.indicator.incomplete` — `--card-bg` bg, `--card-border` border
- `.connector` — thick line, hard color (no gradient)
- `.contentPanel` — `--card-bg`, `--card-border`, `--surface-radius`, `--shadow-hard` offset shadow
- `.vertical` modifier for vertical layout

- [ ] **Step 11: Run tests to verify they pass**

Run: `npm test -- components/Stepper --run`
Expected: All PASS.

- [ ] **Step 12: Write stories**

Create `components/Stepper/Stepper.stories.tsx`:
- `Default` — 3 steps, step 1 active
- `WithNavigation` — showNavigation=true
- `Vertical` — orientation="vertical"
- `OptionalStep` — middle step with optional=true
- `CustomIcons` — steps with custom lucide icons
- `Controlled` — render function with useState, showing step navigation
- `WithValidation` — validator that blocks on invalid form

- [ ] **Step 13: Create barrel export and register**

1. `components/Stepper/index.ts`: export Stepper, StepperStep, and public types
2. Add to root `index.ts`
3. Register in A2UI mapping: `"stepper": Stepper, "stepper-step": StepperStep`
4. Add A2UI catalog descriptor
5. Add to SKILL.md Navigation table

- [ ] **Step 14: Create skill doc**

Create `skills/doom-design-system/components/stepper.md`

- [ ] **Step 15: Run full test suite and commit**

```bash
npm test -- components/Stepper --run
git add components/Stepper/ components/A2UI/ index.ts skills/doom-design-system/
git commit -m "feat: add Stepper component"
```

---

### Task 6: Build Calendar

**Spec reference:** Section 5 (Calendar / DatePicker) — Calendar portion only
**Doom-isms reference:** Spec Section 5 "Doom-isms" + "Tokens"

**Files:**
- Create: `components/Calendar/Calendar.tsx`
- Create: `components/Calendar/Calendar.module.scss`
- Create: `components/Calendar/Calendar.test.tsx`
- Create: `components/Calendar/Calendar.stories.tsx`
- Create: `components/Calendar/index.ts`
- Create: `components/Calendar/components/CalendarHeader.tsx`
- Create: `components/Calendar/components/CalendarGrid.tsx`
- Create: `components/Calendar/components/DayCell.tsx`
- Create: `components/Calendar/components/MonthYearPicker.tsx`
- Create: `components/Calendar/hooks/useCalendarState.ts`
- Create: `components/Calendar/hooks/useDateRange.ts`
- Create: `components/Calendar/types/calendar.ts`
- Create: `components/Calendar/utils/dateGrid.ts`
- Create: `skills/doom-design-system/components/calendar.md`
- Modify: `skills/doom-design-system/SKILL.md`
- Modify: `components/A2UI/mapping.tsx`
- Modify: `components/A2UI/catalog.ts`
- Modify: `index.ts`
- Modify: `package.json` — add `date-fns` to peerDependencies

- [ ] **Step 1: Add date-fns peer dependency**

```bash
npm install --save-peer date-fns
npm install --save-dev date-fns
```

- [ ] **Step 2: Create types**

Create `components/Calendar/types/calendar.ts`:

```tsx
export type CalendarMode = "single" | "range";

export interface DateRange {
  from: Date;
  to: Date | null;
}

export interface CalendarProps {
  mode?: CalendarMode;
  value?: Date | DateRange | null;
  defaultValue?: Date | DateRange | null;
  onValueChange?: (value: Date | DateRange | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showOutsideDays?: boolean;
  className?: string;
}
```

- [ ] **Step 3: Create dateGrid utility**

Create `components/Calendar/utils/dateGrid.ts`:
- `buildDateGrid(month: Date, weekStartsOn: number): Date[][]` — returns 6 rows of 7 dates
- Uses `date-fns`: `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `addDays`
- Always returns 6 weeks (42 cells) for consistent grid height

- [ ] **Step 4: Write failing tests**

Create `components/Calendar/Calendar.test.tsx` with tests for:
- Renders with role="grid" and aria-label="Calendar"
- Day cells have role="gridcell"
- Current month days are rendered
- Today has aria-current="date"
- Clicking a day calls onValueChange with that Date
- Controlled mode: value prop highlights selected day
- Uncontrolled mode: defaultValue sets initial selection
- minDate/maxDate: dates outside range have aria-disabled="true"
- disabledDates: custom function disables specific dates
- Nav buttons: clicking next month shows next month's days
- Nav buttons: clicking prev month shows previous month's days
- Range mode: first click sets from, second click sets to
- Range mode: clicking after range is set resets to new from
- Keyboard: arrow keys navigate between days
- Keyboard: Page Up/Down navigates months
- Keyboard: Enter/Space selects focused day
- showOutsideDays=false: outside-month cells are not rendered
- weekStartsOn=1: Monday is first column

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test -- components/Calendar --run`
Expected: FAIL.

- [ ] **Step 6: Implement useCalendarState hook**

Create `components/Calendar/hooks/useCalendarState.ts`:
- Manages `viewingMonth` state (the month being displayed, separate from selected value)
- `goToNextMonth()`, `goToPrevMonth()`, `goToMonth(date)` — using `addMonths`, `subMonths`
- `goToNextYear()`, `goToPrevYear()` — for Shift+PageUp/Down

- [ ] **Step 7: Implement useDateRange hook**

Create `components/Calendar/hooks/useDateRange.ts`:
- For range mode: tracks selection phase (`from` selected, waiting for `to`)
- `hoverDate` state for range preview while hovering between from and to selection
- `isInRange(date)`, `isRangeStart(date)`, `isRangeEnd(date)` helpers
- `handleDayClick(date)` — first click sets from, second click sets to (ensuring from < to)

- [ ] **Step 8: Implement DayCell (internal)**

Create `components/Calendar/components/DayCell.tsx`:
- Renders `<button role="gridcell">` with day number
- Props: `date`, `isSelected`, `isToday`, `isOutsideMonth`, `isDisabled`, `isInRange`, `isRangeStart`, `isRangeEnd`, `onClick`, `onHover`
- CSS classes for each state
- `aria-selected`, `aria-disabled`, `aria-current="date"` (for today)

- [ ] **Step 9: Implement CalendarGrid (internal)**

Create `components/Calendar/components/CalendarGrid.tsx`:
- Renders day-of-week headers (uppercase, letter-spaced, `--text-2xs`)
- Renders 6 rows of 7 DayCell components
- Uses `dateGrid.ts` utility to build the grid

- [ ] **Step 10: Implement CalendarHeader (internal)**

Create `components/Calendar/components/CalendarHeader.tsx`:
- Month/year label (clickable — cycles to MonthYearPicker view)
- Prev/next `<Button variant="ghost" size="sm">` with `ChevronLeft`/`ChevronRight`
- Buttons call `goToPrevMonth`/`goToNextMonth` from calendar state

- [ ] **Step 11: Implement MonthYearPicker (internal)**

Create `components/Calendar/components/MonthYearPicker.tsx`:
- Grid of 12 months (when in month-picking view)
- Grid of years (when in year-picking view, show +/- 6 years from current)
- Clicking a month/year sets `viewingMonth` and returns to day grid view

- [ ] **Step 12: Implement Calendar root**

Create `components/Calendar/Calendar.tsx`:
- Controlled/uncontrolled for `value`
- Uses `useCalendarState` for month navigation
- Uses `useDateRange` for range mode
- Renders CalendarHeader + CalendarGrid (or MonthYearPicker when in picker view)
- Keyboard handler: arrows, Page Up/Down, Shift+Page, Home/End, Enter/Space
- Manages focused date state for keyboard navigation

- [ ] **Step 13: Write SCSS styles**

Create `components/Calendar/Calendar.module.scss`:
- All tokens per spec Section 5 "Tokens"
- `.calendar` — container with `--card-bg`, `--card-border`, `--shadow-hard`
- `.dayCell` — square cells, `border-radius: var(--radius-pill)`
- `.dayCell.selected` — `--primary` bg, `--primary-foreground` text, `--border-strong` border
- `.dayCell.today` — `::after` pseudo-element: 4px dot, `--error` color, centered below number
- `.dayCell.inRange` — `--primary` at 10% opacity, hard edges
- `.dayCell.outsideMonth` — `--muted-foreground` text
- `.dayCell.disabled` — diagonal strike-through line via `::before` pseudo-element
- `.header` — bold `--text-base` label
- `.weekday` — uppercase, `--text-2xs`, `--muted-foreground`, letter-spacing

- [ ] **Step 14: Run tests to verify they pass**

Run: `npm test -- components/Calendar --run`
Expected: All PASS.

- [ ] **Step 15: Write stories**

Create `components/Calendar/Calendar.stories.tsx`:
- `Default` — single mode, no value
- `WithValue` — value set to specific date
- `Range` — mode="range"
- `MinMax` — minDate and maxDate set
- `DisabledDates` — weekends disabled via disabledDates function
- `MondayStart` — weekStartsOn=1
- `Controlled` — render function with useState

- [ ] **Step 16: Create barrel export and register**

1. `components/Calendar/index.ts`: export Calendar, DateRange, CalendarMode, CalendarProps
2. Add to root `index.ts`
3. A2UI mapping: `"calendar": Calendar`
4. A2UI catalog descriptor
5. SKILL.md: add to Forms table

- [ ] **Step 17: Create skill doc**

Create `skills/doom-design-system/components/calendar.md`

- [ ] **Step 18: Run full test suite and commit**

```bash
npm test -- components/Calendar --run
git add components/Calendar/ components/A2UI/ index.ts skills/doom-design-system/ package.json
git commit -m "feat: add Calendar component"
```

---

### Task 7: Build DatePicker

**Spec reference:** Section 5 (Calendar / DatePicker) — DatePicker portion
**Depends on:** Task 6 (Calendar)

**Files:**
- Create: `components/DatePicker/DatePicker.tsx`
- Create: `components/DatePicker/DatePicker.module.scss`
- Create: `components/DatePicker/DatePicker.test.tsx`
- Create: `components/DatePicker/DatePicker.stories.tsx`
- Create: `components/DatePicker/index.ts`
- Create: `skills/doom-design-system/components/datepicker.md`
- Modify: `skills/doom-design-system/SKILL.md`
- Modify: `components/A2UI/mapping.tsx`
- Modify: `components/A2UI/catalog.ts`
- Modify: `index.ts`

- [ ] **Step 1: Write failing tests**

Create `components/DatePicker/DatePicker.test.tsx` with tests for:
- Single mode: renders an Input with combobox role
- Single mode: clicking input opens popover with Calendar
- Single mode: selecting a date closes popover and formats value into input
- Single mode: Escape closes popover, returns focus to input
- Range mode: renders two inputs with arrow separator
- Range mode: selecting a range fills both inputs
- Controlled: value prop drives displayed date
- Uncontrolled: defaultValue sets initial
- Label prop renders a label element
- Error prop shows error styling on input
- Disabled prop disables input and prevents opening
- Calendar props (minDate, maxDate, etc.) pass through to Calendar
- Format prop: custom date-fns format string changes display

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/DatePicker --run`
Expected: FAIL.

- [ ] **Step 3: Implement DatePicker**

Create `components/DatePicker/DatePicker.tsx`:
- Composes `<Input>`, `<Popover>`, `<Calendar>`, `<Label>`, `<Flex>`
- Internal `isOpen` state for popover
- Single mode: one `<Input endAdornment={<CalendarDays />}>` — endAdornment click and input focus open popover
- Range mode: `<Flex>` container wrapping two `<Input>` fields with `<ArrowRight />` separator
- `<Popover placement="bottom-start" isOpen={isOpen} onClose={() => setIsOpen(false)}>` wrapping `<Calendar>`
- Calendar `onValueChange` — single mode: close popover immediately, format date via `date-fns/format`. Range mode: close only when both from and to are set.
- Pass through calendar props: `minDate`, `maxDate`, `disabledDates`, `weekStartsOn`, `showOutsideDays`
- Accessibility: input gets `role="combobox"`, `aria-expanded={isOpen}`, `aria-haspopup="dialog"`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- components/DatePicker --run`
Expected: All PASS.

- [ ] **Step 5: Write SCSS styles**

Create `components/DatePicker/DatePicker.module.scss`:
- Minimal — mostly composing Input and Popover styles
- `.rangeContainer` — shared border container for range mode, `--shadow-hard`, `--card-border` border, `--surface-radius`
- `.separator` — ArrowRight icon styling, `--muted-foreground` color
- `.rangeContainer .input` — remove individual input shadows/borders (container owns them)

- [ ] **Step 6: Write stories**

Create `components/DatePicker/DatePicker.stories.tsx`:
- `Default` — single mode
- `WithLabel` — label="Date of birth"
- `Range` — mode="range"
- `WithMinMax` — minDate/maxDate constraints
- `Error` — error=true
- `Disabled` — disabled
- `CustomFormat` — format="dd/MM/yyyy"
- `Controlled` — render function with useState

- [ ] **Step 7: Create barrel export and register**

1. `components/DatePicker/index.ts`
2. Add to root `index.ts`
3. A2UI mapping: `"date-picker": DatePicker`
4. A2UI catalog descriptor
5. SKILL.md: add to Forms table

- [ ] **Step 8: Create skill doc**

Create `skills/doom-design-system/components/datepicker.md`

- [ ] **Step 9: Run full test suite and commit**

```bash
npm test -- components/DatePicker --run
git add components/DatePicker/ components/A2UI/ index.ts skills/doom-design-system/
git commit -m "feat: add DatePicker component"
```

---

## Phase 3: Complex Component

### Task 8: Build TreeView

**Spec reference:** Section 4 (TreeView)
**Doom-isms reference:** Spec Section 4 "Doom-isms" + "Tokens"
**Depends on:** Task 2 (Checkbox indeterminate)

**Files:**
- Create: `components/TreeView/TreeView.tsx`
- Create: `components/TreeView/TreeView.module.scss`
- Create: `components/TreeView/TreeView.test.tsx`
- Create: `components/TreeView/TreeView.stories.tsx`
- Create: `components/TreeView/index.ts`
- Create: `components/TreeView/context/TreeViewContext.ts`
- Create: `components/TreeView/components/TreeNode.tsx`
- Create: `components/TreeView/components/TreeNodeRow.tsx`
- Create: `components/TreeView/components/DragOverlay.tsx`
- Create: `components/TreeView/components/DropIndicator.tsx`
- Create: `components/TreeView/hooks/useTreeState.ts`
- Create: `components/TreeView/hooks/useTreeDnd.ts`
- Create: `components/TreeView/hooks/useTreeVirtualizer.ts`
- Create: `components/TreeView/hooks/useTreeKeyboard.ts`
- Create: `components/TreeView/types/tree.ts`
- Create: `components/TreeView/utils/flattenTree.ts`
- Create: `components/TreeView/utils/checkboxCascade.ts`
- Create: `skills/doom-design-system/components/treeview.md`
- Modify: `skills/doom-design-system/SKILL.md`
- Modify: `components/A2UI/mapping.tsx`
- Modify: `components/A2UI/catalog.ts`
- Modify: `index.ts`

This is the most complex component. Build in sub-phases: types/utils first, then hooks, then components, then integration.

- [ ] **Step 1: Create types**

Create `components/TreeView/types/tree.ts`:

```tsx
import type { LucideIcon } from "lucide-react";

export interface TreeNodeData {
  key: string;
  label: string;
  icon?: LucideIcon;
  children?: TreeNodeData[];
  disabled?: boolean;
  isLeaf?: boolean;
  onLoadChildren?: () => Promise<TreeNodeData[]>;
}

export interface TreeDropEvent {
  draggedKey: string;
  targetKey: string;
  position: "before" | "after" | "inside";
}

export interface TreeViewProps {
  data?: TreeNodeData[];
  children?: React.ReactNode;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelect?: (keys: string[]) => void;
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  onExpand?: (keys: string[]) => void;
  selectionMode?: "single" | "multiple";
  checkable?: boolean;
  draggable?: boolean;
  onDrop?: (event: TreeDropEvent) => void;
  virtualized?: boolean;
  estimateSize?: number;
  showLines?: boolean;
  className?: string;
}

// Internal types
export interface FlatNode {
  key: string;
  label: string;
  icon?: LucideIcon;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isDisabled: boolean;
  isLeaf: boolean;
  parentKey: string | null;
}
```

- [ ] **Step 2: Create flattenTree utility**

Create `components/TreeView/utils/flattenTree.ts`:
- `flattenTree(nodes: TreeNodeData[], expandedKeys: Set<string>, depth?: number, parentKey?: string | null): FlatNode[]`
- Recursively flattens tree respecting expansion state
- Each node becomes a `FlatNode` with depth for indentation
- Only includes children of expanded nodes in the output

- [ ] **Step 3: Create checkboxCascade utility**

Create `components/TreeView/utils/checkboxCascade.ts`:
- `getCheckedKeysAfterToggle(key: string, currentChecked: Set<string>, allNodes: TreeNodeData[]): Set<string>`
  - If checking a parent: add all descendants
  - If unchecking a parent: remove all descendants
  - If toggling a child: update, then propagate up (parent becomes checked if all children checked, unchecked if none, indeterminate handled by consumer)
- `getIndeterminateKeys(checkedKeys: Set<string>, allNodes: TreeNodeData[]): Set<string>`
  - Returns set of parent keys that have some (but not all) descendants checked

- [ ] **Step 4: Write failing tests**

Create `components/TreeView/TreeView.test.tsx` with tests for:
- Data-driven: renders tree with role="tree"
- Each node has role="treeitem"
- Nodes have aria-level, aria-setsize, aria-posinset
- Expandable nodes have aria-expanded
- Clicking expand arrow toggles expansion
- Selected nodes have aria-selected="true"
- Controlled selectedKeys/expandedKeys
- Uncontrolled defaultSelectedKeys/defaultExpandedKeys
- selectionMode="single": clicking selects one, deselects previous
- selectionMode="multiple": clicking toggles selection
- checkable: renders checkboxes per node
- checkable: checking parent checks all children
- checkable: unchecking one child makes parent indeterminate
- Disabled nodes: clicks don't fire onSelect
- Keyboard: Up/Down moves focus
- Keyboard: Right expands or moves to first child
- Keyboard: Left collapses or moves to parent
- Keyboard: Space toggles selection
- Keyboard: Home/End moves to first/last visible
- Declarative mode: `<TreeNode>` children work same as data prop
- showLines=false: no connecting line elements rendered

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test -- components/TreeView --run`
Expected: FAIL.

- [ ] **Step 6: Create context**

Create `components/TreeView/context/TreeViewContext.ts`:
- Context value: `selectedKeys`, `expandedKeys`, `toggleSelect`, `toggleExpand`, `checkedKeys`, `indeterminateKeys`, `toggleCheck`, `focusedKey`, `setFocusedKey`, `selectionMode`, `checkable`, `draggable`, `showLines`
- `useTreeViewContext()` hook

- [ ] **Step 7: Implement useTreeState hook**

Create `components/TreeView/hooks/useTreeState.ts`:
- Manages selection (controlled/uncontrolled)
- Manages expansion (controlled/uncontrolled)
- Manages checked keys (for checkable mode) using `checkboxCascade` util
- Computes `indeterminateKeys` from checked state
- `toggleSelect(key)`, `toggleExpand(key)`, `toggleCheck(key)` functions

- [ ] **Step 8: Implement useTreeKeyboard hook**

Create `components/TreeView/hooks/useTreeKeyboard.ts`:
- Takes `flatNodes`, `focusedKey`, `setFocusedKey`, `toggleExpand`, `toggleSelect`
- Returns `onKeyDown` handler
- Arrow Up/Down: move focus to prev/next visible node
- Arrow Right: expand if collapsed, or move to first child if expanded
- Arrow Left: collapse if expanded, or move to parent if collapsed
- Space: toggle selection/checkbox
- Enter: activate node
- Home: focus first visible node
- End: focus last visible node
- `*`: expand all siblings of focused node

- [ ] **Step 9: Implement TreeNodeRow (internal)**

Create `components/TreeView/components/TreeNodeRow.tsx`:
- Renders one row: indentation padding (depth * --space-3) + expand ChevronRight + optional Checkbox + icon + label
- ChevronRight rotates 90deg when expanded (CSS transition)
- If `checkable`: render `<Checkbox indeterminate={isIndeterminate} checked={isChecked} onChange={toggleCheck} />`
- If node has `onLoadChildren` and is expanding: show `<Spinner size="sm" />` instead of children
- `role="treeitem"`, `aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`
- `tabIndex={focusedKey === key ? 0 : -1}` for roving tabindex
- CSS: `.selected` — left border accent + tinted bg, hover — flat `--muted` bg

- [ ] **Step 10: Implement TreeNode (declarative, public)**

Create `components/TreeView/components/TreeNode.tsx`:
- Registers itself into TreeView context on mount
- Collects `nodeKey`, `label`, `icon`, `disabled`, `children` (nested TreeNodes)
- Converts declarative children into `TreeNodeData` structure

- [ ] **Step 11: Implement useTreeDnd hook**

Create `components/TreeView/hooks/useTreeDnd.ts`:
- Wraps dnd-kit's `DndContext` and `SortableContext` setup
- Each node key is a sortable item
- `onDragEnd`: computes drop position (before/after/inside) based on y-offset within target
- Returns `dndContextProps`, `sortableContextProps`, `activeId` (currently dragged key)

- [ ] **Step 12: Implement DragOverlay and DropIndicator (internal)**

Create `components/TreeView/components/DragOverlay.tsx`:
- Floating card showing the dragged node label + icon
- Uses dnd-kit's `DragOverlay` component
- Styled as elevated card: `--shadow-offset-md`, `--card-bg`, `--card-border`

Create `components/TreeView/components/DropIndicator.tsx`:
- Thick `--primary` line rendered between nodes at drop position
- For "inside" drops: dashed `--primary` border on target node

- [ ] **Step 13: Implement useTreeVirtualizer hook**

Create `components/TreeView/hooks/useTreeVirtualizer.ts`:
- Wraps TanStack Virtual's `useVirtualizer`
- Takes `flatNodes`, `estimateSize`, `containerRef`
- Returns virtualizer instance + `virtualItems`

- [ ] **Step 14: Implement TreeView root**

Create `components/TreeView/TreeView.tsx`:
- Uses all hooks: `useTreeState`, `useTreeKeyboard`, optionally `useTreeDnd`, optionally `useTreeVirtualizer`
- Data-driven mode: accepts `data` prop, flattens via `flattenTree`
- Declarative mode: collects `TreeNode` children into same data structure
- Renders `TreeNodeRow` for each visible node (or virtualized items)
- If `draggable`: wraps in DndContext, renders DragOverlay
- `role="tree"` on root element
- Container has offset shadow (`--shadow-hard`), `--card-bg`, `--card-border`

- [ ] **Step 15: Write SCSS styles**

Create `components/TreeView/TreeView.module.scss`:
- All tokens per spec Section 4 "Tokens"
- `.tree` — container with border, shadow, padding
- `.nodeRow` — flex row, hover: `--muted` background (NOT lift)
- `.nodeRow.selected` — `3px solid var(--primary)` left border, `var(--primary)` 10% opacity bg
- `.nodeRow:focus-visible` — `@include focus`
- `.expandArrow` — ChevronRight, transitions `rotate(90deg)` on expanded
- `.connectingLine` — solid, `--muted-foreground`, `--surface-border-width` thickness, hard right angles
- `.indent` — `padding-left: calc(var(--space-3) * var(--depth))`
- `.dragOverlay` — elevated card
- `.dropIndicator` — thick `--primary` line
- `.disabled` — `@include disabled-state`

- [ ] **Step 16: Run tests to verify they pass**

Run: `npm test -- components/TreeView --run`
Expected: All PASS.

- [ ] **Step 17: Write stories**

Create `components/TreeView/TreeView.stories.tsx`:
- `Default` — basic file tree data
- `WithSelection` — selectedKeys + onSelect
- `MultiSelect` — selectionMode="multiple"
- `Checkable` — checkable=true with parent/child cascade
- `Draggable` — draggable=true
- `Virtualized` — virtualized=true with 1000+ nodes
- `LazyLoading` — nodes with onLoadChildren
- `WithLines` — showLines=true (default)
- `WithoutLines` — showLines=false
- `Declarative` — using TreeNode JSX children
- `Controlled` — render function showing controlled selection + expansion

- [ ] **Step 18: Create barrel export and register**

1. `components/TreeView/index.ts`: export TreeView, TreeNode, TreeNodeData, TreeDropEvent, TreeViewProps
2. Add to root `index.ts`
3. A2UI mapping: `"tree-view": TreeView, "tree-node": TreeNode`
4. A2UI catalog descriptor
5. SKILL.md: add to Data Display table

- [ ] **Step 19: Create skill doc**

Create `skills/doom-design-system/components/treeview.md`

- [ ] **Step 20: Run full test suite and commit**

```bash
npm test -- components/TreeView --run
git add components/TreeView/ components/A2UI/ index.ts skills/doom-design-system/
git commit -m "feat: add TreeView component"
```

---

## Phase 4: Final Verification

### Task 9: Integration Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --run
```

All tests must pass.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Build must succeed. All new components must be in `dist/`.

- [ ] **Step 3: Run verify**

```bash
npm run verify
```

Validates build, lints package, runs integration tests.

- [ ] **Step 4: Token-only styling check**

Grep for hardcoded values in new component SCSS files:

```bash
grep -rn '#[0-9a-fA-F]\{3,\}\|[0-9]*px\|[0-9]*ms\|rgb(' components/ToggleGroup/*.module.scss components/Rating/*.module.scss components/Stepper/*.module.scss components/TreeView/*.module.scss components/Calendar/*.module.scss components/DatePicker/*.module.scss
```

Expected: no matches (zero hardcoded values).

- [ ] **Step 5: Commit any fixes**

If Steps 1-4 surfaced issues, fix and commit:

```bash
git add -A
git commit -m "fix: address integration verification issues"
```
