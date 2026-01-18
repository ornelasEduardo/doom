import clsx from "clsx";
import React from "react";

import { useSidebarContext } from "../context";
import styles from "../Sidebar.module.scss";
import { SidebarItemProps } from "../types";

export function Item({
  children,
  href,
  onClick,
  icon,
  appendContent,
  className,
}: SidebarItemProps) {
  const { activeItem, onNavigate } = useSidebarContext();
  const isActive = activeItem === href;

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => {
    if (href) {
      onNavigate(href, e);
    }
    onClick?.(e);
  };

  const content = (
    <>
      {icon && <span className={styles.itemIcon}>{icon}</span>}
      <span className={styles.itemLabel}>{children}</span>
      {appendContent && (
        <span className={styles.itemAppend}>{appendContent}</span>
      )}
    </>
  );

  const sharedProps = {
    className: clsx(styles.item, isActive && styles.active, className),
    "aria-current": isActive ? ("page" as const) : undefined,
  };

  if (href) {
    return (
      <a href={href} {...sharedProps} onClick={handleClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" {...sharedProps} onClick={handleClick}>
      {content}
    </button>
  );
}
