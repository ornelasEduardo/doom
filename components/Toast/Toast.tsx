'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.scss';

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

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

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // Match animation duration
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const toast = useCallback((message: string, type: ToastType = 'info') => addToast(message, type), [addToast]);
  const toastSuccess = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const toastError = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const toastWarning = useCallback((message: string) => addToast(message, 'warning'), [addToast]);
  const toastInfo = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastError, toastWarning, toastInfo }}>
      {children}
      {isMounted && createPortal(
        <div className={styles.container}>
          {toasts.map(t => (
            <div 
              key={t.id} 
              className={clsx(styles.toast, styles[t.type], t.isExiting && styles.exiting)}
            >
              {t.type === 'success' && <CheckCircle2 size={20} strokeWidth={2.5} color="var(--success)" />}
              {t.type === 'error' && <XCircle size={20} strokeWidth={2.5} color="var(--error)" />}
              {t.type === 'warning' && <AlertTriangle size={20} strokeWidth={2.5} color="var(--warning)" />}
              {t.type === 'info' && <Info size={20} strokeWidth={2.5} color="var(--primary)" />}
              <span className="font-semibold">{t.message}</span>
              <button className={styles.closeButton} onClick={() => removeToast(t.id)}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
