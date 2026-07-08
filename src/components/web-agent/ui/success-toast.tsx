"use client";

import { useEffect } from "react";
import { CheckCircleIcon } from "@/components/icons";

type SuccessToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export function SuccessToast({ message, onDismiss, duration = 3500 }: SuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] wa-animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-brand-green/20 bg-white px-5 py-4 shadow-lg">
        <div className="wa-animate-success flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10">
          <CheckCircleIcon className="h-5 w-5 text-brand-green" />
        </div>
        <p className="m-0 text-sm font-medium text-defaulttextcolor">{message}</p>
      </div>
    </div>
  );
}
