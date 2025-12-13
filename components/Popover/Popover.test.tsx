import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popover } from './Popover';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('Popover Component', () => {
  it('should render trigger', () => {
    render(
      <Popover
        isOpen={false}
        onClose={() => {}}
        trigger={<button>Trigger</button>}
        content={<div>Content</div>}
      />
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should render content when open', () => {
    render(
      <Popover
        isOpen={true}
        onClose={() => {}}
        trigger={<button>Trigger</button>}
        content={<div>Content</div>}
      />
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  // Testing positioning logic is hard in JSDOM as getBoundingClientRect returns 0s.
  // We can skip that for unit tests and rely on integration/e2e or visual tests if we had them.
  // For now, verifying rendering is good enough.
});
