import { getPalette } from "../_lib/necessidadePalette";

export default function NecessidadeBadge({
  necessidade,
  size = "sm",
}: {
  necessidade: string;
  size?: "sm" | "md";
}) {
  const p = getPalette(necessidade);
  const base =
    size === "md"
      ? "px-3 py-1.5 text-sm"
      : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${p.bg} ${p.text} ${p.ring} ${base}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} aria-hidden="true" />
      {necessidade}
    </span>
  );
}
