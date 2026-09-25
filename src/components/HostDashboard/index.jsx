import React, { useState } from 'react';
import './index.css';

export default function HostDashboard({ user, hostBookings, hostSpots, setHostSpots, showToast, setCurrentTab }) {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [upi, setUpi] = useState('vikram@okaxis');

  if (user.role !== 'host') {
    return (
      <div className="restricted-box">
        <h2>🔒 Host Telemetry Restricted</h2>
        <p>Earnings data is strictly visible only to registered Space Hosts. Drivers cannot access this section.</p>
        <button className="btn-primary" onClick={() => setCurrentTab('auth')}>Register as Space Host</button>
      </div>
    );
  }

  const thisMonthEarned = hostBookings.reduce((sum, b) => sum + b.hostEarning, 7800);
  const pendingBalance = 3720;

  return (
    <div>
      <div className="dash-header">
        <div>
          <span className="confidential-tag">CONFIDENTIAL • SPACE HOST REVENUE CONSOLE</span>
          <h2>Revenue Generated & Payouts ({user.name})</h2>
          <p>Real-time booking income, live occupied bays, and automated settlements.</p>
        </div>
        <button className="btn-primary" onClick={() => setWithdrawModal(true)}>
          Withdraw Balance (₹{pendingBalance})
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card emerald">
          <span>This Month's Realized Revenue</span>
          <div className="kpi-value">₹{thisMonthEarned.toLocaleString('en-IN')}</div>
          <small>↑ 14% higher than last month</small>
        </div>
        <div className="kpi-card blue">
          <span>Available Wallet Balance</span>
          <div className="kpi-value" style={{ color: '#2563eb' }}>₹{pendingBalance.toLocaleString('en-IN')}</div>
          <small>Ready for instant UPI settlement</small>
        </div>
        <div className="kpi-card amber">
          <span>Bays Occupied Now</span>
          <div className="kpi-value" style={{ color: '#d97706' }}>{hostBookings.length} Active Vehicles</div>
          <small>Accumulating hourly returns</small>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 12px' }}>Live Vehicle Occupancy & Earnings Ledger</h3>
      <div className="ledger-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Vehicle Plate</th>
              <th>Driver</th>
              <th>Duration</th>
              <th>Fixed Rate</th>
              <th>Revenue Earned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hostBookings.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.id}</strong></td>
                <td><span className="plate-pill">{b.vehiclePlate}</span></td>
                <td>{b.driverName}</td>
                <td>{b.hoursBooked} hrs</td>
                <td>₹{b.rateApplied}/hr</td>
                <td style={{ color: '#059669', fontWeight: 800 }}>+ ₹{b.hostEarning}</td>
                <td><span className="status-pill">{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {withdrawModal && (
        <div className="modal-overlay" onClick={() => setWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Instant UPI Settlement</h3>
            <p>Available balance: <strong>₹{pendingBalance}</strong></p>
            <input type="text" value={upi} onChange={(e) => setUpi(e.target.value)} style={{ margin: '14px 0', width: '100%', padding: '10px' }} />
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
              setWithdrawModal(false);
              showToast(`💸 ₹${pendingBalance} successfully transferred to ${upi}!`);
            }}>
              Confirm Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}