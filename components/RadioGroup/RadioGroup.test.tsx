import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RadioGroup, RadioGroupItem } from './RadioGroup';

describe('RadioGroup Component', () => {
  it('renders items', () => {
    render(
      <RadioGroup defaultValue="1">
        <RadioGroupItem value="1">Item 1</RadioGroupItem>
        <RadioGroupItem value="2">Item 2</RadioGroupItem>
      </RadioGroup>
    );
    expect(screen.getByLabelText('Item 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Item 2')).toBeInTheDocument();
  });

  it('handles selection change', () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup onValueChange={handleChange} defaultValue="1">
        <RadioGroupItem value="1">Item 1</RadioGroupItem>
        <RadioGroupItem value="2">Item 2</RadioGroupItem>
      </RadioGroup>
    );
    
    // Initial state
    const radio1 = screen.getByLabelText('Item 1') as HTMLInputElement;
    const radio2 = screen.getByLabelText('Item 2') as HTMLInputElement;
    expect(radio1).toBeChecked();
    expect(radio2).not.toBeChecked();

    // Click Item 2
    fireEvent.click(radio2);
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('respects disabled state', () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup onValueChange={handleChange}>
        <RadioGroupItem value="1" disabled>Item 1</RadioGroupItem>
      </RadioGroup>
    );
    
    const radio1 = screen.getByLabelText('Item 1');
    expect(radio1).toBeDisabled();
    
    fireEvent.click(radio1);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
