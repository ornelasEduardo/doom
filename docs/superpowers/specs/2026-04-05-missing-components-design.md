# Missing Components for 1.0 — Design Spec

**Date:** 2026-04-05
**Status:** Draft
**Approach:** Strategic Dependencies (Approach B) — native builds for simple components, `date-fns` for calendar date math, existing `dnd-kit` + `TanStack Virtual` for Tree

## Overview

Five new components to fill gaps identified in the 1.0 readiness audit. Ordered from simplest to most complex:

1. **ToggleGroup** — grouped toggle buttons with single/multi select
2. **Rating** — flexible icon-based rating with half-value support
3. **Stepper** — wizard with step indicators, content panels, validation, navigation
4. **TreeView** — data-driven and declarative tree with checkboxes, drag-and-drop, virtualization
5. **Calendar / DatePicker** — inline calendar + input-triggered date selection (single and range via `mode` prop)

### New Dependencies

- `date-fns` — added as a **peer dependency** (tree-shakeable, consumer likely already has it). Used only by Calendar/DatePicker/DateRangePicker.

### Pre-Requisite 1: Enhance Component-Builder Skill

The current `component-builder` agent and supporting skill docs can scaffold simple components but lack the guidance needed for compound components, proper doom style enforcement, and engineering rigor. Before building any new component, enhance the skill system with:

**Fix inconsistencies:**
- `SKILL.md` line 62 says `@use "../../styles/mixins" as m;` (qualified) — change to `as *` (unqualified) to match the dominant codebase convention (37/47 components) and what `component-builder.md` + `styles.md` already say

**Add to `agents/component-builder.md`:**

1. **Compound component scaffold** — a second template for context-based multi-part components. Shows:
   - Context file in `context/` subdirectory with `createContext`, typed context value, and a `use[Name]Context` hook that throws when used outside the provider
   - Root component that provides context
   - Child components in `components/` subdirectory that consume context
   - Controlled + uncontrolled pattern with `isControlled` flag
   - Example: reference Tabs (TabsContext, Tabs, TabsList, TabsTrigger, TabsContent)

2. **Complex component directory structure** — when a component has 3+ internal files beyond the base set (tsx, scss, test, stories, index), organize into subdirectories:
   ```
   components/[Name]/
     [Name].tsx
     [Name].module.scss
     [Name].test.tsx
     [Name].stories.tsx
     index.ts
     context/           (if compound)
     components/         (if has internal subcomponents)
     hooks/              (if has 2+ hooks)
     types/              (if types are shared across files)
     utils/              (if has pure utility functions)
   ```

3. **Mixin enforcement table** — which mixins are mandatory for which surface type:
   | Surface Type | Required |
   |---|---|
   | Clickable control | `@include control` (or `base-interactive`), `@include hover` (or `brutalist-hover`), `@include focus`, active press CSS |
   | Container/surface | `--shadow-hard` or `--shadow-sm`, `--card-bg`, `--card-border` |
   | Disableable element | `@include disabled-state` |
   | Focusable element | `@include focus` on `:focus-visible` |
   | Error state | `@include error` |

4. **Doom-isms that are NOT in the mixins** (design judgment the agent must apply):
   - Surfaces get offset shadows — if it has a border and a background, it probably needs a shadow
   - Dense repeated elements (tree rows, table rows, list items) do NOT lift on hover — use flat `--muted` background instead. Lift on 50 rows is chaos.
   - Today/current indicators use bold markers (dots, borders), not subtle highlights
   - Transitions are fast (`--duration-fast`) or instant — no slow fades, no slides
   - Disabled days/items get a visual strike-through or hatched overlay, not just opacity
   - Range/selection bands use `--primary` at 10% opacity with hard edges, not gradients

5. **Test coverage checklist** — replace the bare "renders children" template with minimum required tests:
   - Renders correctly (by role, not text)
   - Every variant renders distinct styles (if applicable)
   - Controlled and uncontrolled modes work
   - Disabled state prevents interaction
   - Keyboard navigation (if interactive)
   - Accessibility attributes present (roles, aria-*)
   - Compound components: child throws when used outside parent context
   - Callbacks fire with correct arguments

6. **Story coverage checklist** — minimum required stories:
   - `Default` — base usage with args
   - One story per variant (if applicable)
   - `Sizes` — sm/md/lg side by side (if applicable)
   - `Disabled` — disabled state
   - `Controlled` — interactive render function showing controlled state
   - Compound components: full composition example

**Add to `skills/doom-design-system/SKILL.md`:**
- Fix mixin import to `as *`
- Add a "Doom Philosophy" section explaining *why* (not just *what*): neubrutalism draws from early web brutalism and print design — every element announces itself, nothing is subtle, form follows function with maximum honesty. This helps agents make judgment calls.
- Add a "When NOT to use mixins" section: not every element is a control. Text, icons, layout containers, separators — these don't get hover/press/focus treatment.

### Pre-Requisite 2: Extend Checkbox

TreeView requires **indeterminate checkbox state**. The current `Checkbox` component only renders checked/unchecked — it has no `indeterminate` prop. Before TreeView is built:

- Add `indeterminate?: boolean` prop to `CheckboxProps`
- When `indeterminate` is true, set `ref.current.indeterminate = true` via `useEffect` and render a `Minus` icon instead of `Check`
- Update Checkbox tests and stories to cover indeterminate state
- Update `skills/doom-design-system/components/checkbox.md`

### Shared Patterns (All Components)

Every component follows existing Doom conventions:

- `@layer doom.components` wraps all SCSS
- `@use "../../styles/mixins" as *` for shared mixins
- Only semantic tokens referenced (never primitives directly)
- `clsx` for className composition
- `forwardRef` for simple components, Context for compound components
- Controlled + uncontrolled support via `value`/`defaultValue` (using the `isControlled` flag pattern from Tabs, Accordion, Slider, etc.)
- `useId` for auto-generated IDs
- Variants/sizes use `ControlSize` type from `styles/types.ts` and applied as CSS classes via `clsx`
- `role`, `aria-*` attributes for accessibility
- Keyboard navigation

### Required Artifacts Per Component

Every component **must** ship with all of the following:

| Artifact | Path | Description |
|----------|------|-------------|
| Source | `components/<Name>/<Name>.tsx` | Component implementation |
| Styles | `components/<Name>/<Name>.module.scss` | SCSS module, `@layer doom.components` |
| Unit tests | `components/<Name>/<Name>.test.tsx` | vitest + @testing-library/react |
| Stories | `components/<Name>/<Name>.stories.tsx` | Storybook stories with `autodocs` tag |
| Barrel export | `components/<Name>/index.ts` | Re-export all public types + components |
| Skill doc | `skills/doom-design-system/components/<name>.md` | AI skill documentation |
| SKILL.md update | `skills/doom-design-system/SKILL.md` | Add to component reference table |
| A2UI mapping | `components/A2UI/mapping.tsx` | Register in componentMap |
| A2UI catalog | `components/A2UI/catalog.ts` | Add to catalog with props/category |
| Root export | `index.ts` | Add `export * from "./components/<Name>"` |

Components with internal hooks, context, or types files list those explicitly in their section below. Complex components use subdirectories to organize internals (see TreeView, Stepper).

### Engineering Standards

All new components must follow these principles:

**Clean code:**
- Single responsibility — each file does one thing. Context in its own file, hooks in their own files, types in their own file.
- No God components — if a component file exceeds ~200 lines, split internal concerns into subcomponents or hooks.
- Named exports only — no default exports (matches existing Doom convention).
- Props interfaces exported and documented — consumers can extend or reference them.
- No `any` types — strict TypeScript throughout. Use generics where the type varies by mode (e.g., DatePicker single vs. range value types).

**Composition over complexity:**
- Prefer composing existing components (`Button`, `Input`, `Popover`, `Checkbox`) over reimplementing their behavior.
- Internal subcomponents (e.g., `TreeNodeRow`, `StepIndicator`) are private — not exported from the barrel `index.ts`.
- Hooks extract stateful logic out of render functions. A component file should primarily be JSX + prop destructuring.

**Testing rigor:**
- Test behavior, not implementation — query by role/label, not by CSS class or test ID.
- Every interactive state must be tested: default, hover-preview (where applicable), active/pressed, disabled, keyboard navigation.
- Controlled and uncontrolled modes both tested.
- Compound components tested for context error (using outside parent throws).
- Accessibility tested: roles, aria attributes, keyboard navigation sequences.

### Doom Style Guarantee

The neubrutalist aesthetic isn't just visual — it's mechanical. Here's how we guarantee it:

**1. Mixin enforcement (mechanical guarantee):**
Every interactive surface must use the appropriate mixins. These encode the doom philosophy and are non-negotiable:

| Surface Type | Required Mixins |
|-------------|----------------|
| Clickable control (button, toggle, nav arrow) | `@include control`, `@include hover`, `@include focus`, `@include press` |
| Container/surface (panel, card, tree container) | Offset shadow via `--shadow-offset-sm/md`, `--card-bg`, `--card-border` |
| Disableable element | `@include disabled-state` (hatched overlay + opacity) |
| Focusable element | `@include focus` on `:focus-visible` |
| Error state | `@include error` |

If a component has an interactive element that doesn't use these mixins, it's a bug.

**2. Token-only styling (mechanical guarantee):**
Zero hardcoded color, spacing, radius, shadow, or timing values in SCSS. Every value must reference a semantic token. This is grep-verifiable — any raw `px`, `#hex`, `rgb()`, or `ms` value in a component's SCSS (outside of the mixins themselves) is a violation.

**3. Doom-isms checklist (design judgment, verified in review):**
Each component's Doom-isms section documents the specific design decisions. During implementation, each item becomes a visual verification point. After building, the implementer must confirm in Storybook:

- [ ] Offset shadows render correctly and match existing component shadow weight
- [ ] Hover lift animation matches Button/Card lift (same mixin = same feel)
- [ ] Press animation compresses toward shadow (not just opacity change)
- [ ] Focus ring uses `--primary` and matches existing focus treatment
- [ ] Disabled state shows hatched overlay pattern (not just opacity)
- [ ] Border weights match — `--surface-border-width` is consistent with Card, Input, etc.
- [ ] Typography uses semantic scale tokens (`--text-2xs`, `--control-font-size`, etc.)
- [ ] Spacing uses semantic tokens (`--control-gap`, `--surface-padding`, `--space-*`)
- [ ] Component feels "heavy" and "punchy" — no thin lines, no subtle transitions, no gradual fades

**4. Cross-reference test (verified in Storybook):**
Open the new component's story alongside an existing component story (e.g., Button, Card, Tabs). They should look like they belong to the same family. If the new component feels lighter, thinner, or smoother than the existing ones, the doom-isms aren't fully applied.

---

## 1. ToggleGroup

### Reuses Existing Components

| Component | How |
|-----------|-----|
| — | No existing component reuse — ToggleGroup is a new primitive |

**Pattern references:** Follows Accordion's `type="single"|"multiple"` + context pattern for value management. Follows Tabs' context + controlled/uncontrolled pattern.

### API

```tsx
// Single select
<ToggleGroup type="single" value={val} onValueChange={setVal}>
  <ToggleGroupItem value="bold" aria-label="Bold"><BoldIcon /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><ItalicIcon /></ToggleGroupItem>
</ToggleGroup>

// Multi select
<ToggleGroup type="multiple" value={vals} onValueChange={setVals}>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
  <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
</ToggleGroup>
```

### Props

```
ToggleGroup
  type            "single" | "multiple"
  value           string | string[]            controlled
  defaultValue    string | string[]            uncontrolled
  onValueChange   (value) => void
  size            ControlSize ("sm" | "md" | "lg")
  variant         "primary" | "outline"
  disabled        boolean
  className       string

ToggleGroupItem
  value           string                       required
  disabled        boolean
  aria-label      string
  className       string
  children        ReactNode
```

### Structure

Compound component with context (same pattern as Tabs):
- `ToggleGroup` creates context: `activeValue`, `setActiveValue`, `type`, `size`, `variant`
- `ToggleGroupItem` consumes context, throws if used outside group
- Controlled + uncontrolled via `value`/`defaultValue` with `isControlled` flag

### Accessibility

- Group: `role="group"` with optional `aria-label`
- Items: `<button>` with `aria-pressed="true|false"`
- Keyboard: arrow keys move focus (roving tabindex), Space/Enter toggles
- Disabled items skipped in arrow key navigation

### Tokens

```
Sizing (via @include control / control-sm / control-lg):
  --control-height          item height
  --control-padding-x       horizontal padding
  --control-padding-y       vertical padding
  --control-font-size       text size
  --control-icon-size       icon size
  --control-gap             gap between icon and label within item
  --control-radius          radius on first/last items only

Borders & Surfaces:
  --surface-border-width    border thickness (shared between items)
  --card-bg                 default item background
  --card-border             border color
  --border-strong           pressed item border (primary variant)

Colors — outline variant:
  --card-bg                 unpressed background
  --foreground              unpressed text
  --muted                   pressed background
  --muted-foreground        pressed text

Colors — primary variant:
  --card-bg                 unpressed background
  --foreground              unpressed text
  --primary                 pressed background
  --primary-foreground      pressed text

Shadows & Motion:
  --shadow-offset-sm        offset shadow on group container
  --duration-fast           transition speed
  --ease-in-out             easing
```

### Doom-isms

- Offset shadow on the entire group container (static, not responsive to hover) — `--shadow-offset-sm` with `--card-border`
- Shared borders — adjacent items share `--surface-border-width` borders
- **No group-level hover/press** — ToggleGroup is a segmented control, not a button. The group does NOT lift.
- Individual unpressed items get subtle `--muted` background on hover (no lift)
- `@include focus` on individual items via `:focus-visible`
- `@include disabled-state` — hatched overlay + 0.6 opacity
- Pressed items feel "pushed in" with inset shadow `0 2px 0 0 var(--card-border)`
- First child gets `--control-radius` on left corners, last child on right, middle items get `border-radius: 0`

### A2UI

```
"toggle-group"      -> ToggleGroup
"toggle-group-item" -> ToggleGroupItem
```

### Required Files

```
components/ToggleGroup/
  ToggleGroup.tsx              ToggleGroup + ToggleGroupItem + context
  ToggleGroup.module.scss
  ToggleGroup.test.tsx
  ToggleGroup.stories.tsx
  index.ts

skills/doom-design-system/components/togglegroup.md
```

Plus standard updates: SKILL.md, A2UI mapping.tsx, A2UI catalog.ts, root index.ts.

---

## 2. Rating

### Reuses Existing Components

| Component | How |
|-----------|-----|
| `Tooltip` | Wraps each icon button to show hover label (e.g., "3 out of 5") when `aria-label` is present. Uses `placement="top"` and default delay. |

**Pattern references:** Follows Slider's controlled/uncontrolled pattern and `aria-value*` attribute approach. Icon rendering matches lucide-react convention used by all Doom components.

### API

```tsx
// Basic
<Rating value={3} onValueChange={setRating} />

// Custom icon, count, half values
<Rating
  value={3.5}
  onValueChange={setRating}
  icon={Skull}
  count={10}
  allowHalf
/>

// Read-only
<Rating value={4.5} icon={Heart} readOnly />
```

### Props

```
Rating
  value           number                       controlled
  defaultValue    number                       uncontrolled
  onValueChange   (value: number) => void
  count           number                       default: 5
  icon            LucideIcon                   default: Star
  allowHalf       boolean                      default: false
  size            ControlSize
  readOnly        boolean
  disabled        boolean
  className       string
  aria-label      string
```

### Structure

Single component (not compound). Each icon position is a `<button>` in interactive mode, `<span>` in readOnly. Half-value via `clip-path: inset(0 50% 0 0)` layering filled + unfilled icons. Hover preview tracked via internal state.

Consumer-provided `icon` rendered via `React.createElement(icon, { className, size })` matching lucide-react convention.

### Accessibility

- Container: `role="radiogroup"` with `aria-label`
- Each icon: `role="radio"`, `aria-checked`, `aria-label="Rate {n} out of {count}"`
- Keyboard: arrow left/right to change, Home/End for min/max. `allowHalf` steps by 0.5.
- readOnly: `role="img"` with `aria-label="{value} out of {count}"`

### Tokens

```
Sizing:
  --control-icon-size       icon size (md)
  --control-gap             gap between icons
  sm: icon = var(--size-4)
  md: icon = var(--control-icon-size)
  lg: icon = var(--size-8)

Colors:
  --warning                 filled icon color
  --warning-foreground      filled icon stroke
  --muted                   unfilled icon color
  --muted-foreground        unfilled icon stroke
  --primary                 focus ring color

Borders:
  --surface-border-width    applied via CSS for icon weight

Motion:
  --duration-fast           fill/unfill transition
  --ease-in-out             easing
```

### Doom-isms

- No offset shadow — Rating is inline/lightweight
- `@include focus` on individual icon buttons via `:focus-visible`
- `@include disabled-state` — hatched overlay + 0.6 opacity
- Filled icons scale up `transform: scale(1.15)` on hover with `--duration-fast`
- Click feedback: `scale(0.85)` bounce then settle
- Half icons via `clip-path` — hard edge, no gradients

### A2UI

```
"rating" -> Rating
```

### Required Files

```
components/Rating/
  Rating.tsx
  Rating.module.scss
  Rating.test.tsx
  Rating.stories.tsx
  index.ts

skills/doom-design-system/components/rating.md
```

Plus standard updates: SKILL.md, A2UI mapping.tsx, A2UI catalog.ts, root index.ts.

---

## 3. Stepper (Wizard)

### Reuses Existing Components

| Component | How |
|-----------|-----|
| `Button` | Navigation buttons — `variant="secondary"` for Back, `variant="primary"` for Next/Complete. Inherits all doom button behavior (hover, press, focus, shadow). |
| `Badge` | "Optional" indicator on optional steps — `<Badge variant="secondary" size="sm">Optional</Badge>` rendered below step label. |
| `Check` icon | Completed step indicator — same lucide `Check` icon used in Checkbox's checked state. |
| `Flex` | Layout container for step indicators (horizontal) and navigation button row. |

**Pattern references:** Follows Tabs' compound context pattern. Step indicator row mirrors Tabs' `TabsList`/`TabsTrigger` pattern with `role="tablist"`/`role="tab"`. Content panel mirrors `TabsContent` with `role="tabpanel"`.

### API

```tsx
<Stepper activeStep={step} onStepChange={setStep}>
  <StepperStep label="Account" description="Create your account">
    <AccountForm onNext={() => setStep(1)} />
  </StepperStep>
  <StepperStep label="Profile" description="Tell us about yourself">
    <ProfileForm onBack={() => setStep(0)} onNext={() => setStep(2)} />
  </StepperStep>
  <StepperStep label="Confirm" validator={() => formIsValid}>
    <ConfirmView onBack={() => setStep(1)} onSubmit={submit} />
  </StepperStep>
</Stepper>

// With built-in navigation
<Stepper activeStep={step} onStepChange={setStep} showNavigation onComplete={submit} />

// Vertical
<Stepper activeStep={step} onStepChange={setStep} orientation="vertical" />
```

### Props

```
Stepper
  activeStep      number                       controlled, 0-indexed
  defaultStep     number                       uncontrolled, default: 0
  onStepChange    (step: number) => void
  orientation     "horizontal" | "vertical"    default: "horizontal"
  showNavigation  boolean                      default: false
  nextLabel       string                       default: "Next"
  backLabel       string                       default: "Back"
  completeLabel   string                       default: "Complete"
  onComplete      () => void
  className       string
  children        StepperStep elements

StepperStep
  label           string                       required
  description     string
  icon            LucideIcon                   overrides step number
  disabled        boolean
  optional        boolean                      shows "Optional" badge
  validator       () => boolean | Promise<boolean>
  className       string
  children        ReactNode                    step content panel
```

### Structure

Compound component with context:
- `Stepper` provides: `activeStep`, `setActiveStep`, `orientation`, `totalSteps`, `completedSteps`
- `StepperStep` registers via index, renders indicator and content
- Only active step's content panel is rendered
- `validator` called before step transition — blocks if returns false
- `showNavigation` renders `<Button variant="secondary">` (Back) and `<Button variant="primary">` (Next/Complete) in a `<Flex>` with `justify="end"` and `gap={2}`

### Accessibility

- Step list: `role="tablist"` with `aria-label="Progress"`
- Step indicators: `role="tab"`, `aria-selected`, `aria-disabled`
- Active step: `aria-current="step"`
- Content: `role="tabpanel"`, `aria-labelledby`
- Completed steps: clickable (keyboard + mouse)
- Keyboard: arrow keys between indicators

### Tokens

```
Step indicator:
  --control-height          circle size
  --control-font-size       step number text
  --control-radius          --radius-pill (fully round)
  --surface-border-width    border thickness

Colors — incomplete:
  --card-bg                 circle bg
  --card-border             circle border
  --muted-foreground        number + label text

Colors — active:
  --primary                 circle bg
  --primary-foreground      number text
  --foreground              label text

Colors — completed:
  --success                 circle bg
  --success-foreground      checkmark color
  --foreground              label text

Connector:
  --card-border             incomplete line
  --success                 completed line
  --surface-border-width    line thickness

Layout:
  --surface-gap             indicator-to-label gap
  --space-4                 between steps (horizontal)
  --space-6                 between steps (vertical)
  --surface-padding         content panel padding

Content panel:
  --card-bg                 background
  --card-border             border
  --surface-radius          radius
  --shadow-offset-sm        offset shadow

Motion:
  --duration-normal         state transitions
  --ease-in-out             easing
```

### Doom-isms

- Offset shadow on content panel
- Bold indicator circles with thick `--surface-border-width` borders
- Connector lines are thick (`--surface-border-width`), hard color cut from `--card-border` to `--success` (no gradient fill)
- Active indicator gets a glow ring (primary box-shadow) — "you are here" signal
- Completed step: `--success` fill, `Check` icon (lucide), `--border-strong` border
- `@include hover` on clickable (completed) indicators
- `@include press` on indicator click
- `@include disabled-state` on disabled steps
- Navigation uses actual `<Button>` components with doom behavior

### A2UI

```
"stepper"      -> Stepper
"stepper-step" -> StepperStep
```

### Required Files

```
components/Stepper/
  Stepper.tsx               root component, renders indicator row + active content panel
  Stepper.module.scss
  Stepper.test.tsx
  Stepper.stories.tsx
  index.ts                  re-exports Stepper, StepperStep, and all public types

  context/
    StepperContext.ts        context type + createContext + useStepperContext hook
  
  components/
    StepperStep.tsx          step registration + content panel rendering
    StepIndicator.tsx        single step circle + label + description (internal, not exported)
    StepConnector.tsx        connector line between indicators (internal, not exported)
    StepperNavigation.tsx    Back/Next/Complete button row using <Button> + <Flex> (internal)

  types/
    stepper.ts               StepperProps, StepperStepProps, StepMeta, public types

skills/doom-design-system/components/stepper.md
```

Plus standard updates: SKILL.md, A2UI mapping.tsx, A2UI catalog.ts, root index.ts.

---

## 4. TreeView

### Reuses Existing Components

| Component | How |
|-----------|-----|
| `Checkbox` | Rendered per node when `checkable` is true. Requires indeterminate extension (see Pre-Requisite above). Inherits all doom checkbox styling. |
| `Spinner` | `<Spinner size="sm" />` shown inline during lazy loading while `onLoadChildren` resolves. |
| `ChevronRight` icon | Expand/collapse arrow per node — same icon used in Sidebar.Group and Accordion. Rotates 90deg when expanded. |

**Pattern references:** Follows Sidebar's expand/collapse context pattern and `useAutoExpand` hook concept for auto-expanding to active nodes. Follows Accordion's `type="single"|"multiple"` controlled state pattern for expansion management. Uses dnd-kit (`@dnd-kit/core` + `@dnd-kit/utilities`, already installed) and TanStack Virtual (`@tanstack/react-virtual`, already installed).

### API

```tsx
// Data-driven
<TreeView
  data={fileTree}
  selectedKeys={selected}
  onSelect={setSelected}
  expandedKeys={expanded}
  onExpand={setExpanded}
  checkable
  draggable
  virtualized
/>

// TreeNodeData shape
interface TreeNodeData {
  key: string
  label: string
  icon?: LucideIcon
  children?: TreeNodeData[]
  disabled?: boolean
  isLeaf?: boolean
  onLoadChildren?: () => Promise<TreeNodeData[]>
}

// Declarative
<TreeView>
  <TreeNode nodeKey="1" label="Documents" icon={Folder}>
    <TreeNode nodeKey="1-1" label="Resume.pdf" icon={FileText} />
  </TreeNode>
</TreeView>
```

### Props

```
TreeView
  data              TreeNodeData[]               data-driven mode
  children          ReactNode                    declarative mode
  selectedKeys      string[]                     controlled
  defaultSelectedKeys string[]                   uncontrolled
  onSelect          (keys: string[]) => void
  expandedKeys      string[]                     controlled
  defaultExpandedKeys string[]                   uncontrolled
  onExpand          (keys: string[]) => void
  selectionMode     "single" | "multiple"        default: "single"
  checkable         boolean                      default: false
  draggable         boolean                      default: false
  onDrop            (event: TreeDropEvent) => void
  virtualized       boolean                      default: false
  estimateSize      number                       default: 32
  showLines         boolean                      default: true
  className         string

TreeNode (declarative)
  nodeKey           string                       required
  label             string                       required
  icon              LucideIcon
  disabled          boolean
  children          ReactNode
```

### Structure

- `TreeView` manages state, sets up `DndContext` (dnd-kit) if draggable, `useVirtualizer` (TanStack Virtual) if virtualized
- Internal `TreeNodeRow` renders: indent + expand chevron + `<Checkbox>` (when checkable) + icon + label + drag handle
- Data-driven: tree flattened to visible-node list (respecting expansion), indexed by depth for indentation
- Declarative: children collected via context into same internal structure
- Checkbox cascade: parent checks all children, unchecking child makes parent indeterminate (uses extended `<Checkbox indeterminate>`)
- Drag-and-drop: `useSortable` per row, drop indicators for "before"/"after"/"inside"
- Lazy loading: `onLoadChildren` on expand shows `<Spinner size="sm" />` until resolved

### Accessibility

- Root: `role="tree"`
- Nodes: `role="treeitem"`, `aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`
- Checkbox: reuses `<Checkbox>`, `aria-checked="true|false|mixed"` (indeterminate = mixed)
- Keyboard:
  - Up/Down: move focus
  - Right: expand or move to first child
  - Left: collapse or move to parent
  - Space: toggle selection/checkbox
  - Enter: activate
  - Home/End: first/last visible
  - `*`: expand all siblings

### Tokens

```
Layout:
  --space-3                 indent per depth level
  --space-2                 gap between arrow, icon, label
  --control-height          row height
  --control-padding-x       row horizontal padding

Node row:
  --control-font-size       label text
  --control-icon-size       icons + expand arrow

Colors:
  --card-bg                 container background
  --card-border             container border
  --foreground              label text
  --muted-foreground        connecting lines, expand arrow, disabled text
  --primary                 selected row bg (10% opacity) + left border accent
  --muted                   hover row background

Connecting lines:
  --muted-foreground        line color
  --surface-border-width    line thickness

Drag-and-drop:
  --primary                 drop indicator line
  --surface-border-width    drop indicator thickness
  --card-bg                 drag overlay bg
  --card-border             drag overlay border
  --shadow-offset-md        drag overlay shadow (elevated)

Surfaces:
  --surface-border-width    container border
  --surface-radius          container radius
  --surface-padding         container padding (top/bottom)
  --shadow-offset-sm        container offset shadow

Motion:
  --duration-fast           expand/collapse, hover
  --duration-normal         drag animation
  --ease-in-out             easing
```

### Doom-isms

- Offset shadow on container
- Selected row: `3px solid var(--primary)` left border accent + `var(--primary)` at 10% opacity bg
- `@include focus` on rows via `:focus-visible`
- `@include disabled-state` on disabled nodes
- Connecting lines: solid (not dotted), thick, hard right angles
- Expand arrow: `ChevronRight` (lucide), rotates 90deg, `--duration-fast`
- Drag overlay: floating card with `--shadow-offset-md` (elevated feel)
- Drop indicator: thick `--primary` line
- Checkbox: reuses existing `<Checkbox>` directly (with indeterminate extension)
- Lazy loading: existing `<Spinner size="sm" />`

### A2UI

```
"tree-view"  -> TreeView
"tree-node"  -> TreeNode
```

### Required Files

```
components/TreeView/
  TreeView.tsx               root component, sets up providers (DndContext, Virtualizer)
  TreeView.module.scss
  TreeView.test.tsx
  TreeView.stories.tsx
  index.ts                   re-exports TreeView, TreeNode, and all public types

  context/
    TreeViewContext.ts        context type + createContext + useTreeViewContext hook

  components/
    TreeNode.tsx              declarative TreeNode component (public, exported)
    TreeNodeRow.tsx           single row renderer: indent + chevron + checkbox + icon + label (internal)
    DragOverlay.tsx           floating card shown during drag (internal)
    DropIndicator.tsx         thick primary line between drop targets (internal)

  hooks/
    useTreeState.ts           selection, expansion, and checkbox cascade logic
    useTreeDnd.ts             dnd-kit DndContext + SortableContext + useSortable wiring
    useTreeVirtualizer.ts     TanStack Virtual useVirtualizer setup
    useTreeKeyboard.ts        keyboard navigation (arrow keys, Home/End, *, expand/collapse)

  types/
    tree.ts                   TreeNodeData, TreeDropEvent, TreeViewProps, public types

  utils/
    flattenTree.ts            recursive tree -> flat visible-node list (respects expansion)
    checkboxCascade.ts        parent/child check propagation + indeterminate resolution
```

Plus standard updates: SKILL.md, A2UI mapping.tsx, A2UI catalog.ts, root index.ts.

**Pre-requisite file changes:**
- `components/Checkbox/Checkbox.tsx` — add `indeterminate` prop
- `components/Checkbox/Checkbox.test.tsx` — add indeterminate tests
- `components/Checkbox/Checkbox.stories.tsx` — add Indeterminate story
- `skills/doom-design-system/components/checkbox.md` — document indeterminate

---

## 5. Calendar / DatePicker

### New Dependency

`date-fns` as a **peer dependency**. Functions used: `format`, `parse`, `addMonths`, `subMonths`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek`, `isSameDay`, `isSameMonth`, `isWithinInterval`.

### Reuses Existing Components

| Component | How |
|-----------|-----|
| `Input` | DatePicker text field(s). Uses `endAdornment` for `CalendarDays` icon trigger. Uses `format` prop to display formatted date on blur. Uses `error` prop + `aria-invalid` for validation. Range mode renders two Inputs in a shared container. |
| `Popover` | Wraps Calendar dropdown in DatePicker. Uses `placement="bottom-start"`, controlled `isOpen`/`onClose`. Portal rendering, click-outside close, viewport clamping all inherited. |
| `Button` | Calendar month navigation (prev/next) — `variant="ghost" size="sm"`. Inherits hover lift, press, focus ring. |
| `Label` | DatePicker field label with `required` indicator support. |
| `Flex` | Layout for range mode dual-input container and calendar header row. |

**Pattern references:** Popover usage follows Select and Combobox's dropdown pattern (controlled `isOpen`, `placement`, `onClose` on escape/click-outside). Input integration follows the same pattern as Combobox (input + popover + list).

### API

```tsx
// Inline calendar
<Calendar value={date} onValueChange={setDate} />

// Inline calendar — range
<Calendar mode="range" value={{ from: start, to: end }} onValueChange={setRange} />

// DatePicker — single (one input + popover + calendar)
<DatePicker value={date} onValueChange={setDate} label="Start date" />

// DatePicker — range (dual input + popover + calendar)
<DatePicker
  mode="range"
  value={{ from: start, to: end }}
  onValueChange={setRange}
  label="Trip dates"
/>
```

### Props

```
Calendar
  mode              "single" | "range"           default: "single"
  value             Date | DateRange | null       controlled
  defaultValue      Date | DateRange | null       uncontrolled
  onValueChange     (value) => void
  minDate           Date
  maxDate           Date
  disabledDates     (date: Date) => boolean
  weekStartsOn      0-6                          default: 0 (Sunday)
  showOutsideDays   boolean                      default: true
  className         string

DateRange = { from: Date; to: Date | null }

DatePicker (extends Calendar props, plus:)
  mode              "single" | "range"           default: "single"
  label             string
  placeholder       string                       default: "Select date" (single mode)
  startPlaceholder  string                       default: "Start date" (range mode)
  endPlaceholder    string                       default: "End date" (range mode)
  error             boolean
  disabled          boolean
  format            string                       default: "PPP" (date-fns)
  className         string
```

### Structure

Two components, layered. `mode` prop controls behavior in both.

**Calendar** — core grid:
- Header: month/year label + prev/next `<Button variant="ghost" size="sm">` + clickable label cycles days -> months -> years view
- Grid: 7-column day cells
- `date-fns` for all date math
- Range mode: first click = `from`, second click = `to`, hover previews range between clicks

**DatePicker** — wraps `<Input>` + `<Popover>` + `<Calendar>`:
- **Single mode (`mode="single"`, default):**
  - One `<Input endAdornment={<CalendarDays />}>` — clicking icon or input opens popover
  - `<Popover placement="bottom-start" isOpen={open} onClose={close}>` — contains `<Calendar>`
  - Selecting date closes popover, formats value into Input via `date-fns/format`
- **Range mode (`mode="range"`):**
  - Two `<Input>` fields in a shared `<Flex>` container with `ArrowRight` icon separator
  - Container gets the offset shadow, not individual inputs
  - `<Popover>` contains `<Calendar mode="range">`
  - Selecting a complete range (from + to) closes popover
- `<Label>` rendered above input(s) when `label` prop is provided

### Accessibility

**Calendar:**
- Grid: `role="grid"`, `aria-label="Calendar"`
- Day cells: `role="gridcell"`, `aria-selected`, `aria-disabled`
- Today: `aria-current="date"`
- Keyboard: arrows navigate days, Page Up/Down for months, Shift+Page for years, Home/End for week start/end, Enter/Space to select

**DatePicker:**
- Input: `role="combobox"`, `aria-expanded`, `aria-haspopup="dialog"`
- Popover: `role="dialog"`, `aria-label="Choose date"`
- Escape closes popover, returns focus to input
- Range mode: both inputs share the same popover; focus returns to start input on close

### Tokens

```
Day cells:
  --control-height          cell height (square)
  --control-font-size       day number text
  --control-radius          --radius-pill (round)
  --space-1                 gap between cells
  --space-2                 calendar internal padding

Header:
  --control-height          nav button height
  --control-icon-size       chevron size
  --text-base               month/year label size (bumped up)

Colors — days:
  --card-bg                 default day bg
  --foreground              day text
  --muted-foreground        outside-month text
  --muted                   outside-month bg, hover bg
  --primary                 selected bg
  --primary-foreground      selected text
  --border-strong           selected border
  --primary (10% opacity)   range-between bg
  --error                   today dot indicator
  --card-border             disabled day strike-through

Month/year picker overlay:
  --card-bg                 overlay bg
  --card-border             overlay border
  --primary                 selected month/year

Surfaces:
  --card-bg                 container bg
  --card-border             container border
  --surface-border-width    border thickness
  --surface-radius          container radius
  --surface-padding         padding
  --shadow-offset-sm        calendar shadow (standalone)
  --shadow-offset-md        popover shadow (DatePicker, inherited from Popover)

DatePicker input:
  Inherits all Input tokens
  --error                   error state border

Motion:
  --duration-fast           day hover/select
  --duration-normal         month transition
  --ease-in-out             easing
```

### Doom-isms

- Offset shadow on calendar container
- Day cells are bold squares — thick `--border-strong` border on selected, not subtle rings
- Today indicator: solid 4px dot below date number, `--error` color (red). Not a ring.
- Range: flat `--primary` at 10% band with hard edges, start/end fully filled
- Month transition: hard cut, no slide animation
- Day-of-week headers: uppercase, `--text-2xs`, `--muted-foreground`, letter-spaced (stencil feel)
- `@include hover` / `@include press` / `@include focus` on nav `<Button>` components (inherited)
- Outside-month days: dimmed but clickable (navigates to that month)
- Disabled days: diagonal strike-through line (2px, `--card-border`) over the number
- DatePicker single mode: reuses `<Input>` with `CalendarDays` lucide via `endAdornment`
- DatePicker range mode: two `<Input>` fields in shared `<Flex>` container with `ArrowRight` separator, container gets shadow

### A2UI

```
"calendar"     -> Calendar
"date-picker"  -> DatePicker
```

### Required Files

```
components/Calendar/
  Calendar.tsx               root component, renders header + day grid
  Calendar.module.scss
  Calendar.test.tsx
  Calendar.stories.tsx
  index.ts                   re-exports Calendar and all public types

  components/
    CalendarHeader.tsx        month/year label + prev/next <Button> nav (internal)
    CalendarGrid.tsx          7-column day cell grid (internal)
    DayCell.tsx               single day button/cell with selection + range styling (internal)
    MonthYearPicker.tsx       overlay grid for quick month/year jumping (internal)

  hooks/
    useCalendarState.ts       viewed month tracking, month navigation
    useDateRange.ts           range selection logic + hover preview state

  types/
    calendar.ts               DateRange, CalendarMode, CalendarProps, public types

  utils/
    dateGrid.ts               builds the 6x7 day grid for a given month using date-fns

components/DatePicker/
  DatePicker.tsx              Input + Popover + Calendar, mode switches single/range
  DatePicker.module.scss      range container styling, composes Input/Popover styles
  DatePicker.test.tsx
  DatePicker.stories.tsx
  index.ts
```

Plus standard updates: SKILL.md, A2UI mapping.tsx, A2UI catalog.ts, root index.ts.

---

## Summary

| Component | Type | New Deps | Reuses | Complexity |
|-----------|------|----------|--------|------------|
| ToggleGroup | Compound (context) | None | — | Low |
| Rating | Single | None | Tooltip | Low |
| Stepper | Compound (context) | None | Button, Badge, Flex, Check icon | Medium |
| TreeView | Data-driven + declarative | None (dnd-kit, TanStack Virtual already installed) | Checkbox (extended), Spinner, ChevronRight icon | High |
| Calendar | Single | date-fns (peer) | Button (ghost) | Medium |
| DatePicker | Single | date-fns (peer) | Input, Popover, Label, Flex, Calendar | Medium |

### Pre-Requisite Work

- Enhanced `agents/component-builder.md` — compound component template, directory structure guide, mixin enforcement table, doom judgment calls, test/story checklists
- Updated `skills/doom-design-system/SKILL.md` — fixed mixin import, added doom philosophy section, added "when NOT to use mixins" guidance
- Extended `Checkbox` — indeterminate prop, tests, stories, skill doc

### Total New Files

- 6 component directories with organized subdirectories (context/, components/, hooks/, types/, utils/)
- ~45 source files (tsx, scss, test, stories, hooks, context, types, utils, index)
- 6 skill docs: togglegroup.md, rating.md, stepper.md, treeview.md, calendar.md, datepicker.md
- 3 updated skill files: component-builder.md, SKILL.md, styles.md
- 4 updated existing files: Checkbox (tsx, test, stories, skill doc) for indeterminate support
- Updates to: A2UI mapping.tsx, A2UI catalog.ts, root index.ts
