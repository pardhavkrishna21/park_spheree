export const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const toRange = (date, startTime, hours) => {
  const start = new Date(`${date}T${startTime}`).getTime();
  return [start, start + hours * 3600000];
};

export const rangesOverlap = ([s1, e1], [s2, e2]) => s1 < e2 && s2 < e1;

export const fmtTime = (ms) =>
  new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

export const fmtSlot = (date, startTime, hours) => {
  const [s, e] = toRange(date, startTime, hours);
  const day = new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${day}, ${fmtTime(s)} - ${fmtTime(e)} (${hours} Hours)`;
};

// Returns the first active booking that overlaps the range, ignoring `ignoreId`.
export const findConflict = (bookings, date, startTime, hours, ignoreId) => {
  const range = toRange(date, startTime, hours);
  return bookings.find(
    (b) => ['Confirmed', 'Parked'].includes(b.status) && b.id !== ignoreId && b.date && rangesOverlap(range, toRange(b.date, b.startTime, b.hours))
  );
};

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  return `${h}:${i % 2 ? '30' : '00'}`;
});
