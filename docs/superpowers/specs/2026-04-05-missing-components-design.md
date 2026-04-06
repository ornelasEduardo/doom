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
5. **Calendar / DatePicker / DateRangePicker** — inline calendar + input-triggered date selection

### New Dependencies

- `date-fns` — added as a **peer dependency** (tree-shakeable, consumer likely already has it). Used only by Calendar/DatePicker/DateRangePicker.

### Shared Patterns (All Components)

Every component follows existing Doom conventions:

- `@layer doom.components` wraps all SCSS
- `@use "../../styles/mixins" as *` for shared mixins
- Only semantic tokens referenced (never primitives directly)
- `clsx` for className composition
- `forwardRef` for simple components, Context for compound components
- Controlled + uncontrolled support via `value`/`defaultValue`
- `useId` for auto-generated IDs
- Variants/sizes applied as CSS classes via `clsx`
- `role`, `aria-*` attributes for accessibility
- Keyboard navigation

### Deliverables Per Component

- `components/<Name>/<Name>.tsx` — component source
- `components/<Name>/<Name>.module.scss` — styles
- `components/<Name>/<Name>.test.tsx` — vitest + RTL tests
- `components/<Name>/<Name>.stories.tsx` — Storybook stories
- `components/<Name>/index.ts` — re-export
- `skills/doom-design-system/components/<name>.md` — skill doc
- Update `SKILL.md` component reference
- Update `A2UI/mapping.tsx` + `A2UI/catalog.ts`
- Update root `index.ts` exports

---

## 1. ToggleGroup

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

- Offset shadow on the entire group container (not per-item) — `--shadow-offset-sm` with `--card-border`
- Shared borders — adjacent items collapse to single `--surface-border-width` via negative margin
- `@include hover` on unpressed items — whole group lifts, shadow grows
- `@include press` on click — group compresses toward shadow
- `@include focus` on individual items via `:focus-visible`
- `@include disabled-state` — hatched overlay + 0.6 opacity
- Pressed items feel "pushed in" with inset shadow `0 2px 0 0 var(--card-border)`
- First child gets `--control-radius` on left corners, last child on right, middle items get `border-radius: 0`

### A2UI

```
"toggle-group"      -> ToggleGroup
"toggle-group-item" -> ToggleGroupItem
```

---

## 2. Rating

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

---

## 3. Stepper (Wizard)

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
- `showNavigation` renders `<Button>` components in an `<ActionRow>`

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
- Navigation uses actual `<Button>` + `<ActionRow>` components

### A2UI

```
"stepper"      -> Stepper
"stepper-step" -> StepperStep
```

---

## 4. TreeView

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
- Internal `TreeNodeRow` renders: indent + expand chevron + checkbox (optional) + icon + label + drag handle
- Data-driven: tree flattened to visible-node list (respecting expansion), indexed by depth for indentation
- Declarative: children collected via context into same internal structure
- Checkbox cascade: parent checks all children, unchecking child makes parent indeterminate
- Drag-and-drop: `useSortable` per row, drop indicators for "before"/"after"/"inside"
- Lazy loading: `onLoadChildren` on expand shows `<Spinner size="sm" />` until resolved

### Internal Files

```
components/TreeView/
  TreeView.tsx              root component + context
  TreeNode.tsx              declarative TreeNode component
  TreeView.module.scss
  TreeView.test.tsx
  TreeView.stories.tsx
  useTreeState.ts           selection, expansion, checkbox cascade
  useTreeDnd.ts             dnd-kit wiring
  useTreeVirtualizer.ts     TanStack Virtual wiring
  types.ts                  TreeNodeData, TreeDropEvent
  index.ts
```

### Accessibility

- Root: `role="tree"`
- Nodes: `role="treeitem"`, `aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`
- Checkbox: reuses `<Checkbox>`, `aria-checked="true|false|mixed"`
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
- Checkbox: reuses existing `<Checkbox>` directly
- Lazy loading: existing `<Spinner size="sm" />`

### A2UI

```
"tree-view"  -> TreeView
"tree-node"  -> TreeNode
```

---

## 5. Calendar / DatePicker / DateRangePicker

### New Dependency

`date-fns` as a **peer dependency**. Functions used: `format`, `parse`, `addMonths`, `subMonths`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek`, `isSameDay`, `isSameMonth`, `isWithinInterval`.

### API

```tsx
// Inline calendar
<Calendar value={date} onValueChange={setDate} />

// Range
<Calendar mode="range" value={{ from: start, to: end }} onValueChange={setRange} />

// DatePicker (input + popover + calendar)
<DatePicker value={date} onValueChange={setDate} label="Start date" />

// DateRangePicker
<DateRangePicker value={{ from: start, to: end }} onValueChange={setRange} label="Trip dates" />
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

DatePicker (extends Calendar single-mode props, plus:)
  label             string
  placeholder       string                       default: "Select date"
  error             boolean
  disabled          boolean
  format            string                       default: "PPP" (date-fns)
  className         string

DateRangePicker (extends Calendar range-mode props, plus:)
  label             string
  startPlaceholder  string                       default: "Start date"
  endPlaceholder    string                       default: "End date"
  error             boolean
  disabled          boolean
  format            string                       default: "PPP"
  className         string
```

### Structure

Three components, layered:

**Calendar** — core grid:
- Header: month/year label + prev/next chevron buttons + clickable label cycles days -> months -> years view
- Grid: 7-column day cells
- `date-fns` for all date math
- Range mode: first click = `from`, second click = `to`, hover previews range between clicks

**DatePicker** — wraps `<Input>` + `<Popover>` + `<Calendar>`:
- Click input or calendar icon opens popover
- Selecting date closes popover, formats into input
- Reuses existing `Input` and `Popover` components

**DateRangePicker** — two `<Input>` fields in shared container + `<Popover>` + `<Calendar mode="range">`:
- Shared bordered container with `->` separator
- Container gets the offset shadow

### Internal Files

```
components/Calendar/
  Calendar.tsx
  Calendar.module.scss
  Calendar.test.tsx
  Calendar.stories.tsx
  useDateRange.ts           range selection + hover preview
  types.ts                  DateRange, CalendarMode
  index.ts

components/DatePicker/
  DatePicker.tsx
  DatePicker.module.scss
  DatePicker.test.tsx
  DatePicker.stories.tsx
  index.ts

components/DateRangePicker/
  DateRangePicker.tsx
  DateRangePicker.module.scss
  DateRangePicker.test.tsx
  DateRangePicker.stories.tsx
  index.ts
```

### Accessibility

**Calendar:**
- Grid: `role="grid"`, `aria-label="Calendar"`
- Day cells: `role="gridcell"`, `aria-selected`, `aria-disabled`
- Today: `aria-current="date"`
- Keyboard: arrows navigate days, Page Up/Down for months, Shift+Page for years, Home/End for week start/end, Enter/Space to select

**DatePicker / DateRangePicker:**
- Input: `role="combobox"`, `aria-expanded`, `aria-haspopup="dialog"`
- Popover: `role="dialog"`, `aria-label="Choose date"`
- Escape closes popover, returns focus to input

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
  --shadow-offset-md        popover shadow (DatePicker/DateRangePicker)

DatePicker/DateRangePicker input:
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
- `@include hover` / `@include press` / `@include focus` on nav buttons
- Outside-month days: dimmed but clickable (navigates to that month)
- Disabled days: diagonal strike-through line (2px, `--card-border`) over the number
- DatePicker input: reuses `<Input>` with `CalendarDays` lucide trailing icon
- DateRangePicker: two inputs in shared container with `->` separator, container gets shadow

### A2UI

```
"calendar"           -> Calendar
"date-picker"        -> DatePicker
"date-range-picker"  -> DateRangePicker
```

---

## Summary

| Component | Type | New Deps | Reuses | Complexity |
|-----------|------|----------|--------|------------|
| ToggleGroup | Compound (context) | None | — | Low |
| Rating | Single | None | — | Low |
| Stepper | Compound (context) | None | Button, ActionRow | Medium |
| TreeView | Data-driven + declarative | None (dnd-kit, TanStack Virtual already installed) | Checkbox, Spinner | High |
| Calendar | Single | date-fns (peer) | — | Medium |
| DatePicker | Single | date-fns (peer) | Input, Popover, Calendar | Medium |
| DateRangePicker | Single | date-fns (peer) | Input, Popover, Calendar | Medium |

### Total New Files

- 7 component directories
- ~30 source files (tsx, scss, test, stories, hooks, types, index)
- 7 skill docs: togglegroup.md, rating.md, stepper.md, treeview.md, calendar.md, datepicker.md, daterangepicker.md
- Updates to: SKILL.md, A2UI mapping.tsx, A2UI catalog.ts, root index.ts
