"use client";

import { useEffect, useState } from "react";

type TypingMessageProps = {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
};

export function TypingMessage({ text, speed = 18, onComplete, className = "" }: TypingMessageProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-brand-green ml-0.5 animate-pulse align-middle" />}
    </span>
  );
}
