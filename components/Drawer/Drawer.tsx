"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Drawer.module.scss";

// Context for composition API
const DrawerContext = React.createContext<{
  onClose: () => void;
  titleId?: string;
  variant: "default" | "solid";
}>({
  onClose: () => {},
  variant: "default",
});

// ============================================================================
// Sub-components for composition API
// ============================================================================

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function DrawerHeader({ children, className, id }: DrawerHeaderProps) {
  const { onClose, titleId } = React.useContext(DrawerContext);

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
        aria-label="Close drawer"
        size="sm"
        variant="danger"
        onClick={onClose}
      >
        <X size={24} />
      </Button>
    </Flex>
  );
}

export function DrawerBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.content, className)}>{children}</div>;
}

export function DrawerFooter({
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

// ============================================================================
// Main Drawer component
// ============================================================================

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  side?: "left" | "right";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: "default" | "solid";
}

function DrawerInternal({
  isOpen,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
  variant = "default",
}: DrawerProps) {
  const reactId = React.useId();
  const titleId = `drawer-title-${reactId}`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <DrawerContext.Provider value={{ onClose, titleId, variant }}>
      <div
        aria-hidden="true"
        className={clsx(styles.overlay, isOpen && styles.isOpen)}
        onClick={onClose}
      />
      <div
        aria-label={!title ? "Drawer" : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={clsx(
          styles.panel,
          styles[side],
          styles[variant],
          isOpen && styles.isOpen,
          className,
        )}
        role="dialog"
      >
        {title ? (
          <>
            <DrawerHeader>{title}</DrawerHeader>
            <DrawerBody>{children}</DrawerBody>
            {footer && <DrawerFooter>{footer}</DrawerFooter>}
          </>
        ) : (
          children
        )}
      </div>
    </DrawerContext.Provider>,
    document.body,
  );
}

// Namespace export pattern (like Chart)
export const Drawer = Object.assign(DrawerInternal, {
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
});
