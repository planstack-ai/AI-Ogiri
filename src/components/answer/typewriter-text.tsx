"use client";

import { useState, useEffect, useRef } from "react";

const PAUSE_CHARS = new Set(["、", ","]);
const LONG_PAUSE_CHARS = new Set(["。", "！", "？", "…", ".", "!", "?", "\n"]);

interface TypewriterTextProps {
  text: string;
  onComplete?: () => void;
}

export function TypewriterText({ text, onComplete }: TypewriterTextProps) {
  const [charIndex, setCharIndex] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (charIndex >= text.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    const currentChar = text[charIndex];
    let delay = 30;

    if (LONG_PAUSE_CHARS.has(currentChar)) {
      delay = 300;
    } else if (PAUSE_CHARS.has(currentChar)) {
      delay = 120;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [charIndex, text]);

  return (
    <span>
      {text.slice(0, charIndex)}
      {charIndex < text.length && (
        <span className="ml-px inline-block h-[1.1em] w-0.5 animate-pulse bg-slate-400 align-text-bottom" />
      )}
    </span>
  );
}
