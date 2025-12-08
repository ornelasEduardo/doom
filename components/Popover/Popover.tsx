'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  placement?: 'bottom-start' | 'bottom-end' | 'bottom-center';
  offset?: number;
}

export function Popover({ 
  trigger, 
  content, 
  isOpen, 
  onClose, 
  placement = 'bottom-start',
  offset = 8 
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [transformOrigin, setTransformOrigin] = useState('top left');

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + offset;
    let left = triggerRect.left;
    let origin = 'top left';

    // Vertical positioning (flip if not enough space below)
    if (top + contentRect.height > viewportHeight && triggerRect.top > contentRect.height) {
      top = triggerRect.top - contentRect.height - offset;
      origin = 'bottom';
    } else {
      origin = 'top';
    }

    // Horizontal positioning
    if (placement === 'bottom-start') {
      left = triggerRect.left;
    } else if (placement === 'bottom-end') {
      left = triggerRect.right - contentRect.width;
    } else if (placement === 'bottom-center') {
      left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
    }

    // Edge detection (keep within viewport)
    if (left + contentRect.width > viewportWidth - 16) {
      left = viewportWidth - contentRect.width - 16; // 16px padding from right edge
      if (origin.includes('left')) origin = origin.replace('left', 'right');
    }
    if (left < 16) {
      left = 16; // 16px padding from left edge
      if (origin.includes('right')) origin = origin.replace('right', 'left');
    }

    setPosition({ top, left });
    setTransformOrigin(origin);
  }, [isOpen, placement, offset]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      <div ref={triggerRef} style={{ display: 'inline-block' }}>
        {trigger}
      </div>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={contentRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999, // High z-index to ensure it's on top
            transformOrigin: transformOrigin,
            animation: 'popoverScale 0.1s ease-out',
          }}
        >
          {content}
          <style jsx global>{`
            @keyframes popoverScale {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}
