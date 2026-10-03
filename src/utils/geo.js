const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

const shortName = (displayName) => displayName.split(',').slice(0, 3).join(',').trim();

// Free OpenStreetMap geocoding; results limited to India.
export const searchPlaces = async (query, signal) => {
  const url = `${NOMINATIM}?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  return data.map((p) => ({ label: shortName(p.display_name), full: p.display_name, lat: Number(p.lat), lon: Number(p.lon) }));
};

// Driving distance in km between two points via the public OSRM router.
export const drivingKm = async (from, to, signal) => {
  const url = `${OSRM}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('route failed');
  const data = await res.json();
  const meters = data.routes?.[0]?.distance;
  if (typeof meters !== 'number') throw new Error('no route');
  return Math.max(0.1, Math.round(meters / 100) / 10);
};

export const destinationQuery = (spot) => `${(spot.destinationNear || spot.address).split('/')[0].trim()}, Hyderabad`;
