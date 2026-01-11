"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Flex, Stack } from "../Layout/Layout";
import styles from "./Modal.module.scss";

interface ModalProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
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

function ModalHeader({ children, className, id }: ModalHeaderProps) {
  const { onClose, titleId } = React.useContext(ModalContext);

  return (
    <Flex
      align="center"
      className={clsx(styles.header, className)}
      justify="space-between"
    >
      <div className={styles.headerContent} id={id || titleId}>
        {children}
      </div>
      <Button
        aria-label="Close modal"
        className={styles.closeButton}
        size="sm"
        variant="danger"
        onClick={onClose}
      >
        <X size={20} strokeWidth={2.5} />
      </Button>
    </Flex>
  );
}

function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.body, className)}>{children}</div>;
}

function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Flex
      align="center"
      className={clsx(styles.footer, className)}
      gap={4}
      justify="flex-end"
    >
      {children}
    </Flex>
  );
}

function ModalInternal({
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
      if (e.key === "Escape") {
        onClose();
      }
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

  if (!mounted) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <ModalContext.Provider value={{ onClose, titleId, variant }}>
      <div
        ref={overlayRef}
        className={clsx(styles.overlay, isOpen && styles.isOpen, className)}
        style={style}
        onClick={handleOverlayClick}
      >
        <div className={styles.contentContainer}>
          <div
            aria-label={
              props["aria-label"] ||
              (!title && !props["aria-labelledby"] ? "Modal Window" : undefined)
            }
            aria-labelledby={title ? titleId : props["aria-labelledby"]}
            aria-modal="true"
            role="dialog"
            {...props}
          >
            <Card
              className={clsx(styles.modalCard, styles[variant])}
              style={{ padding: 0, overflow: "hidden" }}
            >
              {title ? (
                <>
                  <ModalHeader>{title}</ModalHeader>
                  <Stack className={styles.modalContent} gap={0}>
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
    document.body,
  );
}

export const Modal = Object.assign(ModalInternal, {
  Root: ModalInternal,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
