export const PRICES = { ev: 50, washCar: 120, washBike: 60, valetBase: 30, valetPerKm: 15 };

export const valetFare = (km) => PRICES.valetBase + PRICES.valetPerKm * Math.ceil(Math.max(0, km));

export const PLAN_PERKS = {
  Free: { label: 'Free', wash: 0, ev: 0 },
  'Pro Plan': { label: 'Pro', wash: 1, ev: 3 },
  Ultimate: { label: 'Ultimate VIP', wash: 5, ev: Infinity }
};

export const getPerks = (plan) => PLAN_PERKS[plan] || PLAN_PERKS.Free;
export const remaining = (limit, used) => Math.max(0, limit - used);
export const washPrice = (vehicle) => (vehicle === 'Bike' ? PRICES.washBike : PRICES.washCar);
