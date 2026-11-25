import clsx from "clsx";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { SidebarFooterProps } from "../../types";
import styles from "./Footer.module.scss";

export function Footer({
  classNames,
  children,
  className,
}: SidebarFooterProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

  return (
    <div {...doomPart("footer", { className: clsx(styles.footer, className) })}>
      {children}
    </div>
  );
}
