export interface Palette {
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

const PALETTES: Record<string, Palette> = {
  primary: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
  },
  accent: {
    bg: "bg-green-50",
    text: "text-green-700",
    ring: "ring-green-200",
    dot: "bg-green-500",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
    dot: "bg-purple-500",
  },
  slate: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    ring: "ring-slate-200",
    dot: "bg-slate-500",
  },
};

const MAP: Record<string, keyof typeof PALETTES> = {
  "PGR / PCMSO": "primary",
  "Riscos Psicossociais (NR-01)": "purple",
  "Saúde Mental Corporativa": "accent",
  "Gestão de Afastados": "amber",
  "eSocial SST": "slate",
  "Consultoria Completa": "primary",
  "Outros": "slate",
};

export function getPalette(necessidade: string): Palette {
  const key = MAP[necessidade] ?? "slate";
  return PALETTES[key];
}
