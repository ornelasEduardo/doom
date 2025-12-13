import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Card Component', () => {
  it('should render children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should pass through props', () => {
    render(<Card data-testid="test-card" className="custom-class">Content</Card>);
    const card = screen.getByTestId('test-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('custom-class');
  });
});
