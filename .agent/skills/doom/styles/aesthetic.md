# Aesthetic Guide

This guide defines the visual principles of the Doom Design System.

## Core Style: Neubrutalism

- **Bold borders** — 2px solid, always
- **Hard shadows** — No blur, offset only
- **High contrast** — Meets WCAG AAA
- **Geometric** — 4px border-radius, clean lines

---

## Rules

### 1. Borders

Every interactive element has a 2px solid border.

```scss
// ✅ Correct
border: var(--border-width) solid var(--card-border);

// ❌ Wrong
border: 1px solid #ccc;
border: none;
```

### 2. Shadows

Hard offset shadows only. No blur.

```scss
// ✅ Correct
box-shadow: var(--shadow-hard);

// ❌ Wrong
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### 3. Hover States

Elements lift on hover. Shadow compensates.

```scss
// ✅ Correct
&:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hover);
}

// ❌ Wrong
&:hover {
  opacity: 0.8;
}
```

### 4. Colors

Use CSS variables. Never hardcode hex values.

```tsx
// ✅ Correct
style={{ background: "var(--card-bg)" }}

// ❌ Wrong
style={{ background: "#ffffff" }}
```

### 5. Typography

Headings are bold and uppercase.

```scss
font-family: var(--font-heading);
font-weight: var(--heading-weight); // 800
text-transform: var(--heading-transform); // uppercase
```

---

## Color Usage

| Purpose         | Variable    |
| --------------- | ----------- |
| Primary actions | `--primary` |
| Success         | `--success` |
| Errors          | `--error`   |
| Warnings        | `--warning` |
| Muted text      | `--muted`   |

Use color sparingly. Most UI should be black/white/gray with one accent.

---

## Spacing

Use the scale via layout components:

```tsx
// ✅ Correct
<Stack gap={4}>...</Stack>

// ❌ Wrong
<div style={{ marginBottom: "16px" }}>...</div>
```

| Token          | Size    |
| -------------- | ------- |
| `--spacing-xs` | 0.25rem |
| `--spacing-sm` | 0.5rem  |
| `--spacing-md` | 1rem    |
| `--spacing-lg` | 1.5rem  |
| `--spacing-xl` | 2rem    |

---

## Animation

Keep it fast: 150-250ms. Use `transform` for motion.

```scss
transition: all var(--duration-fast) var(--ease-in-out);
```

---

## Avoid

- Rounded pills (except badges/chips)
- Gradients
- Soft shadows
- Thin fonts (< 400 weight)
- Icon-only buttons without labels
- Custom styles that bypass tokens

---

## Template

```scss
@use "styles/mixins" as m;

.component {
  @include m.base-interactive; // border, shadow, transition
  background: var(--card-bg);

  @include m.brutalist-hover; // lift + shadow grow
  @include m.focus; // focus-visible ring
}
```
