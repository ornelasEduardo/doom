import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionRow } from './ActionRow';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock Design System
vi.mock('../Text/Text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('../Layout/Layout', () => ({
  Flex: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
}));

describe('ActionRow Component', () => {
  it('should render title and description', () => {
    render(
      <ActionRow 
        icon={<span>Icon</span>} 
        title="Test Title" 
        description="Test Description" 
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const handleClick = vi.fn();
    render(
      <ActionRow 
        icon={<span>Icon</span>} 
        title="Test Title" 
        onClick={handleClick}
      />
    );
    
    // In our mock Flex, we pass onClick to the div.
    // So clicking the text should bubble up.
    fireEvent.click(screen.getByText('Test Title'));
    expect(handleClick).toHaveBeenCalled();
  });
});
