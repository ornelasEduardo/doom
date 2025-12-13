import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Accordion, AccordionItem } from './Accordion';

describe('Accordion Component', () => {
  it('renders triggers visible', () => {
    render(
      <Accordion>
        <AccordionItem value="1" trigger="Trigger 1">Content 1</AccordionItem>
        <AccordionItem value="2" trigger="Trigger 2">Content 2</AccordionItem>
      </Accordion>
    );
    expect(screen.getByText('Trigger 1')).toBeInTheDocument();
    expect(screen.getByText('Trigger 2')).toBeInTheDocument();
  });

  it('toggles content on click (single)', () => {
    render(
      <Accordion type="single">
        <AccordionItem value="1" trigger="Trigger 1">Content 1</AccordionItem>
      </Accordion>
    );
    // Initially closed (unless default)
    expect(screen.getByText('Content 1')).not.toBeVisible();

    // Click trigger
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(screen.getByText('Content 1')).toBeVisible();

    // Click again to close
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(screen.getByText('Content 1')).not.toBeVisible();
  });

  it('allows multiple items open in multiple mode', () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="1" trigger="Trigger 1">Content 1</AccordionItem>
        <AccordionItem value="2" trigger="Trigger 2">Content 2</AccordionItem>
      </Accordion>
    );
    
    fireEvent.click(screen.getByText('Trigger 1'));
    fireEvent.click(screen.getByText('Trigger 2'));
    
    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
  });
});
