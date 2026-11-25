import clsx from "clsx";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { useSidebarContext } from "../../context";
import { SidebarItemProps } from "../../types";
import styles from "./Item.module.scss";

export function Item({
  classNames,
  children,
  href,
  onClick,
  icon,
  appendContent,
  className,
}: SidebarItemProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

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

  const selected = { "data-selected": isActive || undefined };
  const content = (
    <>
      {icon && (
        <span
          {...doomPart("itemIcon", { ...selected, className: styles.itemIcon })}
        >
          {icon}
        </span>
      )}
      <span
        {...doomPart("itemLabel", { ...selected, className: styles.itemLabel })}
      >
        {children}
      </span>
      {appendContent && (
        <span
          {...doomPart("itemAppend", {
            ...selected,
            className: styles.itemAppend,
          })}
        >
          {appendContent}
        </span>
      )}
    </>
  );

  const sharedProps = doomPart("item", {
    ...selected,
    className: clsx(styles.item, isActive && styles.active, className),
    "aria-current": isActive ? ("page" as const) : undefined,
  });

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
