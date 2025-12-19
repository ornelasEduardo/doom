"use client";

import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import { Card } from "../Card/Card";
import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Modal.module.scss";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalContext = React.createContext<{
  onClose: () => void;
  titleId?: string;
}>({
  onClose: () => {},
});

export function ModalHeader({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { onClose, titleId } = React.useContext(ModalContext);
  return (
    <Flex
      align="center"
      justify="space-between"
      className={clsx(styles.header, className)}
    >
      <h2 id={id || titleId}>{children}</h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        aria-label="Close modal"
      >
        <X size={20} strokeWidth={2.5} />
      </Button>
    </Flex>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.body, className)}>{children}</div>;
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  style,
  ...props
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = `modal-title-${reactId}`;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <ModalContext.Provider value={{ onClose, titleId }}>
      <div
        className={clsx(styles.overlay, className)}
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={style}
      >
        <div className={styles.contentContainer}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            {...props}
          >
            <Card style={{ padding: 0, overflow: "hidden" }}>
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
      </div>
    </ModalContext.Provider>,
    document.body
  );
}
