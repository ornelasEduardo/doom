# Sizing Harmonics & CSS Layer Overhaul

## Goal

Rebuild Doom's spacing, sizing, and typography from first principles into a harmonic token system with a primitive/semantic split. Wrap all component styles in CSS layers so consumer overrides always win. Migrate every component to the new system.

**Version bump:** 0.5.1 → 0.6.0 (breaking change, sole consumer is moneyprinter).

**Hard gate:** After component migration is complete, all 44 skill docs + token reference docs MUST be updated before any other project proceeds.

---

## 1. Harmonic Primitives (`_primitives.scss`)

One base unit (4px), everything derived. These are raw values with no opinion about usage. Nothing except `_semantic.scss` may reference them.

### Spacing

| Token | Value | Use |
|-------|-------|-----|
| `--space-px` | 1px | Borders, hairlines |
| `--space-0.5` | 2px | Active press translate, micro gaps |
| `--space-1` | 4px | Icon gaps, tight padding |
| `--space-1.5` | 6px | Small element internal padding |
| `--space-2` | 8px | Default inline gap, input padding-y |
| `--space-3` | 12px | Control padding-x, section gaps |
| `--space-4` | 16px | Card padding, form field gaps |
| `--space-6` | 24px | Section spacing |
| `--space-8` | 32px | Page section gaps |
| `--space-12` | 48px | Major layout gaps |
| `--space-16` | 64px | Hero spacing |

No `--space-5`, `--space-7`, etc. Gaps are intentional constraints.

### Sizes

| Token | Value | Use |
|-------|-------|-----|
| `--size-4` | 16px | Icons small |
| `--size-5` | 20px | Icons default, toggle elements |
| `--size-6` | 24px | Dense controls (future) |
| `--size-7` | 28px | Small control height |
| `--size-8` | 32px | **Default control height** |
| `--size-10` | 40px | Large controls |
| `--size-11` | 44px | Touch target minimum |
| `--size-12` | 48px | Jumbo controls |

### Type Scale

Anchored at 14px default, 1.25 major-third ratio:

| Token | Value | Line height | Use |
|-------|-------|-------------|-----|
| `--text-2xs` | 10px | 1.4 | Micro labels |
| `--text-xs` | 12px | 1.4 | Dense UI, badges |
| `--text-sm` | 14px | 1.5 | **Default body + controls** |
| `--text-base` | 16px | 1.5 | Large body text |
| `--text-lg` | 18px | 1.4 | Subheadings |
| `--text-xl` | 20px | 1.3 | Section headings |
| `--text-2xl` | 24px | 1.2 | Page headings |
| `--text-3xl` | 30px | 1.2 | Hero headings |
| `--text-4xl` | 36px | 1.1 | Display |
| `--text-5xl` | 48px | 1.1 | Display large |

Default body font-size is 14px (down from 16px).

### Shadow Scale

Hard offsets only, derived from spacing:

| Token | Offset | Use |
|-------|--------|-----|
| `--shadow-sm` | `var(--space-0.5) var(--space-0.5) 0 0` | Checkboxes, small elements |
| `--shadow-md` | `var(--space-1) var(--space-1) 0 0` | Default controls, cards |
| `--shadow-lg` | `var(--space-1.5) var(--space-1.5) 0 0` | Hover states |
| `--shadow-xl` | `var(--space-2) var(--space-2) 0 0` | Focus states, modals |

Shadow color remains theme-dependent (`var(--shadow-base)`).

### Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 2px | Dense elements |
| `--radius-md` | 4px | Default — controls, cards |
| `--radius-lg` | 8px | Large surfaces |
| `--radius-pill` | 9999px | Pills, badges |
| `--radius-full` | 50% | Circles |

### Weights, Motion, Z-Index

Unchanged from current values. Already well-structured.

---

## 2. Semantic Tokens (`_semantic.scss`)

Imports `_primitives.scss`. This is the opinion layer — the only thing components and mixins reference.

### Control Tokens

Three tiers. `md` is the default.

| Token | `sm` | `md` (default) | `lg` |
|-------|------|-----------------|------|
| `--control-height` | `var(--size-7)` 28px | `var(--size-8)` 32px | `var(--size-10)` 40px |
| `--control-padding-x` | `var(--space-2)` 8px | `var(--space-3)` 12px | `var(--space-4)` 16px |
| `--control-padding-y` | `var(--space-1)` 4px | `var(--space-1.5)` 6px | `var(--space-2)` 8px |
| `--control-font-size` | `var(--text-xs)` 12px | `var(--text-sm)` 14px | `var(--text-base)` 16px |
| `--control-icon-size` | `var(--size-4)` 16px | `var(--size-4)` 16px | `var(--size-5)` 20px |
| `--control-gap` | `var(--space-1)` 4px | `var(--space-1.5)` 6px | `var(--space-2)` 8px |
| `--control-radius` | `var(--radius-sm)` 2px | `var(--radius-md)` 4px | `var(--radius-md)` 4px |

Size variants work via scoped CSS variable overrides — component writes styles once against semantic vars, `.sm`/`.lg` classes override the vars locally.

### Surface Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--surface-padding` | `var(--space-4)` 16px | Default internal padding |
| `--surface-padding-dense` | `var(--space-3)` 12px | Compact surfaces |
| `--surface-radius` | `var(--radius-md)` 4px | Default surface radius |
| `--surface-gap` | `var(--space-4)` 16px | Gap between items in surface |
| `--surface-border-width` | `var(--space-px)` 2px | The sacred 2px border |

### Feedback Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--toggle-size` | `var(--size-5)` 20px | Checkbox/radio hit area |
| `--toggle-size-sm` | `var(--size-4)` 16px | Dense checkbox/radio |
| `--switch-width` | `var(--space-8)` 32px | Switch track width |
| `--switch-height` | `var(--size-5)` 20px | Switch track height |

### Display Tokens

| Token | Value |
|-------|-------|
| `--badge-padding-x` | `var(--space-1.5)` 6px |
| `--badge-padding-y` | `var(--space-0.5)` 2px |
| `--badge-font-size` | `var(--text-2xs)` 10px |
| `--chip-padding-x` | `var(--space-2)` 8px |
| `--chip-padding-y` | `var(--space-1)` 4px |
| `--chip-font-size` | `var(--text-xs)` 12px |

---

## 3. Mixins (`_mixins.scss`)

Mixins read only semantic tokens. Never primitives.

### Control Mixins

| Mixin | Replaces | Purpose |
|-------|----------|---------|
| `@include control` | `base-interactive` | Height, padding, font-size, border, shadow, transition, radius |
| `@include hover` | `brutalist-hover` | Lift + shadow grow using shadow scale |
| `@include focus` | `focus` | Focus-visible ring using shadow scale |
| `@include press` | (raw `&:active` CSS) | Press-down translate using `--space-0.5` |
| `@include disabled` | `disabled-state` | Hatched pattern overlay (unchanged) |
| `@include surface` | (new) | Surface padding, border, radius, background, shadow |
| `@include shadow-directional` | `brutalist-shadow` | Directional shadow using shadow scale tokens |

Unchanged: `invert-theme`, `solid-variant`, `mq`, `error`.

### How a new component uses the system

```scss
@layer doom {
  .root {
    @include control;
    @include hover;
    @include focus;
    @include press;
  }
  .sm { /* semantic var overrides for sm tier */ }
  .lg { /* semantic var overrides for lg tier */ }
}
```

No height decisions, no padding decisions, no shadow math.

---

## 4. CSS Layers

All component styles wrap in `@layer doom`. Consumer classes (unlayered) always win.

### Layer order (declared in `globals.scss`)

```scss
@layer doom.reset, doom.utilities, doom.components;
```

- `doom.reset` — `_reset.scss`
- `doom.utilities` — `_utilities.scss` generated classes
- `doom.components` — all `.module.scss` component styles

Consumer CSS is unlayered and always beats any `@layer doom.*` rule. No `!important` needed.

### Per-component SCSS pattern

```scss
@layer doom.components {
  .root { /* ... */ }
  .sm { /* ... */ }
  .lg { /* ... */ }
}
```

---

## 5. Shared TypeScript

```tsx
// styles/types.ts
export type ControlSize = "sm" | "md" | "lg";
export const DEFAULT_CONTROL_SIZE: ControlSize = "md";
```

All control components import from here.

---

## 6. Component Migration

### Control components → `@include control` + `size?: ControlSize`

| Component | Current height | New default (md) | Gets `size` prop |
|-----------|---------------|-------------------|------------------|
| Button | 40px | 32px | Yes (has sm/md/lg, values change) |
| Input | 48px | 32px | Yes (new) |
| Select | 48px | 32px | Yes (has sm/md, add lg) |
| Combobox | 48px | 32px | Yes (has sm/md, add lg) |
| Textarea | 96px min | auto, min 3 lines | Yes (affects padding/font, not height) |
| Dropdown | varies | 32px trigger | Yes (new) |
| SplitButton | 40px | 32px | Yes (new) |
| CopyButton | inherits Button | inherits Button | Inherits |
| Pagination | 40px buttons | 32px | No — uses control tokens directly |

### Surface components → `@include surface`

Card, Modal, Drawer, Sheet, Page — use surface tokens. No size prop.

### Feedback components → own tokens

| Component | Current | New |
|-----------|---------|-----|
| Checkbox | 24px | 20px (`--toggle-size`) |
| RadioGroup | 24px | 20px (`--toggle-size`) |
| Switch | 32×50px | 20×32px (`--switch-*`) |
| Slider | 12px track, 24px thumb | 8px track, 20px thumb |

### Display components → own tokens, keep existing size props

Chip (xs–xl) and Badge (sm–lg) recalibrated to harmonic values.

### No sizing changes

Accordion, Alert, Avatar, Breadcrumbs, Icon, Image, Label, Layout, Link, Popover, Skeleton, Slat, Text, Toast, Tooltip — content-driven or structural. These still get the `@layer doom` wrap and any hardcoded values replaced with tokens.

Tabs triggers adopt `--control-padding-y`/`--control-padding-x` for consistency but no size prop.

Composite components (Table, FileUpload, ActionRow) — internal controls inherit new sizes automatically.

---

## 7. Utility Classes (`_utilities.scss`)

Regenerated from the new primitive scale. Same class names where possible (`.gap-4`, `.p-3`, etc.) but values now point to the harmonic scale. Wrapped in `@layer doom.utilities`.

---

## 8. What Does NOT Change

- **Themes** — color tokens in `definitions.ts` are unaffected
- **Palette** — `palettes.ts` unchanged
- **A2UI protocol** — component API shapes unchanged (only internal styling changes)
- **Component TypeScript interfaces** — only addition is `size?: ControlSize` on control components that don't have it yet

---

## 9. Required Follow-Up (Hard Gate)

After all component migration is complete, before any other project:
- Update all 44 component skill docs (props tables, sizing notes)
- Rewrite `styles.md`, `css-variables.md`, `utilities.md` to reflect new token architecture
- Update `SKILL.md` token quick-ref
- Update theme-builder agent token reference
