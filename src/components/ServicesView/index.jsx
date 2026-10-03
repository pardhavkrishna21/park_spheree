import React, { useState } from 'react';
import { PRICES, getPerks, remaining } from '../../utils/plans';
import { getAvailability, nextSlotTime } from '../../utils/availability';
import { todayStr, toRange, fmtTime } from '../../utils/bookingTime';
import './index.css';

const STATUS_LABELS = { available: 'Available', fast: 'Fast Filling', almost: 'Almost Filled', filled: 'Filled' };

function Ring({ value, max, label, big, tone }) {
  const pct = max === Infinity ? 100 : max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className={`svc-ring-wrap ${tone}`}>
      <div className="svc-ring" style={{ '--pct': `${pct}%` }}>
        <div className="svc-ring-inner">
          <strong>{big}</strong>
          <span>left</span>
        </div>
      </div>
      <small>{label}</small>
    </div>
  );
}

const serviceStatus = (booking, now) => {
  if (String(booking.status).startsWith('Cancelled')) return { key: 'cancelled', label: 'Cancelled' };
  if (booking.status === 'Completed') return { key: 'completed', label: 'Completed' };
  if (booking.status === 'Parked') return { key: 'progress', label: 'In progress' };
  const [start, end] = toRange(booking.date, booking.startTime, booking.hours);
  if (now >= start && now < end) return { key: 'ready', label: 'Ready for check-in' };
  return { key: 'booked', label: 'Slot booked' };
};

export default function ServicesView({ user, spots, usage, bookings = [], now = Date.now(), setCurrentTab }) {
  const [filter, setFilter] = useState('all');
  const perks = getPerks(user?.subscription);
  const premium = perks.wash > 0 || perks.ev > 0;
  const washLeft = remaining(perks.wash, usage.wash);
  const evLeft = remaining(perks.ev, usage.ev);

  const hasWash = (s) => Boolean(s.amenities.carWash || s.amenities.bikeWash);
  const list = spots.filter((s) => {
    if (filter === 'ev') return s.amenities.evCharging;
    if (filter === 'wash') return hasWash(s);
    return s.amenities.evCharging || hasWash(s);
  });

  const evBays = spots.filter((s) => s.amenities.evCharging).length;
  const washBays = spots.filter(hasWash).length;
  const serviceHistory = bookings.flatMap((booking) => {
    if (!booking.date || !booking.startTime) return [];
    const [start, end] = toRange(booking.date, booking.startTime, booking.hours);
    const slot = `${new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${fmtTime(start)} – ${fmtTime(end)}`;
    const status = serviceStatus(booking, now);
    const base = { bookingId: booking.id, spotName: booking.spotName, slot, start, status };
    return [
      booking.needEV && { ...base, id: `${booking.id}-ev`, type: 'EV charging', icon: '⚡', included: booking.freeEV },
      booking.needWash && { ...base, id: `${booking.id}-wash`, type: `${booking.vehicleType || 'Vehicle'} wash`, icon: '✨', included: booking.freeWash }
    ].filter(Boolean);
  }).sort((a, b) => b.start - a.start);

  return (
    <div className="svc-root">
      <section className="svc-hero">
        <span className="svc-bubble b1" /><span className="svc-bubble b2" /><span className="svc-bubble b3" /><span className="svc-bubble b4" />
        <div className="svc-hero-text">
          <span className="svc-pill">⚡ EV CHARGING &amp; ✨ CAR WASH</span>
          <h2>Park. Charge. Shine.</h2>
          <p>Come back to a full battery and a spotless ride. Add services to any booking in one tap.</p>
          <div className="svc-hero-stats">
            <div><strong>{evBays}</strong><span>charging bays</span></div>
            <div><strong>{washBays}</strong><span>wash bays</span></div>
            <div><strong>₹{PRICES.ev}</strong><span>EV session</span></div>
          </div>
        </div>
        <div className="svc-hero-art" aria-hidden="true">
          <div className="svc-bolt">⚡</div>
        </div>
      </section>

      <section className="svc-showcase">
        <article className="svc-feature ev">
          <div className="svc-feature-head">
            <span className="svc-feature-icon">⚡</span>
            <div>
              <h3>EV Fast Charging</h3>
              <p>Plug in while you park</p>
            </div>
            <div className="svc-feature-price">₹{PRICES.ev}<small>/ session</small></div>
          </div>
          <div className="svc-battery"><div className="svc-battery-fill" /></div>
          <ul>
            <li>Type 2 AC and CCTS2 DC chargers</li>
            <li>Starts the moment you arrive</li>
            <li>Free sessions with Pro and Ultimate</li>
          </ul>
        </article>

        <article className="svc-feature wash">
          <div className="svc-feature-head">
            <span className="svc-feature-icon">✨</span>
            <div>
              <h3>Car &amp; Bike Wash</h3>
              <p>Exterior shine while you're away</p>
            </div>
            <div className="svc-feature-price">₹{PRICES.washBike}<small>from</small></div>
          </div>
          <div className="svc-suds"><span /><span /><span /><span /><span /></div>
          <div className="svc-wash-prices">
            <div>🚗 Car <strong>₹{PRICES.washCar}</strong></div>
            <div>🏍 Bike <strong>₹{PRICES.washBike}</strong></div>
          </div>
        </article>
      </section>

      <section className={`svc-plan ${premium ? 'premium' : ''}`}>
        {premium ? (
          <>
            <div className="svc-plan-title">
              <span className="svc-plan-badge">{perks.label}</span>
              <h3>Your monthly perks</h3>
            </div>
            <div className="svc-rings">
              <Ring value={washLeft} max={perks.wash} big={washLeft} label={`Free washes · ${usage.wash} used of ${perks.wash}`} tone="wash" />
              <Ring
                value={evLeft}
                max={perks.ev}
                big={perks.ev === Infinity ? '∞' : evLeft}
                label={perks.ev === Infinity ? `Unlimited EV · ${usage.ev} used` : `Free EV sessions · ${usage.ev} used of ${perks.ev}`}
                tone="ev"
              />
              <div className="svc-value">
                <strong>₹{PRICES.washCar} / ₹{PRICES.washBike}</strong>
                <small>value per car / bike wash, free while your allowance lasts</small>
              </div>
            </div>
          </>
        ) : (
          <div className="svc-upsell">
            <div>
              <h3>🔒 Unlock free washes &amp; EV charging</h3>
              <p>Pro: 1 free wash and 3 EV sessions a month. Ultimate: 5 washes and unlimited EV charging.</p>
            </div>
            <button className="svc-cta" onClick={() => setCurrentTab('subscription')}>See plans →</button>
          </div>
        )}
      </section>

      <section className="svc-history" aria-labelledby="service-history-title">
        <div className="svc-history-head">
          <div>
            <span>YOUR SERVICE ACTIVITY</span>
            <h3 id="service-history-title">EV &amp; wash history</h3>
            <p>Each service is linked to its parking booking and shows its scheduled date and current status.</p>
          </div>
          <strong>{serviceHistory.length} {serviceHistory.length === 1 ? 'service' : 'services'}</strong>
        </div>
        {serviceHistory.length === 0 ? (
          <div className="svc-history-empty">No EV charging or wash services booked yet. Add one while reserving a parking slot.</div>
        ) : (
          <div className="svc-history-list">
            {serviceHistory.map((service) => (
              <article className="svc-history-row" key={service.id}>
                <div className="svc-history-icon">{service.icon}</div>
                <div className="svc-history-main">
                  <strong>{service.type}</strong>
                  <span>{service.spotName}</span>
                  <small>{service.slot} · {service.bookingId}</small>
                </div>
                <div className="svc-history-meta">
                  <span className={`svc-service-status ${service.status.key}`}>{service.status.label}</span>
                  <small>{service.included ? 'Included in your plan' : 'Paid add-on'}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="svc-filters">
        {[['all', 'All bays'], ['ev', '⚡ EV charging'], ['wash', '✨ Car wash']].map(([key, label]) => (
          <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <div className="svc-grid">
        {list.map((s) => {
          const a = getAvailability(s, todayStr(), nextSlotTime(), 1);
          return (
            <article key={s.id} className="svc-card">
              <div className="svc-card-media">
                <img src={s.image} alt={s.name} loading="lazy" />
                <span className={`svc-status ${a.status}`}>{STATUS_LABELS[a.status]}</span>
              </div>
              <div className="svc-card-body">
                <h4>{s.name}</h4>
                <small>{s.address}</small>
                <div className="svc-tags">
                  {s.amenities.evCharging && <span className="ev">⚡ {s.amenities.evChargerType || 'EV charging'}</span>}
                  {s.amenities.carWash && <span className="wash">✨ Car wash</span>}
                  {(s.amenities.bikeWash ?? s.amenities.carWash) && <span className="wash">✨ Bike wash</span>}
                </div>
                <div className="svc-meter">
                  <div className={`svc-meter-fill ${a.status}`} style={{ width: `${(a.free / a.total) * 100}%` }} />
                </div>
                <div className="svc-card-foot">
                  <span>{a.free === 0 ? 'No slots free' : `${a.free} of ${a.total} slots free`}</span>
                  <button className="btn-primary" disabled={a.free === 0} onClick={() => setCurrentTab('find')}>Book →</button>
                </div>
              </div>
            </article>
          );
        })}
        {list.length === 0 && <p>No bays offer this service yet.</p>}
      </div>
    </div>
  );
}
