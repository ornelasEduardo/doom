'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { X } from 'lucide-react';
import { Button } from '../Button';
import { Flex } from '../Layout';


const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, var(--overlay-opacity));
  backdrop-filter: blur(4px);
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity 0.2s ease-in-out;
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
  z-index: var(--z-dropdown);
`;

const Panel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 96vh;
  min-height: 50vh;
  background-color: var(--card-bg);
  border-top: var(--border-width) solid var(--card-border);
  border-left: var(--border-width) solid var(--card-border);
  border-right: var(--border-width) solid var(--card-border);
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  z-index: var(--z-modal);
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(100%)'};
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const HandleBar = styled.div`
  width: 48px;
  height: 6px;
  background-color: var(--card-border);
  border-radius: 99px;
  margin: 0.75rem auto;
  opacity: 0.5;
`;

const Header = styled(Flex)`
  padding: 0 var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
`;

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
`;

const Content = styled.div`
  flex: 1;
  padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
  overflow-y: auto;
`;


interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <Overlay isOpen={isOpen} onClick={onClose} aria-hidden="true" />
      <Panel isOpen={isOpen} role="dialog" aria-modal="true" className={className}>
        <HandleBar />
        <Header align="center" justify="space-between">
          <Title>{title}</Title>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sheet">
            <X size={24} />
          </Button>
        </Header>
        <Content>{children}</Content>
      </Panel>
    </>,
    document.body
  );
}
