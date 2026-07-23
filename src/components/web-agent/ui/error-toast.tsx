"use client";

import { useEffect } from "react";

type ErrorToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export function ErrorToast({ message, onDismiss, duration = 4500 }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] wa-animate-slide-up">
      <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-red-200 bg-white px-5 py-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <span className="text-sm font-bold text-red-600">!</span>
        </div>
        <p className="m-0 text-sm font-medium text-defaulttextcolor">{message}</p>
      </div>
    </div>
  );
}
