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

const Panel = styled.div<{ isOpen: boolean; side: 'left' | 'right' }>`
  position: fixed;
  background-color: var(--card-bg);
  box-shadow: ${props => props.side === 'left' 
    ? '8px 0px 0px 0px var(--card-border)' 
    : '-8px 0px 0px 0px var(--card-border)'};
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  top: 0;
  bottom: 0;
  ${props => props.side}: 0;
  width: 100%;
  max-width: 400px;
  
  ${props => props.side === 'left' ? `
    border-top-right-radius: var(--radius);
    border-bottom-right-radius: var(--radius);
  ` : `
    border-top-left-radius: var(--radius);
    border-bottom-left-radius: var(--radius);
  `}
  
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  
  transform: ${props => {
    if (props.isOpen) return 'translateX(0)';
    return props.side === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
  }};
`;

const Header = styled(Flex)`
  padding: var(--spacing-lg);
  border-bottom-width: var(--border-width);
  border-bottom-style: solid;
  border-bottom-color: var(--card-border);
`;

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
`;

const Content = styled.div`
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
`;

const Footer = styled(Flex)`
  padding: var(--spacing-lg);
  border-top-width: var(--border-width);
  border-top-style: solid;
  border-top-color: var(--card-border);
`;

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  side = 'right', 
  children, 
  footer,
  className 
}: DrawerProps) {
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
      <Panel isOpen={isOpen} side={side} role="dialog" aria-modal="true" className={className}>
        <Header align="center" justify="space-between">
          <Title>{title}</Title>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
            <X size={24} />
          </Button>
        </Header>
        <Content>{children}</Content>
        {footer && <Footer justify="flex-end" gap="var(--spacing-md)">{footer}</Footer>}
      </Panel>
    </>,
    document.body
  );
}
