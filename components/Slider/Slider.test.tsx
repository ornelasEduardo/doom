import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Slider } from './Slider';

describe('Slider Component', () => {
  it('renders with label', () => {
    render(<Slider label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<Slider label="Test" value={50} showValue onChange={() => {}} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('calls onChange when changed', () => {
    const handleChange = vi.fn();
    render(<Slider label="Test" defaultValue={0} onChange={handleChange} />);
    const input = screen.getByRole('slider') || screen.getAllByRole('slider')[0] || document.querySelector('input[type="range"]');
    
    // Testing library role 'slider' should map to input range
    // fireEvent change
    if (input) {
      fireEvent.change(input, { target: { value: '75' } });
      expect(handleChange).toHaveBeenCalledWith(75);
    } else {
      // Fallback query if role fails
      const manualInput = document.querySelector('input');
      if (manualInput) {
        fireEvent.change(manualInput, { target: { value: '75' } });
        expect(handleChange).toHaveBeenCalledWith(75);
      }
    }
  });
});
