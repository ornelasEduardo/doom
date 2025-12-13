import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown } from './Dropdown';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock Design System
vi.mock('../..', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Popover: ({ trigger, content, isOpen }: any) => (
    <div>
      {trigger}
      {isOpen && <div data-testid="popover-content">{content}</div>}
    </div>
  ),
}));

describe('Dropdown Component', () => {
  it('should render trigger', () => {
    render(
      <Dropdown 
        triggerLabel="Menu" 
        items={[]} 
      />
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('should open menu on click', () => {
    render(
      <Dropdown 
        triggerLabel="Menu" 
        items={[{ label: 'Item 1', onClick: () => {} }]} 
      />
    );
    
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should call item onClick and close', () => {
    const handleItemClick = vi.fn();
    render(
      <Dropdown 
        triggerLabel="Menu" 
        items={[{ label: 'Item 1', onClick: handleItemClick }]} 
      />
    );
    
    fireEvent.click(screen.getByText('Menu'));
    fireEvent.click(screen.getByText('Item 1'));
    
    expect(handleItemClick).toHaveBeenCalled();
    expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
  });
});
