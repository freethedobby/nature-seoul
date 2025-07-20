"use client";

import { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export default function AnimatedText({
  text,
  className = "",
  delay = 0,
  speed = 100,
}: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed]);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setDisplayedText("");
      setCurrentIndex(0);
    }, delay);

    return () => clearTimeout(initialTimer);
  }, [delay]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
