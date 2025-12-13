import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert } from './Alert';

describe('Alert Component', () => {
  it('renders title correctly', () => {
    render(<Alert title="Test Alert" />);
    expect(screen.getByText('Test Alert')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Alert title="Title" description="Description text" />);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies correct role', () => {
    render(<Alert title="Alert" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
