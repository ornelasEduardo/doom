# Doom Design System

A modern, premium design system built with React, Next.js, and Emotion.

## Installation

```bash
npm install doom-design-system
```

## Usage

Wrap your application with the `DesignSystemProvider` to ensure all styles and themes are applied correctly.

```tsx
import { DesignSystemProvider } from 'doom-design-system';

export default function App({ Component, pageProps }) {
  return (
    <DesignSystemProvider>
      <Component {...pageProps} />
    </DesignSystemProvider>
  );
}
```

### Importing Components

```tsx
import { Button, Card, Text } from 'doom-design-system';

function MyComponent() {
  return (
    <Card>
      <Text variant="h2">Hello World</Text>
      <Button variant="primary">Click Me</Button>
    </Card>
  );
}
```

## Requirements

This library requires the following peer dependencies:

- React >= 19
- Next.js >= 15
- @emotion/react
- @emotion/styled
- lucide-react
