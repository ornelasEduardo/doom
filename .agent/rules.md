# Agent Coding Rules & Standards

These rules must be followed for all code generation and modification tasks within the `doom` design system.

## 0. Communication Protocol (Experienced Engineer)
*   **Conciseness**: Be succinct. Avoid fluff, filler, and stating the obvious. Focus on the *actions* and *technical rationale*.
*   **Competence Assumption**: Assume the user is an experienced engineer. Do not over-explain basic concepts (e.g., standard React patterns, basic CSS) unless explicitly asked.
*   **High-Quality Options**: Propose options *only* when:
    1.  The request is ambiguous or has multiple valid high-level architectural approaches.
    2.  You detect a significant risk or deviation from best practices in the user's request.
    *   Otherwise, proceed with the most optimal, standard implementation immediately.

## 1. Component Architecture
*   **Reusability**: Components must be generic, reusable, and composable. Avoid business logic.
*   **Props**: Expose sufficient props for customization (className, style, children, etc.) but enforce consistency via variants.
*   **Exports**: All public components must be exported from the root `index.ts`.

## 2. Styling & Layout
*   **NO Inline Styles**: Avoid the `style={{ ... }}` prop. Use styled-components/emotion.
*   **Layout Components**: Use `Flex` and `Grid` for internal component layout where possible.
*   **Spacing**: Use `gap` for spacing between elements.
*   **Library**: Use `@emotion/styled` and `@emotion/react`.

## 3. Typography
*   **Use Text Component**: Internally use the `<Text>` component for any text rendering.
*   **Variants**: Use `variant="..."` (h1-h6, body, small, caption).
*   **Colors**: Use `color="..."` (primary, muted, error, etc.) instead of hex codes.

## 4. Theming & Colors
*   **CSS Variables Only**: Never use hardcoded hex values. Use the defined CSS variables.
    *   `var(--primary)`
    *   `var(--card-bg)`
    *   `var(--card-border)`
    *   `var(--muted-foreground)`
*   **Borders**: Always use `var(--border-width)` and `var(--radius)`.

## 5. Icons
*   **Library**: Use `lucide-react`.
*   **Standard Props**: Always set `strokeWidth={2.5}` for the neubrutalism aesthetic.
*   **Sizing**: Use the `size` prop (e.g., `size={24}`).

## 6. File Organization & Imports
*   **Colocation**: Keep related files together (Component, Stories, Tests).
*   **Relative Imports**: Use relative imports (e.g., `../../components/...`) for internal dependencies. Do NOT use path aliases like `@/`.

## 7. TypeScript & Safety
*   **Strict Typing**: Define explicit interfaces for all component props.
*   **No Any**: Avoid using `any`.
*   **Prop Types**: Use specific union types for string props (e.g., `variant: 'primary' | 'secondary'`).

## 8. React Patterns
*   **'use client'**: Explicitly add `'use client';` at the top of components to ensure compatibility with Next.js App Router consumers.
*   **ForwardRef**: Ensure primitive components forward refs to the underlying DOM element.

## 9. Documentation & Testing
*   **Storybook**: Every component MUST have a corresponding `.stories.tsx` file.
*   **Maintenance**: If you add/modify props, you **MUST** update the Storybook file.
*   **Examples**: Stories should cover all major variants and states.
*   **Unit Tests**: Create/update unit tests (`.test.tsx`) for all components using `vitest`.

## 10. Accessibility Standards
*   **Color Contrast**: Ensure all text and UI components meet **WCAG 2.1 AAA** standards.
*   **Semantic HTML**: Use appropriate HTML tags (`<button>`, `<nav>`, `<main>`, `<h1>`-`<h6>`).
*   **ARIA**: Use ARIA attributes only when semantic HTML is insufficient.
*   **Focus Management**: Ensure all interactive elements are focusable and have visible focus states.
