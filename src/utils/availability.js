import { toRange, rangesOverlap } from './bookingTime';

const hashStr = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

// Time-of-day demand multiplier: lunch and evening peaks fill up faster.
const demand = (hour) => {
  if ((hour >= 11 && hour < 15) || (hour >= 18 && hour < 22)) return 1.6;
  if (hour >= 8 && hour < 23) return 1.0;
  return 0.3;
};

// Simulated occupancy for a bay across the requested window, plus the driver's own bookings.
export const getAvailability = (spot, date, startTime, hours, myBookings = []) => {
  const total = spot.totalSlots ?? (spot.maxCarCapacity ?? 2) + (spot.maxBikeCapacity ?? 2);
  const baseOccupied = total - Math.min(spot.availableSlots ?? total, total);
  const [start, end] = toRange(date, startTime, hours);

  let occupied = 0;
  for (let t = start; t < end; t += 3600000) {
    const d = new Date(t);
    const key = `${spot.id}|${d.toDateString()}|${d.getHours()}`;
    const jitter = (hashStr(key) % 3) - 1;
    const level = Math.round((baseOccupied + 0.5) * demand(d.getHours())) + jitter;
    occupied = Math.max(occupied, Math.min(total, Math.max(0, level)));
  }

  const mine = myBookings.filter(
    (b) => ['Confirmed', 'Parked'].includes(b.status) && b.spotName === spot.name && b.date && rangesOverlap([start, end], toRange(b.date, b.startTime, b.hours))
  ).length;

  const startOfDay = (ms) => new Date(new Date(ms).toDateString()).getTime();
  const dayOffset = Math.round((startOfDay(start) - startOfDay(Date.now())) / 86400000);

  if (dayOffset >= 7) {
    occupied = 0;
  } else if (dayOffset >= 4) {
    occupied = Math.min(occupied, Math.max(0, total - 6));
  } else {
    // Next 4 days: afternoons fill fast (3-5 free), evenings after 6:30 PM are almost full (1-2 free).
    let evening = false;
    let late = false;
    let afternoon = [0, 6].includes(new Date(start).getDay());
    for (let t = start; t < end; t += 1800000) {
      const d = new Date(t);
      const mins = d.getHours() * 60 + d.getMinutes();
      if (mins >= 1140) late = true;
      if (mins >= 1110) evening = true;
      else if (mins >= 720) afternoon = true;
    }
    // Today after 7 PM about half the bays are completely filled.
    if (dayOffset === 0 && late && hashStr(`${spot.id}|tonight`) % 2 === 0) {
      occupied = total;
    } else if (evening) {
      occupied = total - Math.min(2, total);
    } else if (afternoon) {
      occupied = Math.min(total - Math.min(3, total), Math.max(occupied, total - Math.min(5, total)));
    }
  }

  occupied = Math.min(total, occupied + mine);

  const free = total - occupied;
  // Bays with fewer than 6 spots count as available only when completely free, 4+ days out.
  const status = free === 0 ? 'filled'
    : free <= 2 ? 'almost'
    : free <= 5 && !(free === total && dayOffset >= 4) ? 'fast'
    : 'available';
  return { total, free, status, mine };
};

export const nextSlotTime = () => {
  const d = new Date();
  const mins = d.getMinutes() < 30 ? 30 : 60;
  d.setMinutes(mins, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
