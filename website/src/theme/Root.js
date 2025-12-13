import React from 'react';
import { DesignSystemProvider } from 'doom-design-system';
import { Montserrat } from 'next/font/google';

// Since we can't use next/font in standard React/Docusaurus easily without Next.js,
// we will rely on a standard font import or assume it's loaded via CSS for now.
// However, DesignSystemProvider expects a fontClassName.
// For Docusaurus, we can just pass a dummy class or import the font via CSS.

export default function Root({children}) {
  return (
    <DesignSystemProvider>
      {children}
    </DesignSystemProvider>
  );
}
