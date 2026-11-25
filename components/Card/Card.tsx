"use client";
import clsx from "clsx";
import React, { forwardRef } from "react";

import {
  type ThemeClassNames,
  ThemePartsBoundary,
  useOwnedThemeParts,
  useThemeParts,
} from "../../styles/theming/parts";
import styles from "./Card.module.scss";

interface CardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: ThemeClassNames<"Card">;
  children: React.ReactNode;
  as?: React.ElementType;
}

const CardRoot = forwardRef<HTMLDivElement, CardRootProps>(function CardRoot(
  { classNames, children, className, as: Component = "div", ...props },
  ref,
) {
  const doomPart = useOwnedThemeParts("Card", classNames, {});

  return (
    <ThemePartsBoundary classNames={classNames} component="Card" visual={{}}>
      {
        <Component
          ref={ref}
          {...doomPart("root", { className: clsx(styles.root, className) })}
          {...props}
        >
          {children}
        </Component>
      }
    </ThemePartsBoundary>
  );
});

interface CardSubComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: ThemeClassNames<"Card">;
  children: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardSubComponentProps>(
  function CardHeader({ classNames, children, className, ...props }, ref) {
    const doomPart = useThemeParts("Card", classNames, {});

    return (
      <div
        ref={ref}
        {...doomPart("header", { className: clsx(styles.header, className) })}
        {...props}
      >
        {children}
      </div>
    );
  },
);

const CardBody = forwardRef<HTMLDivElement, CardSubComponentProps>(
  function CardBody({ classNames, children, className, ...props }, ref) {
    const doomPart = useThemeParts("Card", classNames, {});

    return (
      <div
        ref={ref}
        {...doomPart("body", { className: clsx(styles.body, className) })}
        {...props}
      >
        {children}
      </div>
    );
  },
);

const CardFooter = forwardRef<HTMLDivElement, CardSubComponentProps>(
  function CardFooter({ classNames, children, className, ...props }, ref) {
    const doomPart = useThemeParts("Card", classNames, {});

    return (
      <div
        ref={ref}
        {...doomPart("footer", { className: clsx(styles.footer, className) })}
        {...props}
      >
        {children}
      </div>
    );
  },
);

interface CardProps extends CardRootProps {
  classNames?: ThemeClassNames<"Card">;
  disabled?: boolean;
}

const CardInternal = forwardRef<HTMLDivElement, CardProps>(function Card(
  { classNames, children, className, ...props },
  ref,
) {
  const doomPart = useOwnedThemeParts("Card", classNames, {});

  return (
    <CardRoot
      ref={ref}
      classNames={classNames}
      {...doomPart("padded", { className: clsx(styles.padded, className) })}
      {...props}
    >
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
