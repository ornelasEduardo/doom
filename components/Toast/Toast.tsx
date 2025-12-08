'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

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

// Styled Components
const ToastContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: var(--z-tooltip);
  pointer-events: none; /* Allow clicking through the container area */
`;

const ToastItem = styled.div<{ type: ToastType; isExiting?: boolean }>`
  min-width: 300px;
  background: var(--card-bg);
  border: var(--border-width) solid var(--card-border);
  color: var(--foreground);
  box-shadow: var(--shadow-hard);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: ${props => props.isExiting ? 'slideOut 0.3s ease-in forwards' : 'slideIn 0.3s ease-out forwards'};
  position: relative;
  overflow: hidden;
  pointer-events: auto; /* Re-enable pointer events for the toast itself */
  border-radius: var(--radius);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    background-color: ${props => {
      switch (props.type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--error)';
        case 'warning': return 'var(--warning)';
        default: return 'var(--primary)';
      }
    }};
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  margin-left: auto;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--foreground);
  opacity: 0.5;
  transition: opacity 0.2s;
  &:hover { opacity: 1; }
`;

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
        <ToastContainer>
          {toasts.map(t => (
            <ToastItem key={t.id} type={t.type} isExiting={t.isExiting}>
              {t.type === 'success' && <CheckCircle2 size={20} strokeWidth={2.5} color="var(--success)" />}
              {t.type === 'error' && <XCircle size={20} strokeWidth={2.5} color="var(--error)" />}
              {t.type === 'warning' && <AlertTriangle size={20} strokeWidth={2.5} color="var(--warning)" />}
              {t.type === 'info' && <Info size={20} strokeWidth={2.5} color="var(--primary)" />}
              <span className="font-semibold">{t.message}</span>
              <CloseButton onClick={() => removeToast(t.id)}>
                <X size={16} strokeWidth={2.5} />
              </CloseButton>
            </ToastItem>
          ))}
        </ToastContainer>,
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
