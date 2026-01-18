import clsx from "clsx";
import React from "react";

import { useSidebarContext } from "../../context";
import { SidebarItemProps } from "../../types";
import styles from "./Item.module.scss";

export function Item({
  children,
  href,
  onClick,
  icon,
  appendContent,
  className,
}: SidebarItemProps) {
  const { activeItem, onNavigate, itemToSection, onSectionChange } =
    useSidebarContext();
  const isActive = activeItem === href;

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => {
    if (href) {
      onNavigate(href, e);
      // Update active section when item is clicked
      const sectionId = itemToSection.get(href);
      if (sectionId) {
        onSectionChange(sectionId);
      }
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

Item.displayName = "Item";
