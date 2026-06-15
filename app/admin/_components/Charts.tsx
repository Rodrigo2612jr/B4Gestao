"use client";

import { useEffect, useRef, useState } from "react";

/** Gráficos SVG leves e ANIMADOS (sem dependência) · estilo profissional B4. */

function useMounted(delay = 60) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}

// ============================================================
// CountUp · número que sobe de 0 até o valor
// ============================================================
export function CountUp({ value, duration = 700, className }: { value: number; duration?: number; className?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const from = ref.current;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else ref.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{n}</span>;
}

// ============================================================
// Reveal · entrada fade-up com atraso (stagger)
// ============================================================
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={className} style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards", animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ============================================================
// Sparkline (barrinhas que crescem)
// ============================================================
export function Sparkline({ data, color = "#0e427b", height = 40 }: { data: number[]; color?: string; height?: number }) {
  const on = useMounted();
  const max = Math.max(1, ...data);
  const n = data.length || 1;
  const gap = 4;
  const bw = (120 - gap * (n - 1)) / n;
  return (
    <svg viewBox={`0 0 120 ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (height - 2));
        const x = i * (bw + gap);
        const last = i === data.length - 1;
        return (
          <rect key={i} x={x} y={height - (on ? h : 2)} width={bw} height={on ? h : 2} rx={2} fill={color} opacity={last ? 1 : 0.4}
            style={{ transition: `height 0.5s cubic-bezier(.22,1,.36,1) ${i * 40}ms, y 0.5s cubic-bezier(.22,1,.36,1) ${i * 40}ms` }} />
        );
      })}
    </svg>
  );
}

// ============================================================
// Gauge (semicírculo que varre)
// ============================================================
export function Gauge({ value, color = "#0e427b", label }: { value: number; color?: string; label?: string }) {
  const on = useMounted(120);
  const v = Math.max(0, Math.min(100, value));
  const off = on ? 100 - v : 100;
  return (
    <svg viewBox="0 0 120 78" width="100%" height="92" aria-hidden="true">
      <path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#e8eaed" strokeWidth="12" strokeLinecap="round" pathLength={100} />
      <path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        pathLength={100} strokeDasharray="100" strokeDashoffset={off}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.22,1,.36,1)" }} />
      <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="700" fill="#021a52">{Math.round(v)}%</text>
      {label && <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#6b7280">{label}</text>}
    </svg>
  );
}

// ============================================================
// Donut (segmentos que desenham)
// ============================================================
export interface DonutSeg { label: string; value: number; color: string }

export function Donut({ segments, size = 120, thickness = 18, centerTop, centerBottom }: {
  segments: DonutSeg[]; size?: number; thickness?: number; centerTop?: string; centerBottom?: string;
}) {
  const on = useMounted(120);
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef0f2" strokeWidth={thickness} />
      {total > 0 && segments.map((s, i) => {
        const pct = (s.value / total) * 100;
        const startDeg = (acc / 100) * 360 - 90;
        acc += pct;
        return (
          <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            pathLength={100} strokeDasharray={`${on ? pct : 0} 100`}
            transform={`rotate(${startDeg} ${cx} ${cx})`}
            style={{ transition: `stroke-dasharray 0.7s cubic-bezier(.22,1,.36,1) ${i * 80}ms` }} />
        );
      })}
      {(centerTop || centerBottom) && (
        <>
          <text x={cx} y={cx - 2} textAnchor="middle" fontSize="22" fontWeight="700" fill="#021a52">{centerTop}</text>
          {centerBottom && <text x={cx} y={cx + 14} textAnchor="middle" fontSize="10" fill="#6b7280">{centerBottom}</text>}
        </>
      )}
    </svg>
  );
}

// ============================================================
// Radial (anel que preenche)
// ============================================================
export function Radial({ value, color = "#0e427b", label, size = 96 }: { value: number; color?: string; label?: string; size?: number }) {
  const on = useMounted(120);
  const v = Math.max(0, Math.min(100, value));
  const thickness = 11;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const off = on ? 100 - v : 100;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e8eaed" strokeWidth={thickness} pathLength={100} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
          pathLength={100} strokeDasharray="100" strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.22,1,.36,1)" }} />
      </g>
      <text x={cx} y={cx + 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="#021a52">{Math.round(v)}%</text>
      {label && <text x={cx} y={cx + 18} textAnchor="middle" fontSize="9" fill="#6b7280">{label}</text>}
    </svg>
  );
}

// ============================================================
// Barras horizontais que crescem (ex: leads por região)
// ============================================================
export function HBars({ data, color = "#0e427b" }: { data: Array<{ label: string; n: number }>; color?: string }) {
  const on = useMounted();
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">{d.label}</span>
            <span className="font-semibold tabular-nums text-gray-500">{d.n}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full" style={{
              width: on ? `${(d.n / max) * 100}%` : "0%",
              backgroundColor: color,
              transition: `width 0.6s cubic-bezier(.22,1,.36,1) ${i * 60}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
