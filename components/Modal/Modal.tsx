'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../Card/Card';
import { Button } from '../Button/Button';
import { Flex } from '../Layout/Layout';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

export function ModalHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const { onClose } = React.useContext(ModalContext);
  return (
    <Flex 
      align="center"
      justify="space-between"
      className={clsx(styles.header, className)}
    >
      <h2>{children}</h2>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X size={20} strokeWidth={2.5} />
      </Button>
    </Flex>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx(styles.body, className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx(styles.footer, className)}>
      {children}
    </div>
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
      <div
        className={styles.overlay}
        ref={overlayRef}
        onClick={handleOverlayClick}
      >
        <div className={styles.contentContainer}>
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
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}
