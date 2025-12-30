"use client";

import clsx from "clsx";
import React from "react";

import { Link } from "../Link/Link";
import styles from "./Breadcrumbs.module.scss";

interface BreadcrumbsProps {
  children: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ children, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className={clsx(styles.nav, className)}>
      <ol className={styles.list}>{children}</ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  href?: string;
  isCurrent?: boolean;
  children: React.ReactNode;
}

export function BreadcrumbItem({
  href,
  isCurrent,
  children,
}: BreadcrumbItemProps) {
  if (isCurrent) {
    return (
      <li aria-current="page" className={styles.li}>
        <span className={styles.currentPage}>{children}</span>
      </li>
    );
  }

  return (
    <li className={styles.li}>
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
