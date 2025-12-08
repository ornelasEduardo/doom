# Doom Design System

A modern, premium, neubrutalist and comic book inspired design system built with React and Emotion.

## Features

- 🎨 **Distinctive Aesthetic**: Bold, high-contrast, and playful design.
- 🧩 **Framework Agnostic**: Works with any React framework (Next.js, Vite, Remix, CRA).
- 🌙 **Theming**: Built-in dark mode and theming support.
- ♿ **Accessible**: Built with accessibility in mind.
- 📦 **TypeScript**: Fully typed for excellent developer experience.

## Installation

### 1. Install the package

```bash
npm install doom-design-system
```

### 2. Install Peer Dependencies

This library relies on a few peer dependencies. If you don't have them installed already, please install them:

```bash
npm install @emotion/react @emotion/styled lucide-react
```

## Usage

### 1. Setup Provider

Wrap your application with the `DesignSystemProvider` to ensure all styles and themes are applied correctly.

```tsx
import { DesignSystemProvider } from 'doom-design-system';

export default function App() {
  return (
    <DesignSystemProvider>
      <YourApp />
    </DesignSystemProvider>
  );
}
```

### 2. Use Components

Import and use components in your application:

```tsx
import { Button, Card, Text, Link } from 'doom-design-system';

function MyComponent() {
  return (
    <Card>
      <Text variant="h2">Hello World</Text>
      <p>
        Check out this <Link href="#">awesome link</Link>.
      </p>
      <Button variant="primary" onClick={() => alert('Boom!')}>
        Click Me
      </Button>
    </Card>
  );
}
```

### 3. Theming

You can control the theme using the `DesignSystemProvider` or the `useTheme` hook.

```tsx
<DesignSystemProvider 
  initialTheme="doom" 
  onThemeChange={(theme) => console.log(`Theme changed to ${theme}`)}
>
  {/* ... */}
</DesignSystemProvider>
```

## Requirements

This library requires the following peer dependencies:

- React >= 19
- @emotion/react
- @emotion/styled
- lucide-react
