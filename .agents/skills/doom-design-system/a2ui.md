# A2UI Reference

## Protocol Overview

A2UI uses a flat adjacency list format where components reference children by ID.

### Message Schema

```json
{
  "surfaceId": "main",
  "components": [
    {
      "id": "unique-id",
      "component": {
        "component-type": {
          "propName": "value",
          "text": { "literalString": "Static text" },
          "children": { "explicitList": ["child-id-1", "child-id-2"] }
        }
      }
    }
  ]
}
```

### Value Types

| Type              | Format                       | Example                          |
| ----------------- | ---------------------------- | -------------------------------- |
| Literal String    | `{ "literalString": "..." }` | `{ "literalString": "Hello" }`   |
| Data Binding      | `{ "path": "/..." }`         | `{ "path": "/user/name" }`       |
| Single Child      | `"child-id"`                 | `"header-component"`             |
| Multiple Children | `{ "explicitList": [...] }`  | `{ "explicitList": ["a", "b"] }` |

---

## Core Principles

### Aesthetic

- **Borders**: All interactive elements (cards, buttons, inputs) already have borders built-in. Do not add `border` classes manually.
- **Shadows**: Use `shadow-hard` for a brutalist look if you are creating a custom container, but prefer using `card` which handles this for you.
- **Radius**: Default radius is `4px`. Avoid `rounded-full` unless creating a badge or avatar.

### Layout & Spacing

- Do NOT use `margin` or `padding` on individual items to space them out.
- DO use `stack` (vertical) or `flex` (horizontal) with the `gap` prop.
  - `gap: 1` = 4px
  - `gap: 4` = 16px (standard)
  - `gap: 6` = 24px (section separation)
- Use `grid` for complex 2D layouts. `columns` prop accepts numbers (`3`) or CSS strings (`"1fr 2fr"`).

### Typography

- Use the `text` component for all text.
- Variants:
  - `h1`–`h3`: Page/section titles (bold, uppercase)
  - `body`: Default text
  - `small`: Metadata/labels (muted)
- Do not use `<h1>` tags inside HTML strings.

### Colors & Variables

- Use CSS variables for all custom styling.
- **Primary**: `var(--primary)` (brand color)
- **Backgrounds**: `var(--card-bg)`, `var(--background)`
- **Text**: `var(--foreground)`, `var(--muted-foreground)`
- **Status**: `var(--success)`, `var(--error)`, `var(--warning)`

### Components

- **Inputs**: Always provide a `label`.
- **Buttons**: Use `variant="ghost"` for secondary/tertiary actions to reduce visual noise.
- **Charts**: Use the `style` prop to set explicit height (e.g., `{ height: 400 }`).

### Utilities

- This is NOT a Tailwind system. Do not use generic Tailwind classes (e.g., `max-w-sm`, `bg-red-500`, `rounded-lg`).
- ONLY use the specific utility classes defined in the Doom system:
  - Spacing: `p-0` to `p-10`, `m-0` to `m-10` (4px increments)
  - Sizing: `w-full`, `h-full`, `h-screen`
  - Flex: `flex`, `flex-col`, `items-center`, `justify-between`
  - Typography: `text-{size}`, `text-{color}`, `uppercase`, `text-center`, `text-left`, `text-right`
- For specific visuals not covered by utilities, use the `style` prop.

---

## Component Registry

### Text Prop Support

**Not all components use `text` prop.** Only components marked ✅ support `text: { literalString }` or `text: { path }`:

| Supports `text` prop | Component         | Text Prop                      |
| :------------------: | ----------------- | ------------------------------ |
|          ✅          | `label`           | `text`                         |
|          ✅          | `text`            | `text` → maps to children      |
|          ✅          | `button`          | `text` → maps to children      |
|          ✅          | `badge`           | `text` → maps to children      |
|          ✅          | `chip`            | `text` → maps to children      |
|          ✅          | `link`            | `text` → maps to children      |
|          ✅          | `tabs-trigger`    | `text` → maps to children      |
|          ✅          | `breadcrumb-item` | `text` → maps to children      |
|          ❌          | `slat`            | Use `label` + `secondaryLabel` |
|          ❌          | `alert`           | Use `title` + `description`    |
|          ❌          | `input`           | Use `label` + `placeholder`    |
|          ❌          | `avatar`          | Use `fallback` for initials    |

### Common Mistakes

```json
// ❌ WRONG - slat doesn't support text prop
{ "slat": { "label": "Trips", "text": { "literalString": "4" } } }

// ✅ CORRECT - use secondaryLabel
{ "slat": { "label": "Trips", "secondaryLabel": "4" } }

// ❌ WRONG - alert doesn't support text prop
{ "alert": { "variant": "warning", "text": { "literalString": "Warning message" } } }

// ✅ CORRECT - use title and description
{ "alert": { "variant": "warning", "title": "Warning", "description": "Message details" } }
```

### Primitives

| Type       | Key Props                            | Notes                          |
| ---------- | ------------------------------------ | ------------------------------ |
| `label`    | `text` ✅                            | Simple text label              |
| `text`     | `variant`, `text` ✅                 | Typography: h1-h6/body/small   |
| `button`   | `variant`, `text` ✅                 | primary/secondary/ghost/danger |
| `badge`    | `variant`, `text` ✅                 | Status indicator               |
| `chip`     | `variant`, `text` ✅                 | Tag element                    |
| `avatar`   | `src`, `fallback`, `size`            | User avatar                    |
| `alert`    | `title` ⚠️, `description`, `variant` | title is REQUIRED              |
| `card`     | `className`, `child`/`children`      | Container                      |
| `input`    | `label`, `placeholder`, `value`      | Text field                     |
| `textarea` | `label`, `placeholder`, `rows`       | Multi-line                     |
| `checkbox` | `label`, `checked`                   | Checkbox                       |
| `switch`   | `label`, `checked`                   | Toggle                         |
| `link`     | `href`, `text` ✅                    | Hyperlink                      |
| `spinner`  | `size`                               | Loading indicator              |

### Layout

| Type        | Key Props                                          |
| ----------- | -------------------------------------------------- |
| `flex`      | `direction`, `gap`, `align`, `justify`, `children` |
| `stack`     | `gap`, `children`                                  |
| `grid`      | `columns`, `gap`, `children`                       |
| `container` | `size`, `children`                                 |
| `box`       | `className`, `children`                            |

### Data Display

| Type             | Key Props                               | Notes                           |
| ---------------- | --------------------------------------- | ------------------------------- |
| `slat`           | `label` ⚠️, `secondaryLabel`, `variant` | label is REQUIRED, NO text prop |
| `table`          | `data`, `columns`                       | Each column needs `accessorKey` |
| `chart`          | `type`, `data`, `xKey`, `yKey`          | line/area/bar                   |
| `accordion`      | `type`, `defaultValue`, `children`      | single/multiple                 |
| `accordion-item` | `value`, `trigger`, `children`          |                                 |
| `image`          | `src`, `alt`                            |                                 |

### Navigation

| Type              | Key Props                   |
| ----------------- | --------------------------- |
| `tabs`            | `defaultValue`, `children`  |
| `tabs-list`       | `children`                  |
| `tabs-trigger`    | `value`, `text` ✅          |
| `tabs-body`       | `children`                  |
| `tabs-content`    | `value`, `child`/`children` |
| `breadcrumbs`     | `children`                  |
| `breadcrumb-item` | `href`, `text` ✅           |

### Feedback

| Type           | Key Props          |
| -------------- | ------------------ |
| `progress-bar` | `value`, `variant` |
| `skeleton`     | `width`, `height`  |

### Actions

| Type           | Key Props  |
| -------------- | ---------- |
| `action-row`   | `children` |
| `split-button` | `options`  |

---

## Contributor Guide

To register a new Doom component so it is available in A2UI, you must update two files: `mapping.tsx` and `catalog.ts`.

### Step 1 — Add the import and map entry in `mapping.tsx`

`mapping.tsx` imports all Doom components and maps string type keys to React element types. Add your import at the top with the appropriate category comment, then add the key → component entry in `componentMap`.

```tsx
// In components/A2UI/mapping.tsx

// 1. Add the import (group with related components)
import { MyNewComponent } from "../MyNewComponent/MyNewComponent";

// 2. Add the entry to componentMap
export const componentMap: Record<string, React.ElementType> = {
  // ... existing entries ...

  // Primitives (example placement)
  "my-new-component": MyNewComponent,
};
```

The string key (e.g. `"my-new-component"`) is the A2UI type name that agents use in JSON.

### Step 2 — Add a descriptor in `catalog.ts`

`catalog.ts` is the machine-readable single source of truth for component metadata. Add a `ComponentDescriptor` object to the `componentCatalog` array, under the matching category comment block.

```ts
// In components/A2UI/catalog.ts

export const componentCatalog: ComponentDescriptor[] = [
  // ... existing entries ...

  // ─────────────────────────────────────────────────────────────
  // PRIMITIVES  (or whichever category applies)
  // ─────────────────────────────────────────────────────────────
  {
    type: "my-new-component",        // must match the key in mapping.tsx
    name: "My New Component",
    category: "primitives",          // "primitives" | "layout" | "navigation" | "feedback" | "data-display" | "actions"
    description: "Short description of what the component does.",
    usesTextProp: false,             // set true if text prop maps to children
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "Visible label text.",
      },
      {
        name: "variant",
        type: '"default" | "success" | "warning" | "error"',
        description: "Visual variant.",
        default: "default",
      },
    ],
  },
];
```

### Step 3 — Verify

After adding both entries, confirm the component renders correctly by passing a minimal A2UI JSON payload that uses the new type key.

---

## Examples

### Text Prop Quick Reference

| Component                                          | Correct Prop              | Do Not Use |
| -------------------------------------------------- | ------------------------- | ---------- |
| `text`, `button`, `badge`, `chip`, `label`, `link` | `text: { literalString }` | —          |
| `slat`                                             | `label`, `secondaryLabel` | `text`     |
| `alert`                                            | `title`, `description`    | `text`     |
| `input`                                            | `label`, `placeholder`    | `text`     |

### Example 1: Login Card

**User Request**: "A login card with email and password fields, and a submit button."

```json
{
  "surfaceId": "login",
  "components": [
    {
      "id": "root",
      "component": {
        "card": {
          "className": "p-6 w-full",
          "style": { "maxWidth": "24rem" },
          "child": "content"
        }
      }
    },
    {
      "id": "content",
      "component": {
        "stack": {
          "gap": 4,
          "children": {
            "explicitList": ["title", "email", "password", "submit"]
          }
        }
      }
    },
    {
      "id": "title",
      "component": {
        "text": { "variant": "h3", "text": { "literalString": "Login" } }
      }
    },
    {
      "id": "email",
      "component": {
        "input": { "label": "Email", "placeholder": "you@example.com" }
      }
    },
    {
      "id": "password",
      "component": {
        "input": { "label": "Password", "type": "password" }
      }
    },
    {
      "id": "submit",
      "component": {
        "button": {
          "variant": "primary",
          "className": "w-full",
          "text": { "literalString": "Sign In" }
        }
      }
    }
  ]
}
```

### Example 2: Dashboard with Slats and Alerts

**User Request**: "Dashboard stats using slat components and a warning alert."

```json
{
  "surfaceId": "dashboard",
  "components": [
    {
      "id": "root",
      "component": {
        "stack": {
          "gap": 4,
          "children": { "explicitList": ["stats-grid", "warning"] }
        }
      }
    },
    {
      "id": "stats-grid",
      "component": {
        "grid": {
          "columns": 3,
          "gap": 4,
          "children": {
            "explicitList": ["users-slat", "revenue-slat", "growth-slat"]
          }
        }
      }
    },
    {
      "id": "users-slat",
      "component": {
        "slat": {
          "label": "Total Users",
          "secondaryLabel": "1,234"
        }
      }
    },
    {
      "id": "revenue-slat",
      "component": {
        "slat": {
          "label": "Revenue",
          "secondaryLabel": "$45.2k"
        }
      }
    },
    {
      "id": "growth-slat",
      "component": {
        "slat": {
          "variant": "success",
          "label": "Growth",
          "secondaryLabel": "+12%"
        }
      }
    },
    {
      "id": "warning",
      "component": {
        "alert": {
          "variant": "warning",
          "title": "Maintenance Scheduled",
          "description": "System will be down for maintenance at 2:00 AM UTC."
        }
      }
    }
  ]
}
```

### Example 3: Data Binding

**User Request**: "A user greeting that displays the user's name from data."

```json
{
  "surfaceId": "greeting",
  "components": [
    {
      "id": "root",
      "component": {
        "card": {
          "className": "p-6",
          "children": { "explicitList": ["welcome", "name"] }
        }
      }
    },
    {
      "id": "welcome",
      "component": {
        "text": {
          "variant": "small",
          "className": "text-muted",
          "text": { "literalString": "Welcome back," }
        }
      }
    },
    {
      "id": "name",
      "component": {
        "text": {
          "variant": "h2",
          "text": { "path": "/user/name" }
        }
      }
    }
  ]
}
```

**Data Model:**

```json
{
  "user": { "name": "Alice Chen" }
}
```

### Example 4: Navigation with Tabs

**User Request**: "A tabbed interface with Overview and Settings tabs."

```json
{
  "surfaceId": "tabbed-ui",
  "components": [
    {
      "id": "root",
      "component": {
        "tabs": {
          "defaultValue": "overview",
          "children": { "explicitList": ["tab-list", "tab-body"] }
        }
      }
    },
    {
      "id": "tab-list",
      "component": {
        "tabs-list": {
          "children": { "explicitList": ["tab-overview", "tab-settings"] }
        }
      }
    },
    {
      "id": "tab-overview",
      "component": {
        "tabs-trigger": {
          "value": "overview",
          "text": { "literalString": "Overview" }
        }
      }
    },
    {
      "id": "tab-settings",
      "component": {
        "tabs-trigger": {
          "value": "settings",
          "text": { "literalString": "Settings" }
        }
      }
    },
    {
      "id": "tab-body",
      "component": {
        "tabs-body": {
          "children": {
            "explicitList": ["content-overview", "content-settings"]
          }
        }
      }
    },
    {
      "id": "content-overview",
      "component": {
        "tabs-content": { "value": "overview", "child": "overview-text" }
      }
    },
    {
      "id": "overview-text",
      "component": {
        "text": { "text": { "literalString": "This is the overview content." } }
      }
    },
    {
      "id": "content-settings",
      "component": {
        "tabs-content": { "value": "settings", "child": "settings-text" }
      }
    },
    {
      "id": "settings-text",
      "component": {
        "text": { "text": { "literalString": "This is the settings content." } }
      }
    }
  ]
}
```
