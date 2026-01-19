import clsx from "clsx";
import React from "react";

import { SidebarFooterProps } from "../../types";
import styles from "./Footer.module.scss";

export function Footer({ children, className }: SidebarFooterProps) {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}
