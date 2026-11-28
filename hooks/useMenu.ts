"use client";
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

/** Menu behavior independent of its visual recipe. Pointer opens retain trigger focus. */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const menu = useRef<HTMLElement | null>(null);
  const entry = useRef<"first" | "last" | null>(null);
  const search = useRef({ text: "", time: 0 });
  const id = useId();
  const items = useCallback(
    () =>
      Array.from(
        menu.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])',
        ) ?? [],
      ).filter((item) => item.closest('[role="menu"]') === menu.current),
    [],
  );
  const restore = () => {
    const node = trigger.current;
    (node?.matches("button,a[href]")
      ? node
      : node?.querySelector<HTMLElement>("button,a[href]")
    )?.focus();
  };
  const close = (returnFocus = false) => {
    if (returnFocus) {
      restore();
    }
    setOpen(false);
  };
  const enter = useCallback(
    (edge: "first" | "last") => {
      const options = items();
      (edge === "last" ? options.at(-1) : options[0])?.focus();
    },
    [items],
  );
  useEffect(() => {
    if (!open) {
      search.current = { text: "", time: 0 };
      return;
    }
    if (entry.current) {
      enter(entry.current);
      entry.current = null;
    }
    const outside = (event: FocusEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("focusin", outside);
    return () => document.removeEventListener("focusin", outside);
  }, [open, enter]);
  return {
    open,
    setOpen,
    close,
    id,
    triggerRef: (node: HTMLElement | null) => {
      trigger.current = node;
    },
    menuRef: (node: HTMLElement | null) => {
      menu.current = node;
    },
    triggerProps: {
      "aria-haspopup": "menu" as const,
      "aria-expanded": open,
      "aria-controls": open ? id : undefined,
      onClick: (event: MouseEvent<HTMLElement>) => {
        // Safari does not focus buttons on pointer activation. Keep keyboard
        // dismissal and navigation anchored to the menu invoker in every engine.
        event.currentTarget.focus({ preventScroll: true });
        entry.current = event.detail === 0 ? "first" : null;
        setOpen((value) => !value);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          const edge = event.key === "ArrowUp" ? "last" : "first";
          if (open) {
            enter(edge);
          } else {
            entry.current = edge;
            setOpen(true);
          }
        } else if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      },
    },
    menuProps: {
      id,
      role: "menu" as const,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (
          event.target instanceof Element &&
          event.target.closest('[role="menu"]') !== menu.current
        ) {
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        } else if (event.key === "Tab") {
          close(true);
        } else {
          const options = items();
          if (!options.length) {
            return;
          }
          const index = options.indexOf(document.activeElement as HTMLElement);
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      options.length) %
                    options.length;
            options[next]?.focus();
          } else if (
            event.key.length === 1 &&
            event.key !== " " &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            const now = Date.now();
            search.current.text =
              (now - search.current.time > 700 ? "" : search.current.text) +
              event.key.toLowerCase();
            search.current.time = now;
            const ordered = [
              ...options.slice(index + 1),
              ...options.slice(0, index + 1),
            ];
            // Repeated characters cycle through same-initial items; a mixed
            // sequence remains a prefix search ("br" finds "Bravo").
            const query = [...search.current.text].every(
              (char) => char === search.current.text[0],
            )
              ? search.current.text[0]
              : search.current.text;
            const match = ordered.find((item) =>
              item.textContent?.trim().toLowerCase().startsWith(query),
            );
            if (match) {
              event.preventDefault();
              match.focus();
            }
          }
        }
      },
    },
  };
}
