"use client";

import { useEffect, useState, useRef } from "react";
import { NR01 } from "@/lib/constants";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(): TimeLeft {
  const diff = NR01.deadline.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const displayValue = String(value).padStart(2, "0");
  const prevValue = useRef(displayValue);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prevValue.current !== displayValue) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setFlipping(false);
        prevValue.current = displayValue;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [displayValue]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 sm:h-20 sm:w-20">
        {/* Horizontal divider line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 z-10" />

        {/* Current value */}
        <span
          className={`text-2xl font-bold tabular-nums text-white sm:text-3xl transition-transform duration-300 ${
            flipping ? "countdown-flip" : ""
          }`}
        >
          {displayValue}
        </span>

        {/* Shine effect on top half */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-xl pointer-events-none" />
      </div>
      <span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-white/80 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function Countdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(calcTimeLeft());
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    return (
      <div className="flex justify-center gap-3 sm:gap-4">
        {["Dias", "Horas", "Min", "Seg"].map((label) => (
          <FlipDigit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      <FlipDigit value={time.days} label="Dias" />
      <FlipDigit value={time.hours} label="Horas" />
      <FlipDigit value={time.minutes} label="Min" />
      <FlipDigit value={time.seconds} label="Seg" />
    </div>
  );
}
