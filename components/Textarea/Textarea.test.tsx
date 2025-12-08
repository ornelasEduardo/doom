import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from './Textarea';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('Textarea Component', () => {
  it('should render', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle changes', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    
    expect(handleChange).toHaveBeenCalled();
  });
});
