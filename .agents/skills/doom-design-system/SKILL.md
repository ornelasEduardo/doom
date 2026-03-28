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
- Always use `var(--border-width) solid var(--card-border)` for borders
- Always use `var(--shadow-hard)` for shadows — no blur, offset only
- Always use `@use "../../styles/mixins" as m;` for interactive states

### Components
- Always forward refs on primitive components
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

| Category | Token                | Value               |
|----------|----------------------|---------------------|
| Colors   | `--primary`          | Purple (default)    |
|          | `--bg`               | Page background     |
|          | `--card-bg`          | Card background     |
|          | `--card-border`      | Border color        |
|          | `--muted-foreground` | Muted text          |
| Spacing  | `--spacing-xs`       | 0.25rem (4px)       |
|          | `--spacing-sm`       | 0.5rem (8px)        |
|          | `--spacing-md`       | 0.75rem (12px)      |
|          | `--spacing-lg`       | 1rem (16px)         |
|          | `--spacing-xl`       | 1.5rem (24px)       |
| Borders  | `--border-width`     | 2px                 |
|          | `--radius`           | 4px                 |
| Shadow   | `--shadow-hard`      | Hard offset, no blur|
|          | `--shadow-primary`   | Colored shadow      |

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
@use "../../styles/mixins" as m;

.root {
  @include m.base-interactive;  // transitions + cursor
  border: var(--border-width) solid var(--card-border);
  box-shadow: var(--shadow-hard);

  &:hover {
    @include m.brutalist-hover;  // signature press-and-shift effect
  }

  @include m.focus;             // accessible focus ring

  &:active {
    transition: none;
    transform: translate(var(--spacing-half), var(--spacing-half));
    box-shadow: none;
  }
}
```

Full mixin reference: `styles.md`

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
| Select      | `components/select.md`     |
| Slider      | `components/slider.md`     |
| SplitButton | `components/splitbutton.md`|
| Switch      | `components/switch.md`     |
| Textarea    | `components/textarea.md`   |

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
