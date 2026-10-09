import React, { useEffect, useState } from 'react';

import './index.css';

import './reserve.css';

import { todayStr, toRange, findConflict, fmtTime, TIME_OPTIONS } from '../../utils/bookingTime';

import { PRICES, getPerks, remaining, washPrice, valetFare } from '../../utils/plans';

import { getAvailability } from '../../utils/availability';

import ValetPicker from '../ValetPicker';



const isCurrentLocationSelection = (value) => /\b(?:my|current)\s+location\b/i.test(String(value || '').trim());

export default function BookingModal({ spot, selectedVehicle, bookingHours, user, usage = { wash: 0, ev: 0 }, existingBookings = [], initialDate, initialTime, onClose, onConfirm }) {

  const [needEV, setNeedEV] = useState(false);

  const [needWash, setNeedWash] = useState(false);

  const [needValet, setNeedValet] = useState(false);

  const [valet, setValet] = useState(null);
  const [valetLocationMessage, setValetLocationMessage] = useState('');
  const [isResolvingValetLocation, setIsResolvingValetLocation] = useState(false);

  const [date, setDate] = useState(initialDate || todayStr());

  const [startTime, setStartTime] = useState(initialTime || '');

  const [hours, setHours] = useState(bookingHours);

  // Convert a "My Location" selection into a resolved address or exact GPS coordinates.
  useEffect(() => {
    const pickup = String(valet?.pickup || '').trim();
    if (!needValet || !isCurrentLocationSelection(pickup) || valet?.pickupResolved) return;

    if (!navigator.geolocation) {
      setValetLocationMessage('This browser does not support location access. Enter your pickup address manually.');
      return;
    }

    let cancelled = false;
    setIsResolvingValetLocation(true);
    setValetLocationMessage('Finding your exact pickup location…');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      let resolvedPickup = `Current location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (response.ok) {
          const data = await response.json();
          if (data?.display_name) resolvedPickup = data.display_name;
        }
      } catch (error) {
        // Keep the precise GPS coordinates if address lookup fails.
      }
      if (cancelled) return;
      setValet((previous) => {
        if (!previous || !isCurrentLocationSelection(previous.pickup)) return previous;
        return { ...previous, pickup: resolvedPickup, pickupLat: latitude, pickupLng: longitude, pickupResolved: true };
      });
      setValetLocationMessage(`Pickup location found: ${resolvedPickup}`);
      setIsResolvingValetLocation(false);
    }, (error) => {
      if (cancelled) return;
      setIsResolvingValetLocation(false);
      setValetLocationMessage(
        error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access in your browser or choose/enter a pickup address.'
          : 'Could not determine your location. Please choose/enter a pickup address and try again.'
      );
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });

    return () => { cancelled = true; };
  }, [needValet, valet?.pickup, valet?.pickupResolved]);



  if (!spot) return null;



  const perks = getPerks(user?.subscription);

  const washLeft = remaining(perks.wash, usage.wash);

  const evLeft = remaining(perks.ev, usage.ev);



  // A slot can be booked after it starts if its selected duration has not

  // ended yet (for example 7:30 PM at 7:36 PM). Fully elapsed slots cannot.

  const isTaken = (t) => toRange(date, t, hours)[1] <= Date.now()

    || Boolean(findConflict(existingBookings, date, t, hours))

    || getAvailability(spot, date, t, hours, existingBookings).free === 0;

  const bookedToday = existingBookings.filter((b) => ['Confirmed', 'Parked'].includes(b.status) && b.date === date);

  const startOk = startTime && !isTaken(startTime);



  const changeHours = (h) => {

    setHours(h);

    if (startTime && (toRange(date, startTime, h)[1] <= Date.now() || findConflict(existingBookings, date, startTime, h))) setStartTime('');

  };



  const chargingVehicles = spot.amenities.evChargingVehicles || ['Car', 'Bike'];

  const chargingType = selectedVehicle === 'Bike' ? 'Bike' : 'Car';

  const canCharge = spot.amenities.evCharging && chargingVehicles.includes(chargingType);

  const canWash = selectedVehicle === 'Bike'

    ? (spot.amenities.bikeWash ?? spot.amenities.carWash)

    : (spot.amenities.carWash ?? spot.amenities.bikeWash);



  const baseRate = selectedVehicle === 'Bike' ? 30 : 50;

  const platRate = selectedVehicle === 'Bike' ? 10 : 20;



  const subtotal = baseRate * hours;

  let platformFee = platRate * hours;

  if (user?.subscription === 'Pro Plan') platformFee = Math.max(0, platformFee - 10);

  if (user?.subscription === 'Ultimate') platformFee = 0;



  const freeEV = needEV && canCharge && evLeft > 0;

  const freeWash = needWash && canWash && washLeft > 0;

  const evCost = needEV && canCharge && !freeEV ? PRICES.ev : 0;

  const washCost = needWash && canWash && !freeWash ? washPrice(selectedVehicle) : 0;

  const valetCost = needValet && valet ? valetFare(valet.km) : 0;

  const valetPickupIsUnresolved = isCurrentLocationSelection(valet?.pickup) && !valet?.pickupResolved;
  const valetOk = !needValet || (Boolean(valet?.pickup) && !valetPickupIsUnresolved && !isResolvingValetLocation);

  const addOnCost = evCost + washCost + valetCost;

  const grandTotal = subtotal + platformFee + addOnCost;

  const timeLabel = (t) => fmtTime(toRange(date, t, 0)[0]);



  const addonRow = ({ key, icon, title, detail, checked, onChange, enabled, priceText, free }) => (

    <label key={key} className={`rm-addon ${checked && enabled ? 'on' : ''} ${enabled ? '' : 'off'}`}>

      <input type="checkbox" checked={checked && enabled} disabled={!enabled} onChange={(e) => onChange(e.target.checked)} />

      <span className="rm-addon-main">

        {icon} {title}

        <small>{enabled ? detail : 'Not offered for your vehicle at this bay'}</small>

      </span>

      <span className={`rm-addon-price ${free ? 'free' : ''}`}>{priceText}</span>

    </label>

  );



  return (

    <div className="rm-backdrop" onClick={onClose}>

      <div className="rm-card" onClick={(e) => e.stopPropagation()}>

        <div className="rm-header">

          <div>

            <h3>Confirm Parking Slot Reservation</h3>

            <p>Pick your date, time and duration</p>

          </div>

          <button className="rm-close" onClick={onClose} aria-label="Close">✕</button>

        </div>



        <div className="rm-body">

          <div className="rm-spot">

            <div>

              <h4>{spot.name}</h4>

              <small>{spot.address}</small>

            </div>

            <span className="rm-vehicle">{selectedVehicle === 'Bike' ? '🏍' : '🚗'} {selectedVehicle}</span>

          </div>



          <div className="rm-section">

            <h5>Date &amp; duration</h5>

            <div className="rm-row">

              <input

                className="rm-date"

                type="date"

                min={todayStr()}

                value={date}

                onChange={(e) => { setDate(e.target.value); setStartTime(''); }}

              />

              <div className="rm-stepper">

                <button type="button" disabled={hours <= 1} onClick={() => changeHours(hours - 1)}>−</button>

                <strong>{hours} hr{hours > 1 ? 's' : ''}</strong>

                <button type="button" disabled={hours >= 12} onClick={() => changeHours(hours + 1)}>+</button>

              </div>

            </div>

          </div>



          <div className="rm-section">

            <h5>Start time</h5>

            <div className="rm-times">

              {TIME_OPTIONS.map((t) => {

                const taken = isTaken(t);

                const mine = Boolean(findConflict(existingBookings, date, t, hours));

                const alreadyRunning = toRange(date, t, hours)[0] < Date.now();

                return (

                  <button

                    key={t}

                    type="button"

                    disabled={taken}

                    className={`rm-time ${startTime === t ? 'selected' : ''} ${mine ? 'mine' : ''}`}

                    onClick={() => setStartTime(t)}

                  >

                    {timeLabel(t)}

                    <small>{mine ? 'You booked' : taken ? 'Already booked' : alreadyRunning ? `Available now · ends ${fmtTime(toRange(date, t, hours)[1])}` : 'Available'}</small>

                  </button>

                );

              })}

            </div>

            {bookedToday.length > 0 && (

              <div className="rm-hint">

                Your booked times: {bookedToday.map((b) => { const [s, e] = toRange(b.date, b.startTime, b.hours); return `${fmtTime(s)} - ${fmtTime(e)}`; }).join(', ')}

              </div>

            )}

          </div>



          {perks.wash > 0 && (

            <div className="rm-perks">

              <div className="rm-perk">

                Free washes ({perks.label})

                <strong>{washLeft} left</strong>

                {usage.wash} used of {perks.wash}

              </div>

              <div className="rm-perk">

                Free EV charging

                <strong>{perks.ev === Infinity ? 'Unlimited' : `${evLeft} left`}</strong>

                {usage.ev} used{perks.ev === Infinity ? '' : ` of ${perks.ev}`}

              </div>

            </div>

          )}



          <div className="rm-section">

            <h5>Add-on services</h5>

            {addonRow({

              key: 'ev',

              icon: '⚡',

              title: 'EV charging',

              detail: spot.amenities.evChargerType ? `${spot.amenities.evChargerType} · check your connector before booking` : 'Charge while you park',

              checked: needEV,

              onChange: setNeedEV,

              enabled: Boolean(canCharge),

              priceText: freeEV ? 'FREE' : `+₹${PRICES.ev}`,

              free: freeEV

            })}

            {addonRow({

              key: 'wash',

              icon: '✨',

              title: `${selectedVehicle === 'Bike' ? 'Bike' : 'Car'} wash`,

              detail: freeWash ? 'Included in your plan' : 'Exterior wash while you are away',

              checked: needWash,

              onChange: setNeedWash,

              enabled: Boolean(canWash),

              priceText: freeWash ? 'FREE' : `+₹${washPrice(selectedVehicle)}`,

              free: freeWash

            })}

            {addonRow({

              key: 'valet',

              icon: '🔑',

              title: 'Captain Valet',

              detail: `Captain picks up your vehicle and parks it for you. ₹${PRICES.valetBase} base + ₹${PRICES.valetPerKm} per km`,

              checked: needValet,

              onChange: setNeedValet,

              enabled: true,

              priceText: `from ₹${PRICES.valetBase + PRICES.valetPerKm}`,

              free: false

            })}



            {needValet && (
                <>
                  <ValetPicker spot={spot} onChange={(value) => { setValet(value); setValetLocationMessage(''); }} />
                  {valetLocationMessage && (
                    <p role="status" style={{ margin: '8px 0 0', fontSize: 12, color: valetOk ? '#047857' : isResolvingValetLocation ? '#475569' : '#b91c1c', overflowWrap: 'anywhere' }}>
                      {valetLocationMessage}
                    </p>
                  )}
                </>
              )}

          </div>



          <div className="rm-price">

            <div><span>Parking ({hours} hr × ₹{baseRate})</span><span>₹{subtotal}</span></div>

            <div><span>Platform fee</span><span>₹{platformFee}</span></div>

            {needEV && canCharge && <div><span>EV charging</span><span>{freeEV ? 'Free (plan)' : `₹${evCost}`}</span></div>}

            {needWash && canWash && <div><span>Wash</span><span>{freeWash ? 'Free (plan)' : `₹${washCost}`}</span></div>}

            {needValet && valet && <div><span>Captain Valet ({valet.km} km)</span><span>₹{valetCost}</span></div>}

            <div className="rm-total"><span>Total</span><span>₹{grandTotal}</span></div>

          </div>



          <button

            className="rm-pay"

            disabled={!startOk || !valetOk}

            onClick={() => onConfirm({ grandTotal, addOnCost, needEV: Boolean(needEV && canCharge), needWash: Boolean(needWash && canWash), needValet, valetPickup: valet?.pickup || '', valetPickupLat: valet?.pickupLat ?? null, valetPickupLng: valet?.pickupLng ?? null, valetKm: valet?.km || 0, valetFee: valetCost, freeEV, freeWash, date, startTime, hours })}

          >

            {!startOk ? 'Select an available start time' : !valetOk ? (isResolvingValetLocation ? 'Finding your pickup location…' : 'Choose a valid pickup location for valet') : `Pay & Reserve Slot (₹${grandTotal})`}

          </button>

        </div>

      </div>

    </div>

  );

}
