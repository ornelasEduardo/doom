import clsx from "clsx";
import React from "react";

import styles from "../Sidebar.module.scss";
import { SidebarFooterProps } from "../types";

export function Footer({ children, className }: SidebarFooterProps) {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}
