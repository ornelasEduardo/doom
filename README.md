# Doom Design System

[![Doom CI](https://github.com/ornelasEduardo/doom/actions/workflows/main.yml/badge.svg)](https://github.com/ornelasEduardo/doom/actions/workflows/main.yml)
[![npm version](https://img.shields.io/npm/v/doom-design-system.svg)](https://www.npmjs.com/package/doom-design-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, premium, neubrutalist and comic book inspired design system built with React and SASS Modules.

## Features

- 🎨 **Distinctive Aesthetic**: Bold, high-contrast, and playful design.
- 🚀 **Server Components Ready**: Fully compatible with Next.js App Router and React Server Components (RSC) with zero-runtime CSS.
- 🧩 **Framework Agnostic**: Works with any React framework (Next.js, Vite, Remix).
- 🌙 **Theming**: Built-in dark mode and theming support via CSS Variables.
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

Import and use components in your application. They are now fully tree-shakeable and lightweight.

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

The Design System uses CSS Variables for theming. You can control the theme using the `DesignSystemProvider`.

```tsx
<DesignSystemProvider initialTheme="doom">
  {/* The entire app will be themed automatically */}
</DesignSystemProvider>
```

## Requirements

This library requires the following peer dependencies:

- React >= 19
- lucide-react (for icons)

## Architecture

This system uses **CSS Modules** (`.module.scss`) for component styling, ensuring styles are locally scoped and avoid collisions. It uses **SASS** for mixins and shared logic at build time. All styles are compiled to standard CSS during the build, making it extremely fast and lightweight.
