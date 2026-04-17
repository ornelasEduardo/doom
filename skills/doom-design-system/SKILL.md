---
name: doom-design-system
description: AI skills and context for the Doom Design System — neubrutalist React component library
version: 1.0.0
triggers:
  - working on doom components
  - importing from doom-design-system
  - building UI with doom
  - components/ directory in this repo
---

# Doom Design System

## Setup

Wrap your app with `DesignSystemProvider`:

```tsx
import { DesignSystemProvider } from "doom-design-system";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <DesignSystemProvider initialTheme="default" withBody fontClassName={font.className}>
        {children}
      </DesignSystemProvider>
    </html>
  );
}
```

| Prop           | Type                                              | Default     | Description                 |
|----------------|---------------------------------------------------|-------------|-----------------------------|
| `initialTheme` | `"default" \| "doom" \| "captain" \| "vigilante"` | `"default"` | Active theme                |
| `withBody`     | `boolean`                                         | `false`     | Render as `<body>` element  |
| `fontClassName`| `string`                                          | `""`        | Font class from `next/font` |

## Import Pattern

```tsx
import { Button, Card, Text, Modal } from "doom-design-system";
```

All components are tree-shakeable. Named exports only.

---

## Mandatory Rules

### Files
- Always add `'use client';` at the top of component files
- Always use relative imports — never path aliases like `@/`
- Always export from root `index.ts` via `export * from './Component'`
- Always colocate Component.tsx, Component.module.scss, Component.stories.tsx, Component.test.tsx

### Styling
- Always use SCSS Modules — never CSS-in-JS, never inline styles
- Always use `clsx` for conditional class names
- Always use CSS variables for colors — never hardcode hex values
- Always use `var(--surface-border-width) solid var(--card-border)` for borders
- Always use `var(--shadow-md)` for shadows — no blur, offset only
- Always use `@use "../../styles/mixins" as *;` for interactive states

### Components
- Use forwardRef only when consumers need direct ref access (form controls like Checkbox, Switch, Input). Most components use plain function exports.
- Always use `<Text>` component for text rendering — never raw `<p>` or `<span>`
- Always set `strokeWidth={2.5}` on Lucide icons
- Always use `ReactNode` for title props — not `string`
- Never add margin to Text components — use layout components or `gap`

### TypeScript
- Always define explicit interfaces for component props
- Never use `any`
- Always use union types for string props: `variant: 'primary' | 'secondary'`

### A2UI Integration (for contributors)
When adding or modifying components:
1. Update `components/A2UI/mapping.tsx` to register the component type
2. Update `components/A2UI/catalog.ts` to document props for AI consumption

See `a2ui.md` for full protocol.

---

## Design Tokens Quick-Ref

| Category | Token                  | Value               |
|----------|------------------------|---------------------|
| Colors   | `--primary`            | Purple (default)    |
|          | `--background`         | Page background     |
|          | `--card-bg`            | Card background     |
|          | `--card-border`        | Border color        |
|          | `--muted-foreground`   | Muted text          |
| Spacing  | `--space-1`            | 4px                 |
|          | `--space-2`            | 8px                 |
|          | `--space-3`            | 12px                |
|          | `--space-4`            | 16px                |
|          | `--space-6`            | 24px                |
|          | `--space-8`            | 32px                |
| Borders  | `--surface-border-width` | 2px               |
|          | `--radius-md`          | 4px                 |
| Shadow   | `--shadow-md`          | Hard offset, no blur|
|          | `--shadow-lg`          | Larger hard offset  |
|          | `--shadow-primary`     | Colored shadow      |
| Control  | `--control-height`     | 40px (md default)   |
|          | `--control-radius`     | var(--radius-md)    |
| Surface  | `--surface-padding`    | var(--space-4)      |
|          | `--surface-radius`     | var(--radius-md)    |

Full token reference: `styles.md`

---

## Themes

| Key         | Name        | Primary |
|-------------|-------------|---------|
| `default`   | Default     | Purple  |
| `doom`      | DOOMSDAY    | Green   |
| `captain`   | THE CAPTAIN | Blue    |
| `vigilante` | DARK KNIGHT | Yellow  |

---

## Neubrutalist Aesthetic

The doom aesthetic: bold 2px borders, hard offset shadows (no blur), high contrast, UPPERCASE labels, 4px radius, aggressive hover states.

```scss
@use "../../styles/mixins" as *;

.root {
  @include control;  // height, padding, border, shadow, transition
  @include hover;    // lift + shadow grow on hover
  @include focus;    // accessible focus ring
  @include press;    // active press state (push into page)

  background: var(--card-bg);
  color: var(--foreground);

  &:disabled {
    @include disabled-state;
  }
}
```

Full mixin reference: `styles.md`

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

---

## Component Reference

> **REQUIRED:** Read the relevant component file before working on any component.

### Layout
| Component                    | File                   |
|------------------------------|------------------------|
| Flex, Stack, Grid, Container | `components/layout.md` |
| Page                         | `components/page.md`   |

### Navigation
| Component   | File                       |
|-------------|----------------------------|
| Breadcrumbs | `components/breadcrumbs.md`|
| Link        | `components/link.md`       |
| Pagination  | `components/pagination.md` |
| Sidebar     | `components/sidebar.md`    |
| Tabs        | `components/tabs.md`       |

### Forms
| Component   | File                       |
|-------------|----------------------------|
| Button      | `components/button.md`     |
| Checkbox    | `components/checkbox.md`   |
| Combobox    | `components/combobox.md`   |
| CopyButton  | `components/copybutton.md` |
| FileUpload  | `components/fileupload.md` |
| Form        | `components/form.md`       |
| Input       | `components/input.md`      |
| Label       | `components/label.md`      |
| RadioGroup  | `components/radiogroup.md` |
| Rating      | `components/rating.md`     |
| Select      | `components/select.md`     |
| Slider      | `components/slider.md`     |
| SplitButton | `components/splitbutton.md`|
| Switch      | `components/switch.md`     |
| Textarea    | `components/textarea.md`   |
| ToggleGroup | `components/togglegroup.md`|

### Data Display
| Component   | File                       |
|-------------|----------------------------|
| Avatar      | `components/avatar.md`     |
| Badge       | `components/badge.md`      |
| Card        | `components/card.md`       |
| Chart       | `components/chart.md`      |
| Chip        | `components/chip.md`       |
| Image       | `components/image.md`      |
| ProgressBar | `components/progressbar.md`|
| Skeleton    | `components/skeleton.md`   |
| Slat        | `components/slat.md`       |
| Table       | `components/table.md`      |
| Text        | `components/text.md`       |

### Feedback
| Component | File                    |
|-----------|-------------------------|
| Alert     | `components/alert.md`   |
| Spinner   | `components/spinner.md` |
| Toast     | `components/toast.md`   |
| Tooltip   | `components/tooltip.md` |

### Overlays
| Component | File                     |
|-----------|--------------------------|
| Drawer    | `components/drawer.md`   |
| Dropdown  | `components/dropdown.md` |
| Modal     | `components/modal.md`    |
| Popover   | `components/popover.md`  |
| Sheet     | `components/sheet.md`    |

### Other
| Component | File                      |
|-----------|---------------------------|
| Accordion | `components/accordion.md` |
| ActionRow | `components/actionrow.md` |
| Icon      | `components/icon.md`      |

---

## Common Commands

| Action    | Command              |
|-----------|----------------------|
| Test      | `npm test -- --run`  |
| Storybook | `npm run storybook`  |
| Build     | `npm run build`      |
| Verify    | `npm run verify`     |
