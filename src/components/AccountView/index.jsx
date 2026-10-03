import React from 'react';
import { toRange, fmtTime } from '../../utils/bookingTime';
import './index.css';

const STATUS_COLORS = { Confirmed: '#059669', Parked: '#2563eb', Completed: '#475569', Cancelled: '#dc2626' };

export default function AccountView({ user, bookings, hostBookings = [], hostSpots = [], violations, holdUntilText, rating = 4.8, setCurrentTab }) {
  const isDriver = user.role === 'driver';

  if (!isDriver) {
    const received = hostBookings.length;
    const completedHost = hostBookings.filter((b) => b.status === 'Completed').length;
    const earnings = hostBookings.filter((b) => !String(b.status).startsWith('Cancelled')).reduce((s, b) => s + (b.hostEarning || 0), 0);
    const hostDetails = [
      ['Full name', user.name],
      ['Email', user.email],
      ['Phone', user.phone || 'Not added'],
      ['Business / property', user.companyName || 'Not added'],
      ['Role', 'Space host'],
      ['Member since', user.joinedAt || 'March 2026']
    ];
    return (
      <div className="acc-root">
        <section className="acc-hero">
          <div className="acc-avatar"><svg width="40" height="40" viewBox="0 0 24 24" fill="#78716c" aria-hidden="true"><circle cx="12" cy="8" r="4.5" /><path d="M3.5 21c0-4.6 3.8-7.5 8.5-7.5s8.5 2.9 8.5 7.5z" /></svg></div>
          <div className="acc-hero-text"><h2>{user.name}</h2><span>{user.email}</span></div>
          <span className="acc-plan" style={{ background: '#0f766e' }}>Space host</span>
        </section>

        <section className="acc-stats">
          <div><strong>{hostSpots.length}</strong><span>Bays listed</span></div>
          <div><strong>{received}</strong><span>Bookings received</span></div>
          <div><strong>{completedHost}</strong><span>Completed</span></div>
          <div><strong>₹{earnings}</strong><span>Earnings</span></div>
        </section>

        <div className="acc-grid">
          <section className="acc-card">
            <h3>Account details</h3>
            <dl>
              {hostDetails.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
            </dl>
          </section>
          <section className="acc-card">
            <h3>Your bays</h3>
            {hostSpots.length === 0 ? (
              <p className="acc-muted">No bays listed yet.</p>
            ) : (
              hostSpots.map((s) => (
                <div key={s.id} className="acc-case" style={{ background: '#f0fdf4', borderLeftColor: '#16a34a' }}>
                  <strong style={{ color: '#065f46' }}>{s.name}</strong>
                  <span>{s.address}</span>
                </div>
              ))
            )}
          </section>
        </div>

        <section className="acc-card">
          <div className="acc-row">
            <h3>Bookings at your bays</h3>
            <button className="btn-primary" onClick={() => setCurrentTab('host-dashboard')}>Open revenue</button>
          </div>
          {received === 0 ? (
            <p className="acc-muted">No bookings yet.</p>
          ) : (
            <div className="acc-table-wrap">
              <table className="acc-table">
                <thead><tr><th>Bay</th><th>Driver</th><th>Hours</th><th>Earning</th><th>Status</th></tr></thead>
                <tbody>
                  {hostBookings.slice(0, 15).map((b) => (
                    <tr key={b.id}>
                      <td>{b.spotName}</td>
                      <td>{b.driverName}</td>
                      <td>{b.hoursBooked}</td>
                      <td>₹{b.hostEarning}</td>
                      <td>{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }
  const plan = user.subscription === 'Ultimate' ? 'Ultimate VIP' : user.subscription === 'Pro Plan' ? 'Pro' : 'Free';
  const ring = isDriver && user.subscription === 'Ultimate' ? '#2563eb' : isDriver && user.subscription === 'Pro Plan' ? '#16a34a' : '#d6d3d1';
  const completed = bookings.filter((b) => b.status === 'Completed').length;
  const violationCases = bookings.filter((b) => b.violation);
  const details = [
    ['Full name', user.name],
    ['Email', user.email],
    ['Phone', user.phone || 'Not added'],
    ['Vehicle number', user.vehiclePlate || 'Not added'],
    ['Role', user.role],
    ['Member since', user.joinedAt || 'March 2026']
  ];

  return (
    <div className="acc-root">
      <section className="acc-hero">
        <div className="acc-avatar" style={{ borderColor: ring }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#78716c" aria-hidden="true">
            <circle cx="12" cy="8" r="4.5" />
            <path d="M3.5 21c0-4.6 3.8-7.5 8.5-7.5s8.5 2.9 8.5 7.5z" />
          </svg>
        </div>
        <div className="acc-hero-text">
          <h2>{user.name}</h2>
          <span>{user.email}</span>
        </div>
        {isDriver && <span className="acc-plan" style={{ background: ring === '#d6d3d1' ? '#78716c' : ring }}>{plan} plan</span>}
      </section>

      <section className="acc-stats">
        <div><strong>★ {rating}</strong><span>Rating</span></div>
        <div><strong>{bookings.length}</strong><span>Slots booked</span></div>
        <div><strong>{completed}</strong><span>Completed</span></div>
        <div className={violations.count > 0 ? 'bad' : 'good'}><strong>{violations.count} of {violations.max}</strong><span>Violations</span></div>
      </section>

      {violations.holdUntil && (
        <div className="acc-hold">Account on hold until <strong>{holdUntilText}</strong>. New bookings are paused for 3 months.</div>
      )}

      <div className="acc-grid">
        <section className="acc-card">
          <h3>Account details</h3>
          <dl>
            {details.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd style={{ textTransform: k === 'Role' ? 'capitalize' : 'none' }}>{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="acc-card">
          <h3>Violation cases</h3>
          <p className="acc-muted">Booking a slot and not parking is a violation. {violations.max} violations put the account on hold for 3 months.</p>
          {violationCases.length === 0 ? (
            <div className="acc-ok">✓ No violations. Keep it up!</div>
          ) : (
            violationCases.map((b) => (
              <div key={b.id} className="acc-case">
                <strong>{b.spotName}</strong>
                <span>{b.timeSlot}</span>
                <small>{b.id} · Missed slot, cancelled automatically</small>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="acc-card">
        <div className="acc-row">
          <h3>Slot bookings</h3>
          <button className="btn-primary" onClick={() => setCurrentTab('bookings')}>Manage bookings</button>
        </div>
        {bookings.length === 0 ? (
          <p className="acc-muted">No bookings yet.</p>
        ) : (
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead>
                <tr><th>Booking</th><th>Bay</th><th>Slot</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.spotName}</td>
                    <td>{b.date ? `${new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${fmtTime(toRange(b.date, b.startTime, 0)[0])} (${b.hours}h)` : b.timeSlot}</td>
                    <td>₹{b.totalPaid}</td>
                    <td><span className="acc-status" style={{ background: STATUS_COLORS[b.status] }}>{b.status}{b.violation ? ' · violation' : ''}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
