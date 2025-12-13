import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Link } from './Link';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Link Component', () => {
  it('should render children', () => {
    render(<Link href="/test">Test Link</Link>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
  });

  it('should render with variants', () => {
    render(<Link href="/test" variant="button">Button Link</Link>);
    expect(screen.getByText('Button Link')).toBeInTheDocument();
  });
});
