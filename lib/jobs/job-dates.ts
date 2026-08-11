const FIJI_TIME_ZONE = "Pacific/Fiji";

export function deadlineAtEndOfFijiDay(date: string) {
  return new Date(`${date}T23:59:59.999+12:00`);
}

export function startOfFijiDay(date: string) {
  return new Date(`${date}T00:00:00.000+12:00`);
}

export function toFijiDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FIJI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInFiji() {
  return toFijiDate(new Date());
}

export const JOB_DATE_TIME_ZONE = FIJI_TIME_ZONE;
