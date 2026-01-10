# Doom Design System Skills

## Setup

Wrap your app with `DesignSystemProvider`:

```tsx
import { DesignSystemProvider } from "doom-design-system";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <DesignSystemProvider
        initialTheme="default"
        withBody
        fontClassName={font.className}
      >
        {children}
      </DesignSystemProvider>
    </html>
  );
}
```

### Props

| Prop            | Type                                              | Default     | Description                         |
| --------------- | ------------------------------------------------- | ----------- | ----------------------------------- |
| `initialTheme`  | `"default" \| "doom" \| "captain" \| "vigilante"` | `"default"` | Theme to apply                      |
| `withBody`      | `boolean`                                         | `false`     | Render as `<body>` element          |
| `fontClassName` | `string`                                          | `""`        | Font class (e.g., from `next/font`) |
| `className`     | `string`                                          | `""`        | Additional classes                  |

## Core Principles

1. **Neubrutalist aesthetic**: Bold 2px borders, hard shadows, high contrast.
2. **CSS Variables**: All colors/spacing via CSS variables—never hardcode hex values.
3. **Server Components ready**: Use `'use client'` only where needed.
4. **Accessibility**: WCAG 2.1 AAA color contrast target.

## Themes

| Key         | Name        | Primary Color      |
| ----------- | ----------- | ------------------ |
| `default`   | Default     | Purple             |
| `doom`      | DOOMSDAY    | Green (dark mode)  |
| `captain`   | THE CAPTAIN | Blue               |
| `vigilante` | DARK KNIGHT | Yellow (dark mode) |

## Import Pattern

```tsx
import { Button, Card, Text, Modal } from "doom-design-system";
```

All components are tree-shakeable.

---

## Hooks

### useTheme

Access and change the current theme programmatically.

```tsx
import { useTheme } from "doom-design-system";

function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <Select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      options={Object.keys(availableThemes).map((key) => ({
        value: key,
        label: availableThemes[key].name,
      }))}
    />
  );
}
```

| Return Value      | Type                            | Description       |
| ----------------- | ------------------------------- | ----------------- |
| `theme`           | `ThemeKey`                      | Current theme key |
| `setTheme`        | `(theme: ThemeKey) => void`     | Change theme      |
| `availableThemes` | `Record<ThemeKey, ThemeConfig>` | All theme configs |

---

## Styles

- [aesthetic.md](styles/aesthetic.md) — **READ FIRST!** Visual philosophy and design principles
- [tokens.md](styles/tokens.md) — Design tokens (palette, typography, spacing, z-index, motion)
- [css-variables.md](styles/css-variables.md) — Theme-aware CSS custom properties
- [mixins.md](styles/mixins.md) — SCSS mixins for interactivity, theming, shadows
- [utilities.md](styles/utilities.md) — Utility classes for layout, spacing, typography

---

## Components

### Layout

- [layout.md](components/layout.md) — Flex, Stack, Grid, Container, Switcher
- [page.md](components/page.md) — Page container

### Navigation

- [breadcrumbs.md](components/breadcrumbs.md) — Navigation hierarchy
- [link.md](components/link.md) — Anchor links
- [pagination.md](components/pagination.md) — Page navigation
- [tabs.md](components/tabs.md) — Tab navigation

### Forms

- [button.md](components/button.md) — Buttons
- [checkbox.md](components/checkbox.md) — Checkboxes
- [combobox.md](components/combobox.md) — Searchable dropdown
- [fileupload.md](components/fileupload.md) — File input with drag-drop
- [form.md](components/form.md) — Form containers
- [input.md](components/input.md) — Text inputs
- [label.md](components/label.md) — Form labels
- [radiogroup.md](components/radiogroup.md) — Radio buttons
- [select.md](components/select.md) — Dropdown select
- [slider.md](components/slider.md) — Range inputs
- [switch.md](components/switch.md) — Toggle switches
- [textarea.md](components/textarea.md) — Multi-line inputs

### Data Display

- [avatar.md](components/avatar.md) — User avatars
- [badge.md](components/badge.md) — Status indicators
- [card.md](components/card.md) — Content containers
- [chart.md](components/chart.md) — Data visualization (D3.js)
- [chip.md](components/chip.md) — Tags and filters
- [image.md](components/image.md) — Enhanced images
- [progressbar.md](components/progressbar.md) — Progress indicators
- [skeleton.md](components/skeleton.md) — Loading placeholders
- [slat.md](components/slat.md) — List items
- [table.md](components/table.md) — Data tables (TanStack)
- [text.md](components/text.md) — Typography

### Feedback

- [alert.md](components/alert.md) — Status messages
- [spinner.md](components/spinner.md) — Loading spinners
- [toast.md](components/toast.md) — Notification toasts
- [tooltip.md](components/tooltip.md) — Hover tooltips

### Overlays

- [drawer.md](components/drawer.md) — Side panels
- [dropdown.md](components/dropdown.md) — Action menus
- [modal.md](components/modal.md) — Dialog overlays
- [popover.md](components/popover.md) — Positioned overlays
- [sheet.md](components/sheet.md) — Bottom sheets

### Other

- [accordion.md](components/accordion.md) — Expandable content
- [actionrow.md](components/actionrow.md) — Settings/navigation rows
- [icon.md](components/icon.md) — Lucide icons
- [splitbutton.md](components/splitbutton.md) — Split action buttons
