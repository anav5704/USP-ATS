const FIJI_TIME_ZONE = "Pacific/Fiji";

const FIJI_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: FIJI_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function deadlineAtEndOfFijiDay(date: string) {
  return new Date(`${date}T23:59:59.999+12:00`);
}

export function startOfFijiDay(date: string) {
  return new Date(`${date}T00:00:00.000+12:00`);
}

export function toFijiDate(date: Date) {
  const parts = FIJI_DATE_FORMATTER.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInFiji() {
  return toFijiDate(new Date());
}

export const JOB_DATE_TIME_ZONE = FIJI_TIME_ZONE;

export function daysUntilFijiDate(date: Date) {
  const dayMs = 86_400_000;
  const deadlineDay = Date.parse(toFijiDate(date));
  const today = Date.parse(todayInFiji());
  return Math.round((deadlineDay - today) / dayMs);
}

export function deadlineRemainingLabel(date: Date): {
  expired: boolean;
  label: string;
} {
  const days = daysUntilFijiDate(date);
  if (days < 0) return { expired: true, label: "Deadline passed" };
  if (days === 0) return { expired: false, label: "Closes today" };
  if (days === 1) return { expired: false, label: "Closes in 1 day" };
  return { expired: false, label: `Closes in ${days} days` };
}
