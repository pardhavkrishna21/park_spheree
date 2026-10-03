import React, { useEffect, useRef, useState } from 'react';
import { PRICES, valetFare } from '../../utils/plans';
import { searchPlaces, drivingKm, destinationQuery } from '../../utils/geo';
import '../BookingModal/reserve.css';

// Pickup search plus driving distance to the bay; reports { pickup, km } once ready, otherwise null.
export default function ValetPicker({ spot, initialPickup = '', initialKm = null, onChange }) {
  const [text, setText] = useState(initialPickup);
  const [edited, setEdited] = useState(false);
  const [place, setPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [km, setKm] = useState(initialKm);
  const [geoState, setGeoState] = useState('idle');
  const [geoError, setGeoError] = useState('');
  const destRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(km != null && text.trim() ? { pickup: text.trim(), km } : null);
  }, [km, text]);

  useEffect(() => {
    const q = text.trim();
    if (!edited || q.length < 3 || place) return undefined;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setGeoState('searching');
      setGeoError('');
      try {
        const results = await searchPlaces(q, ctrl.signal);
        setSuggestions(results);
        setGeoState('idle');
        if (results.length === 0) setGeoError('No matching place found. Try a more specific address or landmark.');
      } catch (e) {
        if (e.name !== 'AbortError') {
          setGeoState('error');
          setGeoError('Could not search locations. Check your connection and try again.');
        }
      }
    }, 700);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [text, edited, place]);

  useEffect(() => {
    if (!place) return undefined;
    const ctrl = new AbortController();
    setGeoState('routing');
    setGeoError('');
    setKm(null);
    (async () => {
      try {
        if (!destRef.current) {
          const dest = await searchPlaces(destinationQuery(spot), ctrl.signal);
          if (!dest[0]) throw new Error('destination not found');
          destRef.current = dest[0];
        }
        setKm(await drivingKm(place, destRef.current, ctrl.signal));
        setGeoState('idle');
      } catch (e) {
        if (e.name !== 'AbortError') {
          setGeoState('error');
          setGeoError('Could not calculate the route. Try a more specific pickup location.');
        }
      }
    })();
    return () => ctrl.abort();
  }, [place, spot]);

  const choose = (p) => {
    setPlace(p);
    setText(p.label);
    setSuggestions([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support location access.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => choose({ label: 'My current location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeoError('Location access was blocked. Type your pickup address instead.')
    );
  };

  const fare = km != null ? valetFare(km) : 0;

  return (
    <div className="rm-valet">
      <div className="rm-valet-route">
        <div><span>📍 Pickup</span><small>Where the Captain should come</small></div>
        <input
          type="text"
          placeholder="Search pickup address or landmark, e.g. Inorbit Mall, Madhapur"
          value={text}
          onChange={(e) => { setText(e.target.value); setEdited(true); setPlace(null); setKm(null); setGeoError(''); }}
        />
        <button type="button" className="rm-locate" onClick={useMyLocation}>🎯 Use my current location</button>
        {suggestions.length > 0 && !place && (
          <ul className="rm-suggest">
            {suggestions.map((s) => (
              <li key={`${s.lat},${s.lon}`}><button type="button" onClick={() => choose(s)}>{s.full || s.label}</button></li>
            ))}
          </ul>
        )}
        <div className="rm-valet-arrow">↓</div>
        <div><span>🅿️ Destination</span><small>{spot.name} · {spot.address}</small></div>
      </div>
      <div className={`rm-geo ${geoState}`}>
        {geoState === 'searching' && 'Searching locations…'}
        {geoState === 'routing' && 'Calculating driving distance…'}
        {geoError && <span className="rm-geo-error">{geoError}</span>}
        {!geoError && geoState === 'idle' && km == null && 'Pick a suggested location to see the distance and price.'}
        {km != null && <span>🛣️ Driving distance: <strong>{km} km</strong></span>}
      </div>
      {km != null && (
        <div className="rm-valet-fare">
          ₹{PRICES.valetBase} base + {Math.ceil(km)} km × ₹{PRICES.valetPerKm} = <strong>₹{fare}</strong>
        </div>
      )}
    </div>
  );
}
