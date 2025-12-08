import { render, screen, fireEvent } from '@testing-library/react';
import { SplitButton } from './SplitButton';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock Design System
vi.mock('../..', () => ({
  Popover: ({ trigger, content, isOpen }: any) => (
    <div>
      {trigger}
      {isOpen && <div data-testid="popover-content">{content}</div>}
    </div>
  ),
}));

describe('SplitButton Component', () => {
  it('should render primary button', () => {
    render(
      <SplitButton 
        primaryLabel="Save" 
        onPrimaryClick={() => {}} 
        items={[]} 
      />
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should call primary click', () => {
    const handlePrimaryClick = vi.fn();
    render(
      <SplitButton 
        primaryLabel="Save" 
        onPrimaryClick={handlePrimaryClick} 
        items={[]} 
      />
    );
    
    fireEvent.click(screen.getByText('Save'));
    expect(handlePrimaryClick).toHaveBeenCalled();
  });

  it('should open menu on trigger click', () => {
    render(
      <SplitButton 
        primaryLabel="Save" 
        onPrimaryClick={() => {}} 
        items={[{ label: 'Save as Draft', onClick: () => {} }]} 
      />
    );
    
    // Find the dropdown trigger (it has a chevron icon, but we can find by role button that is NOT the primary one)
    const buttons = screen.getAllByRole('button');
    const trigger = buttons[1]; // 0 is primary, 1 is trigger
    
    fireEvent.click(trigger);
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
  });
});
