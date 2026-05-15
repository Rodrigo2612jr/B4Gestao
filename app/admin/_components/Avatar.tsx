"use client";

interface Props {
  name: string;
  size?: "sm" | "md" | "lg";
}

// Cor determinística baseada no hash do nome (sempre a mesma pra mesma pessoa)
function colorFromName(name: string): string {
  const palette = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export default function Avatar({ name, size = "md" }: Props) {
  return (
    <div
      className={`${SIZES[size]} ${colorFromName(name)} flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white shadow-sm`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
