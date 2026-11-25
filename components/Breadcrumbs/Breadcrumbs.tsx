"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { Link } from "../Link/Link";
import styles from "./Breadcrumbs.module.scss";

interface BreadcrumbsProps {
  classNames?: ThemeClassNames<"Breadcrumbs">;
  children: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({
  classNames,
  children,
  className,
}: BreadcrumbsProps) {
  const doomPart = useThemeParts("Breadcrumbs", classNames, {});

  return (
    <nav
      aria-label="breadcrumb"
      {...doomPart("root", { className: clsx(styles.nav, className) })}
    >
      <ol {...doomPart("list", { className: styles.list })}>{children}</ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  classNames?: ThemeClassNames<"Breadcrumbs">;
  href?: string;
  isCurrent?: boolean;
  children: React.ReactNode;
}

export function BreadcrumbItem({
  href,
  isCurrent,
  children,
}: BreadcrumbItemProps) {
  const doomPart = useThemeParts("Breadcrumbs", undefined, {});

  if (isCurrent) {
    return (
      <li aria-current="page" {...doomPart("li", { className: styles.li })}>
        <span {...doomPart("currentPage", { className: styles.currentPage })}>
          {children}
        </span>
      </li>
    );
  }

  return (
    <li {...doomPart("li", { className: styles.li })}>
      {href ? (
        <Link href={href} style={{ fontSize: "inherit" }} variant="default">
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
    </li>
  );
}
