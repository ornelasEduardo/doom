'use client';

import clsx from 'clsx';
import { Link } from '../Link/Link';
import styles from './Breadcrumbs.module.scss';
import React from 'react';

interface BreadcrumbsProps {
  children: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ children, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className={clsx(styles.nav, className)}>
      <ol className={styles.list}>
        {children}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  href?: string;
  isCurrent?: boolean;
  children: React.ReactNode;
}

export function BreadcrumbItem({ href, isCurrent, children }: BreadcrumbItemProps) {
  if (isCurrent) {
    return (
      <li className={styles.li} aria-current="page">
        <span className={styles.currentPage}>{children}</span>
      </li>
    );
  }

  return (
    <li className={styles.li}>
      {href ? (
        <Link href={href} variant="default" style={{ fontSize: 'inherit' }}>
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
    </li>
  );
}
