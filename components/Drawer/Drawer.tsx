"use client";
import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

import {
  type ThemeClassNames,
  ThemePartsBoundary,
  useOwnedThemeParts,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { ThemedPortal } from "../../styles/theming/ThemedPortal";
import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Drawer.module.scss";

const DrawerContext = React.createContext<{
  onClose: () => void;
  titleId?: string;
  variant: "default" | "solid";
}>({
  onClose: () => {},
  variant: "default",
});

interface DrawerHeaderProps {
  classNames?: ThemeClassNames<"Drawer">;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function DrawerHeader({
  classNames,
  children,
  className,
  id,
}: DrawerHeaderProps) {
  const doomPart = useThemeParts("Drawer", classNames, {});

  const { onClose, titleId } = React.useContext(DrawerContext);

  return (
    <Flex
      align="center"
      {...doomPart("header", { className: clsx(styles.header, className) })}
      justify="space-between"
    >
      <div
        {...doomPart("headerContent", { className: styles.headerContent })}
        id={id || titleId}
      >
        {children}
      </div>
      <Button
        aria-label="Close drawer"
        size="sm"
        variant="danger"
        onClick={onClose}
      >
        <ThemedIcon icon={X} iconName="close" size={24} />
      </Button>
    </Flex>
  );
}

export function DrawerBody({
  classNames,
  children,
  className,
}: {
  classNames?: ThemeClassNames<"Drawer">;
  children: React.ReactNode;
  className?: string;
}) {
  const doomPart = useThemeParts("Drawer", classNames, {});

  return (
    <div
      {...doomPart("content", { className: clsx(styles.content, className) })}
    >
      {children}
    </div>
  );
}

export function DrawerFooter({
  classNames,
  children,
  className,
}: {
  classNames?: ThemeClassNames<"Drawer">;
  children: React.ReactNode;
  className?: string;
}) {
  const doomPart = useThemeParts("Drawer", classNames, {});

  return (
    <Flex
      align="center"
      {...doomPart("footer", { className: clsx(styles.footer, className) })}
      gap={4}
      justify="flex-end"
    >
      {children}
    </Flex>
  );
}

interface DrawerProps {
  classNames?: ThemeClassNames<"Drawer">;
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
  classNames,
  isOpen,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
  variant = "default",
}: DrawerProps) {
  const doomPart = useOwnedThemeParts("Drawer", classNames, {
    variant: variant,
  });

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

  return (
    <ThemePartsBoundary
      classNames={classNames}
      component="Drawer"
      visual={{ variant }}
    >
      {
        <ThemedPortal surface={variant === "solid" ? "solid" : undefined}>
          {
            <DrawerContext.Provider value={{ onClose, titleId, variant }}>
              <div
                aria-hidden="true"
                {...doomPart("root", {
                  className: clsx(styles.overlay, isOpen && styles.isOpen),
                })}
                onClick={onClose}
              />
              <div
                aria-label={!title ? "Drawer" : undefined}
                aria-labelledby={title ? titleId : undefined}
                aria-modal="true"
                {...doomPart("panel", {
                  className: clsx(
                    styles.panel,
                    styles[side],
                    styles[variant],
                    isOpen && styles.isOpen,
                    className,
                  ),
                })}
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
            </DrawerContext.Provider>
          }
        </ThemedPortal>
      }
    </ThemePartsBoundary>
  );
}

export const Drawer = Object.assign(DrawerInternal, {
  Root: DrawerInternal,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
});
