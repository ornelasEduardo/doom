import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Label } from './Label';

describe('Label Component', () => {
  it('renders children correctly', () => {
    render(<Label>Username</Label>);
    const labelElement = screen.getByText('Username');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement.tagName).toBe('LABEL');
  });

  it('passes htmlFor attribute correctly', () => {
    render(<Label htmlFor="username-input">Username</Label>);
    const labelElement = screen.getByText('Username');
    expect(labelElement).toHaveAttribute('for', 'username-input');
  });

  it('accepts additional className', () => {
    render(<Label className="custom-class">Test Label</Label>);
    const labelElement = screen.getByText('Test Label');
    expect(labelElement).toHaveClass('custom-class');
  });

  it('forwards other props to the label element', () => {
    render(<Label data-testid="test-label" id="my-label">Test Label</Label>);
    const labelElement = screen.getByTestId('test-label');
    expect(labelElement).toHaveAttribute('id', 'my-label');
  });
});
