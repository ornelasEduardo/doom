'use client';

import React from 'react';
import './styles/globals.scss';
import { ThemeProvider, ThemeKey } from './styles/themes';

export function DesignSystemProvider({ 
  children,
  initialTheme = 'default',
  withBody = false,
  className = '',
  fontClassName = ''
}: { 
  children: React.ReactNode;
  initialTheme?: ThemeKey;
  withBody?: boolean;
  className?: string;
  fontClassName?: string;
}) {
  const content = (
    <ThemeProvider initialTheme={initialTheme}>
      {children}
    </ThemeProvider>
  );

  const combinedClassName = `${fontClassName} ${className}`.trim();

  if (withBody) {
    return (
      <body className={combinedClassName}>
        {content}
      </body>
    );
  }

  return (
    <div className={combinedClassName} style={{ display: 'contents' }}>
      {content}
    </div>
  );
}
