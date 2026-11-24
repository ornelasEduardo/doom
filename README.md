# Doom Design System

[![Doom CI](https://github.com/ornelasEduardo/doom/actions/workflows/main.yml/badge.svg)](https://github.com/ornelasEduardo/doom/actions/workflows/main.yml)
[![npm version](https://img.shields.io/npm/v/doom-design-system.svg)](https://www.npmjs.com/package/doom-design-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A themeable React component library with a neubrutalist default preset, typed design tokens, component recipes, and scoped CSS.

## Features

- 🎨 **Distinctive Aesthetic**: Bold, high-contrast, and playful design.
- 🚀 **Server Components Ready**: Render scoped theme styles with server HTML, or compile static CSS at build time.
- 🧩 **Framework Agnostic**: Works with any React framework (Next.js, Vite, Remix).
- 🌙 **Theming**: Define themes, switch modes and customize public component parts.
- ♿ **Accessible**: Built with accessibility in mind.
- 📦 **TypeScript**: Fully typed for excellent developer experience.

## Installation

### 1. Install the package

```bash
npm install doom-design-system
```

### 2. Install Peer Dependencies

This library requires just `react` and `lucide-react`.

```bash
npm install lucide-react
```

## Usage

### 1. Setup Provider

Wrap your application with the `DesignSystemProvider` to ensure all styles and themes are applied correctly. It injects the necessary global CSS and theme variables.

```tsx
import { DesignSystemProvider } from "doom-design-system";
import { Montserrat } from "next/font/google";

// Optional: Use a custom google font
const montserrat = Montserrat({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <DesignSystemProvider withBody fontClassName={montserrat.className}>
        {children}
      </DesignSystemProvider>
    </html>
  );
}
```

### 2. Use Components

Import and use components in your application. Use named imports for the components you need.

```tsx
import { Button, Card, Text, Link } from "doom-design-system";

function MyComponent() {
  return (
    <Card>
      <Text variant="h2">Hello World</Text>
      <p>
        Check out this <Link href="#">awesome link</Link>.
      </p>
      <Button variant="primary" onClick={() => alert("Boom!")}>
        Click Me
      </Button>
    </Card>
  );
}
```

### 3. Theming

Use the object provider to apply a preset or an application-defined theme.

```tsx
import { DesignSystemProvider } from "doom-design-system";
import { captainTheme } from "doom-design-system/themes";

<DesignSystemProvider theme={captainTheme} withBackground>
  <App />
</DesignSystemProvider>;
```

The [theming guide](THEME.md) covers custom themes, modes, portals, CSS Modules, server rendering and migration from string theme names. The [generated reference](THEME-REFERENCE.md) lists parts, variants, sizes, tokens, and legacy aliases.

## Requirements

This library requires the following peer dependencies:

- React >= 19
- lucide-react (for icons)

## Architecture

This system uses **CSS Modules** (`.module.scss`) for component styling, ensuring styles are locally scoped and avoid collisions. It uses **SASS** for mixins and shared logic at build time. All styles are compiled to standard CSS during the build, making it extremely fast and lightweight.

## Testing

| Suite               | Location                     | Command                                 |
| ------------------- | ---------------------------- | --------------------------------------- |
| Unit                | Beside source                | `npm test`                              |
| Browser regressions | `tests/browser/<Component>/` | `npm run test:browser`                  |
| Story interactions  | Story `play` functions       | `npm run test:storybook`                |
| Package imports     | `tests/package/`             | `npm run build && npm run test:package` |

Storybook tests target the running server on port 6006. Add `-- --includeTags interaction`
to run only interaction examples. Install Chromium with `npx playwright install chromium`.
CI uses `npm run build-storybook && npm run test:storybook:ci`; set
`STORYBOOK_TEST_PORT=6010` locally if 6006 is occupied. `test:integration` remains
an alias for `test:package`.
