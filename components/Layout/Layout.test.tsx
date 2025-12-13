import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Flex, Grid } from './Layout';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Layout Components', () => {
  describe('Flex', () => {
    it('should render children', () => {
      render(<Flex><div>Child</div></Flex>);
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    
    // We can't easily check styles in JSDOM without computing styles, 
    // but we can check if it renders.
  });

  describe('Grid', () => {
    it('should render children', () => {
      render(<Grid><div>Child</div></Grid>);
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
  });
});
