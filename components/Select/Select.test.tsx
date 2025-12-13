import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Select } from './Select';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    style: { fontFamily: 'mocked' },
    className: 'mocked-font',
    variable: '--font-mocked',
  }),
}));

// Mock Popover since it might be complex or rely on portals
vi.mock('../..', async () => {
  const actual = await vi.importActual('../..');
  return {
    ...actual as any,
    Popover: ({ trigger, content, isOpen }: any) => (
      <div>
        {trigger}
        {isOpen && <div data-testid="popover-content">{content}</div>}
      </div>
    ),
  };
});

describe('Select Component', () => {
  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ];

  it('should render with placeholder', () => {
    render(<Select options={options} placeholder="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('should open options when clicked', () => {
    const { container } = render(<Select options={options} />);
    
    const trigger = container.querySelector('button') as HTMLElement;
    fireEvent.click(trigger);
    
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should select an option', () => {
    const handleChange = vi.fn();
    const { container } = render(<Select options={options} onChange={handleChange} />);
    
    const trigger = container.querySelector('button') as HTMLElement;
    fireEvent.click(trigger);
    
    const popoverContent = screen.getByTestId('popover-content');
    const option1 = within(popoverContent).getByText('Option 1');
    fireEvent.click(option1);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should have required attribute on hidden input when required prop is true', () => {
    const { container } = render(<Select options={options} required name="test-select" />);
    // Select the input that has the name "test-select"
    // Note: We changed type="hidden" to type="text" with opacity 0, so we query by name
    const input = container.querySelector('input[name="test-select"]');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('type', 'text'); // Verify it's text type for validation
    expect(input).toHaveStyle({ opacity: '0' }); // Verify it's visually hidden
  });
});
