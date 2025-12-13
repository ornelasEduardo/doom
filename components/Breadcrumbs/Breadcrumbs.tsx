'use client';

import React from 'react';
import styled from '@emotion/styled';
import { ChevronRight } from 'lucide-react';
import { Link } from '../Link';

const BreadcrumbNav = styled.nav`
  display: flex;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--muted-foreground);
`;

const BreadcrumbList = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
  gap: 0.5rem;
`;

const BreadcrumbLi = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:not(:last-child)::after {
    /* Separator */
    content: '/';
    margin-left: 0.25rem;
    color: var(--muted-foreground);
    opacity: 0.5;
    font-weight: 700;
  }
`;

const CurrentPage = styled.span`
  font-weight: 700;
  color: var(--foreground);
`;

interface BreadcrumbsProps {
  children: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ children, className }: BreadcrumbsProps) {
  return (
    <BreadcrumbNav aria-label="breadcrumb" className={className}>
      <BreadcrumbList>
        {children}
      </BreadcrumbList>
    </BreadcrumbNav>
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
      <BreadcrumbLi aria-current="page">
        <CurrentPage>{children}</CurrentPage>
      </BreadcrumbLi>
    );
  }

  return (
    <BreadcrumbLi>
      {href ? (
        <Link href={href} variant="default" style={{ fontSize: 'inherit' }}>
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
    </BreadcrumbLi>
  );
}
