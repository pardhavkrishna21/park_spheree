import { toRange } from './bookingTime';

export const MAX_VIOLATIONS = 3;
const HOLD_MONTHS = 3;

const addMonths = (ms, months) => {
  const d = new Date(ms);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};

// A violation is a booked slot that was missed without parking; three of them put the account on hold.
export const getViolationStatus = (bookings, now = Date.now()) => {
  const times = bookings.filter((b) => b.violation).map((b) => b.violationAt || toRange(b.date, b.startTime, b.hours)[1]).sort((a, b) => a - b);
  let count = 0;
  let cycleStart = 0;
  for (const t of times) {
    if (t < cycleStart) continue;
    count += 1;
    if (count >= MAX_VIOLATIONS) {
      const holdUntil = addMonths(t, HOLD_MONTHS);
      if (now < holdUntil) return { count, holdUntil, max: MAX_VIOLATIONS };
      cycleStart = holdUntil;
      count = 0;
    }
  }
  return { count, holdUntil: null, max: MAX_VIOLATIONS };
};
