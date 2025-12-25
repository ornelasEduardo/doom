"use client";

import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import { Card } from "../Card/Card";
import { Button } from "../Button/Button";
import { Stack, Flex } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./Modal.module.scss";

interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "solid";
}

const ModalContext = React.createContext<{
  onClose: () => void;
  titleId?: string;
  variant: "default" | "solid";
}>({
  onClose: () => {},
  variant: "default",
});

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function ModalHeader({ children, className, id }: ModalHeaderProps) {
  const { onClose, titleId } = React.useContext(ModalContext);

  return (
    <Flex
      align="center"
      justify="space-between"
      className={clsx(styles.header, className)}
    >
      <div id={id || titleId} className={styles.headerContent}>
        {children}
      </div>
      <Button
        variant="danger"
        size="sm"
        onClick={onClose}
        aria-label="Close modal"
        className={styles.closeButton}
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
  return (
    <Flex
      justify="flex-end"
      align="center"
      gap={4}
      className={clsx(styles.footer, className)}
    >
      {children}
    </Flex>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  style,
  variant = "default",
  ...props
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = `modal-title-${reactId}`;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <ModalContext.Provider value={{ onClose, titleId, variant }}>
      <div
        className={clsx(styles.overlay, isOpen && styles.isOpen, className)}
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={style}
      >
        <div className={styles.contentContainer}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : props["aria-labelledby"]}
            aria-label={
              props["aria-label"] ||
              (!title && !props["aria-labelledby"] ? "Modal Window" : undefined)
            }
            {...props}
          >
            <Card
              className={clsx(styles.modalCard, styles[variant])}
              style={{ padding: 0, overflow: "hidden" }}
            >
              {title ? (
                <>
                  <ModalHeader>{title}</ModalHeader>
                  <Stack gap={0} className={styles.modalContent}>
                    <ModalBody>{children}</ModalBody>
                    {footer && <ModalFooter>{footer}</ModalFooter>}
                  </Stack>
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
