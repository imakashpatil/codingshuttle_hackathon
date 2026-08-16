import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2, AlertCircle } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
//  TOAST SYSTEM
// ══════════════════════════════════════════════════════════════

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const TOAST_VARIANTS = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    bar: 'bg-emerald-500',
    iconClass: 'text-emerald-500',
    border: 'border-emerald-500/30',
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    bar: 'bg-red-500',
    iconClass: 'text-red-500',
    border: 'border-red-500/30',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bar: 'bg-amber-400',
    iconClass: 'text-amber-400',
    border: 'border-amber-400/30',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    bar: 'bg-primary',
    iconClass: 'text-primary',
    border: 'border-primary/30',
  },
};

const TOAST_DURATION = 4500;

const ToastItem = ({ toast, onDismiss }) => {
  const { id, type = 'info', title, message } = toast;
  const v = TOAST_VARIANTS[type] || TOAST_VARIANTS.info;
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef(null);
  const startRef = useRef(Date.now());

  const dismiss = useCallback(() => {
    clearInterval(intervalRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) dismiss();
    }, 30);
    return () => clearInterval(intervalRef.current);
  }, [dismiss]);

  return (
    <div
      className={`
        relative flex gap-3 items-start w-[360px] max-w-[90vw] p-4 rounded-xl border bg-card shadow-2xl overflow-hidden
        ${v.border}
        transition-all duration-300 ease-out
        ${visible && !exiting
          ? 'opacity-100 translate-x-0 translate-y-0 scale-100'
          : 'opacity-0 translate-x-6 translate-y-2 scale-95'}
      `}
    >
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/20 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${v.bar} rounded-b-xl`}
          style={{ width: `${progress}%`, transition: 'width 30ms linear' }}
        />
      </div>
      <span className={`shrink-0 mt-0.5 ${v.iconClass}`}>{v.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-foreground leading-snug">{title}</p>}
        {message && (
          <p className={`text-xs leading-relaxed ${title ? 'text-muted-foreground mt-0.5' : 'text-sm font-semibold text-foreground'}`}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, dismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  CONFIRM DIALOG SYSTEM
// ══════════════════════════════════════════════════════════════

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ToastProvider>');
  return ctx;
};

const CONFIRM_VARIANTS = {
  danger: {
    icon: <Trash2 className="h-5 w-5 text-red-500" />,
    iconBg: 'bg-red-500/10',
    confirmClass: 'bg-red-500 hover:bg-red-600 text-white',
    confirmLabel: 'Delete',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    iconBg: 'bg-amber-400/10',
    confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    confirmLabel: 'Confirm',
  },
  info: {
    icon: <AlertCircle className="h-5 w-5 text-primary" />,
    iconBg: 'bg-primary/10',
    confirmClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    confirmLabel: 'Confirm',
  },
};

const ConfirmDialog = ({ dialog, onResolve }) => {
  const { title, message, variant = 'danger', confirmText, cancelText } = dialog;
  const v = CONFIRM_VARIANTS[variant] || CONFIRM_VARIANTS.danger;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleResolve = (result) => {
    setVisible(false);
    setTimeout(() => onResolve(result), 200);
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) handleResolve(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleResolve(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[99998] flex items-center justify-center p-4 transition-all duration-200 ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={handleBackdrop}
    >
      <div
        className={`
          w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-200 ease-out
          ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`shrink-0 p-2.5 rounded-xl ${v.iconBg}`}>
            {v.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground leading-snug">{title}</h3>
            {message && (
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{message}</p>
            )}
          </div>
          <button
            onClick={() => handleResolve(false)}
            className="shrink-0 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/60 mx-6" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 px-6">
          <button
            onClick={() => handleResolve(false)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            onClick={() => handleResolve(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm ${v.confirmClass}`}
          >
            {confirmText || v.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  COMBINED PROVIDER
// ══════════════════════════════════════════════════════════════

export const ToastProvider = ({ children }) => {
  // ── Toast state ───────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', title, message }) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
  }, []);

  const toastSuccess = useCallback((title, message) => toast({ type: 'success', title, message }), [toast]);
  const toastError   = useCallback((title, message) => toast({ type: 'error',   title, message }), [toast]);
  const toastWarning = useCallback((title, message) => toast({ type: 'warning', title, message }), [toast]);
  const toastInfo    = useCallback((title, message) => toast({ type: 'info',    title, message }), [toast]);

  // ── Confirm state ─────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState(null);
  const resolverRef = useRef(null);

  /**
   * confirm({ title, message, variant?, confirmText?, cancelText? })
   * variant: 'danger' | 'warning' | 'info'
   * Returns Promise<boolean>
   */
  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmDialog(opts);
    });
  }, []);

  const handleConfirmResolve = useCallback((result) => {
    setConfirmDialog(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastError, toastWarning, toastInfo }}>
      <ConfirmContext.Provider value={{ confirm }}>
        {children}
        <ToastContainer toasts={toasts} dismiss={dismissToast} />
        {confirmDialog && (
          <ConfirmDialog dialog={confirmDialog} onResolve={handleConfirmResolve} />
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
};
