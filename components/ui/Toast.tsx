"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  return ctx;
}

const AUTO_HIDE_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    timeoutRef.current = setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, AUTO_HIDE_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl shadow-lg animate-in duration-300"
          role="alert"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}
