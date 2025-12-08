'use client';

import React from 'react';
import { Global } from '@emotion/react';
import { resetStyles, utilityStyles } from './styles';
import { ThemeProvider, ThemeKey } from './styles/themes';
import { defaultFont } from './fonts';

export function DesignSystemProvider({ 
  children,
  initialTheme = 'default',
  withBody = false
}: { 
  children: React.ReactNode;
  initialTheme?: ThemeKey;
  withBody?: boolean;
}) {
  const content = (
    <ThemeProvider initialTheme={initialTheme}>
      <Global styles={[resetStyles, utilityStyles]} />
      {children}
    </ThemeProvider>
  );

  if (withBody) {
    return (
      <body className={defaultFont.variable}>
        {content}
      </body>
    );
  }

  return (
    <div className={defaultFont.variable} style={{ display: 'contents' }}>
      {content}
    </div>
  );
}
