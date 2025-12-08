'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styled from '@emotion/styled';
import { Card, Button, Flex } from '../..';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(4px);
  background-color: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 28rem;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const StyledHeader = styled(Flex)`
  padding: 1.5rem;
  border-bottom: var(--border-width) solid var(--card-border);
  background: var(--background);
  
  h2 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 0;
  }
`;

const StyledBody = styled.div`
  padding: 1.5rem;
`;

const StyledFooter = styled.div`
  padding: 1.5rem;
  border-top: var(--border-width) solid var(--card-border);
  background: var(--background);
`;

export function ModalHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const { onClose } = React.useContext(ModalContext);
  return (
    <StyledHeader 
      justify="space-between" 
      align="center" 
      className={className}
    >
      <h2>{children}</h2>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X size={20} strokeWidth={2.5} />
      </Button>
    </StyledHeader>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StyledBody className={className}>
      {children}
    </StyledBody>
  );
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StyledFooter className={className}>
      {children}
    </StyledFooter>
  );
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <ModalContext.Provider value={{ onClose }}>
      <Overlay
        ref={overlayRef}
        onClick={handleOverlayClick}
      >
        <ContentContainer>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {title ? (
              <>
                <ModalHeader>{title}</ModalHeader>
                <ModalBody>{children}</ModalBody>
                {footer && <ModalFooter>{footer}</ModalFooter>}
              </>
            ) : (
              children
            )}
          </Card>
        </ContentContainer>
      </Overlay>
    </ModalContext.Provider>,
    document.body
  );
}
