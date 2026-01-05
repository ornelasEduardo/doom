"use client";

import clsx from "clsx";
import React, { forwardRef } from "react";

import styles from "./Card.module.scss";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  disabled?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, as: Component = "div", ...props },
  ref,
) {
  return (
    <Component ref={ref} className={clsx(styles.card, className)} {...props}>
      {children}
    </Component>
  );
});
