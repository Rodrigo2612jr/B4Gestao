"use client";

import { useMemo } from "react";
import {
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineLocationMarker,
  HiOutlineClipboardList,
} from "react-icons/hi";
import StatCard from "./StatCard";
import type { Submission } from "../_lib/types";
import { isToday, isWithinDays } from "../_lib/format";
import { mode } from "../_lib/filters";

export default function StatsGrid({ submissions }: { submissions: Submission[] }) {
  const stats = useMemo(() => {
    const total = submissions.length;
    const today = submissions.filter((s) => isToday(s.criadoEm)).length;
    const week = submissions.filter((s) => isWithinDays(s.criadoEm, 7)).length;
    const topRegiao = mode(submissions.map((s) => s.regiao)) ?? "—";
    const topNecessidade = mode(submissions.map((s) => s.necessidade)) ?? "—";
    return { total, today, week, topRegiao, topNecessidade };
  }, [submissions]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
      <StatCard
        icon={<HiOutlineUsers className="text-xl" />}
        label="Total de leads"
        value={stats.total}
        accent="primary"
      />
      <StatCard
        icon={<HiOutlineClock className="text-xl" />}
        label="Hoje"
        value={stats.today}
        accent="accent"
      />
      <StatCard
        icon={<HiOutlineTrendingUp className="text-xl" />}
        label="Últimos 7 dias"
        value={stats.week}
        accent="amber"
      />
      <StatCard
        icon={<HiOutlineLocationMarker className="text-xl" />}
        label="Top região"
        value={stats.topRegiao}
        accent="purple"
      />
      <StatCard
        icon={<HiOutlineClipboardList className="text-xl" />}
        label="Top necessidade"
        value={stats.topNecessidade}
        accent="primary"
      />
    </div>
  );
}
