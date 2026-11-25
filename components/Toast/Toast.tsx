"use client";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useThemeParts } from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { ThemedPortal } from "../../styles/theming/ThemedPortal";
import styles from "./Toast.module.scss";

// Types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isExiting?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
  toastWarning: (message: string) => void;
  toastInfo: (message: string) => void;
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

function useAnnouncement() {
  const [message, setMessage] = useState("");
  const pending = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(() => {
    if (timer.current !== null || pending.current.length === 0) {
      return;
    }

    // A fixed insertion window makes repeated text a new change without delaying bursts.
    timer.current = setTimeout(() => {
      setMessage(pending.current.join("\n"));
      pending.current = [];
      timer.current = null;
    }, 100);
  }, []);

  useEffect(() => {
    // Effect replay cancels timers but must resume a guarded child's pending mount message.
    schedule();
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      timer.current = null;
    };
  }, [schedule]);

  const announce = useCallback(
    (nextMessage: string) => {
      pending.current.push(nextMessage);
      setMessage("");
      schedule();
    },
    [schedule],
  );

  return [message, announce] as const;
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const doomPart = useThemeParts("Toast", undefined, {});

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [politeMessage, announcePolite] = useAnnouncement();
  const [assertiveMessage, announceAssertive] = useAnnouncement();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300); // Match animation duration
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      if (type === "error") {
        announceAssertive(message);
      } else {
        announcePolite(message);
      }

      // Auto remove after 5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [announceAssertive, announcePolite, removeToast],
  );

  const toast = useCallback(
    (message: string, type: ToastType = "info") => addToast(message, type),
    [addToast],
  );
  const toastSuccess = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast],
  );
  const toastError = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast],
  );
  const toastWarning = useCallback(
    (message: string) => addToast(message, "warning"),
    [addToast],
  );
  const toastInfo = useCallback(
    (message: string) => addToast(message, "info"),
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{ toast, toastSuccess, toastError, toastWarning, toastInfo }}
    >
      {children}
      {isMounted && (
        <ThemedPortal>
          {
            <>
              <div
                aria-atomic="true"
                {...doomPart("announcer", { className: styles.announcer })}
                role="status"
              >
                {politeMessage}
              </div>
              <div
                aria-atomic="true"
                {...doomPart("announcer", { className: styles.announcer })}
                role="alert"
              >
                {assertiveMessage}
              </div>
              <div {...doomPart("root", { className: styles.container })}>
                {toasts.map((t) => (
                  <div
                    key={t.id}
                    aria-label={t.message}
                    {...doomPart("toast", {
                      className: clsx(
                        styles.toast,
                        styles[t.type],
                        t.isExiting && styles.exiting,
                      ),
                    })}
                    role="group"
                  >
                    {t.type === "success" && (
                      <ThemedIcon
                        color="var(--success)"
                        icon={CheckCircle2}
                        iconName="checkCircle2"
                        size={20}
                        strokeWidth={2.5}
                      />
                    )}
                    {t.type === "error" && (
                      <ThemedIcon
                        color="var(--error)"
                        icon={XCircle}
                        iconName="xCircle"
                        size={20}
                        strokeWidth={2.5}
                      />
                    )}
                    {t.type === "warning" && (
                      <ThemedIcon
                        color="var(--warning)"
                        icon={AlertTriangle}
                        iconName="alertTriangle"
                        size={20}
                        strokeWidth={2.5}
                      />
                    )}
                    {t.type === "info" && (
                      <ThemedIcon
                        color="var(--primary)"
                        icon={Info}
                        iconName="info"
                        size={20}
                        strokeWidth={2.5}
                      />
                    )}
                    <span className="font-semibold">{t.message}</span>
                    <button
                      aria-label="Close notification"
                      {...doomPart("closeButton", {
                        className: styles.closeButton,
                      })}
                      onClick={() => removeToast(t.id)}
                    >
                      <ThemedIcon
                        icon={X}
                        iconName="close"
                        size={16}
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          }
        </ThemedPortal>
      )}
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
