/**
 * "há 3 horas", "há 2 dias", etc.
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "agora há pouco";
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `há ${day} dia${day !== 1 ? "s" : ""}`;
  const week = Math.floor(day / 7);
  if (week < 5) return `há ${week} sem`;
  const month = Math.floor(day / 30);
  if (month < 12) return `há ${month} mês${month !== 1 ? "es" : ""}`;
  const year = Math.floor(day / 365);
  return `há ${year} ano${year !== 1 ? "s" : ""}`;
}
