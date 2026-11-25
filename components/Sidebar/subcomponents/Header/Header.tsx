import clsx from "clsx";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { SidebarHeaderProps } from "../../types";
import styles from "./Header.module.scss";

export function Header({
  classNames,
  children,
  className,
}: SidebarHeaderProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

  return (
    <div {...doomPart("header", { className: clsx(styles.header, className) })}>
      {children}
    </div>
  );
}
