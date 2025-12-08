'use client';

import React from 'react';
import { Global } from '@emotion/react';
import { resetStyles, utilityStyles } from './styles';
import { ThemeProvider, ThemeKey } from './styles/themes';

export function DesignSystemProvider({ 
  children,
  initialTheme = 'default',
  withBody = false,
  className = ''
}: { 
  children: React.ReactNode;
  initialTheme?: ThemeKey;
  withBody?: boolean;
  className?: string;
}) {
  const content = (
    <ThemeProvider initialTheme={initialTheme}>
      <Global styles={[resetStyles, utilityStyles]} />
      {children}
    </ThemeProvider>
  );

  if (withBody) {
    return (
      <body className={className}>
        {content}
      </body>
    );
  }

  return (
    <div className={className} style={{ display: 'contents' }}>
      {content}
    </div>
  );
}
