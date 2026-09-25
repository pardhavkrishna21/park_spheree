import React from 'react';
import './index.css';

export default function BookingsView({ bookings, setCurrentTab }) {
  return (
    <div className="bookings-container">
      <h2>My Parking Reservations</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
        Present this entry OTP to the host upon reaching the reserved space.
      </p>

      {bookings.length === 0 ? (
        <div className="empty-box">
          <p>No active reservations yet.</p>
          <button className="btn-primary" onClick={() => setCurrentTab('find')}>Find a Spot</button>
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b.id} className="pass-card">
            <div className="pass-top">
              <div>
                <span className="status-badge">{b.status}</span>
                <h3>{b.spotName}</h3>
                <small>Host: {b.hostName}</small>
              </div>
              <div className="otp-block">
                <span>ENTRY OTP</span>
                <strong>{b.otpCode}</strong>
              </div>
            </div>
            <div className="pass-meta">
              <div><span>TIMING</span> <strong>{b.timeSlot}</strong></div>
              <div><span>VEHICLE</span> <strong>{b.vehicle}</strong></div>
              <div><span>TOTAL</span> <strong style={{ color: '#047857' }}>₹{b.totalPaid}</strong></div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
