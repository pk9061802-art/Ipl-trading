'use client';

import React from 'react';
import { useToast } from '../hooks/useToast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const typeStyles = {
    success: 'from-emerald-900/40 to-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'from-red-900/40 to-red-500/10 border-red-500/20 text-red-400',
    info: 'from-blue-900/40 to-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'from-amber-900/40 to-amber-500/10 border-amber-500/20 text-amber-400',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`glass p-4 rounded-xl border bg-gradient-to-r shadow-2xl cursor-pointer animate-in slide-in-from-right-10 fade-in duration-300 ${typeStyles[toast.type]}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">{icons[toast.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm tracking-tight">{toast.title}</div>
              <div className="text-xs opacity-80 mt-1 line-clamp-2 leading-relaxed">{toast.message}</div>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors text-lg leading-none">
              &times;
            </button>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full overflow-hidden rounded-b-xl">
             <div className="h-full bg-current/40 animate-out fade-out fill-mode-forwards duration-[5000ms] ease-linear origin-left scale-x-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
