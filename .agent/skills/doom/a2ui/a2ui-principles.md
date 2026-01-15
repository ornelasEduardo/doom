# A2UI Principles

## 1. Aesthetic

- **Borders**: All interactive elements (cards, buttons, inputs) already have borders built-in. Do not add `border` classes manually.
- **Shadows**: Use `shadow-hard` for a brutalist look if you are creating a custom container, but prefer using `<Card>` which handles this for you.
- **Radius**: Default radius is `4px`. Avoid `rounded-full` unless creating a badge or avatar.

## 2. Layout & Spacing

- **Do NOT** use `margin` or `padding` on individual items to space them out.
- **DO** use `Stack` (vertical) or `Flex` (horizontal) with the `gap` prop.
  - `gap={1}` = 4px
  - `gap={4}` = 16px (Standard)
  - `gap={6}` = 24px (Section separation)
- Use `Grid` for complex 2D layouts. `columns` prop accepts numbers (`3`) or CSS strings (`"1fr 2fr"`).

## 3. Typography

- Use the `<Text>` component for all text.
- **Variants**:
  - `h1`-`h3`: Page/Section titles (Bold, Uppercase)
  - `body`: Default text
  - `small`: Metadata/Labels (Muted)
- Do not use `<h1>` tags inside HTML strings.

## 4. Colors & Variables

- Use CSS variables for all custom styling.
- **Primary**: `var(--primary)` (Brand color)
- **Backgrounds**: `var(--card-bg)`, `var(--background)`
- **Text**: `var(--foreground)`, `var(--muted-foreground)`
- **Status**: `var(--success)`, `var(--error)`, `var(--warning)`

## 5. Components

- **Inputs**: Always provide a `label`.
- **Buttons**: Use `variant="ghost"` for secondary/tertiary actions to reduce visual noise.
- **Charts**: Use the `style` prop to set explicit height (e.g., `{ height: 400 }`).

## 6. Utilities

- **WE ARE NOT A TAILWIND SYSTEM**. Do not use generic Tailwind classes (e.g., `max-w-sm`, `bg-red-500`, `rounded-lg`).
- **ONLY** use the specific utility classes defined in the Doom system:
  - Spacing: `p-0` to `p-10`, `m-0` to `m-10` (4px increments)
  - Sizing: `w-full`, `h-full`, `h-screen`
  - Flex: `flex`, `flex-col`, `items-center`, `justify-between`
  - Typography: `text-{size}`, `text-{color}`, `uppercase`, `text-center`, `text-left`, `text-right`
- For specific visuals not covered by utilities, use the `style` prop.
