const SESSION_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

/** Parse a booking's wall-clock date and time as Asia/Kolkata time. */
export function parseSessionStart(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const start = new Date(`${date}T${time}:00${IST_OFFSET}`);
  if (Number.isNaN(start.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SESSION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(start);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  if (
    values.year !== date.slice(0, 4) ||
    values.month !== date.slice(5, 7) ||
    values.day !== date.slice(8, 10) ||
    values.hour !== time.slice(0, 2) ||
    values.minute !== time.slice(3, 5)
  ) {
    return null;
  }

  return start;
}
