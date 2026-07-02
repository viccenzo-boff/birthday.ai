"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "warning";

export interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onClose: () => void;
}

const TOAST_DURATION_MS = 5000;

export function Toast({ message, variant, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const progressTimer = window.setTimeout(() => setProgress(0), 50);
    const dismissTimer = window.setTimeout(onClose, TOAST_DURATION_MS + 50);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onClose]);

  const isWarning = variant === "warning";
  const styles = isWarning
    ? {
        border: "border-amber-200",
        iconBg: "bg-amber-100",
        iconText: "text-amber-700",
        text: "text-amber-900",
        hover: "hover:bg-amber-50",
        track: "bg-amber-50",
        bar: "bg-amber-500",
        icon: "!",
      }
    : {
        border: "border-emerald-200",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-700",
        text: "text-emerald-800",
        hover: "hover:bg-emerald-50",
        track: "bg-emerald-50",
        bar: "bg-emerald-500",
        icon: "✓",
      };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-40px))] overflow-hidden rounded-lg border bg-white shadow-lg ${styles.border}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.iconBg} ${styles.iconText}`}
        >
          {styles.icon}
        </div>
        <p className={`min-w-0 flex-1 text-sm font-semibold leading-6 ${styles.text}`}>
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-lg leading-none transition ${styles.iconText} ${styles.hover}`}
        >
          ×
        </button>
      </div>
      <div className={`h-1 ${styles.track}`}>
        <div
          className={`h-full transition-[width] duration-[5000ms] ease-linear ${styles.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
