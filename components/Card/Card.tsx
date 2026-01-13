"use client";

import clsx from "clsx";
import React, { forwardRef } from "react";

import styles from "./Card.module.scss";

interface CardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
}

const CardRoot = forwardRef<HTMLDivElement, CardRootProps>(function CardRoot(
  { children, className, as: Component = "div", ...props },
  ref,
) {
  return (
    <Component ref={ref} className={clsx(styles.root, className)} {...props}>
      {children}
    </Component>
  );
});

interface CardSubComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardSubComponentProps>(
  function CardHeader({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={clsx(styles.header, className)} {...props}>
        {children}
      </div>
    );
  },
);

const CardBody = forwardRef<HTMLDivElement, CardSubComponentProps>(
  function CardBody({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={clsx(styles.body, className)} {...props}>
        {children}
      </div>
    );
  },
);

const CardFooter = forwardRef<HTMLDivElement, CardSubComponentProps>(
  function CardFooter({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={clsx(styles.footer, className)} {...props}>
        {children}
      </div>
    );
  },
);

interface CardProps extends CardRootProps {
  disabled?: boolean;
}

const CardInternal = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, ...props },
  ref,
) {
  return (
    <CardRoot ref={ref} className={clsx(styles.padded, className)} {...props}>
      {children}
    </CardRoot>
  );
});

export const Card = Object.assign(CardInternal, {
  Root: CardRoot,
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
}) as typeof CardInternal & {
  Root: typeof CardRoot;
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};
